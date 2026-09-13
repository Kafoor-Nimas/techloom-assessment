import React, { useEffect, useState, useCallback } from "react";
import { api } from "./api";
import ProductGrid from "./components/ProductGrid";
import Cart from "./components/Cart";
import OrderCard from "./components/OrderCard";

function getCartSessionId() {
  let id = localStorage.getItem("cartSessionId");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("cartSessionId", id);
  }
  return id;
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [checkingOut, setCheckingOut] = useState(false);
  const [cartError, setCartError] = useState(null);
  const cartSessionId = getCartSessionId();

  const loadProducts = useCallback(() => {
    api.listProducts().then(setProducts).catch(console.error);
  }, []);

  const loadOrders = useCallback(() => {
    api.listOrders(cartSessionId).then(setOrders).catch(console.error);
  }, [cartSessionId]);

  useEffect(() => {
    loadProducts();
    loadOrders();
    const id = setInterval(loadOrders, 5000); // pick up sweeper-driven expiry
    return () => clearInterval(id);
  }, [loadProducts, loadOrders]);

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
        cartSessionId,
        items: cart.map((i) => ({ productId: i.productId, qty: i.qty })),
      });
      setCart([]);
      loadProducts();
      loadOrders();
    } catch (err) {
      setCartError(err.message);
    } finally {
      setCheckingOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-stone-900">
      <div className="max-w-6xl mx-auto p-4 sm:p-8">
        <header className="mb-8 pb-4 border-b border-dashed border-stone-300 flex items-baseline justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Counter POS</h1>
          <p className="font-mono text-xs text-stone-500">
            Concurrency-safe order & inventory demo — Techloom.ai Task 01
          </p>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-10">
            <ProductGrid
              products={products}
              onChanged={loadProducts}
              onAddToCart={addToCart}
            />

            <div>
              <h2 className="text-lg font-semibold mb-3 pb-2 border-b border-dashed border-stone-300">
                Your orders
              </h2>
              {orders.length === 0 && (
                <p className="text-sm text-stone-500 py-2">
                  No orders yet — add items to your cart and check out.
                </p>
              )}
              <div className="grid sm:grid-cols-2 gap-3">
                {orders.map((o) => (
                  <OrderCard
                    key={o._id}
                    order={o}
                    onRefresh={() => {
                      loadOrders();
                      loadProducts();
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <Cart
              items={cart}
              onQtyChange={updateQty}
              onRemove={removeFromCart}
              onCheckout={checkout}
              checkingOut={checkingOut}
              error={cartError}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
