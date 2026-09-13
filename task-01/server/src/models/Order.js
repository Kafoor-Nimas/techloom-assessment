const mongoose = require("mongoose");
const { STATUSES } = require("../orderStateMachine");

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true }, // snapshot at time of order
    price: { type: Number, required: true }, // snapshot at time of order
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
    // Identifies the checkout session the order came from. Used to detect
    // duplicate order creation if a client double-submits the same cart.
    cartSessionId: { type: String, required: true, index: true },
    items: { type: [orderItemSchema], required: true, validate: (v) => v.length > 0 },
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: Object.values(STATUSES), default: STATUSES.RESERVED, index: true },
    statusHistory: { type: [statusHistoryEntry], default: [] },

    reservationExpiresAt: { type: Date, index: true },

    // Idempotency: every payment attempt must carry a client-generated key.
    // We remember every key we've already processed for this order plus the
    // result we gave, so a retried/duplicated network request replays the
    // original outcome instead of charging or failing twice.
    processedPaymentKeys: {
      type: [
        {
          key: String,
          outcome: String,
          at: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },

    paymentOutcome: { type: String, enum: ["success", "failed", "timeout", null], default: null },
    cancelReason: String,
  },
  { timestamps: true }
);

orderSchema.methods.pushHistory = function (status, note) {
  this.statusHistory.push({ status, at: new Date(), note });
};

module.exports = mongoose.model("Order", orderSchema);
