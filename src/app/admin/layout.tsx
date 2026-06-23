"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Glow circles */}
        <div className="glow-blue top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2" />
        <div className="glow-sky bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2" />

        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 animate-bounce">
            <Loader2 className="h-5 w-5 text-white animate-spin" />
          </div>
          <h2 className="text-sm font-bold tracking-widest text-white uppercase animate-pulse">
            Verifying Credentials
          </h2>
          <p className="text-[10px] text-gray-500 font-semibold uppercase">
            Securing Connection...
          </p>
        </div>
      </div>
    );
  }

  // If not logged in, return null. The AuthProvider's redirect effect will send the user to /login.
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#030712] flex text-gray-100 overflow-hidden">
      {/* Background visual glow accents */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Sidebar Component */}
      <Sidebar isMobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />

      {/* Main Viewport Container */}
      <div className="flex-1 flex flex-col min-w-0 z-10 overflow-hidden">
        {/* Header */}
        <Header setMobileOpen={setMobileSidebarOpen} />

        {/* Scrollable Dashboard Viewport */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
