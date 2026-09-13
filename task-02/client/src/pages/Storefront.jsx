import React, { useEffect, useState, useCallback } from "react";
import { api } from "../api";
import ProductCard from "../components/ProductCard";
import SearchFilterBar from "../components/SearchFilterBar";
import Cart from "../components/Cart";

export default function Storefront({ cart, onAddToCart, onQtyChange, onRemove, onCheckout, checkingOut, cartError }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ search: "", category: "", minPrice: "", maxPrice: "", inStock: false });

  const load = useCallback(() => {
    api.listProducts(filters).then(setProducts).catch(console.error);
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(load, 250); // debounce search typing
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    api.listCategories().then(setCategories).catch(console.error);
  }, []);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <SearchFilterBar filters={filters} onChange={setFilters} categories={categories} />
        {products.length === 0 && <p className="text-sm text-stone-500">No products match your filters.</p>}
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} onAddToCart={onAddToCart} />
          ))}
        </div>
      </div>
      <div>
        <Cart items={cart} onQtyChange={onQtyChange} onRemove={onRemove} onCheckout={onCheckout} checkingOut={checkingOut} error={cartError} />
      </div>
    </div>
  );
}
