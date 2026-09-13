import React, { useEffect, useState } from "react";
import { api } from "../api";

const STATUS_STYLES = {
  Pending: "border-stone-400 text-stone-600",
  Reserved: "border-[#A8650C] text-[#A8650C]",
  Paid: "border-[#2E6F4F] text-[#2E6F4F]",
  Cancelled: "border-stone-300 text-stone-400",
  Expired: "border-[#AD3A2E] text-[#AD3A2E]",
  Failed: "border-[#AD3A2E] text-[#AD3A2E]",
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

  async function handlePay(simulate) {
    setBusy(true);
    setError(null);
    try {
      await api.pay(order._id, {
        idempotencyKey: `${order._id}-${Date.now()}`,
        simulate,
      });
      onRefresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    setBusy(true);
    setError(null);
    try {
      await api.cancelOrder(order._id, "Cancelled from dashboard");
      onRefresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const canPay = order.status === "Reserved" && remaining > 0;
  const canCancel = ["Pending", "Reserved", "Paid"].includes(order.status);

  return (
    <div className="border border-stone-300 rounded-sm p-4 bg-white relative">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-xs text-stone-500">
            #{order._id.slice(-6)}
          </p>
          <p className="font-mono font-semibold text-lg mt-0.5">
            ${order.totalAmount.toFixed(2)}
          </p>
        </div>
        <span
          className={`text-xs font-medium px-2 py-0.5 border rounded-sm ${STATUS_STYLES[order.status]} ${
            order.status === "Paid" ? "-rotate-3" : ""
          }`}
        >
          {order.status}
        </span>
      </div>

      <ul className="mt-3 text-sm text-stone-600 space-y-0.5 border-t border-dashed border-stone-200 pt-2">
        {order.items.map((it, idx) => (
          <li key={idx} className="flex justify-between">
            <span>{it.name}</span>
            <span className="font-mono text-stone-500">×{it.qty}</span>
          </li>
        ))}
      </ul>

      {order.status === "Reserved" && (
        <p className="mt-2 text-xs text-[#A8650C]">
          Reservation expires in <span className="font-mono">{label}</span>
        </p>
      )}
      {order.paymentOutcome === "timeout" && (
        <p className="mt-2 text-xs text-[#AD3A2E]">
          Last payment attempt timed out - waiting for reservation to expire or
          retry.
        </p>
      )}
      {error && <p className="mt-2 text-xs text-[#AD3A2E]">{error}</p>}

      {(canPay || canCancel) && (
        <div className="mt-3 pt-3 border-t border-dashed border-stone-200 flex flex-wrap gap-2">
          {canPay && (
            <>
              <button
                disabled={busy}
                onClick={() => handlePay("success")}
                className="text-xs px-2.5 py-1.5 rounded-sm bg-[#2E6F4F] text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                Simulate success
              </button>
              <button
                disabled={busy}
                onClick={() => handlePay("failed")}
                className="text-xs px-2.5 py-1.5 rounded-sm bg-[#AD3A2E] text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                Simulate failure
              </button>
              <button
                disabled={busy}
                onClick={() => handlePay("timeout")}
                className="text-xs px-2.5 py-1.5 rounded-sm bg-stone-500 text-white hover:bg-stone-600 disabled:opacity-50"
              >
                Simulate timeout
              </button>
            </>
          )}
          {canCancel && (
            <button
              disabled={busy}
              onClick={handleCancel}
              className="text-xs px-2.5 py-1.5 rounded-sm border border-stone-300 hover:bg-stone-100 disabled:opacity-50"
            >
              Cancel order
            </button>
          )}
        </div>
      )}
    </div>
  );
}
