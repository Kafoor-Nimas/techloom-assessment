require("dotenv").config();
const { connectDB } = require("./db");
const { createApp } = require("./app");
const { startReservationSweeper } = require("./reservationSweeper");

const app = createApp();

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "Task 02 E-Commerce Checkout & Payment System" });
});

connectDB()
  .then(() => startReservationSweeper())
  .catch((err) => console.error("Failed to connect to DB:", err));

if (require.main === module) {
  const port = process.env.PORT || 4000;
  app.listen(port, () =>
    console.log(`[server] Task 01 POS API listening on port ${port}`),
  );
}

module.exports = app; 
