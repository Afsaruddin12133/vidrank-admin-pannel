"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  Bell, 
  Search, 
  Menu, 
  Wifi, 
  WifiOff, 
  User as UserIcon,
  ChevronDown
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

interface HeaderProps {
  setMobileOpen: (open: boolean) => void;
}

export default function Header({ setMobileOpen }: HeaderProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [dbConnected, setDbConnected] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Derive page title from pathname
  const getPageTitle = () => {
    if (pathname === "/admin") return "Dashboard Overview";
    const segment = pathname.split("/").pop();
    if (!segment) return "Dashboard";
    return segment
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Listen to firestore connection status
  useEffect(() => {
    // Simple verification check to ensure DB is responsive
    try {
      const unsub = onSnapshot(doc(db, ".info/connected"), (snapshot) => {
        setDbConnected(!!snapshot.data()?.connected);
      }, (err) => {
        console.warn("Firestore connection check info unavailable:", err);
      });
      return () => unsub();
    } catch (e) {
      console.warn("Firestore status listener setup failed:", e);
    }
  }, []);

  return (
    <header className="sticky top-0 z-20 h-16 w-full bg-[#030712]/75 backdrop-blur-md border-b border-white/5 px-4 flex items-center justify-between">
      {/* Left side: Hamburger & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden p-2 -ml-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight">{getPageTitle()}</h2>
            
            {/* Realtime status indicator */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/[0.02] border border-white/5 text-[10px]">
              {dbConnected ? (
                <>
                  <Wifi className="h-3 w-3 text-green-400 animate-pulse" />
                  <span className="text-green-400 font-semibold hidden sm:inline">LIVE</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 text-amber-500" />
                  <span className="text-amber-500 font-semibold hidden sm:inline">OFFLINE</span>
                </>
              )}
            </div>
          </div>
          
          <div className="text-[10px] text-gray-500 hidden sm:flex items-center gap-1">
            <span>VidRank Admin Panel</span>
            <span>•</span>
            <span className="capitalize">{pathname.replace("/admin", "Home").replace("/", " > ")}</span>
          </div>
        </div>
      </div>

      {/* Right side: Search, Notifications, Profile */}
      <div className="flex items-center gap-4">
        {/* Search Input */}
        <div className="relative hidden lg:block w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search global directory..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-white/5 bg-white/[0.02] text-gray-200 placeholder-gray-500 text-xs focus:outline-none focus:border-primary/50 transition-all"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white relative transition-all cursor-pointer"
          >
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background"></span>
          </button>

          {/* Quick Notification Dropdown */}
          {notificationsOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setNotificationsOpen(false)}></div>
              <div className="absolute right-0 mt-2.5 w-72 rounded-xl glass-panel p-4 z-40 shadow-xl">
                <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                  <span className="text-xs font-bold text-white">System Alerts</span>
                  <span className="text-[10px] text-accent cursor-pointer">Mark all read</span>
                </div>
                <div className="space-y-2.5 max-h-48 overflow-y-auto">
                  <div className="p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 cursor-pointer">
                    <p className="text-[11px] text-white font-medium">New plan upgrade: UID f8H...</p>
                    <span className="text-[9px] text-gray-500">2 minutes ago</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 cursor-pointer">
                    <p className="text-[11px] text-white font-medium">High API key consumption warning</p>
                    <span className="text-[9px] text-gray-500">1 hour ago</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 cursor-pointer">
                    <p className="text-[11px] text-white font-medium">Cloudinary storage threshold reached</p>
                    <span className="text-[9px] text-gray-500">3 hours ago</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Profile Dropdown */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-white/5 transition-all text-left cursor-pointer"
            >
              <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center font-bold text-accent border border-primary/20 shadow-inner">
                {user.displayName ? user.displayName.charAt(0) : "A"}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-white leading-none">{user.displayName || "Admin"}</p>
                <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">{user.role}</span>
              </div>
              <ChevronDown className="h-3 w-3 text-gray-500 hidden sm:block" />
            </button>

            {profileDropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setProfileDropdownOpen(false)}></div>
                <div className="absolute right-0 mt-2.5 w-48 rounded-xl glass-panel p-2 z-40 shadow-xl border border-white/5">
                  <div className="px-3 py-2 border-b border-white/5 mb-1.5">
                    <p className="text-xs font-bold text-white truncate">{user.displayName}</p>
                    <p className="text-[10px] text-gray-500 truncate mt-0.5">{user.email}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-all text-left cursor-pointer"
                  >
                    <UserIcon className="h-3.5 w-3.5" />
                    Logout Account
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
