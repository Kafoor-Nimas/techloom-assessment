import React, { useEffect, useState, useCallback } from "react";
import { api } from "../api";
import OrderCard from "../components/OrderCard";

export default function OrderHistory({ customerId }) {
  const [orders, setOrders] = useState([]);

  const load = useCallback(() => {
    api.listOrders(customerId).then(setOrders).catch(console.error);
  }, [customerId]);

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-stone-900 tracking-tight">
        Order history
      </h1>
      {orders.length === 0 && (
        <div className="text-center py-12 border border-dashed border-stone-300 rounded-xl bg-white/50 max-w-md mx-auto">
          <p className="text-sm text-stone-500 font-medium">No orders yet.</p>
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        {orders.map((o) => (
          <OrderCard key={o._id} order={o} onRefresh={load} />
        ))}
      </div>
    </div>
  );
}
