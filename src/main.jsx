import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import { supabase } from "./supabase";
import "./index.css";

function Root() {
  const isAdminPage = window.location.pathname === "/admin";

  const [session, setSession] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(isAdminPage);

  useEffect(() => {
    if (!isAdminPage) return;

    const checkAdmin = async () => {
      setCheckingAuth(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setSession(null);
        setCheckingAuth(false);
        return;
      }

      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();

      if (error || roleData?.role !== "admin") {
        await supabase.auth.signOut();
        setSession(null);
      } else {
        setSession(session);
      }

      setCheckingAuth(false);
    };

    checkAdmin();
  }, [isAdminPage]);

  if (!isAdminPage) {
    return <App />;
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔐</div>
          <p className="text-cyan-400 font-semibold">
            Checking admin access...
          </p>
        </div>
      </div>
    );
  }

  return session ? (
    <AdminDashboard user={session.user} />
  ) : (
    <AdminLogin
      onLoginSuccess={() => {
        window.location.reload();
      }}
    />
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);