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
    <div>
      <h1 className="text-xl font-semibold mb-4">Order history</h1>
      {orders.length === 0 && <p className="text-sm text-stone-500">No orders yet.</p>}
      <div className="grid sm:grid-cols-2 gap-3">
        {orders.map((o) => (
          <OrderCard key={o._id} order={o} onRefresh={load} />
        ))}
      </div>
    </div>
  );
}
