const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { STATUSES, assertTransition } = require("../orderStateMachine");
const { reserveItems, releaseItems } = require("./inventoryService");
const { isTransactionsSupported } = require("../db");

const RESERVATION_TTL_MINUTES = Number(process.env.RESERVATION_TTL_MINUTES || 5);

class OrderError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

async function withOptionalTransaction(fn) {
  if (!isTransactionsSupported()) {
    return fn(null);
  }
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } finally {
    session.endSession();
  }
}

// --- Checkout ---
async function checkout({ customerId, cartSessionId, items }) {
  if (!customerId) throw new OrderError("customerId is required");
  if (!cartSessionId) throw new OrderError("cartSessionId is required");
  if (!Array.isArray(items) || items.length === 0) throw new OrderError("items must be a non-empty array");

  const existing = await Order.findOne({
    cartSessionId,
    status: { $in: [STATUSES.PENDING, STATUSES.RESERVED] },
  });
  if (existing) return { order: existing, reused: true };

  const productDocs = await Product.find({ _id: { $in: items.map((i) => i.productId) } });
  const byId = new Map(productDocs.map((p) => [String(p._id), p]));

  const orderItems = items.map((i) => {
    const product = byId.get(String(i.productId));
    if (!product) throw new OrderError(`Product ${i.productId} not found`, 404);
    if (!Number.isInteger(i.qty) || i.qty < 1) throw new OrderError("qty must be a positive integer");
    return { product: product._id, name: product.name, price: product.price, qty: i.qty };
  });

  const totalAmount = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0);

  return withOptionalTransaction(async (session) => {
    await reserveItems(
      orderItems.map((i) => ({ product: i.product, qty: i.qty })),
      session
    );
    const reservationExpiresAt = new Date(Date.now() + RESERVATION_TTL_MINUTES * 60 * 1000);
    const [order] = await Order.create(
      [
        {
          customerId,
          cartSessionId,
          items: orderItems,
          totalAmount,
          status: STATUSES.RESERVED,
          reservationExpiresAt,
          statusHistory: [{ status: STATUSES.RESERVED, note: "Stock reserved at checkout" }],
        },
      ],
      { session }
    );
    return { order, reused: false };
  });
}

// --- Payment (identical semantics to Task 01) ---
async function pay(orderId, { idempotencyKey, simulate }) {
  if (!idempotencyKey) throw new OrderError("idempotencyKey is required");

  const order = await Order.findById(orderId);
  if (!order) throw new OrderError("Order not found", 404);

  await expireIfDue(order);

  const replay = order.processedPaymentKeys.find((p) => p.key === idempotencyKey);
  if (replay) return { order, outcome: replay.outcome, replay: true };

  if (order.status !== STATUSES.RESERVED) {
    throw new OrderError(
      `Cannot pay for order in status ${order.status} (duplicate or stale payment attempt)`,
      409
    );
  }

  const outcome = simulate || pickRandomOutcome();

  if (outcome === "timeout") {
    order.processedPaymentKeys.push({ key: idempotencyKey, outcome });
    order.paymentOutcome = "timeout";
    await order.save();
    return { order, outcome, replay: false };
  }

  return withOptionalTransaction(async (session) => {
    if (outcome === "success") {
      assertTransition(order.status, STATUSES.PAID);
      order.status = STATUSES.PAID;
      order.paymentOutcome = "success";
      order.pushHistory(STATUSES.PAID, "Payment succeeded");
    } else {
      assertTransition(order.status, STATUSES.FAILED);
      order.status = STATUSES.FAILED;
      order.paymentOutcome = "failed";
      order.pushHistory(STATUSES.FAILED, "Payment failed - stock released");
      await releaseItems(order.items, session);
    }
    order.processedPaymentKeys.push({ key: idempotencyKey, outcome });
    await order.save({ session });
    return { order, outcome, replay: false };
  });
}

function pickRandomOutcome() {
  const r = Math.random();
  if (r < 0.7) return "success";
  if (r < 0.9) return "failed";
  return "timeout";
}

// --- Cancellation ---
async function cancel(orderId, reason) {
  const order = await Order.findById(orderId);
  if (!order) throw new OrderError("Order not found", 404);

  await expireIfDue(order);
  assertTransition(order.status, STATUSES.CANCELLED);

  return withOptionalTransaction(async (session) => {
    const hadStockHeld = order.status === STATUSES.RESERVED || order.status === STATUSES.PAID;
    order.status = STATUSES.CANCELLED;
    order.cancelReason = reason || "Cancelled by customer";
    order.pushHistory(STATUSES.CANCELLED, order.cancelReason);
    if (hadStockHeld) await releaseItems(order.items, session);
    await order.save({ session });
    return order;
  });
}

// --- Refund ---
// A refund only makes sense once money has actually moved: either the order
// was Paid and is now being cancelled/reversed, or a payment attempt was
// marked Failed after having been charged in a way that still needs
// reversing in a real gateway. We simulate this by allowing refunds on
// Cancelled orders that were Paid at some point, and on Failed orders.
async function refund(orderId) {
  const order = await Order.findById(orderId);
  if (!order) throw new OrderError("Order not found", 404);

  if (order.refundStatus === "refunded") {
    return order; // idempotent - already refunded, no-op
  }

  const wasEverPaid = order.statusHistory.some((h) => h.status === STATUSES.PAID);
  const refundable =
    (order.status === STATUSES.CANCELLED && wasEverPaid) || order.status === STATUSES.FAILED;

  if (!refundable) {
    throw new OrderError(
      `Order in status ${order.status} is not eligible for a refund (must be a cancelled paid order, or a failed payment)`,
      409
    );
  }

  order.refundStatus = "refunded";
  order.refundedAt = new Date();
  order.refundAmount = order.totalAmount;
  order.pushHistory(order.status, `Refund of $${order.totalAmount.toFixed(2)} simulated`);
  await order.save();
  return order;
}

// --- Expiry ---
async function expireIfDue(order) {
  if (order.status !== STATUSES.RESERVED) return order;
  if (!order.reservationExpiresAt || order.reservationExpiresAt > new Date()) return order;

  return withOptionalTransaction(async (session) => {
    assertTransition(order.status, STATUSES.EXPIRED);
    order.status = STATUSES.EXPIRED;
    order.pushHistory(STATUSES.EXPIRED, "Reservation window elapsed without payment");
    await releaseItems(order.items, session);
    await order.save({ session });
    return order;
  });
}

async function expireDueOrders() {
  const dueOrders = await Order.find({ status: STATUSES.RESERVED, reservationExpiresAt: { $lte: new Date() } });
  let count = 0;
  for (const order of dueOrders) {
    try {
      await expireIfDue(order);
      count++;
    } catch (err) {
      console.error(`[sweeper] failed to expire order ${order._id}:`, err.message);
    }
  }
  return count;
}

module.exports = { checkout, pay, cancel, refund, expireIfDue, expireDueOrders, OrderError };
