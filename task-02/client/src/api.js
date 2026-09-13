const BASE = import.meta.env.VITE_API_URL || "http://localhost:4001/api";

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

function qs(params) {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v != null));
  const s = new URLSearchParams(clean).toString();
  return s ? `?${s}` : "";
}

export const api = {
  listProducts: (filters = {}) => request(`/products${qs(filters)}`),
  listCategories: () => request("/products/categories"),
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (body) => request("/products", { method: "POST", body: JSON.stringify(body) }),
  updateProduct: (id, body) => request(`/products/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: "DELETE" }),

  checkout: (body) => request("/orders/checkout", { method: "POST", body: JSON.stringify(body) }),
  listOrders: (customerId) => request(`/orders?customerId=${encodeURIComponent(customerId)}`),
  getOrder: (id) => request(`/orders/${id}`),
  pay: (id, body) => request(`/orders/${id}/pay`, { method: "POST", body: JSON.stringify(body) }),
  cancelOrder: (id, reason) => request(`/orders/${id}/cancel`, { method: "POST", body: JSON.stringify({ reason }) }),
  refundOrder: (id) => request(`/orders/${id}/refund`, { method: "POST" }),
};
