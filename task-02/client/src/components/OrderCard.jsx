import React, { useEffect, useState } from "react";
import { api } from "../api";

const STATUS_STYLES = {
  Pending: "bg-stone-200 text-stone-700",
  Reserved: "bg-amber-100 text-amber-800",
  Paid: "bg-emerald-100 text-emerald-800",
  Cancelled: "bg-stone-200 text-stone-500",
  Expired: "bg-red-100 text-red-700",
  Failed: "bg-red-100 text-red-700",
};

function useCountdown(expiresAt) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => setRemaining(Math.max(0, new Date(expiresAt).getTime() - Date.now()));
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
  const { remaining, label } = useCountdown(order.status === "Reserved" ? order.reservationExpiresAt : null);

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
    ((order.status === "Cancelled" && wasEverPaid) || order.status === "Failed");

  return (
    <div className="border border-stone-200 rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-stone-500">Order #{order._id.slice(-6)}</p>
          <p className="font-medium">${order.totalAmount.toFixed(2)}</p>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_STYLES[order.status]}`}>
          {order.status}
        </span>
      </div>

      <ul className="mt-2 text-sm text-stone-600 space-y-0.5">
        {order.items.map((it, idx) => (
          <li key={idx}>{it.qty} × {it.name}</li>
        ))}
      </ul>

      {order.status === "Reserved" && <p className="mt-2 text-xs text-amber-700">Reservation expires in {label}</p>}
      {order.paymentOutcome === "timeout" && (
        <p className="mt-2 text-xs text-red-600">Last payment attempt timed out - waiting for reservation to expire or retry.</p>
      )}
      {order.refundStatus === "refunded" && (
        <p className="mt-2 text-xs text-emerald-700">Refunded ${order.refundAmount?.toFixed(2)} on {new Date(order.refundedAt).toLocaleString()}</p>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        {canPay && (
          <>
            <button disabled={busy} onClick={() => run(() => api.pay(order._id, { idempotencyKey: `${order._id}-${Date.now()}`, simulate: "success" }))} className="text-xs px-2.5 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">Simulate success</button>
            <button disabled={busy} onClick={() => run(() => api.pay(order._id, { idempotencyKey: `${order._id}-${Date.now()}`, simulate: "failed" }))} className="text-xs px-2.5 py-1.5 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">Simulate failure</button>
            <button disabled={busy} onClick={() => run(() => api.pay(order._id, { idempotencyKey: `${order._id}-${Date.now()}`, simulate: "timeout" }))} className="text-xs px-2.5 py-1.5 rounded bg-stone-500 text-white hover:bg-stone-600 disabled:opacity-50">Simulate timeout</button>
          </>
        )}
        {canCancel && (
          <button disabled={busy} onClick={() => run(() => api.cancelOrder(order._id, "Cancelled from order history"))} className="text-xs px-2.5 py-1.5 rounded border border-stone-300 hover:bg-stone-100 disabled:opacity-50">Cancel order</button>
        )}
        {canRefund && (
          <button disabled={busy} onClick={() => run(() => api.refundOrder(order._id))} className="text-xs px-2.5 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">Refund</button>
        )}
      </div>
    </div>
  );
}
