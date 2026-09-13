const express = require("express");
const cors = require("cors");
const productsRouter = require("./routes/products");
const ordersRouter = require("./routes/orders");

function createApp() {
  const app = express();
  app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
  app.use(express.json());

  app.get("/api/health", (req, res) => res.json({ ok: true }));
  app.use("/api/products", productsRouter);
  app.use("/api/orders", ordersRouter);

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || "Internal server error" });
  });

  return app;
}

module.exports = { createApp };
