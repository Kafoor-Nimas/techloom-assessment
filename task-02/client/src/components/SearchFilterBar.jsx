import React from "react";

export default function SearchFilterBar({ filters, onChange, categories }) {
  function update(key, value) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="flex flex-wrap gap-2 mb-4 bg-white border border-stone-200 rounded-lg p-3">
      <input
        placeholder="Search products..."
        value={filters.search}
        onChange={(e) => update("search", e.target.value)}
        className="flex-1 min-w-[160px] border rounded px-2 py-1.5 text-sm"
      />
      <select value={filters.category} onChange={(e) => update("category", e.target.value)} className="border rounded px-2 py-1.5 text-sm">
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <input
        type="number"
        placeholder="Min $"
        value={filters.minPrice}
        onChange={(e) => update("minPrice", e.target.value)}
        className="w-20 border rounded px-2 py-1.5 text-sm"
      />
      <input
        type="number"
        placeholder="Max $"
        value={filters.maxPrice}
        onChange={(e) => update("maxPrice", e.target.value)}
        className="w-20 border rounded px-2 py-1.5 text-sm"
      />
      <label className="flex items-center gap-1.5 text-sm px-2">
        <input type="checkbox" checked={filters.inStock} onChange={(e) => update("inStock", e.target.checked)} />
        In stock only
      </label>
    </div>
  );
}
