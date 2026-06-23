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
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { 
  Cpu, 
  Sparkles, 
  RotateCcw, 
  Plus, 
  Minus, 
  User, 
  ArrowUpRight,
  Loader2
} from "lucide-react";

interface UserUsage {
  id: string; // User ID
  name: string;
  email: string;
  creditsConsumed: number;
  creditsRemaining: number;
  tagsGenerated: number;
  descGenerated: number;
  titlesGenerated: number;
  keywordSearches: number;
}

const MOCK_USAGE: UserUsage[] = [
  {
    id: "uid_alex_carter",
    name: "Alex Carter",
    email: "alex.carter@example.com",
    creditsConsumed: 850,
    creditsRemaining: 150,
    tagsGenerated: 430,
    descGenerated: 98,
    titlesGenerated: 120,
    keywordSearches: 42
  },
  {
    id: "uid_sophie_martinez",
    name: "Sophie Martinez",
    email: "sophie.m@techvlog.co",
    creditsConsumed: 2500,
    creditsRemaining: 500,
    tagsGenerated: 1250,
    descGenerated: 290,
    titlesGenerated: 340,
    keywordSearches: 180
  },
  {
    id: "uid_dan_kovalsky",
    name: "Daniel Kovalsky",
    email: "dan.koval@youtube-creator.com",
    creditsConsumed: 135,
    creditsRemaining: 15,
    tagsGenerated: 88,
    descGenerated: 12,
    titlesGenerated: 24,
    keywordSearches: 5
  },
  {
    id: "uid_emily_watson",
    name: "Emily Watson",
    email: "emily.watson@gmail.com",
    creditsConsumed: 780,
    creditsRemaining: 220,
    tagsGenerated: 560,
    descGenerated: 140,
    titlesGenerated: 190,
    keywordSearches: 38
  }
];

export default function AiUsagePage() {
  const [usersUsage, setUsersUsage] = useState<UserUsage[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selected user to manage
  const [selectedUser, setSelectedUser] = useState<UserUsage | null>(null);
  const [creditAdjustment, setCreditAdjustment] = useState<number>(50);

  useEffect(() => {
    setLoading(true);
    // Realtime snapshot of users collection to track credits and usage counts
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usageList: UserUsage[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        usageList.push({
          id: doc.id,
          name: data.name || "Unknown User",
          email: data.email || "",
          creditsConsumed: (Number(data.generatedTags) || 0) + (Number(data.generatedTitles) || 0) + (Number(data.generatedDescriptions) || 0),
          creditsRemaining: Number(data.credits) || 0,
          tagsGenerated: Number(data.generatedTags) || 0,
          descGenerated: Number(data.generatedDescriptions) || 0,
          titlesGenerated: Number(data.generatedTitles) || 0,
          keywordSearches: Number(data.keywordSearches) || 0
        });
      });
      setUsersUsage(usageList.length ? usageList : MOCK_USAGE);
      setLoading(false);
    }, (err) => {
      console.warn("Firestore users collection unavailable, loading mock usage details:", err);
      setUsersUsage(MOCK_USAGE);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateCredits = async (userId: string, action: "add" | "reduce" | "reset") => {
    const targetUser = usersUsage.find(u => u.id === userId);
    if (!targetUser) return;

    let nextCredits = targetUser.creditsRemaining;
    let nextTags = targetUser.tagsGenerated;
    let nextDesc = targetUser.descGenerated;
    let nextTitles = targetUser.titlesGenerated;
    let nextKeywords = targetUser.keywordSearches;

    if (action === "add") {
      nextCredits += creditAdjustment;
    } else if (action === "reduce") {
      nextCredits = Math.max(0, nextCredits - creditAdjustment);
    } else if (action === "reset") {
      nextTags = 0;
      nextDesc = 0;
      nextTitles = 0;
      nextKeywords = 0;
    }

    try {
      const userRef = doc(db, "users", userId);
      const updateData: any = {};
      if (action === "add" || action === "reduce") {
        updateData.credits = nextCredits;
      } else {
        updateData.generatedTags = 0;
        updateData.generatedDescriptions = 0;
        updateData.generatedTitles = 0;
        updateData.keywordSearches = 0;
      }
      
      await updateDoc(userRef, updateData);

      // Local State Update
      setUsersUsage(prev => prev.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            creditsRemaining: action === "reset" ? u.creditsRemaining : nextCredits,
            tagsGenerated: nextTags,
            descGenerated: nextDesc,
            titlesGenerated: nextTitles,
            keywordSearches: nextKeywords,
            creditsConsumed: action === "reset" ? 0 : u.creditsConsumed
          };
        }
        return u;
      }));

      // Update selected profile reference
      if (selectedUser?.id === userId) {
        setSelectedUser(prev => prev ? {
          ...prev,
          creditsRemaining: action === "reset" ? prev.creditsRemaining : nextCredits,
          tagsGenerated: nextTags,
          descGenerated: nextDesc,
          titlesGenerated: nextTitles,
          keywordSearches: nextKeywords,
          creditsConsumed: action === "reset" ? 0 : prev.creditsConsumed
        } : null);
      }
    } catch (e) {
      console.error("Error updating credits/usage:", e);
    }
  };

  // Chart aggregation: sum usage across all users
  const totalTags = usersUsage.reduce((acc, curr) => acc + curr.tagsGenerated, 0);
  const totalDesc = usersUsage.reduce((acc, curr) => acc + curr.descGenerated, 0);
  const totalTitles = usersUsage.reduce((acc, curr) => acc + curr.titlesGenerated, 0);
  const totalKeywords = usersUsage.reduce((acc, curr) => acc + curr.keywordSearches, 0);

  const usageGraphData = [
    { name: "Tags", Requests: totalTags },
    { name: "Descriptions", Requests: totalDesc },
    { name: "Titles", Requests: totalTitles },
    { name: "Keywords", Requests: totalKeywords },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">AI Usage Tracking</h1>
        <p className="text-gray-400 text-xs mt-1">Monitor credit distributions, engine loads, and reset billing variables.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Graph & User list */}
        <div className="lg:col-span-8 space-y-6">
          {/* Chart Card */}
          <div className="glass-panel p-5 rounded-xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Cpu className="h-4 w-4 text-primary" />
              Engine Load Distribution
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usageGraphData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={10} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} />
                  <Tooltip contentStyle={{ background: "#0b0f19", border: "1px solid rgba(255,255,255,0.1)", fontSize: 11 }} />
                  <Bar dataKey="Requests" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Consuming Users Table */}
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Top AI Consumers</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01]">
                    <th className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">User</th>
                    <th className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tags</th>
                    <th className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Titles</th>
                    <th className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Desc.</th>
                    <th className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Credits Left</th>
                    <th className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-xs text-gray-500">
                        <div className="flex justify-center items-center gap-2">
                          <Loader2 className="h-4.5 w-4.5 text-primary animate-spin" />
                          Analyzing logs...
                        </div>
                      </td>
                    </tr>
                  ) : usersUsage.map((u) => (
                    <tr 
                      key={u.id} 
                      className={`hover:bg-white/[0.02] cursor-pointer transition-all ${selectedUser?.id === u.id ? "bg-white/[0.03]" : ""}`}
                      onClick={() => setSelectedUser(u)}
                    >
                      <td className="p-3 text-xs">
                        <div>
                          <p className="font-semibold text-white leading-none">{u.name}</p>
                          <span className="text-[10px] text-gray-500 mt-0.5 block truncate max-w-[150px]">{u.email}</span>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-xs text-gray-300">{u.tagsGenerated}</td>
                      <td className="p-3 font-mono text-xs text-gray-300">{u.titlesGenerated}</td>
                      <td className="p-3 font-mono text-xs text-gray-300">{u.descGenerated}</td>
                      <td className="p-3 font-mono text-xs text-emerald-400">{u.creditsRemaining}</td>
                      <td className="p-3 text-right" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="px-2 py-1 bg-white/5 hover:bg-primary/20 hover:text-accent rounded text-[10px] font-semibold text-gray-400 hover:border-primary/20 border border-transparent transition-all cursor-pointer inline-flex items-center gap-0.5"
                        >
                          Tweak <ArrowUpRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column - Controls Card */}
        <div className="lg:col-span-4">
          <div className="glass-panel p-5 rounded-xl sticky top-20">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-400" />
              Adjust Credits Console
            </h3>

            {selectedUser ? (
              <div className="space-y-5">
                {/* Active selection banner */}
                <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/5">
                  <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider block">Inspecting Session</span>
                  <p className="text-xs font-bold text-white mt-1">{selectedUser.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{selectedUser.email}</p>
                </div>

                {/* Adjuster factor */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5">Adjustment Volume</label>
                  <input
                    type="number"
                    value={creditAdjustment}
                    onChange={(e) => setCreditAdjustment(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-[#030712]/80 border border-white/5 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                {/* Grid buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => handleUpdateCredits(selectedUser.id, "add")}
                    className="py-2 rounded-lg bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-400 border border-emerald-950/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Credit Add
                  </button>

                  <button
                    onClick={() => handleUpdateCredits(selectedUser.id, "reduce")}
                    className="py-2 rounded-lg bg-amber-950/20 hover:bg-amber-950/40 text-amber-400 border border-amber-950/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Minus className="h-3.5 w-3.5" /> Credit Cut
                  </button>

                  <button
                    onClick={() => handleUpdateCredits(selectedUser.id, "reset")}
                    className="col-span-2 py-2 rounded-lg bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-950/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Reset Usage Counters
                  </button>
                </div>

                <div className="border-t border-white/5 pt-4 text-center">
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-[10px] text-gray-500 hover:text-white cursor-pointer"
                  >
                    Dismiss Inspector
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <User className="h-8 w-8 mx-auto mb-2 text-gray-700" />
                <p className="text-xs">Select a user from the table to increase or decrease their credit volumes.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
