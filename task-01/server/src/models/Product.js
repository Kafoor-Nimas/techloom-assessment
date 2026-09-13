const mongoose = require("mongoose");

// `stock` always represents AVAILABLE (sellable) stock - i.e. total stock
// minus whatever is currently held by active reservations. Reserving stock
// atomically decrements this field; releasing/expiring/cancelling a
// reservation atomically increments it back. Because MongoDB guarantees
// document-level atomicity, a conditional $inc (stock >= qty) is enough to
// prevent overselling even under heavy concurrent load, with no need for a
// separate lock.
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    category: { type: String, default: "general" },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", category: 1 });

module.exports = mongoose.model("Product", productSchema);
