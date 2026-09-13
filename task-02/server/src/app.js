const express = require("express");
const cors = require("cors");
const productsRouter = require("./routes/products");
const ordersRouter = require("./routes/orders");

function createApp() {
  const app = express();

  const allowedOrigins = [
    process.env.CLIENT_ORIGIN,
    "http://localhost:5173",
  ].filter(Boolean);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true); 

        const isAllowed =
          allowedOrigins.includes(origin) ||
          /^https:\/\/techloom-assessment-task-02-client[a-z0-9-]*\.vercel\.app$/.test(origin);

        if (isAllowed) return callback(null, true);
        return callback(new Error(`Not allowed by CORS: ${origin}`));
      },
    })
  );

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