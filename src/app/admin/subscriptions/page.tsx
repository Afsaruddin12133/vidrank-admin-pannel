"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc,
  query
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, 
  Check, 
  Pause, 
  X, 
  Search, 
  ChevronDown, 
  ArrowUp, 
  ArrowDown, 
  Loader2
} from "lucide-react";

interface Subscription {
  id: string; // Subscription ID (mapped from UID)
  userId: string;
  userName: string;
  userEmail: string;
  plan: "FREE" | "PRO" | "MAX";
  price: number;
  startDate: any;
  renewDate: any;
  status: "active" | "paused" | "cancelled";
}

const MOCK_SUBSCRIPTIONS: Subscription[] = [
  {
    id: "sub_mock_1",
    userId: "uid_alex_carter",
    userName: "Alex Carter",
    userEmail: "alex.carter@example.com",
    plan: "PRO",
    price: 29,
    startDate: { seconds: 1714560000 },
    renewDate: { seconds: 1717152000 },
    status: "active"
  },
  {
    id: "sub_mock_2",
    userId: "uid_sophie_martinez",
    userName: "Sophie Martinez",
    userEmail: "sophie.m@techvlog.co",
    plan: "MAX",
    price: 79,
    startDate: { seconds: 1715000000 },
    renewDate: { seconds: 1717593600 },
    status: "active"
  }
];

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  
  // Action state
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    // Query users collection to extract subscriptions details
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const subsList: Subscription[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        
        // Extract raw plan
        const rawPlan = (data.plan || data.tier || "FREE").toString().toUpperCase();
        const mappedPlan = (rawPlan === "PRO" || rawPlan === "MAX" || rawPlan === "FREE") ? rawPlan : "FREE";
        
        // Resolve subscription price
        let resolvedPrice = 0;
        if (data.subscriptionPrice !== undefined) {
          resolvedPrice = Number(data.subscriptionPrice);
        } else {
          resolvedPrice = mappedPlan === "PRO" ? 29 : mappedPlan === "MAX" ? 79 : 0;
        }

        // Resolve status
        const resolvedStatus = data.subscriptionStatus || (data.status === "disabled" ? "paused" : "active");

        subsList.push({
          id: `sub_${docSnap.id.substring(0, 8)}`,
          userId: docSnap.id,
          userName: data.name || data.displayName || data.fullName || (data.email ? data.email.split('@')[0] : "Unnamed User"),
          userEmail: data.email || "",
          plan: mappedPlan as "FREE" | "PRO" | "MAX",
          price: resolvedPrice,
          startDate: data.subscriptionStartDate || data.createdAt || data.joinedAt || null,
          renewDate: data.subscriptionRenewDate || null,
          status: resolvedStatus as "active" | "paused" | "cancelled"
        });
      });
      
      setSubscriptions(subsList.length ? subsList : MOCK_SUBSCRIPTIONS);
      setLoading(false);
    }, (err) => {
      console.warn("Firestore users collection query for subscriptions failed, using mock data:", err);
      setSubscriptions(MOCK_SUBSCRIPTIONS);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (userId: string, status: "active" | "paused" | "cancelled") => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { 
        subscriptionStatus: status,
        status: status === "active" ? "active" : "disabled" // sync with profile status
      });
      setActionMenuOpen(null);
    } catch (e) {
      console.error("Error updating subscription status:", e);
      alert("Failed to update status. Verify your Firestore rules.");
    }
  };

  const handleUpgradeDowngrade = async (userId: string, plan: "FREE" | "PRO" | "MAX", price: number) => {
    try {
      const userRef = doc(db, "users", userId);
      
      // Auto adjust credits for standard limits when changing plans
      const creditsForPlan = plan === "MAX" ? 500 : plan === "PRO" ? 150 : 20;

      await updateDoc(userRef, { 
        plan: plan,
        tier: plan.toLowerCase(),
        subscriptionPrice: price,
        credits: creditsForPlan,
        creditBalance: creditsForPlan
      });
      setActionMenuOpen(null);
    } catch (e) {
      console.error("Error upgrading/downgrading subscription:", e);
      alert("Failed to update tier. Verify your Firestore rules.");
    }
  };

  const formatDate = (dateObj: any) => {
    if (!dateObj) return "N/A";
    const date = dateObj.seconds ? new Date(dateObj.seconds * 1000) : new Date(dateObj);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const filteredSubs = subscriptions.filter(s => {
    const matchesSearch = s.userName.toLowerCase().includes(search.toLowerCase()) ||
                          s.userEmail.toLowerCase().includes(search.toLowerCase()) ||
                          s.userId.toLowerCase().includes(search.toLowerCase()) ||
                          s.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Subscriptions Management</h1>
        <p className="text-gray-400 text-xs mt-1">Activate, pause, cancel, or re-tier platform subscriptions.</p>
      </div>

      {/* Filters */}
      <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by user name, email, or sub ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-white/5 bg-[#030712]/60 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-primary/50 transition-all"
          />
        </div>

        {/* Filter status */}
        <div className="flex gap-2 items-center w-full md:w-auto justify-end">
          <span className="text-xs text-gray-400 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#030712]/60 border border-white/5 text-gray-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary/50"
          >
            <option value="ALL">All States</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">User Account</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Plan Details</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Price</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Start Date</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Renews On</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-gray-500">
                    <div className="flex justify-center items-center gap-2">
                      <Loader2 className="h-4.5 w-4.5 text-primary animate-spin" />
                      Loading active subscription logs...
                    </div>
                  </td>
                </tr>
              ) : filteredSubs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-gray-500">No active subscriptions match the filters.</td>
                </tr>
              ) : (
                filteredSubs.map((sub) => (
                  <tr key={sub.userId} className="hover:bg-white/[0.02] transition-all">
                    {/* User Details */}
                    <td className="p-4">
                      <div>
                        <p className="text-xs font-bold text-white leading-none">{sub.userName}</p>
                        <span className="text-[10px] text-gray-500 mt-1 block truncate max-w-[200px]">{sub.userEmail}</span>
                      </div>
                    </td>

                    {/* Plan */}
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border ${
                        sub.plan === "MAX" 
                          ? "bg-purple-950/40 text-purple-400 border-purple-800/30" 
                          : sub.plan === "PRO" 
                            ? "bg-primary/20 text-accent border-primary/20" 
                            : "bg-white/[0.03] text-gray-400 border-white/5"
                      }`}>
                        {sub.plan}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="p-4">
                      <span className="text-xs font-bold text-white">${sub.price}/mo</span>
                    </td>

                    {/* Start Date */}
                    <td className="p-4 text-xs text-gray-400">{formatDate(sub.startDate)}</td>

                    {/* Renew Date */}
                    <td className="p-4 text-xs text-gray-400">{formatDate(sub.renewDate)}</td>

                    {/* Status */}
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-semibold ${
                        sub.status === "active" 
                          ? "bg-emerald-950/40 text-emerald-400" 
                          : sub.status === "paused"
                            ? "bg-amber-950/40 text-amber-400"
                            : "bg-red-950/40 text-red-400"
                      }`}>
                        {sub.status === "active" ? "Active" : sub.status === "paused" ? "Paused" : "Cancelled"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() => setActionMenuOpen(actionMenuOpen === sub.userId ? null : sub.userId)}
                          className="px-2.5 py-1 rounded bg-white/5 border border-white/5 hover:bg-white/10 text-[10px] font-semibold text-gray-300 hover:text-white transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          Actions <ChevronDown className="h-3 w-3" />
                        </button>

                        {actionMenuOpen === sub.userId && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setActionMenuOpen(null)}></div>
                            <div className="absolute right-0 mt-1 w-44 glass-panel rounded-lg shadow-lg z-20 p-1 border border-white/5">
                              {/* Status actions */}
                              {sub.status !== "active" && (
                                <button
                                  onClick={() => handleUpdateStatus(sub.userId, "active")}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-white/5 text-left text-xs text-emerald-400"
                                >
                                  <Check className="h-3.5 w-3.5" /> Activate
                                </button>
                              )}
                              {sub.status === "active" && (
                                <button
                                  onClick={() => handleUpdateStatus(sub.userId, "paused")}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-white/5 text-left text-xs text-amber-400"
                                >
                                  <Pause className="h-3.5 w-3.5" /> Pause
                                </button>
                              )}
                              {sub.status !== "cancelled" && (
                                <button
                                  onClick={() => handleUpdateStatus(sub.userId, "cancelled")}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-white/5 text-left text-xs text-red-400"
                                >
                                  <X className="h-3.5 w-3.5" /> Cancel Plan
                                </button>
                              )}

                              {/* Upgrade / Downgrade links */}
                              <div className="border-t border-white/5 my-1"></div>
                              
                              {sub.plan !== "MAX" && (
                                <button
                                  onClick={() => handleUpgradeDowngrade(sub.userId, "MAX", 79)}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-white/5 text-left text-xs text-purple-400"
                                >
                                  <ArrowUp className="h-3.5 w-3.5" /> Upgrade to MAX
                                </button>
                              )}

                              {sub.plan === "MAX" && (
                                <button
                                  onClick={() => handleUpgradeDowngrade(sub.userId, "PRO", 29)}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-white/5 text-left text-xs text-amber-500"
                                >
                                  <ArrowDown className="h-3.5 w-3.5" /> Downgrade to PRO
                                </button>
                              )}

                              {sub.plan === "FREE" && (
                                <button
                                  onClick={() => handleUpgradeDowngrade(sub.userId, "PRO", 29)}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-white/5 text-left text-xs text-accent"
                                >
                                  <ArrowUp className="h-3.5 w-3.5" /> Upgrade to PRO
                                </button>
                              )}

                              {sub.plan === "PRO" && (
                                <button
                                  onClick={() => handleUpgradeDowngrade(sub.userId, "FREE", 0)}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-white/5 text-left text-xs text-gray-400"
                                >
                                  <ArrowDown className="h-3.5 w-3.5" /> Downgrade to FREE
                                </button>
                              )}
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
      </div>
    </div>
  );
}
