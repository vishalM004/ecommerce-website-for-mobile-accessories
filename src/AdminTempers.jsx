import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "./supabase";

const emptyGroupForm = {
  reference_model: "",
};

const fitOptions = [
  "Perfect",
  "Usable",
  "Perfect & Usable",
  "NIL",
];

export default function AdminTempers({ onBack }) {
  const [groups, setGroups] = useState([]);
  const [phones, setPhones] = useState([]);
  const [compatibility, setCompatibility] = useState([]);

  const [groupForm, setGroupForm] = useState(emptyGroupForm);
  const [editingGroupId, setEditingGroupId] = useState(null);

  const [selectedGroupId, setSelectedGroupId] = useState(null);

  const [phoneSearch, setPhoneSearch] = useState("");
  const [selectedPhoneId, setSelectedPhoneId] = useState("");
  const [selectedFit, setSelectedFit] = useState("Perfect");

  const [groupSearch, setGroupSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingGroup, setSavingGroup] = useState(false);
  const [savingCompatibility, setSavingCompatibility] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError("");

    const [
      { data: groupData, error: groupError },
      { data: phoneData, error: phoneError },
      { data: compatibilityData, error: compatibilityError },
    ] = await Promise.all([
      supabase
        .from("tempered_groups")
        .select("group_id, reference_model, fit")
        .order("group_id", { ascending: true }),

      supabase
        .from("phones_v2")
        .select("id, brand, model")
        .order("id", { ascending: true }),

      supabase
        .from("tempered_compatibility")
        .select("group_id, phone_id, fit"),
    ]);

    if (groupError) {
      setError(groupError.message);
      setLoading(false);
      return;
    }

    if (phoneError) {
      setError(phoneError.message);
      setLoading(false);
      return;
    }

    if (compatibilityError) {
      setError(compatibilityError.message);
      setLoading(false);
      return;
    }

    setGroups(groupData || []);
    setPhones(phoneData || []);
    setCompatibility(compatibilityData || []);

    setLoading(false);
  }

  const generateNextGroupId = () => {
    let highestNumber = 0;

    groups.forEach((group) => {
      const match = String(group.group_id || "").match(/^TG(\d+)$/i);

      if (match) {
        const number = Number(match[1]);

        if (number > highestNumber) {
          highestNumber = number;
        }
      }
    });

    return `TG${String(highestNumber + 1).padStart(3, "0")}`;
  };

  const resetGroupForm = () => {
    setGroupForm(emptyGroupForm);
    setEditingGroupId(null);
    setError("");
  };

  const handleGroupChange = (e) => {
    setGroupForm({
      ...groupForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleGroupSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    const referenceModel = groupForm.reference_model.trim();

    if (!referenceModel) {
      setError("Reference model is required.");
      return;
    }

    setSavingGroup(true);

    try {
      if (editingGroupId) {
        const { error } = await supabase
          .from("tempered_groups")
          .update({
            reference_model: referenceModel,
          })
          .eq("group_id", editingGroupId);

        if (error) throw error;

        setMessage("Tempered-glass group updated successfully.");
      } else {
        const newGroupId = generateNextGroupId();

        const { error } = await supabase
          .from("tempered_groups")
          .insert({
            group_id: newGroupId,
            reference_model: referenceModel,
            fit: "Perfect",
          });

        if (error) throw error;

        setMessage(
          `Tempered-glass group ${newGroupId} created successfully.`
        );
      }

      resetGroupForm();
      await fetchData();
    } catch (err) {
      setError(err.message || "Unable to save tempered-glass group.");
    } finally {
      setSavingGroup(false);
    }
  };

  const handleEditGroup = (group) => {
    setEditingGroupId(group.group_id);

    setGroupForm({
      reference_model: group.reference_model || "",
    });

    setSelectedGroupId(group.group_id);
    setError("");
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDeleteGroup = async (groupId, referenceModel) => {
    const confirmed = window.confirm(
      `Delete ${groupId} (${referenceModel})?\n\nIts compatibility records will also be removed if the database relationship allows cascading deletes.`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    const { error } = await supabase
      .from("tempered_groups")
      .delete()
      .eq("group_id", groupId);

    if (error) {
      setError(error.message);
      return;
    }

    if (selectedGroupId === groupId) {
      setSelectedGroupId(null);
    }

    if (editingGroupId === groupId) {
      resetGroupForm();
    }

    setMessage(`${groupId} deleted successfully.`);
    await fetchData();
  };

  const handleAddCompatibility = async () => {
    if (!selectedGroupId) {
      setError("Select a tempered-glass group first.");
      return;
    }

    if (!selectedPhoneId) {
      setError("Select a phone model.");
      return;
    }

    if (!selectedFit) {
      setError("Select a fit type.");
      return;
    }

    setError("");
    setMessage("");
    setSavingCompatibility(true);

    try {
      const existing = compatibility.find(
        (item) =>
          item.group_id === selectedGroupId &&
          item.phone_id === selectedPhoneId &&
          item.fit === selectedFit
      );

      if (existing) {
        throw new Error("This compatibility record already exists.");
      }

      const { error } = await supabase
        .from("tempered_compatibility")
        .insert({
          group_id: selectedGroupId,
          phone_id: selectedPhoneId,
          fit: selectedFit,
        });

      if (error) throw error;

      setMessage("Compatibility added successfully.");

      setSelectedPhoneId("");
      setSelectedFit("Perfect");
      setPhoneSearch("");

      await fetchData();
    } catch (err) {
      setError(
        err.message || "Unable to add compatibility."
      );
    } finally {
      setSavingCompatibility(false);
    }
  };

  const handleRemoveCompatibility = async (
    groupId,
    phoneId,
    fit
  ) => {
    const phone = phones.find((item) => item.id === phoneId);

    const confirmed = window.confirm(
      `Remove compatibility?\n\n${phone?.brand || ""} ${
        phone?.model || phoneId
      } → ${fit}`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    const { error } = await supabase
      .from("tempered_compatibility")
      .delete()
      .eq("group_id", groupId)
      .eq("phone_id", phoneId)
      .eq("fit", fit);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Compatibility removed successfully.");
    await fetchData();
  };

  const filteredGroups = useMemo(() => {
    const query = groupSearch.trim().toLowerCase();

    if (!query) return groups;

    return groups.filter((group) => {
      return (
        String(group.group_id || "")
          .toLowerCase()
          .includes(query) ||
        String(group.reference_model || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [groups, groupSearch]);

  const filteredPhoneOptions = useMemo(() => {
    const query = phoneSearch.trim().toLowerCase();

    if (!query) {
      return phones.slice(0, 20);
    }

    return phones
      .filter((phone) => {
        return (
          String(phone.id || "")
            .toLowerCase()
            .includes(query) ||
          String(phone.brand || "")
            .toLowerCase()
            .includes(query) ||
          String(phone.model || "")
            .toLowerCase()
            .includes(query)
        );
      })
      .slice(0, 30);
  }, [phones, phoneSearch]);

  const selectedGroupCompatibility = compatibility.filter(
    (item) => item.group_id === selectedGroupId
  );

  const getPhone = (phoneId) =>
    phones.find((phone) => phone.id === phoneId);

  return (
    <div className="min-h-screen bg-black text-white">

      {/* HEADER */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-5 flex items-center justify-between gap-4">

          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Tempered Glass
            </h1>

            <p className="text-green-400 text-sm font-semibold mt-1">
              Compatibility Management
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

        {/* ADD / EDIT GROUP */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900/70 border border-gray-800 rounded-3xl p-6 md:p-8 mb-8"
        >

          <div className="flex items-center justify-between gap-4 mb-6">

            <div>
              <h2 className="text-2xl font-bold">
                {editingGroupId
                  ? "Edit Tempered-Glass Group"
                  : "Add Tempered-Glass Group"}
              </h2>

              <p className="text-gray-500 text-sm mt-1">
                Create the reference model used by the compatibility system.
              </p>
            </div>

            {editingGroupId && (
              <button
                onClick={resetGroupForm}
                className="text-sm text-gray-400 hover:text-white"
              >
                Cancel Edit
              </button>
            )}

          </div>

          <form
            onSubmit={handleGroupSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >

            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Reference Model
              </label>

              <input
                name="reference_model"
                value={groupForm.reference_model}
                onChange={handleGroupChange}
                placeholder="Example: Samsung Galaxy A52"
                className="w-full px-4 py-3 rounded-2xl bg-black border border-gray-700 text-white placeholder-gray-600 outline-none focus:border-green-400"
                required
              />

              <p className="text-xs text-gray-600 mt-2">
                Group ID is generated automatically for new groups.
              </p>
            </div>

            {editingGroupId && (
              <div className="flex items-center">
                <div className="bg-black border border-gray-800 rounded-2xl px-4 py-3">
                  <span className="text-gray-500 text-sm">
                    Group ID
                  </span>

                  <p className="text-green-400 font-bold mt-1">
                    {editingGroupId}
                  </p>
                </div>
              </div>
            )}

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

            <div className="md:col-span-2 flex gap-3">

              <button
                type="submit"
                disabled={savingGroup}
                className="px-6 py-3 rounded-2xl bg-green-400 text-black font-bold hover:scale-[1.01] transition disabled:opacity-50"
              >
                {savingGroup
                  ? "Saving..."
                  : editingGroupId
                  ? "Update Group"
                  : "Add Group"}
              </button>

              <button
                type="button"
                onClick={resetGroupForm}
                className="px-6 py-3 rounded-2xl border border-gray-700 text-gray-300 hover:border-gray-500 transition"
              >
                Clear
              </button>

            </div>

          </form>
        </motion.section>

        {/* GROUP SEARCH */}
        <section className="mb-6">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>
              <h2 className="text-2xl font-bold">
                Tempered-Glass Groups
              </h2>

              <p className="text-gray-500 text-sm mt-1">
                {groups.length} groups
              </p>
            </div>

            <input
              value={groupSearch}
              onChange={(e) => setGroupSearch(e.target.value)}
              placeholder="Search group or reference model..."
              className="w-full md:w-96 px-4 py-3 rounded-2xl bg-gray-900 border border-gray-700 text-white placeholder-gray-600 outline-none focus:border-green-400"
            />

          </div>

        </section>

        {/* GROUP LIST */}
        {loading ? (
          <div className="text-center py-16 text-gray-500">
            Loading tempered-glass groups...
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-16 text-gray-500 border border-gray-800 rounded-3xl">
            No tempered-glass groups found.
          </div>
        ) : (
          <div className="space-y-5">

            {filteredGroups.map((group) => {
              const groupCompatibility = compatibility.filter(
                (item) => item.group_id === group.group_id
              );

              const isSelected =
                selectedGroupId === group.group_id;

              return (
                <motion.div
                  key={group.group_id}
                  layout
                  className={`bg-gray-900/70 border rounded-3xl p-5 md:p-6 transition ${
                    isSelected
                      ? "border-green-400/50"
                      : "border-gray-800"
                  }`}
                >

                  {/* GROUP HEADER */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedGroupId(
                          isSelected ? null : group.group_id
                        )
                      }
                      className="text-left flex-1"
                    >
                      <div className="flex items-center gap-3 flex-wrap">

                        <span className="text-xs font-bold text-green-400 bg-green-400/10 border border-green-400/20 px-3 py-1 rounded-full">
                          {group.group_id}
                        </span>

                        <span className="text-sm text-gray-500">
                          {groupCompatibility.length} compatibility record
                          {groupCompatibility.length !== 1 ? "s" : ""}
                        </span>

                      </div>

                      <h3 className="text-xl md:text-2xl font-bold mt-3">
                        {group.reference_model || "Unnamed Reference"}
                      </h3>

                      {group.fit && (
                        <p className="text-gray-500 text-sm mt-1">
                          Default fit: {group.fit}
                        </p>
                      )}

                    </button>

                    <div className="flex gap-3">

                      <button
                        onClick={() => handleEditGroup(group)}
                        className="px-4 py-2.5 rounded-xl border border-cyan-400/30 text-cyan-400 hover:bg-cyan-400 hover:text-black transition font-semibold"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          handleDeleteGroup(
                            group.group_id,
                            group.reference_model
                          )
                        }
                        className="px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition font-semibold"
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                  {/* EXPANDED COMPATIBILITY */}
                  {isSelected && (
                    <div className="mt-6 pt-6 border-t border-gray-800">

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* ADD COMPATIBILITY */}
                        <div className="bg-black/50 border border-gray-800 rounded-3xl p-5">

                          <h4 className="font-bold text-lg">
                            Add Compatible Phone
                          </h4>

                          <p className="text-gray-500 text-sm mt-1">
                            Select a phone and its fit for this temper group.
                          </p>

                          <div className="mt-5">

                            <label className="block text-sm text-gray-300 mb-2">
                              Search Phone
                            </label>

                            <input
                              value={phoneSearch}
                              onChange={(e) =>
                                setPhoneSearch(e.target.value)
                              }
                              placeholder="Search brand, model or ID..."
                              className="w-full px-4 py-3 rounded-2xl bg-gray-900 border border-gray-700 text-white placeholder-gray-600 outline-none focus:border-green-400"
                            />

                          </div>

                          <div className="mt-3 max-h-64 overflow-y-auto space-y-2">

                            {filteredPhoneOptions.map((phone) => (
                              <button
                                key={phone.id}
                                type="button"
                                onClick={() =>
                                  setSelectedPhoneId(phone.id)
                                }
                                className={`w-full text-left px-4 py-3 rounded-2xl border transition ${
                                  selectedPhoneId === phone.id
                                    ? "border-green-400 bg-green-400/10"
                                    : "border-gray-800 hover:border-gray-600"
                                }`}
                              >
                                <div className="text-xs text-green-400 font-bold">
                                  {phone.id}
                                </div>

                                <div className="font-semibold mt-1">
                                  {phone.brand} {phone.model}
                                </div>
                              </button>
                            ))}

                          </div>

                          <div className="mt-5">

                            <label className="block text-sm text-gray-300 mb-2">
                              Fit
                            </label>

                            <select
                              value={selectedFit}
                              onChange={(e) =>
                                setSelectedFit(e.target.value)
                              }
                              className="w-full px-4 py-3 rounded-2xl bg-gray-900 border border-gray-700 text-white outline-none focus:border-green-400"
                            >
                              {fitOptions.map((fit) => (
                                <option key={fit} value={fit}>
                                  {fit}
                                </option>
                              ))}
                            </select>

                          </div>

                          <button
                            type="button"
                            onClick={handleAddCompatibility}
                            disabled={savingCompatibility}
                            className="w-full mt-5 py-3 rounded-2xl bg-green-400 text-black font-bold hover:scale-[1.01] transition disabled:opacity-50"
                          >
                            {savingCompatibility
                              ? "Adding..."
                              : "Add Compatibility →"}
                          </button>

                        </div>

                        {/* CURRENT COMPATIBILITY */}
                        <div className="bg-black/50 border border-gray-800 rounded-3xl p-5">

                          <h4 className="font-bold text-lg">
                            Compatible Phones
                          </h4>

                          <p className="text-gray-500 text-sm mt-1">
                            Phones currently mapped to {group.group_id}.
                          </p>

                          <div className="mt-5 space-y-3 max-h-[500px] overflow-y-auto">

                            {groupCompatibility.length === 0 ? (
                              <div className="text-gray-600 text-sm py-8 text-center">
                                No compatible phones yet.
                              </div>
                            ) : (
                              groupCompatibility.map((item, index) => {

                                const phone = getPhone(item.phone_id);

                                return (
                                  <div
                                    key={`${item.group_id}-${item.phone_id}-${item.fit}-${index}`}
                                    className="border border-gray-800 rounded-2xl p-4"
                                  >

                                    <div className="flex items-start justify-between gap-3">

                                      <div>
                                        <p className="font-semibold">
                                          {phone
                                            ? `${phone.brand} ${phone.model}`
                                            : item.phone_id}
                                        </p>

                                        <p className="text-xs text-gray-600 mt-1">
                                          {item.phone_id}
                                        </p>

                                        <span className="inline-flex mt-3 px-3 py-1 rounded-full bg-green-400/10 border border-green-400/20 text-green-400 text-xs font-bold">
                                          {item.fit}
                                        </span>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleRemoveCompatibility(
                                            item.group_id,
                                            item.phone_id,
                                            item.fit
                                          )
                                        }
                                        className="text-red-400 text-sm font-semibold hover:text-red-300"
                                      >
                                        Remove
                                      </button>

                                    </div>

                                  </div>
                                );
                              })
                            )}

                          </div>

                        </div>

                      </div>

                    </div>
                  )}

                </motion.div>
              );
            })}

          </div>
        )}

      </main>
    </div>
  );
}