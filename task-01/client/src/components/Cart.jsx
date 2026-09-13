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
    <div className="border border-stone-300 rounded-sm bg-white sticky top-4">
      <div className="px-4 py-3 border-b border-dashed border-stone-300">
        <h2 className="text-lg font-semibold">Cart</h2>
      </div>

      <div className="p-4">
        {items.length === 0 && (
          <p className="text-sm text-stone-500">Cart is empty.</p>
        )}
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex-1 pr-2">
                <p>{item.name}</p>
                <p className="font-mono text-xs text-stone-500">
                  ${item.price.toFixed(2)} each
                </p>
              </div>
              <input
                type="number"
                min={1}
                max={item.maxStock}
                value={item.qty}
                onChange={(e) =>
                  onQtyChange(item.productId, Number(e.target.value))
                }
                className="w-14 font-mono border border-stone-300 rounded-sm px-1 py-1 text-center mr-2 focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
              <button
                onClick={() => onRemove(item.productId)}
                aria-label={`Remove ${item.name}`}
                className="text-stone-400 hover:text-[#AD3A2E] text-sm leading-none px-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <>
            <div className="flex justify-between items-baseline mt-4 pt-3 border-t border-dashed border-stone-300">
              <span className="text-sm text-stone-600">Total</span>
              <span className="font-mono text-lg font-semibold">
                ${total.toFixed(2)}
              </span>
            </div>
            {error && <p className="text-xs text-[#AD3A2E] mt-2">{error}</p>}
            <button
              disabled={checkingOut}
              onClick={onCheckout}
              className="mt-4 w-full bg-brand text-white rounded-sm py-2.5 text-sm font-medium hover:bg-stone-800 disabled:opacity-50 transition-colors"
            >
              {checkingOut ? "Reserving stock…" : "Checkout & reserve stock"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
