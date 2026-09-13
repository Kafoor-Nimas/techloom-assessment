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
  const [cartSessionId, setCartSessionId] = useState(() => getPersistentId("cartSessionId"));
  const [cart, setCart] = useState([]);
  const [checkingOut, setCheckingOut] = useState(false);
  const [cartError, setCartError] = useState(null);
  const location = useLocation();

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product._id);
      if (existing) {
        return prev.map((i) => (i.productId === product._id ? { ...i, qty: Math.min(i.qty + 1, product.stock) } : i));
      }
      return [...prev, { productId: product._id, name: product.name, price: product.price, qty: 1, maxStock: product.stock }];
    });
  }

  function updateQty(productId, qty) {
    setCart((prev) => prev.map((i) => (i.productId === productId ? { ...i, qty: Math.max(1, qty) } : i)));
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
      // Start a fresh checkout session for the next cart so a new order can
      // be created instead of being treated as a duplicate of this one.
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
    <div className="max-w-6xl mx-auto p-4 sm:p-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fernweh Goods</h1>
          <p className="text-stone-500 text-sm">Storefront checkout & payment demo — Techloom.ai Task 02</p>
        </div>
        <nav className="flex gap-4 text-sm">
          <Link className={location.pathname === "/" ? "font-semibold" : "text-stone-500"} to="/">Shop</Link>
          <Link className={location.pathname === "/orders" ? "font-semibold" : "text-stone-500"} to="/orders">Order history</Link>
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
        <Route path="/orders" element={<OrderHistory customerId={customerId} />} />
      </Routes>
    </div>
  );
}
