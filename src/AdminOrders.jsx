import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "./supabase";


const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Ready for Pickup",
  "Picked Up",
  "Cancelled",
];

const PAYMENT_STATUSES = [
  "Unpaid",
  "Paid",
];

export default function AdminOrders({ onBack }) {
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [newOrderAlert, setNewOrderAlert] = useState(false);


  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

 
useEffect(() => {
  const channel = supabase
    .channel("admin-pickup-orders")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "pickup_orders",
      },
      (payload) => {
        console.log("NEW ORDER RECEIVED:", payload.new);
        setNewOrderAlert(true);
        fetchOrders();
      }
    )
    .subscribe((status) => {
      console.log("Order notifications connection:", status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}, []);




  async function fetchOrders() {
    setLoading(true);

    const [
      { data: orderData, error: orderError },
      { data: itemData, error: itemError },
    ] = await Promise.all([
      supabase
        .from("pickup_orders")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase
        .from("pickup_order_items")
        .select("*")
        .order("created_at", { ascending: true }),
    ]);

    if (orderError) {
      console.error("Orders fetch error:", orderError);
      alert(orderError.message);
      setLoading(false);
      return;
    }

    if (itemError) {
      console.error("Order items fetch error:", itemError);
      alert(itemError.message);
      setLoading(false);
      return;
    }

    setOrders(orderData || []);
    setOrderItems(itemData || []);
    setLoading(false);
  }

  async function updateOrder(orderId, changes) {
    setUpdatingId(orderId);

    const { data, error } = await supabase
      .from("pickup_orders")
      .update(changes)
      .eq("id", orderId)
      .select("*")
      .single();

    if (error) {
      console.error("Order update error:", error);
      alert(error.message);
      setUpdatingId(null);
      return;
    }

    setOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? data
          : order
      )
    );

    setUpdatingId(null);
  }

  function getOrderItems(orderId) {
    return orderItems.filter(
      (item) => item.order_id === orderId
    );
  }

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        order.order_number
          ?.toLowerCase()
          .includes(query) ||
        order.customer_name
          ?.toLowerCase()
          .includes(query) ||
        order.customer_phone
          ?.toLowerCase()
          .includes(query) ||
        order.customer_email
          ?.toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const pendingCount = orders.filter(
    (order) => order.status === "Pending"
  ).length;

  const preparingCount = orders.filter(
    (order) =>
      order.status === "Preparing"
  ).length;

  const readyCount = orders.filter(
    (order) =>
      order.status === "Ready for Pickup"
  ).length;

  const completedCount = orders.filter(
    (order) =>
      order.status === "Picked Up"
  ).length;

  function formatDate(dateValue) {
    if (!dateValue) return "—";

    return new Date(dateValue).toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  }

  function getStatusClass(status) {
    switch (status) {
      case "Pending":
        return "bg-yellow-400/10 text-yellow-400 border-yellow-400/20";

      case "Confirmed":
        return "bg-cyan-400/10 text-cyan-400 border-cyan-400/20";

      case "Preparing":
        return "bg-orange-400/10 text-orange-400 border-orange-400/20";

      case "Ready for Pickup":
        return "bg-purple-400/10 text-purple-400 border-purple-400/20";

      case "Picked Up":
        return "bg-green-400/10 text-green-400 border-green-400/20";

      case "Cancelled":
        return "bg-red-400/10 text-red-400 border-red-400/20";

      default:
        return "bg-gray-400/10 text-gray-400 border-gray-400/20";
    }
  }

  return (
    
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
      {newOrderAlert && (
  <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-green-500/40 bg-green-500/10 p-4 text-green-400">
    <p className="font-bold">
      🔔 New Order Received!
    </p>

    <button
      onClick={() => setNewOrderAlert(false)}
      className="rounded-lg border border-green-500/30 px-3 py-1 text-sm hover:bg-green-500/20"
    >
      Dismiss
    </button>
  </div>
)}

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
                🧾 Pickup Orders
              </h1>

              <p className="text-gray-400 mt-2">
                View reservations, customer details and order status.
              </p>
            </div>

            <button
              onClick={fetchOrders}
              className="w-full lg:w-auto px-5 py-3 rounded-xl border border-gray-700 text-gray-300 hover:border-cyan-400 hover:text-cyan-400 transition"
            >
              🔄 Refresh Orders
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

          <StatCard
            icon="⏳"
            title="Pending"
            value={pendingCount}
          />

          <StatCard
            icon="🔥"
            title="Preparing"
            value={preparingCount}
          />

          <StatCard
            icon="📦"
            title="Ready"
            value={readyCount}
          />

          <StatCard
            icon="✅"
            title="Picked Up"
            value={completedCount}
          />

        </div>

        {/* SEARCH / FILTER */}
        <div className="bg-gray-900 border border-gray-700 rounded-3xl p-5 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            <div className="lg:col-span-2">
              <label className="block text-sm text-gray-500 mb-2">
                Search Orders
              </label>

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="🔎 Order number, customer, phone or email..."
                className="w-full bg-black border border-gray-700 rounded-2xl px-5 py-4 outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-2">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
                className="w-full bg-black border border-gray-700 rounded-2xl px-5 py-4 outline-none focus:border-cyan-400"
              >
                <option value="All">
                  All Statuses
                </option>

                {ORDER_STATUSES.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {status}
                    </option>
                  )
                )}
              </select>
            </div>

          </div>
        </div>

        {/* ORDERS */}
        {loading ? (
          <div className="text-center py-20 text-cyan-400">
            Loading orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-gray-900 border border-gray-800 rounded-3xl">
            <div className="text-5xl mb-4">
              🧾
            </div>

            <p className="text-gray-500">
              No pickup orders found.
            </p>
          </div>
        ) : (
          <div className="space-y-5">

            {filteredOrders.map((order) => {
              const items = getOrderItems(
                order.id
              );

              const isExpanded =
                expandedOrderId === order.id;

              return (
                <motion.div
                  key={order.id}
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className="bg-gray-900 border border-gray-700 rounded-3xl overflow-hidden"
                >

                  {/* ORDER HEADER */}
                  <div className="p-5 md:p-6">

                    <div className="flex flex-col xl:flex-row xl:items-center gap-5">

                      {/* ORDER INFO */}
                      <div className="flex-1 min-w-0">

                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-xl md:text-2xl font-bold">
                            {order.order_number}
                          </h2>

                          <span
                            className={`text-xs px-3 py-1.5 rounded-full border ${getStatusClass(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                        </div>

                        <div className="mt-3 text-gray-400">
                          👤 {order.customer_name}
                        </div>

                        <div className="text-gray-500 text-sm mt-1">
                          📞 {order.customer_phone}
                        </div>

                        {order.customer_email && (
                          <div className="text-gray-500 text-sm mt-1">
                            ✉️ {order.customer_email}
                          </div>
                        )}

                        <div className="text-gray-600 text-xs mt-2">
                          {formatDate(
                            order.created_at
                          )}
                        </div>

                      </div>

                      {/* TOTAL */}
                      <div className="xl:w-40">
                        <div className="text-gray-500 text-sm">
                          Total
                        </div>

                        <div className="text-green-400 text-2xl font-bold">
                          ₹
                          {Number(
                            order.total_amount || 0
                          ).toFixed(2)}
                        </div>

                        <div
                          className={`text-sm mt-1 ${
                            order.payment_status ===
                            "Paid"
                              ? "text-green-400"
                              : "text-yellow-400"
                          }`}
                        >
                          {order.payment_status}
                        </div>
                      </div>

                      {/* CONTROLS */}
                      <div className="xl:w-72 space-y-3">

                        <select
                          value={order.status}
                          onChange={(e) =>
                            updateOrder(
                              order.id,
                              {
                                status:
                                  e.target.value,
                              }
                            )
                          }
                          disabled={
                            updatingId === order.id
                          }
                          className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-cyan-400"
                        >
                          {ORDER_STATUSES.map(
                            (status) => (
                              <option
                                key={status}
                                value={status}
                              >
                                {status}
                              </option>
                            )
                          )}
                        </select>

                        <div className="flex gap-2">

                          <select
                            value={
                              order.payment_status
                            }
                            onChange={(e) =>
                              updateOrder(
                                order.id,
                                {
                                  payment_status:
                                    e.target.value,
                                }
                              )
                            }
                            disabled={
                              updatingId ===
                              order.id
                            }
                            className="flex-1 bg-black border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-cyan-400"
                          >
                            {PAYMENT_STATUSES.map(
                              (status) => (
                                <option
                                  key={status}
                                  value={status}
                                >
                                  {status}
                                </option>
                              )
                            )}
                          </select>

                          <button
                            onClick={() =>
                              setExpandedOrderId(
                                isExpanded
                                  ? null
                                  : order.id
                              )
                            }
                            className="px-4 py-3 rounded-xl border border-gray-700 text-gray-300 hover:border-cyan-400 hover:text-cyan-400 transition"
                          >
                            {isExpanded
                              ? "Hide"
                              : "View"}
                          </button>

                        </div>

                      </div>

                    </div>

                  </div>

                  {/* EXPANDED DETAILS */}
                  {isExpanded && (
                    <div className="border-t border-gray-800 p-5 md:p-6">

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* CUSTOMER */}
                        <div className="bg-black border border-gray-800 rounded-2xl p-5">

                          <h3 className="font-bold text-lg mb-4">
                            👤 Customer Details
                          </h3>

                          <div className="space-y-2 text-sm">
                            <p>
                              <span className="text-gray-500">
                                Name:
                              </span>{" "}
                              {order.customer_name}
                            </p>

                            <p>
                              <span className="text-gray-500">
                                Phone:
                              </span>{" "}
                              {order.customer_phone}
                            </p>

                            {order.customer_email && (
                              <p>
                                <span className="text-gray-500">
                                  Email:
                                </span>{" "}
                                {order.customer_email}
                              </p>
                            )}

                            <p>
                              <span className="text-gray-500">
                                Fulfillment:
                              </span>{" "}
                              {order.fulfillment_type}
                            </p>

                            {order.notes && (
                              <div className="pt-3 mt-3 border-t border-gray-800">
                                <div className="text-gray-500 mb-1">
                                  Notes
                                </div>

                                <div className="text-gray-300">
                                  {order.notes}
                                </div>
                              </div>
                            )}
                          </div>

                        </div>

                        {/* ITEMS */}
                        <div className="bg-black border border-gray-800 rounded-2xl p-5">

                          <h3 className="font-bold text-lg mb-4">
                            🛍️ Order Items
                          </h3>

                          {items.length === 0 ? (
                            <p className="text-gray-500">
                              No items found.
                            </p>
                          ) : (
                            <div className="space-y-3">

                              {items.map(
                                (item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-center justify-between gap-4 border-b border-gray-800 pb-3 last:border-b-0 last:pb-0"
                                  >
                                    <div>
                                      <div className="font-semibold">
                                        {
                                          item.product_name
                                        }
                                      </div>

                                      <div className="text-gray-500 text-sm">
                                        ₹
                                        {
                                          item.unit_price
                                        }{" "}
                                        ×{" "}
                                        {
                                          item.quantity
                                        }
                                      </div>
                                    </div>

                                    <div className="font-bold text-green-400">
                                      ₹
                                      {Number(
                                        item.subtotal ||
                                          0
                                      ).toFixed(2)}
                                    </div>
                                  </div>
                                )
                              )}

                            </div>
                          )}

                        </div>

                      </div>

                    </div>
                  )}

                </motion.div>
              );
            })}

          </div>
        )}

      </div>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
}) {
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