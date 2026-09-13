import React, { useEffect, useState } from "react";
import { api } from "../api";

const STATUS_STYLES = {
  Pending: "bg-stone-100 text-stone-700 border-stone-200",
  Reserved: "bg-amber-50 text-amber-800 border-amber-200/60",
  Paid: "bg-emerald-50 text-emerald-800 border-emerald-200/60",
  Cancelled: "bg-stone-100 text-stone-500 border-stone-200",
  Expired: "bg-rose-50 text-rose-700 border-rose-200/60",
  Failed: "bg-rose-50 text-rose-700 border-rose-200/60",
};

function useCountdown(expiresAt) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () =>
      setRemaining(Math.max(0, new Date(expiresAt).getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  return { remaining, label: `${mins}:${String(secs).padStart(2, "0")}` };
}

export default function OrderCard({ order, onRefresh }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const { remaining, label } = useCountdown(
    order.status === "Reserved" ? order.reservationExpiresAt : null,
  );

  useEffect(() => {
    if (order.status === "Reserved" && remaining === 0) {
      const t = setTimeout(onRefresh, 1200);
      return () => clearTimeout(t);
    }
  }, [remaining, order.status, onRefresh]);

  async function run(fn) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      onRefresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const canPay = order.status === "Reserved" && remaining > 0;
  const canCancel = ["Pending", "Reserved", "Paid"].includes(order.status);
  const wasEverPaid = order.statusHistory?.some((h) => h.status === "Paid");
  const canRefund =
    order.refundStatus !== "refunded" &&
    ((order.status === "Cancelled" && wasEverPaid) ||
      order.status === "Failed");

  return (
    <div className="border border-stone-200/80 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2 pb-3 border-b border-stone-100">
          <div>
            <p className="text-xs font-mono font-medium text-stone-400">
              Order #{order._id.slice(-6)}
            </p>
            <p className="font-bold text-lg text-stone-900 mt-0.5">
              ${order.totalAmount.toFixed(2)}
            </p>
          </div>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[order.status]}`}
          >
            {order.status}
          </span>
        </div>

        <ul className="mt-3 text-sm text-stone-600 space-y-1">
          {order.items.map((it, idx) => (
            <li key={idx} className="flex justify-between items-center text-xs">
              <span className="font-medium text-stone-700">{it.name}</span>
              <span className="text-stone-400">×{it.qty}</span>
            </li>
          ))}
        </ul>

        {order.status === "Reserved" && (
          <p className="mt-3 text-xs font-medium text-amber-700 bg-amber-50 p-2 rounded-md border border-amber-200/50">
            ⏳ Reservation expires in {label}
          </p>
        )}
        {order.paymentOutcome === "timeout" && (
          <p className="mt-3 text-xs text-rose-700 bg-rose-50 p-2 rounded-md border border-rose-200/50">
            Last payment attempt timed out - waiting for reservation to expire
            or retry.
          </p>
        )}
        {order.refundStatus === "refunded" && (
          <p className="mt-3 text-xs text-emerald-700 bg-emerald-50 p-2 rounded-md border border-emerald-200/50">
            Refunded ${order.refundAmount?.toFixed(2)} on{" "}
            {new Date(order.refundedAt).toLocaleString()}
          </p>
        )}
        {error && (
          <p className="mt-3 text-xs text-rose-600 font-medium bg-rose-50 p-2 rounded-md border border-rose-100">
            {error}
          </p>
        )}
      </div>

      <div className="mt-5 pt-3 border-t border-stone-100 flex flex-wrap gap-2">
        {canPay && (
          <>
            <button
              disabled={busy}
              onClick={() =>
                run(() =>
                  api.pay(order._id, {
                    idempotencyKey: `${order._id}-${Date.now()}`,
                    simulate: "success",
                  }),
                )
              }
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50"
            >
              Simulate success
            </button>
            <button
              disabled={busy}
              onClick={() =>
                run(() =>
                  api.pay(order._id, {
                    idempotencyKey: `${order._id}-${Date.now()}`,
                    simulate: "failed",
                  }),
                )
              }
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors disabled:opacity-50"
            >
              Simulate failure
            </button>
            <button
              disabled={busy}
              onClick={() =>
                run(() =>
                  api.pay(order._id, {
                    idempotencyKey: `${order._id}-${Date.now()}`,
                    simulate: "timeout",
                  }),
                )
              }
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-stone-600 hover:bg-stone-700 text-white transition-colors disabled:opacity-50"
            >
              Simulate timeout
            </button>
          </>
        )}
        {canCancel && (
          <button
            disabled={busy}
            onClick={() =>
              run(() =>
                api.cancelOrder(order._id, "Cancelled from order history"),
              )
            }
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 transition-colors disabled:opacity-50"
          >
            Cancel order
          </button>
        )}
        {canRefund && (
          <button
            disabled={busy}
            onClick={() => run(() => api.refundOrder(order._id))}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50"
          >
            Refund
          </button>
        )}
      </div>
    </div>
  );
}
