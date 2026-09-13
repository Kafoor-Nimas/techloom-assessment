import React, { useState } from "react";

export default function ProductCard({ product, onAddToCart }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-stone-200 rounded-lg p-4 bg-white flex flex-col">
      <button className="text-left flex-1" onClick={() => setOpen(true)}>
        <p className="font-medium">{product.name}</p>
        <p className="text-xs text-stone-500 uppercase tracking-wide mt-0.5">{product.category}</p>
        <p className="mt-2 font-semibold">${product.price.toFixed(2)}</p>
        <p className={`text-xs mt-1 ${product.stock <= 3 && product.stock > 0 ? "text-amber-600" : product.stock === 0 ? "text-red-600" : "text-stone-500"}`}>
          {product.stock === 0 ? "Out of stock" : `${product.stock} in stock`}
        </p>
      </button>
      <button
        disabled={product.stock < 1}
        onClick={() => onAddToCart(product)}
        className="mt-3 text-xs bg-brand text-white rounded px-2 py-1.5 disabled:opacity-40"
      >
        Add to cart
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-lg p-5 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">{product.name}</h3>
            <p className="text-sm text-stone-500 uppercase tracking-wide">{product.category}</p>
            <p className="mt-3 text-sm text-stone-700">{product.description || "No description provided."}</p>
            <p className="mt-3 font-semibold text-lg">${product.price.toFixed(2)}</p>
            <p className="text-sm text-stone-500">{product.stock} in stock</p>
            <div className="mt-4 flex gap-2">
              <button
                disabled={product.stock < 1}
                onClick={() => { onAddToCart(product); setOpen(false); }}
                className="flex-1 bg-brand text-white rounded py-2 text-sm disabled:opacity-40"
              >
                Add to cart
              </button>
              <button onClick={() => setOpen(false)} className="border rounded px-3 py-2 text-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
