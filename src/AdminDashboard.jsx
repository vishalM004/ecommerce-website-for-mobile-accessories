import AdminTempers from "./AdminTempers";
import { useEffect, useState } from "react";
import AdminPhones from "./AdminPhones";
import AdminProducts from "./AdminProducts";
import AdminProductCompatibility from "./AdminProductCompatibility";
import AdminOrders from "./AdminOrders";
import AdminInventory from "./AdminInventory";
import { motion } from "framer-motion";
import AdminHeroSlides from "./AdminHeroSlides";
import { supabase } from "./supabase";

export default function AdminDashboard({ user }) {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [showOrderNotification, setShowOrderNotification] = useState(false);
  useEffect(() => {
  const channel = supabase
    .channel("main-dashboard-order-alerts")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "pickup_orders",
      },
      (payload) => {
        console.log("New order on main dashboard:", payload.new);
        setNewOrderCount((count) => count + 1);
        setShowOrderNotification(true);
      }
    )
    .subscribe((status) => {
      console.log("Main dashboard notifications:", status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/admin";
  };
 
if (activeSection === "phones") {
  return (
    <AdminPhones
      onBack={() => setActiveSection("dashboard")}
    />
  );
}

if (activeSection === "heroSlides") {
  return (
    <AdminHeroSlides
      onBack={() => setActiveSection("dashboard")}
    />
  );
}

if (activeSection === "tempers") {
  return (
    <AdminTempers
      onBack={() => setActiveSection("dashboard")}
    />
  );
}
if (activeSection === "products") {
  return (
    <AdminProducts
      onBack={() => setActiveSection("dashboard")}
    />
  );
}
if (activeSection === "productCompatibility") {
  return (
    <AdminProductCompatibility
      onBack={() => setActiveSection("dashboard")}
    />
  );
}
if (activeSection === "inventory") {
  return (
    <AdminInventory
      onBack={() => setActiveSection("dashboard")}
    />
  );
}
if (activeSection === "orders") {
  return (
    
    <AdminOrders
      onBack={() => setActiveSection("dashboard")}
    />
  );
}

  return (
    <div className="min-h-screen bg-black text-white">

      {/* HEADER */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              MM TIMES
            </h1>

            <p className="text-cyan-400 font-semibold text-sm mt-1">
              Admin Dashboard
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm text-gray-300">
                Admin
              </p>

              <p className="text-xs text-gray-500">
                {user?.email || "Authenticated"}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition font-semibold"
            >
              Logout
            </button>
          </div>

        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-5 md:px-8 py-8 md:py-12">

        {/* NEW ORDER NOTIFICATION */}
{showOrderNotification && (
  <div className="mb-6 rounded-2xl border border-green-400/30 bg-green-400/10 p-5 flex items-center justify-between gap-4">
    <div>
      <p className="font-bold text-green-400">
        🔔 New Order Received!
      </p>
      <p className="text-sm text-gray-300 mt-1">
        {newOrderCount} new order{newOrderCount !== 1 ? "s" : ""} received.
      </p>
    </div>

    <div className="flex gap-2">
      <button
        onClick={() => {
          setShowOrderNotification(false);
          setActiveSection("orders");
        }}
        className="rounded-xl bg-green-400 px-4 py-2 font-semibold text-black"
      >
        View Orders
      </button>

      <button
        onClick={() => setShowOrderNotification(false)}
        className="rounded-xl border border-gray-600 px-4 py-2 text-white"
      >
        Dismiss
      </button>
    </div>
  </div>
)}

        {/* WELCOME */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-bold">
            Welcome, Vishal 👋
          </h2>

          <p className="text-gray-400 mt-2">
            Manage MM TIMES products, inventory, compatibility and orders.
          </p>
        </motion.div>

        {/* DASHBOARD CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

          {/* PRODUCTS */}
          <DashboardCard
            icon="🛍️"
            title="Products"
            description="Manage accessories, prices, sale prices and product details."
            onManage={() => setActiveSection("products")}
          />

          {/* INVENTORY */}
          <DashboardCard
  icon="📦"
  title="Inventory"
  description="View and update stock levels for products."
  onManage={() => setActiveSection("inventory")}
/>

          {/* PHONES */}
          <DashboardCard
  icon="📱"
  title="Phone Models"
  description="Manage supported phone models and phone information."
  onManage={() => setActiveSection("phones")}
/>

{/* HERO SLIDESHOW */}
<DashboardCard
  icon="🖼️"
  title="Hero Slideshow"
  description="Upload and manage homepage banner images and automatic rotation."
  onManage={() => setActiveSection("heroSlides")}
/>

          {/* TEMPERED GLASS */}
          <DashboardCard
  icon="🛡️"
  title="Tempered Glass"
  description="Manage tempered-glass groups and compatibility."
  onManage={() => setActiveSection("tempers")}
/>
{/* COMPATIBILITY */}
<DashboardCard
  icon="🔗"
  title="Compatibility"
  description="Connect products with supported phone models."
  onManage={() =>
    setActiveSection("productCompatibility")
  }
/>
          {/* ORDERS */}
          <DashboardCard
  icon="🧾"
  title="Pickup Orders"
  description="View reservations, customer details and order status."
  onManage={() => setActiveSection("orders")}
/>

          {/* ENQUIRIES */}
          <DashboardCard
            icon="💬"
            title="Customer Enquiries"
            description="View customer questions and availability requests."
          />

        </div>

        {/* STATUS */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-10 rounded-3xl border border-green-400/20 bg-green-400/5 p-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />

            <div>
              <p className="font-bold text-green-400">
                Admin Session Active
              </p>

              <p className="text-sm text-gray-400 mt-1">
                Your account is authenticated and has admin access.
              </p>
            </div>
          </div>
        </motion.div>

      </main>
    </div>
  );
}


/* DASHBOARD CARD */

function DashboardCard({
  icon,
  title,
  description,
  onManage,
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-gray-900/70 border border-gray-800 rounded-3xl p-6 hover:border-cyan-400/40 transition"
    >

      <div className="text-4xl mb-5">
        {icon}
      </div>

      <h3 className="text-xl font-bold">
        {title}
      </h3>

      <p className="text-gray-400 text-sm mt-2 leading-relaxed">
        {description}
      </p>

      <button
  onClick={onManage}
  className="mt-5 px-4 py-2 rounded-xl border border-cyan-400/30 text-cyan-400 text-sm font-semibold hover:bg-cyan-400 hover:text-black transition"
>
  Manage →
</button>

    </motion.div>
  );
}