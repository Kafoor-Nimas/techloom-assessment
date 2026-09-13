const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  listProducts: () => request("/products"),
  createProduct: (body) => request("/products", { method: "POST", body: JSON.stringify(body) }),
  updateProduct: (id, body) => request(`/products/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: "DELETE" }),

  checkout: (body) => request("/orders/checkout", { method: "POST", body: JSON.stringify(body) }),
  listOrders: (cartSessionId) => request(`/orders?cartSessionId=${encodeURIComponent(cartSessionId)}`),
  getOrder: (id) => request(`/orders/${id}`),
  pay: (id, body) => request(`/orders/${id}/pay`, { method: "POST", body: JSON.stringify(body) }),
  cancelOrder: (id, reason) => request(`/orders/${id}/cancel`, { method: "POST", body: JSON.stringify({ reason }) }),
};
