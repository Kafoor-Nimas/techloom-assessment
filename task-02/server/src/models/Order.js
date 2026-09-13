const mongoose = require("mongoose");
const { STATUSES } = require("../orderStateMachine");

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const statusHistoryEntry = new mongoose.Schema(
  { status: { type: String, required: true }, at: { type: Date, default: Date.now }, note: String },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // No real auth in this assessment - the client generates and persists a
    // stable customerId (localStorage) so "order history for a user" and
    // "duplicate checkout session" both have something durable to key off.
    customerId: { type: String, required: true, index: true },
    cartSessionId: { type: String, required: true, index: true },

    items: { type: [orderItemSchema], required: true, validate: (v) => v.length > 0 },
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: Object.values(STATUSES), default: STATUSES.RESERVED, index: true },
    statusHistory: { type: [statusHistoryEntry], default: [] },

    reservationExpiresAt: { type: Date, index: true },

    processedPaymentKeys: {
      type: [{ key: String, outcome: String, at: { type: Date, default: Date.now } }],
      default: [],
    },
    paymentOutcome: { type: String, enum: ["success", "failed", "timeout", null], default: null },
    cancelReason: String,

    // Refund simulation: a Cancelled order, or a Paid order that is then
    // cancelled/failed, can be refunded. Kept separate from `status` because
    // a refund is a payment-side event, not an order-lifecycle transition.
    refundStatus: { type: String, enum: ["none", "refunded"], default: "none" },
    refundedAt: Date,
    refundAmount: Number,
  },
  { timestamps: true }
);

orderSchema.methods.pushHistory = function (status, note) {
  this.statusHistory.push({ status, at: new Date(), note });
};

module.exports = mongoose.model("Order", orderSchema);
