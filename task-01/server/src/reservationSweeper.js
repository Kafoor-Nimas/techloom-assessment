const { expireDueOrders } = require("./services/orderService");

const INTERVAL_MS = Number(process.env.RESERVATION_SWEEP_INTERVAL_MS || 10000);

function startReservationSweeper() {
  const timer = setInterval(async () => {
    try {
      const count = await expireDueOrders();
      if (count > 0) console.log(`[sweeper] expired ${count} stale reservation(s)`);
    } catch (err) {
      console.error("[sweeper] error:", err.message);
    }
  }, INTERVAL_MS);
  timer.unref?.();
  return timer;
}

module.exports = { startReservationSweeper };
