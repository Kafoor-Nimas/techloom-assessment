const express = require("express");
const Order = require("../models/Order");
const orderService = require("../services/orderService");

const router = express.Router();

// POST /api/orders/checkout  { cartSessionId, items: [{productId, qty}] }
router.post("/checkout", async (req, res, next) => {
  try {
    const { cartSessionId, items } = req.body;
    const { order, reused } = await orderService.checkout({ cartSessionId, items });
    res.status(reused ? 200 : 201).json({ order, reused });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders?cartSessionId=...
router.get("/", async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.cartSessionId) filter.cartSessionId = req.query.cartSessionId;
    if (req.query.status) filter.status = req.query.status;
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:id
router.get("/:id", async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    await orderService.expireIfDue(order);
    res.json(order);
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/:id/pay  { idempotencyKey, simulate?: "success"|"failed"|"timeout" }
router.post("/:id/pay", async (req, res, next) => {
  try {
    const { idempotencyKey, simulate } = req.body;
    const result = await orderService.pay(req.params.id, { idempotencyKey, simulate });
    const status = result.outcome === "timeout" ? 202 : 200;
    res.status(status).json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/:id/cancel  { reason? }
router.post("/:id/cancel", async (req, res, next) => {
  try {
    const order = await orderService.cancel(req.params.id, req.body.reason);
    res.json(order);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
