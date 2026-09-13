import React from "react";

export default function Cart({
  items,
  onQtyChange,
  onRemove,
  onCheckout,
  checkingOut,
  error,
}) {
  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  return (
    <div className="border border-stone-200/80 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
      <h2 className="text-lg font-bold text-stone-900 mb-4 tracking-tight">
        Cart
      </h2>
      {items.length === 0 && (
        <p className="text-sm text-stone-400 py-4 text-center">
          Cart is empty.
        </p>
      )}
      <div className="divide-y divide-stone-100">
        {items.map((item) => (
          <div
            key={item.productId}
            className="flex items-center justify-between text-sm py-3 first:pt-0 last:pb-0 gap-3"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-stone-800 truncate">{item.name}</p>
              <p className="text-xs text-stone-500">
                ${item.price.toFixed(2)} each
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="number"
                min={1}
                max={item.maxStock}
                value={item.qty}
                onChange={(e) =>
                  onQtyChange(item.productId, Number(e.target.value))
                }
                className="w-12 border border-stone-200 rounded-md px-1.5 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 bg-stone-50/50"
              />
              <button
                onClick={() => onRemove(item.productId)}
                className="text-stone-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
                title="Remove item"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
      {items.length > 0 && (
        <>
          <div className="flex justify-between font-semibold text-stone-900 mt-4 pt-4 border-t border-stone-200/80">
            <span>Total</span>
            <span className="text-base">${total.toFixed(2)}</span>
          </div>
          {error && (
            <p className="text-xs text-red-600 mt-2 font-medium bg-red-50 p-2 rounded border border-red-100">
              {error}
            </p>
          )}
          <button
            disabled={checkingOut}
            onClick={onCheckout}
            className="mt-4 w-full bg-stone-900 hover:bg-stone-800 active:scale-[0.99] text-white font-medium rounded-lg py-2.5 text-sm shadow-sm transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {checkingOut ? "Reserving stock..." : "Checkout & reserve stock"}
          </button>
        </>
      )}
    </div>
  );
}
