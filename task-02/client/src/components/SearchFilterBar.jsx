import React from "react";

export default function SearchFilterBar({ filters, onChange, categories }) {
  function update(key, value) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5 mb-4 bg-white border border-stone-200/80 rounded-xl p-3 shadow-sm">
      <input
        placeholder="Search products..."
        value={filters.search}
        onChange={(e) => update("search", e.target.value)}
        className="flex-1 min-w-[180px] border border-stone-200 rounded-lg px-3 py-1.5 text-sm bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 transition-all placeholder:text-stone-400"
      />
      <select
        value={filters.category}
        onChange={(e) => update("category", e.target.value)}
        className="border border-stone-200 rounded-lg px-3 py-1.5 text-sm bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 text-stone-700 transition-all cursor-pointer"
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <input
        type="number"
        placeholder="Min $"
        value={filters.minPrice}
        onChange={(e) => update("minPrice", e.target.value)}
        className="w-20 border border-stone-200 rounded-lg px-2.5 py-1.5 text-sm bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 transition-all placeholder:text-stone-400"
      />
      <input
        type="number"
        placeholder="Max $"
        value={filters.maxPrice}
        onChange={(e) => update("maxPrice", e.target.value)}
        className="w-20 border border-stone-200 rounded-lg px-2.5 py-1.5 text-sm bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 transition-all placeholder:text-stone-400"
      />
      <label className="flex items-center gap-2 text-sm text-stone-600 px-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={filters.inStock}
          onChange={(e) => update("inStock", e.target.checked)}
          className="rounded border-stone-300 text-stone-900 focus:ring-stone-400 h-4 w-4 accent-stone-900 cursor-pointer"
        />
        <span className="font-medium">In stock only</span>
      </label>
    </div>
  );
}
