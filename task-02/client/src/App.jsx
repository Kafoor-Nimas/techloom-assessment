import React, { useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { api } from "./api";
import Storefront from "./pages/Storefront";
import OrderHistory from "./pages/OrderHistory";

function getPersistentId(key) {
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export default function App() {
  const customerId = getPersistentId("customerId");
  const [cartSessionId, setCartSessionId] = useState(() =>
    getPersistentId("cartSessionId"),
  );
  const [cart, setCart] = useState([]);
  const [checkingOut, setCheckingOut] = useState(false);
  const [cartError, setCartError] = useState(null);
  const location = useLocation();

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product._id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product._id
            ? { ...i, qty: Math.min(i.qty + 1, product.stock) }
            : i,
        );
      }
      return [
        ...prev,
        {
          productId: product._id,
          name: product.name,
          price: product.price,
          qty: 1,
          maxStock: product.stock,
        },
      ];
    });
  }

  function updateQty(productId, qty) {
    setCart((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, qty: Math.max(1, qty) } : i,
      ),
    );
  }

  function removeFromCart(productId) {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }

  async function checkout() {
    setCheckingOut(true);
    setCartError(null);
    try {
      await api.checkout({
        customerId,
        cartSessionId,
        items: cart.map((i) => ({ productId: i.productId, qty: i.qty })),
      });
      setCart([]);
      const nextSession = crypto.randomUUID();
      localStorage.setItem("cartSessionId", nextSession);
      setCartSessionId(nextSession);
    } catch (err) {
      setCartError(err.message);
    } finally {
      setCheckingOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50/50 text-stone-800 antialiased">
      <div className="max-w-6xl mx-auto p-4 sm:p-8">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200/80">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              Fernweh Goods
            </h1>
            <p className="text-stone-500 text-sm mt-0.5">
              Storefront checkout & payment demo — Techloom.ai Task 02
            </p>
          </div>
          <nav className="flex gap-1 bg-stone-200/60 p-1 rounded-lg self-start sm:self-auto">
            <Link
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                location.pathname === "/"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/40"
              }`}
              to="/"
            >
              Shop
            </Link>
            <Link
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                location.pathname === "/orders"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/40"
              }`}
              to="/orders"
            >
              Order history
            </Link>
          </nav>
        </header>

        <Routes>
          <Route
            path="/"
            element={
              <Storefront
                cart={cart}
                onAddToCart={addToCart}
                onQtyChange={updateQty}
                onRemove={removeFromCart}
                onCheckout={checkout}
                checkingOut={checkingOut}
                cartError={cartError}
              />
            }
          />
          <Route
            path="/orders"
            element={<OrderHistory customerId={customerId} />}
          />
        </Routes>
      </div>
    </div>
  );
}
