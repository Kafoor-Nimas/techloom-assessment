const mongoose = require("mongoose");

// Same available-stock convention as Task 01: `stock` is always the
// sellable quantity (reservations decrement it, releases/expiry/cancel
// increment it back).
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    category: { type: String, default: "general", index: true },
    imageUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("Product", productSchema);
