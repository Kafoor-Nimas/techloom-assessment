import React, { useState } from "react";

export default function ProductCard({ product, onAddToCart }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-stone-200/80 rounded-xl p-4 bg-white flex flex-col shadow-sm hover:shadow-md transition-all group">
      <button className="text-left flex-1" onClick={() => setOpen(true)}>
        <p className="font-semibold text-stone-900 group-hover:text-stone-700 transition-colors">
          {product.name}
        </p>
        <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mt-1">
          {product.category}
        </p>
        <p className="mt-3 text-lg font-bold text-stone-900">
          ${product.price.toFixed(2)}
        </p>
        <p
          className={`text-xs mt-1 font-medium ${product.stock <= 3 && product.stock > 0 ? "text-amber-600" : product.stock === 0 ? "text-red-500" : "text-stone-500"}`}
        >
          {product.stock === 0 ? "Out of stock" : `${product.stock} in stock`}
        </p>
      </button>
      <button
        disabled={product.stock < 1}
        onClick={() => onAddToCart(product)}
        className="mt-4 text-xs font-medium bg-stone-900 hover:bg-stone-800 active:scale-[0.98] text-white rounded-lg px-3 py-2 transition-all disabled:opacity-40 disabled:pointer-events-none shadow-sm"
      >
        Add to cart
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl border border-stone-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-xl font-bold text-stone-900">
                {product.name}
              </h3>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mt-0.5">
                {product.category}
              </p>
            </div>
            <p className="text-sm text-stone-600 leading-relaxed">
              {product.description || "No description provided."}
            </p>
            <div className="pt-2">
              <p className="font-bold text-2xl text-stone-900">
                ${product.price.toFixed(2)}
              </p>
              <p className="text-xs font-medium text-stone-500 mt-0.5">
                {product.stock} in stock
              </p>
            </div>
            <div className="pt-2 flex gap-3">
              <button
                disabled={product.stock < 1}
                onClick={() => {
                  onAddToCart(product);
                  setOpen(false);
                }}
                className="flex-1 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-lg py-2.5 text-sm transition-all shadow-sm disabled:opacity-40"
              >
                Add to cart
              </button>
              <button
                onClick={() => setOpen(false)}
                className="border border-stone-200 hover:bg-stone-50 rounded-lg px-4 py-2.5 text-sm font-medium text-stone-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
