import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "./supabase";

const emptyForm = {
  brand: "",
  model: "",
  image_url: "",
};

const brandOptions = [
  "Apple",
  "Samsung",
  "OPPO",
  "Vivo",
  "iQOO",
  "Redmi",
  "Xiaomi",
  "Poco",
  "Motorola",
  "Realme",
  "OnePlus",
];

export default function AdminPhones({ onBack }) {
  const [phones, setPhones] = useState([]);
  const [form, setForm] = useState(emptyForm);
const [editingId, setEditingId] = useState(null);

const [selectedImageFile, setSelectedImageFile] = useState(null);
const [imagePreview, setImagePreview] = useState("");

const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchPhones();
  }, []);

  async function fetchPhones() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("phones_v2")
      .select("id, brand, model, image_url")
      .order("id", { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setPhones(data || []);
    }

    setLoading(false);
  }

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };
  const handleImageSelect = (e) => {
  const file = e.target.files?.[0];

  if (!file) return;

  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    setError("Only PNG, JPG/JPEG, and WEBP images are allowed.");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    setError("Image must be smaller than 5 MB.");
    return;
  }

  setSelectedImageFile(file);
  setImagePreview(URL.createObjectURL(file));
  setError("");
};

  const resetForm = () => {
  setForm(emptyForm);
  setEditingId(null);
  setSelectedImageFile(null);
  setImagePreview("");
  setError("");
};

  const generateNextPhoneId = () => {
    let highestNumber = 0;

    phones.forEach((phone) => {
      const match = String(phone.id || "").match(/^P(\d+)$/i);

      if (match) {
        const number = Number(match[1]);

        if (number > highestNumber) {
          highestNumber = number;
        }
      }
    });

    return `P${String(highestNumber + 1).padStart(4, "0")}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    const brand = form.brand.trim();
    const model = form.model.trim();
    const imageUrl = form.image_url.trim();

    if (!brand) {
      setError("Brand is required.");
      return;
    }

    if (!model) {
      setError("Model is required.");
      return;
    }

    setSaving(true);

try {
  let phoneId = editingId;

  if (!phoneId) {
    phoneId = generateNextPhoneId();
  }

  let finalImageUrl = imageUrl || null;

  // Uploaded image takes priority over Image URL
  if (selectedImageFile) {
    const extension =
      selectedImageFile.name.split(".").pop()?.toLowerCase() || "jpg";

    const filePath = `phones/${phoneId}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("catalog-images")
      .upload(filePath, selectedImageFile, {
        upsert: true,
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
      if (editingId) {
        const { error } = await supabase
          .from("phones_v2")
          .update({
            brand,
            model,
            image_url: finalImageUrl,
          })
          .eq("id", editingId);

        if (error) throw error;

        setMessage("Phone model updated successfully.");
      } else {
        const newPhoneId = generateNextPhoneId();

        const { error } = await supabase
          .from("phones_v2")
          .insert({
            id: newPhoneId,
            brand,
            model,
            image_url: finalImageUrl,
          });

        if (error) throw error;

        setMessage(
          `Phone model added successfully with ID ${newPhoneId}.`
        );
      }

      resetForm();
      await fetchPhones();
    } catch (err) {
      setError(err.message || "Unable to save phone model.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (phone) => {
    setEditingId(phone.id);

    setForm({
      brand: phone.brand || "",
      model: phone.model || "",
      image_url: phone.image_url || "",
    });

    setError("");
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (id, model) => {
    const confirmed = window.confirm(
      `Delete "${model}"?\n\nThis may also remove compatibility relationships connected to this phone.`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    const { error } = await supabase
      .from("phones_v2")
      .delete()
      .eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    if (editingId === id) {
      resetForm();
    }

    setMessage("Phone model deleted successfully.");
    await fetchPhones();
  };

  const filteredPhones = phones.filter((phone) => {
    const query = search.trim().toLowerCase();

    if (!query) return true;

    return (
      String(phone.id || "").toLowerCase().includes(query) ||
      String(phone.brand || "").toLowerCase().includes(query) ||
      String(phone.model || "").toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-black text-white">

      {/* HEADER */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-5 flex items-center justify-between gap-4">

          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Phone Models
            </h1>

            <p className="text-cyan-400 text-sm font-semibold mt-1">
              Phone Catalog Management
            </p>
          </div>

          <button
            onClick={onBack}
            className="px-4 py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:border-cyan-400 hover:text-cyan-400 transition font-semibold"
          >
            ← Dashboard
          </button>

        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 md:px-8 py-8">

        {/* ADD / EDIT FORM */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900/70 border border-gray-800 rounded-3xl p-6 md:p-8 mb-10"
        >

          <div className="flex items-center justify-between gap-4 mb-6">

            <div>
              <h2 className="text-2xl font-bold">
                {editingId ? "Edit Phone Model" : "Add Phone Model"}
              </h2>

              <p className="text-gray-500 text-sm mt-1">
                Add or update phones used by the MM TIMES compatibility system.
              </p>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm text-gray-400 hover:text-white transition"
              >
                Cancel Edit
              </button>
            )}

          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >

            {/* BRAND */}
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Brand
              </label>

              <select
                name="brand"
                value={form.brand}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-2xl bg-black border border-gray-700 text-white outline-none focus:border-cyan-400"
                required
              >
                <option value="">
                  Select brand
                </option>

                {brandOptions.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>

            {/* MODEL */}
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Model
              </label>

              <input
                name="model"
                value={form.model}
                onChange={handleChange}
                placeholder="Example: Galaxy S26"
                className="w-full px-4 py-3 rounded-2xl bg-black border border-gray-700 text-white placeholder-gray-600 outline-none focus:border-cyan-400"
                required
              />
            </div>

            {/* PHONE IMAGE */}
<div className="md:col-span-2">

  <label className="block text-sm text-gray-300 mb-2">
    Phone Image
  </label>

  {/* UPLOAD */}
  <div className="bg-black border border-gray-700 rounded-2xl p-5">

    <p className="text-gray-300 font-semibold mb-3">
      📤 Upload Image
    </p>

    <input
      type="file"
      accept="image/png,image/jpeg,image/webp"
      onChange={handleImageSelect}
      className="w-full text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-cyan-400 file:text-black file:font-bold file:cursor-pointer"
    />

    <p className="text-xs text-gray-600 mt-2">
      PNG, JPG/JPEG, WEBP • Maximum 5 MB
    </p>

  </div>

  {/* OR URL */}
  <div className="mt-4">

    <p className="text-gray-500 text-sm mb-2">
      OR use an Image URL
    </p>

    <input
      name="image_url"
      value={form.image_url}
      onChange={handleChange}
      placeholder="https://..."
      className="w-full px-4 py-3 rounded-2xl bg-black border border-gray-700 text-white placeholder-gray-600 outline-none focus:border-cyan-400"
    />

  </div>

  <p className="text-xs text-cyan-400/70 mt-3">
    Uploaded image takes priority over the Image URL.
  </p>

  {/* PREVIEW */}
  {(imagePreview || form.image_url.trim()) && (
    <div className="mt-5">

      <p className="text-sm text-gray-400 mb-2">
        Image Preview
      </p>

      <div className="w-32 h-40 rounded-2xl bg-black border border-gray-800 overflow-hidden flex items-center justify-center">

        <img
          src={imagePreview || form.image_url}
          alt="Phone preview"
          className="w-full h-full object-contain"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />

      </div>

    </div>
  )}

</div>

            {/* MESSAGES */}
            {error && (
              <div className="md:col-span-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="md:col-span-2 bg-green-500/10 border border-green-500/30 text-green-400 rounded-2xl px-4 py-3 text-sm">
                {message}
              </div>
            )}

            {/* ACTIONS */}
            <div className="md:col-span-2 flex flex-col sm:flex-row gap-3">

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-2xl bg-cyan-400 text-black font-bold hover:scale-[1.01] transition disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Phone"
                  : "Add Phone"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 rounded-2xl border border-gray-700 text-gray-300 hover:border-gray-500 transition"
              >
                Clear
              </button>

            </div>

          </form>
        </motion.section>

        {/* SEARCH */}
        <section className="mb-6">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>
              <h2 className="text-2xl font-bold">
                Phone Catalog
              </h2>

              <p className="text-gray-500 text-sm mt-1">
                {phones.length} phone models
              </p>
            </div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search brand, model or ID..."
              className="w-full md:w-80 px-4 py-3 rounded-2xl bg-gray-900 border border-gray-700 text-white placeholder-gray-600 outline-none focus:border-cyan-400"
            />

          </div>

        </section>

        {/* PHONE LIST */}
        {loading ? (
          <div className="text-center py-16 text-gray-500">
            Loading phone models...
          </div>
        ) : filteredPhones.length === 0 ? (
          <div className="text-center py-16 text-gray-500 border border-gray-800 rounded-3xl">
            No phone models found.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {filteredPhones.map((phone) => (
  <motion.div
    key={phone.id}
    layout
    className="px-5 py-4 bg-[#fbf9f5] border-b border-[#e7e0d5] cursor-pointer hover:bg-[#f3ede4] transition"
  >
    <div className="flex gap-4">

      {/* IMAGE */}
      <div className="w-24 h-28 rounded-2xl bg-[#f3ede4] border border-[#e7e0d5] shrink-0 overflow-hidden flex items-center justify-center">

        {phone.image_url ? (
          <img
            src={phone.image_url}
            alt={phone.model}
            className="w-full h-full object-contain"
          />
        ) : (
          <span className="text-3xl">
            📱
          </span>
        )}

      </div>

      {/* INFO */}
      <div className="min-w-0 flex-1">

        <h3 className="text-xl font-bold text-[#8f5f3a]">
          {phone.model || "Unnamed Model"}
        </h3>

        <p className="text-[#9a948c] mt-1">
          {phone.brand}
        </p>

      </div>

    </div>

    {/* ACTIONS */}
    <div className="mt-5 grid grid-cols-2 gap-3">

      <button
        onClick={() => handleEdit(phone)}
        className="py-2.5 rounded-xl border border-[#b68a4a] text-[#8f5f3a] hover:bg-[#b68a4a] hover:text-white transition font-semibold"
      >
        Edit
      </button>

      <button
        onClick={() =>
          handleDelete(phone.id, phone.model)
        }
        className="py-2.5 rounded-xl border border-red-300 text-red-400 hover:bg-red-500 hover:text-white transition font-semibold"
      >
        Delete
      </button>

    </div>
              </motion.div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}