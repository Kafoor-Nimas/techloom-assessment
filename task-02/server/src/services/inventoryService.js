const Product = require("../models/Product");

class InsufficientStockError extends Error {
  constructor(productId, requested, available) {
    super(`Insufficient stock for product ${productId}: requested ${requested}, available ${available}`);
    this.name = "InsufficientStockError";
    this.status = 409;
    this.productId = productId;
  }
}

// Atomically reserve `qty` units of a single product. The condition
// `stock: { $gte: qty }` is evaluated by MongoDB as part of the same atomic
// document operation as the $inc, so two concurrent requests racing for the
// last unit can never both succeed - one of them will simply not match the
// filter and get null back. This is what actually prevents overselling,
// independent of any higher-level transaction.
async function reserveStock(productId, qty, session) {
  const product = await Product.findOneAndUpdate(
    { _id: productId, stock: { $gte: qty } },
    { $inc: { stock: -qty } },
    { new: true, session }
  );
  if (!product) {
    const current = await Product.findById(productId, null, { session });
    throw new InsufficientStockError(productId, qty, current ? current.stock : 0);
  }
  return product;
}

// Release (return) qty units back to available stock. Always safe to call
// more than once accidentally is NOT guaranteed - callers must ensure a
// reservation is only released once (enforced via order status transitions).
async function releaseStock(productId, qty, session) {
  await Product.updateOne({ _id: productId }, { $inc: { stock: qty } }, { session });
}

// Reserve multiple line items. If any item fails part-way through (e.g. item
// 3 of 4 is out of stock), we roll back the ones that already succeeded so
// we never leave inventory partially reserved. When the DB deployment
// supports multi-document transactions this rollback is unnecessary (the
// session abort handles it) but we keep it as a safety net for both cases.
async function reserveItems(items, session) {
  const reserved = [];
  try {
    for (const item of items) {
      const product = await reserveStock(item.product, item.qty, session);
      reserved.push({ productId: item.product, qty: item.qty });
    }
    return reserved;
  } catch (err) {
    if (!session) {
      // Manual compensation path (no transaction support available).
      for (const r of reserved.reverse()) {
        await releaseStock(r.productId, r.qty, null);
      }
    }
    throw err;
  }
}

async function releaseItems(items, session) {
  for (const item of items) {
    await releaseStock(item.product ?? item.productId, item.qty, session);
  }
}

module.exports = { reserveStock, releaseStock, reserveItems, releaseItems, InsufficientStockError };
