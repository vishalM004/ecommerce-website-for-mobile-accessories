import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "./supabase";

const CATEGORY_OPTIONS = [
  "Tempered Glass",
  "Back Cases",
  "Chargers",
  "Cables",
  "Earphones",
  "Other Accessories",
];

export default function AdminProducts({ onBack }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("Tempered Glass");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [stock, setStock] = useState("0");
  const [isActive, setIsActive] = useState(true);

  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);

    const { data, error } = await supabase
      .from("products")
      .select(
        "id, product_name, category, brand, price, sale_price, description, image_url, stock, is_active, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Products fetch error:", error);
      alert(error.message);
      setLoading(false);
      return;
    }

    setProducts(data || []);
    setLoading(false);
  }

  function resetForm() {
    setEditingId(null);
    setProductName("");
    setCategory("Tempered Glass");
    setBrand("");
    setPrice("");
    setSalePrice("");
    setDescription("");
    setImageUrl("");
    setStock("0");
    setIsActive(true);
    setSelectedImageFile(null);
    setImagePreview("");
  }

  function handleImageSelect(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Only PNG, JPG/JPEG and WEBP images are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be smaller than 5 MB.");
      return;
    }

    setSelectedImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function handleEdit(product) {
    setEditingId(product.id);
    setProductName(product.product_name || "");
    setCategory(product.category || "Tempered Glass");
    setBrand(product.brand || "");
    setPrice(product.price ?? "");
    setSalePrice(product.sale_price ?? "");
    setDescription(product.description || "");
    setImageUrl(product.image_url || "");
    setStock(product.stock ?? 0);
    setIsActive(product.is_active !== false);

    setSelectedImageFile(null);
    setImagePreview(product.image_url || "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!productName.trim()) {
      alert("Product name is required.");
      return;
    }

    if (!category.trim()) {
      alert("Category is required.");
      return;
    }

    if (price === "" || Number(price) < 0) {
      alert("Enter a valid price.");
      return;
    }

    if (stock === "" || Number(stock) < 0) {
      alert("Enter a valid stock quantity.");
      return;
    }

    setSaving(true);

    try {
      let finalImageUrl = imageUrl.trim();

      if (selectedImageFile) {
        const extension =
          selectedImageFile.name.split(".").pop()?.toLowerCase() ||
          "jpg";

        const fileName = `${crypto.randomUUID()}.${extension}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("catalog-images")
          .upload(filePath, selectedImageFile, {
            upsert: false,
            contentType: selectedImageFile.type,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage
          .from("catalog-images")
          .getPublicUrl(filePath);

        finalImageUrl = publicUrlData.publicUrl;
      }

      const payload = {
        product_name: productName.trim(),
        category: category.trim(),
        brand: brand.trim() || null,
        price: Number(price),
        sale_price:
          salePrice === "" ? null : Number(salePrice),
        description: description.trim() || null,
        image_url: finalImageUrl || null,
        stock: Number(stock),
        is_active: isActive,
      };

      let error;

      if (editingId) {
        ({ error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", editingId));
      } else {
        ({ error } = await supabase
          .from("products")
          .insert(payload));
      }

      if (error) {
        throw error;
      }

      alert(
        editingId
          ? "Product updated successfully."
          : "Product added successfully."
      );

      resetForm();
      await fetchProducts();
    } catch (error) {
      console.error("Product save error:", error);
      alert(error.message || "Failed to save product.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product) {
    const confirmed = window.confirm(
      `Delete "${product.product_name}"?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);

    if (error) {
      console.error("Delete error:", error);
      alert(error.message);
      return;
    }

    if (editingId === product.id) {
      resetForm();
    }

    await fetchProducts();
  }

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return products;

    return products.filter((product) => {
      return (
        product.product_name?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query) ||
        product.brand?.toLowerCase().includes(query)
      );
    });
  }, [products, search]);

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <button
              onClick={onBack}
              className="text-gray-400 hover:text-cyan-400 transition mb-3"
            >
              ← Dashboard
            </button>

            <h1 className="text-3xl md:text-4xl font-bold">
              🛍️ Product Management
            </h1>

            <p className="text-gray-400 mt-2">
              Manage accessories, prices, stock and product visibility.
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-2xl px-5 py-3">
            <span className="text-gray-400 text-sm">
              Total Products
            </span>

            <div className="text-2xl font-bold text-cyan-400">
              {products.length}
            </div>
          </div>
        </div>

        {/* FORM */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 border border-gray-700 rounded-3xl p-5 md:p-7 mb-10"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">
                {editingId
                  ? "✏️ Edit Product"
                  : "➕ Add Product"}
              </h2>

              <p className="text-gray-500 text-sm mt-1">
                Actual sellable accessory product.
              </p>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-xl border border-gray-700 text-gray-400 hover:border-red-400 hover:text-red-400 transition"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* PRODUCT NAME */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Product Name
              </label>

              <input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Example: 9D Tempered Glass"
                className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-cyan-400"
              />
            </div>

            {/* CATEGORY */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Category
              </label>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-cyan-400"
              >
                {CATEGORY_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {/* BRAND */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Brand
              </label>

              <input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Example: CASE U"
                className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-cyan-400"
              />
            </div>

            {/* STOCK */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Stock
              </label>

              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-cyan-400"
              />
            </div>

            {/* PRICE */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Price (₹)
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="199"
                className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-cyan-400"
              />
            </div>

            {/* SALE PRICE */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Sale Price (₹) — optional
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="149"
                className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-cyan-400"
              />
            </div>

            {/* DESCRIPTION */}
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-2">
                Description
              </label>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Product description..."
                rows={4}
                className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-cyan-400 resize-none"
              />
            </div>

            {/* IMAGE URL */}
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-2">
                Image URL
              </label>

              <input
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);

                  if (!selectedImageFile) {
                    setImagePreview(e.target.value);
                  }
                }}
                placeholder="https://..."
                className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-cyan-400"
              />
            </div>

            {/* IMAGE UPLOAD */}
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-2">
                Upload Image
              </label>

              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageSelect}
                className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3"
              />

              <p className="text-gray-500 text-xs mt-2">
                PNG, JPG/JPEG or WEBP • Maximum 5 MB
              </p>

              <p className="text-cyan-400 text-xs mt-1">
                Uploaded image takes priority over Image URL.
              </p>
            </div>

            {/* PREVIEW */}
            {imagePreview && (
              <div className="md:col-span-2">
                <div className="text-sm text-gray-400 mb-2">
                  Image Preview
                </div>

                <div className="w-40 h-40 bg-black border border-gray-700 rounded-2xl flex items-center justify-center overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* ACTIVE */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-5 h-5"
                />

                <span>
                  Product visible on customer website
                </span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-7 w-full md:w-auto px-8 py-3 rounded-2xl bg-cyan-400 text-black font-bold hover:scale-[1.02] transition disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : editingId
              ? "💾 Update Product"
              : "➕ Add Product"}
          </button>
        </motion.form>

        {/* SEARCH */}
        <div className="mb-6">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔎 Search product, category or brand..."
            className="w-full bg-gray-900 border border-gray-700 rounded-2xl px-5 py-4 outline-none focus:border-cyan-400"
          />
        </div>

        {/* PRODUCT LIST */}
        {loading ? (
          <div className="text-center py-16 text-cyan-400">
            Loading products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            No products found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900 border border-gray-700 rounded-3xl p-5"
              >
                <div className="w-full h-48 bg-black rounded-2xl flex items-center justify-center overflow-hidden mb-5">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.product_name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-6xl">
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
                    </div>
                  )}
                </div>

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold">
                      {product.product_name}
                    </h3>

                    {product.brand && (
                      <p className="text-gray-500 text-sm mt-1">
                        {product.brand}
                      </p>
                    )}
                  </div>

                  <span
                    className={`text-xs px-3 py-1 rounded-full ${
                      product.is_active
                        ? "bg-green-400/10 text-green-400"
                        : "bg-red-400/10 text-red-400"
                    }`}
                  >
                    {product.is_active ? "Active" : "Hidden"}
                  </span>
                </div>

                <div className="mt-4">
                  <span className="text-gray-500 text-sm">
                    {product.category}
                  </span>
                </div>

                <div className="mt-4">
                  {product.sale_price !== null &&
                  product.sale_price !== undefined ? (
                    <div>
                      <span className="text-gray-500 line-through mr-2">
                        ₹{product.price}
                      </span>

                      <span className="text-green-400 text-xl font-bold">
                        ₹{product.sale_price}
                      </span>
                    </div>
                  ) : (
                    <span className="text-green-400 text-xl font-bold">
                      ₹{product.price}
                    </span>
                  )}
                </div>

                <div className="mt-3 text-sm">
                  <span className="text-gray-400">
                    Stock:
                  </span>{" "}
                  <span
                    className={
                      product.stock > 0
                        ? "text-white"
                        : "text-red-400"
                    }
                  >
                    {product.stock}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-5">
                  <button
                    onClick={() => handleEdit(product)}
                    className="py-3 rounded-xl border border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black transition font-semibold"
                  >
                    ✏️ Edit
                  </button>

                  <button
                    onClick={() => handleDelete(product)}
                    className="py-3 rounded-xl border border-red-400 text-red-400 hover:bg-red-400 hover:text-black transition font-semibold"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}