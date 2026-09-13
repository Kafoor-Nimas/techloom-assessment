const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { STATUSES, assertTransition } = require("../orderStateMachine");
const { reserveItems, releaseItems, InsufficientStockError } = require("./inventoryService");
const { isTransactionsSupported } = require("../db");

const RESERVATION_TTL_MINUTES = Number(process.env.RESERVATION_TTL_MINUTES || 5);

class OrderError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

// Runs `fn(session)` inside a real MongoDB transaction when the deployment
// supports it (Atlas / any replica set), otherwise just runs fn(null) and
// relies on the manual-compensation logic inside inventoryService for
// atomicity of the inventory step. Either way overselling is impossible;
// the transaction only adds all-or-nothing guarantees across the
// Order + Product collections together.
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

// --- Checkout: validate stock, reserve it, create the order in Reserved
// status with a 5-minute reservation window. ---
async function checkout({ cartSessionId, items }) {
  if (!cartSessionId) throw new OrderError("cartSessionId is required");
  if (!Array.isArray(items) || items.length === 0) throw new OrderError("items must be a non-empty array");

  // Duplicate-order guard: if this cart already has a live (non-terminal)
  // order, hand that back instead of creating a second one / double
  // reserving stock for the same cart.
  const existing = await Order.findOne({
    cartSessionId,
    status: { $in: [STATUSES.PENDING, STATUSES.RESERVED] },
  });
  if (existing) {
    return { order: existing, reused: true };
  }

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

// --- Payment ---
// `simulate` lets the caller (or the demo UI) force an outcome for testing;
// otherwise a random outcome is chosen so the flow behaves like a real
// unreliable gateway. `idempotencyKey` must be supplied by the client and is
// remembered per-order so a duplicated/retried request never charges twice.
async function pay(orderId, { idempotencyKey, simulate }) {
  if (!idempotencyKey) throw new OrderError("idempotencyKey is required");

  const order = await Order.findById(orderId);
  if (!order) throw new OrderError("Order not found", 404);

  // Lazily expire if the reservation window has already passed - keeps
  // behaviour correct even if the background sweeper hasn't run yet.
  await expireIfDue(order);

  const replay = order.processedPaymentKeys.find((p) => p.key === idempotencyKey);
  if (replay) {
    return { order, outcome: replay.outcome, replay: true };
  }

  if (order.status !== STATUSES.RESERVED) {
    throw new OrderError(
      `Cannot pay for order in status ${order.status} (duplicate or stale payment attempt)`,
      409
    );
  }

  const outcome = simulate || pickRandomOutcome();

  if (outcome === "timeout") {
    // Gateway never responded in time: we record the attempt so it can't be
    // replayed as a different outcome, but we do NOT change the order
    // status - it simply keeps counting down to its existing expiry, which
    // will release the stock automatically if the customer doesn't retry.
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
    order.cancelReason = reason || "Cancelled by user";
    order.pushHistory(STATUSES.CANCELLED, order.cancelReason);
    if (hadStockHeld) {
      await releaseItems(order.items, session);
    }
    await order.save({ session });
    return order;
  });
}

// --- Expiry ---
// Central place that turns a stale Reserved order into Expired + releases
// its stock. Used both by the lazy check-on-read above and by the
// background sweeper in reservationSweeper.js.
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
  const dueOrders = await Order.find({
    status: STATUSES.RESERVED,
    reservationExpiresAt: { $lte: new Date() },
  });
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

module.exports = { checkout, pay, cancel, expireIfDue, expireDueOrders, OrderError, InsufficientStockError };
