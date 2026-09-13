require("dotenv").config();
const { connectDB } = require("./db");
const { createApp } = require("./app");
const { startReservationSweeper } = require("./reservationSweeper");

async function main() {
  await connectDB();
  const app = createApp();
  startReservationSweeper();

  const port = process.env.PORT || 4000;
  app.listen(port, () => console.log(`[server] Task 01 POS API listening on port ${port}`));
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
