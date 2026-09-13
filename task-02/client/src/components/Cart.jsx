import React from "react";

export default function Cart({ items, onQtyChange, onRemove, onCheckout, checkingOut, error }) {
  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  return (
    <div className="border border-stone-200 rounded-lg p-4 bg-white sticky top-4">
      <h2 className="text-lg font-semibold mb-3">Cart</h2>
      {items.length === 0 && <p className="text-sm text-stone-500">Cart is empty.</p>}
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.productId} className="flex items-center justify-between text-sm">
            <div className="flex-1">
              <p>{item.name}</p>
              <p className="text-stone-500">${item.price.toFixed(2)} each</p>
            </div>
            <input
              type="number"
              min={1}
              max={item.maxStock}
              value={item.qty}
              onChange={(e) => onQtyChange(item.productId, Number(e.target.value))}
              className="w-14 border rounded px-1 py-0.5 text-center mr-2"
            />
            <button onClick={() => onRemove(item.productId)} className="text-red-600 text-xs">✕</button>
          </div>
        ))}
      </div>
      {items.length > 0 && (
        <>
          <div className="flex justify-between font-medium mt-3 pt-3 border-t border-stone-200">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
          <button
            disabled={checkingOut}
            onClick={onCheckout}
            className="mt-3 w-full bg-brand text-white rounded py-2 text-sm disabled:opacity-50"
          >
            {checkingOut ? "Reserving stock..." : "Checkout & reserve stock"}
          </button>
        </>
      )}
    </div>
  );
}
