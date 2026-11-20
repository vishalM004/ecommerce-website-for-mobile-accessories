import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "./supabase";

export default function AdminLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // 1. Login with Supabase Auth
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        throw new Error(loginError.message);
      }

      if (!data.user) {
        throw new Error("Login failed. User not found.");
      }

      // 2. Check whether this user is an admin
      const { data: roleData, error: roleError } =
        await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .single();

      if (roleError || roleData?.role !== "admin") {
        await supabase.auth.signOut();
        throw new Error("Access denied. This account is not an admin.");
      }

      // 3. Admin verified
      setSuccess("Admin authentication successful.");

      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden">

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-400/10 blur-3xl rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700 rounded-3xl p-8 shadow-2xl">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🔐</div>

            <h1 className="text-3xl font-bold text-white">
              MM TIMES
            </h1>

            <p className="text-cyan-400 font-semibold mt-1">
              Admin Login
            </p>

            <p className="text-gray-500 text-sm mt-2">
              Authorized access only
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter admin email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 rounded-2xl bg-black border border-gray-700 text-white placeholder-gray-600 outline-none focus:border-cyan-400 transition"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 rounded-2xl bg-black border border-gray-700 text-white placeholder-gray-600 outline-none focus:border-cyan-400 transition"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-2xl px-4 py-3 text-sm">
                {success}
              </div>
            )}

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-cyan-400 text-black font-bold hover:scale-[1.02] transition disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? "Authenticating..." : "Login as Admin →"}
            </button>

          </form>
        </div>
      </motion.div>
    </div>
  );
}