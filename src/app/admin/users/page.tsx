"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  UserX, 
  UserCheck, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Check, 
  TrendingUp, 
  Cpu, 
  CreditCard,
  User,
  Shield,
  Clock,
  Sparkles
} from "lucide-react";

interface UserProfile {
  id: string; // Document ID (UID)
  name: string;
  email: string;
  plan: "FREE" | "PRO" | "MAX";
  status: "active" | "disabled";
  credits: number;
  generatedTags: number;
  generatedTitles: number;
  generatedDescriptions: number;
  createdAt: any;
  lastLogin: any;
  loginHistory?: string[];
  photoURL?: string;
}

const MOCK_USERS: UserProfile[] = [
  {
    id: "uid_alex_carter",
    name: "Alex Carter",
    email: "alex.carter@example.com",
    plan: "PRO",
    status: "active",
    credits: 150,
    generatedTags: 430,
    generatedTitles: 120,
    generatedDescriptions: 98,
    createdAt: { seconds: 1714560000 },
    lastLogin: { seconds: 1718970000 },
    loginHistory: ["2026-06-21 14:22:01 via Chrome", "2026-06-20 09:12:45 via Chrome", "2026-06-18 11:32:00 via Safari"],
    photoURL: ""
  },
  {
    id: "uid_sophie_martinez",
    name: "Sophie Martinez",
    email: "sophie.m@techvlog.co",
    plan: "MAX",
    status: "active",
    credits: 500,
    generatedTags: 1250,
    generatedTitles: 340,
    generatedDescriptions: 290,
    createdAt: { seconds: 1715000000 },
    lastLogin: { seconds: 1719056000 },
    loginHistory: ["2026-06-22 08:44:12 via Firefox", "2026-06-20 18:30:11 via Firefox"],
    photoURL: ""
  },
  {
    id: "uid_dan_kovalsky",
    name: "Daniel Kovalsky",
    email: "dan.koval@youtube-creator.com",
    plan: "FREE",
    status: "active",
    credits: 15,
    generatedTags: 88,
    generatedTitles: 24,
    generatedDescriptions: 12,
    createdAt: { seconds: 1716000000 },
    lastLogin: { seconds: 1718800000 },
    loginHistory: ["2026-06-19 16:05:00 via Edge"],
    photoURL: ""
  },
  {
    id: "uid_liam_nguyen",
    name: "Liam Nguyen",
    email: "liam.n@vlogspace.io",
    plan: "FREE",
    status: "disabled",
    credits: 0,
    generatedTags: 230,
    generatedTitles: 76,
    generatedDescriptions: 48,
    createdAt: { seconds: 1712000000 },
    lastLogin: { seconds: 1718000000 },
    loginHistory: ["2026-06-10 10:12:00 via Chrome"],
    photoURL: ""
  },
  {
    id: "uid_emily_watson",
    name: "Emily Watson",
    email: "emily.watson@gmail.com",
    plan: "PRO",
    status: "active",
    credits: 220,
    generatedTags: 560,
    generatedTitles: 190,
    generatedDescriptions: 140,
    createdAt: { seconds: 1713000000 },
    lastLogin: { seconds: 1719050000 },
    loginHistory: ["2026-06-22 07:11:32 via iOS App", "2026-06-21 19:40:00 via iOS App"],
    photoURL: ""
  }
];

export default function UsersManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isEditPlanOpen, setIsEditPlanOpen] = useState(false);
  const [isEditCreditsOpen, setIsEditCreditsOpen] = useState(false);
  const [newPlan, setNewPlan] = useState<"FREE" | "PRO" | "MAX">("FREE");
  const [newCredits, setNewCredits] = useState<number>(0);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    setLoading(true);
    // Realtime snapshot of users collection
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersList: UserProfile[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        
        // Resilient database mapping
        const mappedName = data.name || data.displayName || data.fullName || (data.email ? data.email.split('@')[0] : "Unnamed User");
        const mappedEmail = data.email || "";
        const rawPlan = (data.plan || data.tier || "FREE").toString().toUpperCase();
        const mappedPlan = (rawPlan === "PRO" || rawPlan === "MAX" || rawPlan === "FREE") ? rawPlan : "FREE";
        const mappedStatus = data.status === "disabled" || data.status === "inactive" ? "disabled" : "active";
        const mappedCredits = Number(data.credits !== undefined ? data.credits : (data.creditBalance !== undefined ? data.creditBalance : 0));
        
        const generatedTags = Number(data.generatedTags || data.tagsCount || 0);
        const generatedTitles = Number(data.generatedTitles || data.titlesCount || 0);
        const generatedDescriptions = Number(data.generatedDescriptions || data.descriptionsCount || 0);
        
        const createdAt = data.createdAt || data.joinedAt || null;
        const lastLogin = data.lastLogin || data.lastSeen || null;

        usersList.push({
          id: docSnap.id,
          name: mappedName,
          email: mappedEmail,
          plan: mappedPlan as "FREE" | "PRO" | "MAX",
          status: mappedStatus as "active" | "disabled",
          credits: mappedCredits,
          generatedTags,
          generatedTitles,
          generatedDescriptions,
          createdAt,
          lastLogin,
          loginHistory: data.loginHistory || []
        });
      });
      
      setUsers(usersList.length ? usersList : MOCK_USERS);
      setLoading(false);
    }, (err) => {
      console.warn("Firestore users collection unavailable, loading mockup data:", err);
      setUsers(MOCK_USERS);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter and sort users
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                          u.email.toLowerCase().includes(search.toLowerCase()) ||
                          u.id.toLowerCase().includes(search.toLowerCase());
    const matchesPlan = planFilter === "ALL" || u.plan === planFilter;
    const matchesStatus = statusFilter === "ALL" || u.status === statusFilter;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  // Pagination details
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Admin action integrations
  const handleToggleStatus = async (user: UserProfile) => {
    const nextStatus = user.status === "active" ? "disabled" : "active";
    try {
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, { status: nextStatus });
      
      // Update local state in case we want immediate responsive UI
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: nextStatus } : u));
      if (selectedUser?.id === user.id) {
        setSelectedUser(prev => prev ? { ...prev, status: nextStatus } : null);
      }
    } catch (e) {
      console.error("Error updating user status:", e);
    }
  };

  const handleChangePlan = async () => {
    if (!selectedUser) return;
    try {
      const userRef = doc(db, "users", selectedUser.id);
      await updateDoc(userRef, { 
        plan: newPlan,
        tier: newPlan.toLowerCase() 
      });
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, plan: newPlan } : u));
      setSelectedUser(prev => prev ? { ...prev, plan: newPlan } : null);
      setIsEditPlanOpen(false);
    } catch (e) {
      console.error("Error updating plan:", e);
    }
  };

  const handleResetCredits = async () => {
    if (!selectedUser) return;
    try {
      const userRef = doc(db, "users", selectedUser.id);
      await updateDoc(userRef, { 
        credits: newCredits,
        creditBalance: newCredits
      });
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, credits: newCredits } : u));
      setSelectedUser(prev => prev ? { ...prev, credits: newCredits } : null);
      setIsEditCreditsOpen(false);
    } catch (e) {
      console.error("Error updating credits:", e);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you absolutely sure you want to permanently delete this user? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "users", userId));
      setUsers(prev => prev.filter(u => u.id !== userId));
      if (selectedUser?.id === userId) {
        setSelectedUser(null);
      }
    } catch (e) {
      console.error("Error deleting user:", e);
    }
  };

  const formatDate = (dateObj: any) => {
    if (!dateObj) return "N/A";
    const date = dateObj.seconds ? new Date(dateObj.seconds * 1000) : new Date(dateObj);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Users Management</h1>
          <p className="text-gray-400 text-xs mt-1">Review active, pending, or disabled platform accounts.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name, email, UID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-white/5 bg-[#030712]/60 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-primary/50 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto items-center justify-end">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs text-gray-400 font-medium">Plan:</span>
            <select
              value={planFilter}
              onChange={(e) => { setPlanFilter(e.target.value); setCurrentPage(1); }}
              className="bg-[#030712]/60 border border-white/5 text-gray-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary/50"
            >
              <option value="ALL">All Plans</option>
              <option value="FREE">FREE</option>
              <option value="PRO">PRO</option>
              <option value="MAX">MAX</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="bg-[#030712]/60 border border-white/5 text-gray-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary/50"
            >
              <option value="ALL">All Statuses</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">User Details</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">UID</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Plan</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Registered</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-gray-500">
                    <div className="flex justify-center items-center gap-2">
                      <Loader2 className="h-4.5 w-4.5 text-primary animate-spin" />
                      Synchronizing users records...
                    </div>
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-gray-500">No users found matching query filters.</td>
                </tr>
              ) : (
                paginatedUsers.map((u) => (
                  <tr 
                    key={u.id} 
                    className="hover:bg-white/[0.02] cursor-pointer transition-all duration-150"
                    onClick={() => { setSelectedUser(u); setNewPlan(u.plan); setNewCredits(u.credits); }}
                  >
                    {/* Avatar + Email */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary/30 to-accent/30 border border-primary/20 flex items-center justify-center font-bold text-white shrink-0">
                          {u.name ? u.name.charAt(0) : "U"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white leading-none truncate">{u.name}</p>
                          <span className="text-[10px] text-gray-500 mt-1 block truncate">{u.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* UID */}
                    <td className="p-4">
                      <span className="font-mono text-[10px] text-gray-400">{u.id.substring(0, 12)}...</span>
                    </td>

                    {/* Plan Badge */}
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border ${
                        u.plan === "MAX" 
                          ? "bg-purple-950/40 text-purple-400 border-purple-800/30" 
                          : u.plan === "PRO" 
                            ? "bg-primary/20 text-accent border-primary/20" 
                            : "bg-white/[0.03] text-gray-400 border-white/5"
                      }`}>
                        {u.plan}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                        u.status === "active" 
                          ? "bg-emerald-950/40 text-emerald-400" 
                          : "bg-red-950/40 text-red-400"
                      }`}>
                        <span className={`h-1 w-1 rounded-full ${u.status === "active" ? "bg-emerald-400" : "bg-red-400"}`}></span>
                        {u.status === "active" ? "Active" : "Disabled"}
                      </span>
                    </td>

                    {/* Registered Date */}
                    <td className="p-4">
                      <span className="text-xs text-gray-400">{formatDate(u.createdAt)}</span>
                    </td>

                    {/* Quick Row Actions */}
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() => setActionMenuOpen(actionMenuOpen === u.id ? null : u.id)}
                          className="p-1.5 rounded hover:bg-white/5 text-gray-400 hover:text-white cursor-pointer"
                        >
                          <MoreVertical className="h-4.5 w-4.5" />
                        </button>

                        {actionMenuOpen === u.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setActionMenuOpen(null)}></div>
                            <div className="absolute right-0 mt-1 w-40 glass-panel rounded-lg shadow-lg z-20 p-1 border border-white/5">
                              <button
                                onClick={() => {
                                  setSelectedUser(u);
                                  setNewPlan(u.plan);
                                  setNewCredits(u.credits);
                                  setActionMenuOpen(null);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-white/5 text-left text-xs text-white"
                              >
                                <User className="h-3.5 w-3.5" /> View Details
                              </button>
                              <button
                                onClick={() => { handleToggleStatus(u); setActionMenuOpen(null); }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-white/5 text-left text-xs text-white"
                              >
                                {u.status === "active" ? (
                                  <>
                                    <UserX className="h-3.5 w-3.5 text-amber-400" /> Disable User
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-3.5 w-3.5 text-emerald-400" /> Enable User
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => { handleDeleteUser(u.id); setActionMenuOpen(null); }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-red-950/20 text-left text-xs text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Delete User
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
          <span>Showing {paginatedUsers.length} of {filteredUsers.length} users</span>
          <div className="flex gap-2.5">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="p-1.5 rounded border border-white/5 bg-white/[0.01] hover:bg-white/5 text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="flex items-center px-1.5 font-medium text-gray-400">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
              className="p-1.5 rounded border border-white/5 bg-white/[0.01] hover:bg-white/5 text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* User Details Modal (Framer Motion Drawer) */}
      <AnimatePresence>
        {selectedUser && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="fixed inset-0 bg-black z-40"
            />
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.35 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0b0f19] border-l border-white/5 z-50 overflow-y-auto p-6 flex flex-col justify-between"
            >
              {/* Header */}
              <div>
                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                  <span className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="h-4 w-4 text-accent" />
                    Account Inspector
                  </span>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white cursor-pointer"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                {/* Profile Snapshot */}
                <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-primary/10">
                    {selectedUser.name ? selectedUser.name.charAt(0) : "U"}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{selectedUser.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{selectedUser.email}</p>
                    <span className="font-mono text-[9px] text-gray-500 mt-1 block">UID: {selectedUser.id}</span>
                  </div>
                </div>

                {/* Stats / Usage */}
                <div className="grid grid-cols-3 gap-2.5 mb-6">
                  <div className="p-3 rounded-lg bg-black/30 border border-white/5 text-center">
                    <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">Plan</span>
                    <span className="text-xs font-bold text-accent">{selectedUser.plan}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-black/30 border border-white/5 text-center">
                    <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">Credits</span>
                    <span className="text-xs font-bold text-emerald-400">{selectedUser.credits}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-black/30 border border-white/5 text-center">
                    <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">Status</span>
                    <span className={`text-xs font-bold ${selectedUser.status === 'active' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {selectedUser.status}
                    </span>
                  </div>
                </div>

                {/* AI Consumption */}
                <div className="space-y-3.5 mb-8">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                    <Cpu className="h-3.5 w-3.5 text-primary" />
                    AI Usage Counters
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-white/[0.01] border border-white/5">
                      <span className="text-gray-400">Generated SEO Tags</span>
                      <span className="font-bold text-white font-mono">{selectedUser.generatedTags}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-white/[0.01] border border-white/5">
                      <span className="text-gray-400">Generated Titles</span>
                      <span className="font-bold text-white font-mono">{selectedUser.generatedTitles}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-white/[0.01] border border-white/5">
                      <span className="text-gray-400">Generated Descriptions</span>
                      <span className="font-bold text-white font-mono">{selectedUser.generatedDescriptions}</span>
                    </div>
                  </div>
                </div>

                {/* Login History */}
                <div className="space-y-3.5 mb-6">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    Session History
                  </h4>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {selectedUser.loginHistory?.map((hist, idx) => (
                      <div key={idx} className="text-[10px] text-gray-400 bg-white/[0.01] border border-white/5 p-2 rounded">
                        {hist}
                      </div>
                    )) || (
                      <div className="text-[10px] text-gray-500 italic">No recent session logs recorded.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions panel */}
              <div className="border-t border-white/5 pt-4 space-y-3">
                <p className="text-[9px] uppercase font-bold text-gray-500 tracking-widest text-center">Administrator Console</p>
                <div className="grid grid-cols-2 gap-2">
                  {/* Edit Plan Trigger */}
                  {isEditPlanOpen ? (
                    <div className="col-span-2 p-2.5 bg-black/40 border border-white/5 rounded-lg flex items-center justify-between">
                      <div className="flex gap-1.5">
                        {(["FREE", "PRO", "MAX"] as const).map(p => (
                          <button
                            key={p}
                            onClick={() => setNewPlan(p)}
                            className={`px-2 py-1 rounded text-[10px] font-bold ${
                              newPlan === p 
                                ? "bg-primary text-white" 
                                : "bg-white/5 text-gray-400 hover:text-white"
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={handleChangePlan} className="p-1 rounded bg-emerald-500 text-white hover:bg-emerald-600"><Check className="h-3 w-3" /></button>
                        <button onClick={() => setIsEditPlanOpen(false)} className="p-1 rounded bg-red-500 text-white hover:bg-red-600"><X className="h-3 w-3" /></button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsEditPlanOpen(true)}
                      className="py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-white border border-white/5 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CreditCard className="h-3.5 w-3.5 text-accent" />
                      Adjust Plan
                    </button>
                  )}

                  {/* Edit Credits Trigger */}
                  {isEditCreditsOpen ? (
                    <div className="col-span-2 p-2.5 bg-black/40 border border-white/5 rounded-lg flex items-center justify-between gap-2">
                      <input
                        type="number"
                        value={newCredits}
                        onChange={(e) => setNewCredits(Number(e.target.value))}
                        className="w-full bg-[#030712]/80 border border-white/10 rounded px-2.5 py-1 text-xs text-white"
                      />
                      <div className="flex gap-1 shrink-0">
                        <button onClick={handleResetCredits} className="p-1 rounded bg-emerald-500 text-white hover:bg-emerald-600"><Check className="h-3 w-3" /></button>
                        <button onClick={() => setIsEditCreditsOpen(false)} className="p-1 rounded bg-red-500 text-white hover:bg-red-600"><X className="h-3 w-3" /></button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsEditCreditsOpen(true)}
                      className="py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-white border border-white/5 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                      Update Credits
                    </button>
                  )}

                  {/* Disable/Enable */}
                  <button
                    onClick={() => handleToggleStatus(selectedUser)}
                    className={`py-2.5 rounded-lg border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedUser.status === "active"
                        ? "bg-amber-950/20 hover:bg-amber-950/40 text-amber-400 border-amber-950/30"
                        : "bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-400 border-emerald-950/30"
                    }`}
                  >
                    {selectedUser.status === "active" ? (
                      <>
                        <UserX className="h-3.5 w-3.5" /> Disable User
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-3.5 w-3.5" /> Enable User
                      </>
                    )}
                  </button>

                  {/* Delete Account */}
                  <button
                    onClick={() => handleDeleteUser(selectedUser.id)}
                    className="py-2.5 rounded-lg bg-red-950/20 hover:bg-red-950/40 text-xs font-semibold text-red-400 border border-red-950/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Purge Account
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
