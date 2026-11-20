import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "./supabase";

export default function AdminInventory({ onBack }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);

    const { data, error } = await supabase
      .from("products")
      .select(
        "id, product_name, category, brand, price, sale_price, stock, is_active, image_url"
      )
      .order("product_name", { ascending: true });

    if (error) {
      console.error("Inventory fetch error:", error);
      alert(error.message);
      setLoading(false);
      return;
    }

    setProducts(data || []);
    setLoading(false);
  }

  function updateStockLocal(productId, value) {
    const numericValue = Math.max(
      0,
      Number.isFinite(Number(value)) ? Number(value) : 0
    );

    setProducts((current) =>
      current.map((product) =>
        product.id === productId
          ? { ...product, stock: numericValue }
          : product
      )
    );
  }

  async function saveStock(product) {
    setSavingId(product.id);

    const { error } = await supabase
      .from("products")
      .update({
        stock: Math.max(0, Number(product.stock) || 0),
      })
      .eq("id", product.id);

    if (error) {
      console.error("Stock update error:", error);
      alert(error.message);
      setSavingId(null);
      return;
    }

    setSavingId(null);
  }

  const categories = useMemo(() => {
    const unique = [
      ...new Set(
        products
          .map((product) => product.category)
          .filter(Boolean)
      ),
    ];

    return ["All", ...unique];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        product.product_name
          ?.toLowerCase()
          .includes(query) ||
        product.brand
          ?.toLowerCase()
          .includes(query) ||
        product.category
          ?.toLowerCase()
          .includes(query);

      const matchesCategory =
        categoryFilter === "All" ||
        product.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, categoryFilter]);

  const totalUnits = products.reduce(
    (sum, product) => sum + (Number(product.stock) || 0),
    0
  );

  const outOfStock = products.filter(
    (product) => Number(product.stock) === 0
  ).length;

  const lowStock = products.filter(
    (product) =>
      Number(product.stock) > 0 &&
      Number(product.stock) <= 5
  ).length;

  const inStock = products.filter(
    (product) => Number(product.stock) > 5
  ).length;

  function getStockStatus(stock) {
    const quantity = Number(stock) || 0;

    if (quantity === 0) {
      return {
        label: "Out of Stock",
        className: "bg-red-400/10 text-red-400 border-red-400/20",
      };
    }

    if (quantity <= 5) {
      return {
        label: "Low Stock",
        className:
          "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
      };
    }

    return {
      label: "In Stock",
      className:
        "bg-green-400/10 text-green-400 border-green-400/20",
    };
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-cyan-400 transition mb-3"
          >
            ← Dashboard
          </button>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">
                📦 Inventory Management
              </h1>

              <p className="text-gray-400 mt-2">
                Quickly view and update product stock levels.
              </p>
            </div>

            <button
              onClick={fetchProducts}
              className="w-full lg:w-auto px-5 py-3 rounded-xl border border-gray-700 text-gray-300 hover:border-cyan-400 hover:text-cyan-400 transition"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

          <StatCard
            title="Products"
            value={products.length}
            icon="🛍️"
          />

          <StatCard
            title="Total Units"
            value={totalUnits}
            icon="📦"
          />

          <StatCard
            title="Low Stock"
            value={lowStock}
            icon="⚠️"
          />

          <StatCard
            title="Out of Stock"
            value={outOfStock}
            icon="🔴"
          />

        </div>

        {/* SEARCH / FILTER */}
        <div className="bg-gray-900 border border-gray-700 rounded-3xl p-5 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            <div className="lg:col-span-2">
              <label className="block text-sm text-gray-500 mb-2">
                Search
              </label>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔎 Search product, brand or category..."
                className="w-full bg-black border border-gray-700 rounded-2xl px-5 py-4 outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-2">
                Category
              </label>

              <select
                value={categoryFilter}
                onChange={(e) =>
                  setCategoryFilter(e.target.value)
                }
                className="w-full bg-black border border-gray-700 rounded-2xl px-5 py-4 outline-none focus:border-cyan-400"
              >
                {categories.map((category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                ))}
              </select>
            </div>

          </div>
        </div>

        {/* INVENTORY LIST */}
        {loading ? (
          <div className="text-center py-20 text-cyan-400">
            Loading inventory...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            No products found.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map((product) => {
              const status = getStockStatus(product.stock);

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-900 border border-gray-700 rounded-3xl p-5"
                >
                  <div className="flex flex-col xl:flex-row xl:items-center gap-5">

                    {/* PRODUCT */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">

                      <div className="w-20 h-20 shrink-0 bg-black border border-gray-800 rounded-2xl flex items-center justify-center overflow-hidden">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.product_name}
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <span className="text-3xl">
                            {product.category === "Tempered Glass"
                              ? "🛡️"
                              : product.category === "Back Cases"
                              ? "📱"
                              : product.category === "Chargers"
                              ? "🔌"
                              : product.category === "Cables"
                              ? "⚡"
                              : product.category === "Earphones"
                              ? "🎧"
                              : "🧩"}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-lg md:text-xl font-bold truncate">
                          {product.product_name}
                        </h3>

                        <p className="text-gray-500 text-sm mt-1">
                          {product.brand || "No brand"}
                          {" • "}
                          {product.category}
                        </p>

                        <div className="flex flex-wrap gap-2 mt-2">
                          <span
                            className={`text-xs px-3 py-1 rounded-full border ${status.className}`}
                          >
                            {status.label}
                          </span>

                          {!product.is_active && (
                            <span className="text-xs px-3 py-1 rounded-full border border-gray-700 text-gray-500">
                              Hidden
                            </span>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* PRICE */}
                    <div className="xl:w-36">
                      <div className="text-xs text-gray-500 mb-1">
                        Price
                      </div>

                      <div className="font-bold">
                        ₹
                        {product.sale_price ??
                          product.price}
                      </div>

                      {product.sale_price !== null &&
                        product.sale_price !== undefined && (
                          <div className="text-xs text-gray-600 line-through">
                            ₹{product.price}
                          </div>
                        )}
                    </div>

                    {/* STOCK CONTROL */}
                    <div className="xl:w-64">
                      <div className="text-xs text-gray-500 mb-2">
                        Stock Quantity
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="0"
                          value={product.stock}
                          onChange={(e) =>
                            updateStockLocal(
                              product.id,
                              e.target.value
                            )
                          }
                          className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-cyan-400"
                        />

                        <button
                          onClick={() =>
                            saveStock(product)
                          }
                          disabled={
                            savingId === product.id
                          }
                          className="px-5 py-3 rounded-xl bg-cyan-400 text-black font-bold hover:scale-[1.02] transition disabled:opacity-50"
                        >
                          {savingId === product.id
                            ? "..."
                            : "Save"}
                        </button>
                      </div>
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* LEGEND */}
        <div className="mt-8 bg-gray-900/50 border border-gray-800 rounded-2xl p-4">
          <div className="text-sm text-gray-500 mb-3">
            Stock status
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-green-400">
              🟢 In Stock — more than 5
            </span>

            <span className="text-yellow-400">
              🟡 Low Stock — 1 to 5
            </span>

            <span className="text-red-400">
              🔴 Out of Stock — 0
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
      <div className="text-2xl mb-2">
        {icon}
      </div>

      <div className="text-2xl md:text-3xl font-bold">
        {value}
      </div>

      <div className="text-gray-500 text-sm mt-1">
        {title}
      </div>
    </div>
  );
}