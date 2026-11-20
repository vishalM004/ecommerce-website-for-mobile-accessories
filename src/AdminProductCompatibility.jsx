import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "./supabase";

export default function AdminProductCompatibility({ onBack }) {
  const [products, setProducts] = useState([]);
  const [phones, setPhones] = useState([]);
  const [compatibility, setCompatibility] = useState([]);

  const [selectedProductId, setSelectedProductId] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);

    const [
      { data: productData, error: productError },
      { data: phoneData, error: phoneError },
      { data: compatibilityData, error: compatibilityError },
    ] = await Promise.all([
      supabase
        .from("products")
        .select(
          "id, product_name, category, brand, price, sale_price, stock, is_active"
        )
        .order("product_name", { ascending: true }),

      supabase
        .from("phones_v2")
        .select("id, brand, model, image_url")
        .order("brand", { ascending: true })
        .order("model", { ascending: true }),

      supabase
        .from("product_compatibility")
        .select("id, product_id, phone_id"),
    ]);

    if (productError) {
      console.error("Products error:", productError);
      alert(productError.message);
      setLoading(false);
      return;
    }

    if (phoneError) {
      console.error("Phones error:", phoneError);
      alert(phoneError.message);
      setLoading(false);
      return;
    }

    if (compatibilityError) {
      console.error("Compatibility error:", compatibilityError);
      alert(compatibilityError.message);
      setLoading(false);
      return;
    }

    setProducts(productData || []);
    setPhones(phoneData || []);
    setCompatibility(compatibilityData || []);

    setLoading(false);
  }

  const selectedProduct = products.find(
    (product) => product.id === selectedProductId
  );

  const linkedPhoneIds = useMemo(() => {
    return new Set(
      compatibility
        .filter(
          (item) => item.product_id === selectedProductId
        )
        .map((item) => String(item.phone_id))
    );
  }, [compatibility, selectedProductId]);

  const linkedPhones = useMemo(() => {
    if (!selectedProductId) return [];

    return phones.filter((phone) =>
      linkedPhoneIds.has(String(phone.id))
    );
  }, [phones, linkedPhoneIds, selectedProductId]);

  const filteredPhones = useMemo(() => {
    const query = phoneSearch.trim().toLowerCase();

    let result = phones;

    if (query) {
      const normalizedQuery = query.replace(
        /[^a-z0-9]/g,
        ""
      );

      result = phones.filter((phone) => {
        const fullText = `${phone.brand} ${phone.model} ${phone.id}`
          .toLowerCase();

        const normalizedFullText = fullText.replace(
          /[^a-z0-9]/g,
          ""
        );

        return (
          fullText.includes(query) ||
          normalizedFullText.includes(normalizedQuery)
        );
      });
    }

    return result.slice(0, 100);
  }, [phones, phoneSearch]);

  async function addCompatibility(phone) {
    if (!selectedProductId) {
      alert("Select a product first.");
      return;
    }

    if (linkedPhoneIds.has(String(phone.id))) {
      return;
    }

    setSaving(true);

    const { data, error } = await supabase
      .from("product_compatibility")
      .insert({
        product_id: selectedProductId,
        phone_id: phone.id,
      })
      .select("id, product_id, phone_id")
      .single();

    if (error) {
      console.error("Add compatibility error:", error);
      alert(error.message);
      setSaving(false);
      return;
    }

    setCompatibility((current) => [
      ...current,
      data,
    ]);

    setSaving(false);
  }

  async function removeCompatibility(
    compatibilityId,
    phoneName
  ) {
    const confirmed = window.confirm(
      `Remove compatibility with "${phoneName}"?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("product_compatibility")
      .delete()
      .eq("id", compatibilityId);

    if (error) {
      console.error(
        "Remove compatibility error:",
        error
      );
      alert(error.message);
      return;
    }

    setCompatibility((current) =>
      current.filter(
        (item) => item.id !== compatibilityId
      )
    );
  }

  function getCompatibilityId(phoneId) {
    return compatibility.find(
      (item) =>
        item.product_id === selectedProductId &&
        String(item.phone_id) === String(phoneId)
    )?.id;
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

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">
                🔗 Product Compatibility
              </h1>

              <p className="text-gray-400 mt-2">
                Connect sellable products to supported phone models.
              </p>
            </div>

            <div className="bg-gray-900 border border-gray-700 rounded-2xl px-5 py-3">
              <div className="text-gray-500 text-sm">
                Phone Models
              </div>

              <div className="text-2xl font-bold text-cyan-400">
                {phones.length}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-cyan-400">
            Loading compatibility data...
          </div>
        ) : (
          <>
            {/* PRODUCT SELECT */}
            <div className="bg-gray-900 border border-gray-700 rounded-3xl p-5 md:p-7 mb-8">
              <h2 className="text-2xl font-bold mb-5">
                🛍️ Select Product
              </h2>

              <select
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  setPhoneSearch("");
                }}
                className="w-full bg-black border border-gray-700 rounded-2xl px-4 py-4 outline-none focus:border-cyan-400"
              >
                <option value="">
                  Select a product...
                </option>

                {products.map((product) => (
                  <option
                    key={product.id}
                    value={product.id}
                  >
                    {product.product_name}
                    {product.brand
                      ? ` • ${product.brand}`
                      : ""}
                  </option>
                ))}
              </select>

              {selectedProduct && (
                <div className="mt-5 bg-black border border-gray-800 rounded-2xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold">
                        {selectedProduct.product_name}
                      </h3>

                      <p className="text-gray-500 text-sm mt-1">
                        {selectedProduct.category}
                        {selectedProduct.brand
                          ? ` • ${selectedProduct.brand}`
                          : ""}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="text-green-400 font-bold">
                        ₹
                        {selectedProduct.sale_price ??
                          selectedProduct.price}
                      </div>

                      <div className="text-gray-500 text-sm">
                        Stock: {selectedProduct.stock}
                      </div>
                    </div>
                  </div>

                  {!selectedProduct.is_active && (
                    <div className="mt-3 text-red-400 text-sm">
                      ⚠️ This product is currently hidden.
                    </div>
                  )}
                </div>
              )}
            </div>

            {selectedProductId && (
              <>
                {/* ADD PHONE */}
                <div className="bg-gray-900 border border-gray-700 rounded-3xl p-5 md:p-7 mb-8">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                    <div>
                      <h2 className="text-2xl font-bold">
                        📱 Add Compatible Phone
                      </h2>

                      <p className="text-gray-500 text-sm mt-1">
                        Search for a phone and add it to this product.
                      </p>
                    </div>

                    <div className="text-cyan-400 font-semibold">
                      {linkedPhones.length} linked
                    </div>
                  </div>

                  <input
                    value={phoneSearch}
                    onChange={(e) =>
                      setPhoneSearch(e.target.value)
                    }
                    placeholder="🔎 Search phone model, brand or ID..."
                    className="w-full bg-black border border-gray-700 rounded-2xl px-5 py-4 outline-none focus:border-cyan-400"
                  />

                  <div className="mt-5 max-h-[500px] overflow-y-auto space-y-3 pr-1">
                    {filteredPhones.map((phone) => {
                      const alreadyLinked =
                        linkedPhoneIds.has(String(phone.id));

                      return (
                        <div
                          key={phone.id}
                          className="bg-black border border-gray-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                        >
                          <div>
                            <div className="font-bold">
                              {phone.brand} {phone.model}
                            </div>

                            <div className="text-gray-600 text-xs mt-1">
                              {phone.id}
                            </div>
                          </div>

                          <button
                            onClick={() =>
                              addCompatibility(phone)
                            }
                            disabled={
                              alreadyLinked || saving
                            }
                            className={`px-5 py-2.5 rounded-xl font-semibold transition ${
                              alreadyLinked
                                ? "bg-green-400/10 text-green-400 cursor-default"
                                : "bg-cyan-400 text-black hover:scale-[1.02]"
                            } disabled:opacity-60`}
                          >
                            {alreadyLinked
                              ? "✓ Linked"
                              : saving
                              ? "Adding..."
                              : "+ Add"}
                          </button>
                        </div>
                      );
                    })}

                    {filteredPhones.length === 0 && (
                      <div className="text-center py-10 text-gray-500">
                        No phone models found.
                      </div>
                    )}

                    {phones.length > 100 &&
                      !phoneSearch.trim() && (
                        <div className="text-center text-gray-600 text-sm py-2">
                          Showing first 100 phones. Search to find
                          another model.
                        </div>
                      )}
                  </div>
                </div>

                {/* LINKED PHONES */}
                <div className="bg-gray-900 border border-gray-700 rounded-3xl p-5 md:p-7">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                    <div>
                      <h2 className="text-2xl font-bold">
                        ✅ Compatible Phones
                      </h2>

                      <p className="text-gray-500 text-sm mt-1">
                        Phones currently connected to this product.
                      </p>
                    </div>

                    <div className="text-cyan-400 font-bold">
                      {linkedPhones.length}
                    </div>
                  </div>

                  {linkedPhones.length === 0 ? (
                    <div className="text-center py-14 text-gray-500">
                      No phones linked to this product yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {linkedPhones.map((phone) => {
                        const compatibilityId =
                          getCompatibilityId(phone.id);

                        return (
                          <motion.div
                            key={phone.id}
                            initial={{
                              opacity: 0,
                              y: 10,
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                            }}
                            className="bg-black border border-gray-800 rounded-2xl p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-bold">
                                  {phone.brand} {phone.model}
                                </div>

                                <div className="text-gray-600 text-xs mt-1">
                                  {phone.id}
                                </div>
                              </div>

                              <span className="text-green-400 text-xs">
                                Linked
                              </span>
                            </div>

                            <button
                              onClick={() =>
                                removeCompatibility(
                                  compatibilityId,
                                  `${phone.brand} ${phone.model}`
                                )
                              }
                              className="w-full mt-4 py-2.5 rounded-xl border border-red-400 text-red-400 hover:bg-red-400 hover:text-black transition font-semibold"
                            >
                              🗑️ Remove
                            </button>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}