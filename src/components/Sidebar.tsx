"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  CalendarDays, 
  KeyRound, 
  Image as ImageIcon, 
  LogOut, 
  Menu,
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from "lucide-react";

interface SidebarProps {
  isMobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export default function Sidebar({ isMobileOpen, setMobileOpen }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const menuItems = [
    { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { name: "Users", path: "/admin/users", icon: Users },
    { name: "Plans", path: "/admin/plans", icon: CreditCard },
    { name: "Subscriptions", path: "/admin/subscriptions", icon: CalendarDays },
    { name: "API Settings", path: "/admin/api-settings", icon: KeyRound },
    { name: "Cloudinary", path: "/admin/cloudinary", icon: ImageIcon },
  ];

  const handleLinkClick = () => {
    setMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0b0f19]/90 backdrop-blur-xl border-r border-white/5 relative">
      {/* Top Logo */}
      <div className={`p-5 flex items-center justify-between border-b border-white/5 h-16`}>
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-md shadow-primary/20 shrink-0">
            <ShieldAlert className="h-4.5 w-4.5 text-white" />
          </div>
          {(!isCollapsed || isMobileOpen) && (
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-bold tracking-wider text-sm bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent"
            >
              VIDRANK ADMIN
            </motion.span>
          )}
        </div>
        
        {/* Desktop Collapse Toggle */}
        {!isMobileOpen && (
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex h-5 w-5 rounded-md border border-white/10 hover:border-primary/50 items-center justify-center bg-black/40 hover:bg-black/80 transition-all text-gray-400 hover:text-white cursor-pointer"
          >
            {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      {/* Admin Quick Profile */}
      {(!isCollapsed || isMobileOpen) && user && (
        <div className="p-4 mx-3 my-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-accent to-primary flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-inner">
            {user.displayName ? user.displayName.charAt(0) : "A"}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">{user.displayName}</p>
            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-primary/20 text-accent border border-primary/20">
              {user.role}
            </span>
          </div>
        </div>
      )}

      {/* Menu List */}
      <nav className="flex-1 px-3 space-y-1 py-4 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;

          return (
            <Link 
              key={item.path} 
              href={item.path}
              onClick={handleLinkClick}
              className={`flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group relative ${
                isActive 
                  ? "bg-primary/20 text-accent border border-primary/20 font-medium" 
                  : "text-gray-400 hover:text-white hover:bg-white/[0.03] border border-transparent"
              }`}
            >
              <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-accent" : "text-gray-400 group-hover:text-white"}`} />
              {(!isCollapsed || isMobileOpen) && (
                <span className="truncate">{item.name}</span>
              )}
              {/* Tooltip for collapsed state */}
              {isCollapsed && !isMobileOpen && (
                <div className="absolute left-16 scale-0 group-hover:scale-100 transition-transform origin-left bg-[#080c14] border border-white/10 text-white text-xs px-2.5 py-1.5 rounded-md shadow-lg z-50 pointer-events-none whitespace-nowrap">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-white/5">
        <button
          onClick={logout}
          className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-950/20 hover:text-red-300 border border-transparent transition-all cursor-pointer group relative`}
        >
          <LogOut className="h-4.5 w-4.5 shrink-0 text-red-400" />
          {(!isCollapsed || isMobileOpen) && <span>Logout</span>}
          {isCollapsed && !isMobileOpen && (
            <div className="absolute left-16 scale-0 group-hover:scale-100 transition-transform origin-left bg-[#080c14] border border-red-500/10 text-red-300 text-xs px-2.5 py-1.5 rounded-md shadow-lg z-50 pointer-events-none whitespace-nowrap">
              Logout
            </div>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar container */}
      <aside 
        className={`hidden md:block h-screen sticky top-0 transition-all duration-300 z-30 shrink-0 ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="md:hidden fixed inset-0 bg-black z-40"
          />
        )}
      </AnimatePresence>

      {/* Mobile Drawer content */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            className="md:hidden fixed top-0 bottom-0 left-0 w-64 z-50"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
