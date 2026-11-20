
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "./supabase";

export default function AdminHeroSlides({ onBack }) {
  const [slides, setSlides] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSlides();
  }, []);

  async function fetchSlides() {
    setLoading(true);

    const { data, error } = await supabase
      .from("hero_slides")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      alert(error.message);
    } else {
      setSlides(data || []);
    }

    setLoading(false);
  }

  function handleImageSelect(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      alert("Choose a PNG, JPG/JPEG or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleUpload(event) {
    event.preventDefault();

    if (!selectedFile) {
      alert("Please choose an image.");
      return;
    }

    if (slides.length >= 4) {
      alert("You can add up to 4 hero slides.");
      return;
    }

    setSaving(true);

    try {
      const extension =
        selectedFile.name.split(".").pop()?.toLowerCase() || "jpg";

      const filePath =
        `hero-slides/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("catalog-images")
        .upload(filePath, selectedFile, {
          upsert: false,
          contentType: selectedFile.type,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("catalog-images")
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from("hero_slides")
        .insert({
          image_url: urlData.publicUrl,
          title: title.trim() || null,
          sort_order: slides.length,
          is_active: true,
        });

      if (insertError) throw insertError;

      setSelectedFile(null);
      setPreview("");
      setTitle("");

      event.target.reset();

      await fetchSlides();
      alert("Hero slide uploaded successfully.");
    } catch (error) {
      console.error("Hero slide upload error:", error);
      alert(error.message || "Failed to upload hero slide.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleSlide(slide) {
    const { error } = await supabase
      .from("hero_slides")
      .update({ is_active: !slide.is_active })
      .eq("id", slide.id);

    if (error) {
      alert(error.message);
      return;
    }

    await fetchSlides();
  }

  async function moveSlide(index, direction) {
    const newIndex = index + direction;

    if (newIndex < 0 || newIndex >= slides.length) return;

    const reordered = [...slides];
    [reordered[index], reordered[newIndex]] = [
      reordered[newIndex],
      reordered[index],
    ];

    const updates = reordered.map((slide, position) => ({
      ...slide,
      sort_order: position,
    }));

    setSaving(true);

    try {
      for (const slide of updates) {
        const { error } = await supabase
          .from("hero_slides")
          .update({ sort_order: slide.sort_order })
          .eq("id", slide.id);

        if (error) throw error;
      }

      await fetchSlides();
    } catch (error) {
      alert(error.message || "Could not reorder slides.");
      await fetchSlides();
    } finally {
      setSaving(false);
    }
  }

  async function deleteSlide(slide) {
    if (!window.confirm("Delete this homepage slide?")) return;

    const { error } = await supabase
      .from("hero_slides")
      .delete()
      .eq("id", slide.id);

    if (error) {
      alert(error.message);
      return;
    }

    await fetchSlides();
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={onBack}
          className="text-cyan-400 mb-5 hover:text-white"
        >
          ← Dashboard
        </button>

        <h1 className="text-3xl md:text-4xl font-bold">
          🖼️ Hero Slideshow
        </h1>

        <p className="text-gray-400 mt-2 mb-8">
          Upload up to 4 images for your homepage hero section.
        </p>

        <form
          onSubmit={handleUpload}
          className="bg-gray-900 border border-gray-700 rounded-3xl p-5 md:p-7 mb-8"
        >
          <h2 className="text-xl font-bold mb-5">
            Add Homepage Image
          </h2>

          <label className="block text-sm text-gray-400 mb-2">
            Image title (optional)
          </label>

          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Example: Premium Accessories"
            className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 mb-5 outline-none focus:border-cyan-400"
          />

          <label className="block text-sm text-gray-400 mb-2">
            Upload image
          </label>

          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleImageSelect}
            className="w-full bg-black border border-gray-700 rounded-xl p-3"
          />

          <p className="text-xs text-gray-500 mt-2">
            PNG, JPG/JPEG or WEBP • Maximum 5 MB
          </p>

          {preview && (
            <img
              src={preview}
              alt="Slide preview"
              className="mt-5 h-48 w-full max-w-sm rounded-2xl bg-black object-contain"
            />
          )}

          <button
            type="submit"
            disabled={saving || slides.length >= 4}
            className="mt-6 px-6 py-3 rounded-xl bg-cyan-400 text-black font-bold disabled:opacity-50"
          >
            {saving ? "Saving..." : "Upload Hero Image"}
          </button>

          <p className="text-sm text-gray-400 mt-3">
            {slides.length} of 4 images added
          </p>
        </form>

        <h2 className="text-2xl font-bold mb-5">
          Your Homepage Slides
        </h2>

        {loading ? (
          <p className="text-cyan-400">Loading slides...</p>
        ) : slides.length === 0 ? (
          <p className="text-gray-500">
            No slides uploaded yet.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-5">
            {slides.map((slide, index) => (
              <motion.div
                key={slide.id}
                layout
                className="bg-gray-900 border border-gray-700 rounded-3xl p-4"
              >
                <img
                  src={slide.image_url}
                  alt={slide.title || "Homepage slide"}
                  className="w-full h-52 object-contain bg-black rounded-2xl"
                />

                <h3 className="font-bold mt-4">
                  {slide.title || `Homepage Slide ${index + 1}`}
                </h3>

                <p
                  className={
                    slide.is_active
                      ? "text-green-400 text-sm mt-2"
                      : "text-gray-500 text-sm mt-2"
                  }
                >
                  {slide.is_active ? "Active" : "Hidden"}
                </p>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button
                    type="button"
                    disabled={saving || index === 0}
                    onClick={() => moveSlide(index, -1)}
                    className="py-2 rounded-lg border border-gray-700 disabled:opacity-30"
                  >
                    ↑ Move up
                  </button>

                  <button
                    type="button"
                    disabled={saving || index === slides.length - 1}
                    onClick={() => moveSlide(index, 1)}
                    className="py-2 rounded-lg border border-gray-700 disabled:opacity-30"
                  >
                    ↓ Move down
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleSlide(slide)}
                    className="py-2 rounded-lg border border-cyan-400/50 text-cyan-400"
                  >
                    {slide.is_active ? "Hide slide" : "Activate"}
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteSlide(slide)}
                    className="py-2 rounded-lg border border-red-400/50 text-red-400"
                  >
                    Delete
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
