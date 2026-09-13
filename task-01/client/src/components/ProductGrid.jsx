import React, { useState } from "react";
import { api } from "../api";

const emptyForm = { name: "", price: "", stock: "", category: "" };

export default function ProductGrid({ products, onChanged, onAddToCart }) {
  const [showAdmin, setShowAdmin] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);

  async function submitForm(e) {
    e.preventDefault();
    setError(null);
    const body = { name: form.name, price: Number(form.price), stock: Number(form.stock), category: form.category };
    try {
      if (editingId) {
        await api.updateProduct(editingId, body);
      } else {
        await api.createProduct(body);
      }
      setForm(emptyForm);
      setEditingId(null);
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(p) {
    setEditingId(p._id);
    setForm({ name: p.name, price: p.price, stock: p.stock, category: p.category || "" });
  }

  async function remove(id) {
    if (!confirm("Delete this product?")) return;
    await api.deleteProduct(id);
    onChanged();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Products</h2>
        <button
          onClick={() => setShowAdmin((s) => !s)}
          className="text-xs px-2.5 py-1.5 rounded border border-stone-300 hover:bg-stone-100"
        >
          {showAdmin ? "Hide admin" : "Manage inventory"}
        </button>
      </div>

      {showAdmin && (
        <form onSubmit={submitForm} className="mb-4 grid grid-cols-2 sm:grid-cols-5 gap-2 bg-white border border-stone-200 rounded-lg p-3">
          <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="col-span-2 sm:col-span-1 border rounded px-2 py-1 text-sm" />
          <input required type="number" step="0.01" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="border rounded px-2 py-1 text-sm" />
          <input required type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="border rounded px-2 py-1 text-sm" />
          <input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="border rounded px-2 py-1 text-sm" />
          <button className="bg-brand text-white text-sm rounded px-3 py-1.5">{editingId ? "Save" : "Add"}</button>
          {error && <p className="col-span-full text-xs text-red-600">{error}</p>}
        </form>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {products.map((p) => (
          <div key={p._id} className="border border-stone-200 rounded-lg p-4 bg-white flex flex-col">
            <div className="flex-1">
              <p className="font-medium">{p.name}</p>
              <p className="text-sm text-stone-500">{p.category}</p>
              <p className="mt-1 font-semibold">${p.price.toFixed(2)}</p>
              <p className={`text-xs mt-1 ${p.stock <= 3 ? "text-red-600" : "text-stone-500"}`}>
                {p.stock} in stock
              </p>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                disabled={p.stock < 1}
                onClick={() => onAddToCart(p)}
                className="flex-1 text-xs bg-brand text-white rounded px-2 py-1.5 disabled:opacity-40"
              >
                {p.stock < 1 ? "Out of stock" : "Add to cart"}
              </button>
              {showAdmin && (
                <>
                  <button onClick={() => startEdit(p)} className="text-xs border rounded px-2 py-1.5">Edit</button>
                  <button onClick={() => remove(p._id)} className="text-xs border rounded px-2 py-1.5 text-red-600">Del</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
