"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc 
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Ticket, 
  Search, 
  Check, 
  MessageSquare, 
  Trash2, 
  X, 
  Send,
  AlertCircle,
  Clock,
  User,
  Loader2
} from "lucide-react";

interface SupportTicket {
  id: string;
  userName: string;
  userEmail: string;
  issue: string;
  status: "open" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  createdAt: any;
  replies?: { sender: "admin" | "user"; message: string; timestamp: Date }[];
}

const MOCK_TICKETS: SupportTicket[] = [
  {
    id: "ticket_1",
    userName: "Alex Carter",
    userEmail: "alex.carter@example.com",
    issue: "My daily generation limits didn't reset at midnight UTC as expected.",
    status: "open",
    priority: "high",
    createdAt: { seconds: 1719050000 },
    replies: [
      { sender: "user", message: "Hi support, my credit counters are still locked at 0 today.", timestamp: new Date(Date.now() - 6 * 3600 * 1000) }
    ]
  },
  {
    id: "ticket_2",
    userName: "Daniel Kovalsky",
    userEmail: "dan.koval@youtube-creator.com",
    issue: "Do you offer competitive volume pricing for multi-channel video creators?",
    status: "open",
    priority: "medium",
    createdAt: { seconds: 1718970000 },
    replies: []
  },
  {
    id: "ticket_3",
    userName: "Sophie Martinez",
    userEmail: "sophie.m@techvlog.co",
    issue: "Failed Cloudinary webhook during avatar upload sequence.",
    status: "resolved",
    priority: "high",
    createdAt: { seconds: 1718000000 },
    replies: [
      { sender: "user", message: "Avatar uploads fail when updating profile pages.", timestamp: new Date(Date.now() - 48 * 3600 * 1000) },
      { sender: "admin", message: "We resolved the storage bucket CORS policy. Try again now.", timestamp: new Date(Date.now() - 44 * 3600 * 1000) }
    ]
  }
];

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Chat window state
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");

  useEffect(() => {
    setLoading(true);
    const q = collection(db, "tickets");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: SupportTicket[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as SupportTicket);
      });
      setTickets(list.length ? list : MOCK_TICKETS);
      setLoading(false);
    }, (err) => {
      console.warn("Firestore support tickets unavailable, loading mock tickets:", err);
      setTickets(MOCK_TICKETS);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (ticketId: string, status: "resolved" | "closed" | "open") => {
    try {
      const ticketRef = doc(db, "tickets", ticketId);
      await updateDoc(ticketRef, { status });
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status } : t));
      if (activeTicket?.id === ticketId) {
        setActiveTicket(prev => prev ? { ...prev, status } : null);
      }
    } catch (e) {
      console.error("Error updating ticket status:", e);
    }
  };

  const handleSendReply = async () => {
    if (!activeTicket || !replyMessage.trim()) return;

    const nextReplies = [
      ...(activeTicket.replies || []),
      { sender: "admin" as const, message: replyMessage.trim(), timestamp: new Date() }
    ];

    try {
      const ticketRef = doc(db, "tickets", activeTicket.id);
      await updateDoc(ticketRef, { replies: nextReplies });
      
      setTickets(prev => prev.map(t => t.id === activeTicket.id ? { ...t, replies: nextReplies } : t));
      setActiveTicket(prev => prev ? { ...prev, replies: nextReplies } : null);
      setReplyMessage("");
    } catch (e) {
      console.error("Error submitting ticket response:", e);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm("Are you sure you want to permanently delete this support ticket?")) return;
    try {
      await deleteDoc(doc(db, "tickets", ticketId));
      setTickets(prev => prev.filter(t => t.id !== ticketId));
      if (activeTicket?.id === ticketId) {
        setActiveTicket(null);
      }
    } catch (e) {
      console.error("Error deleting ticket:", e);
    }
  };

  const formatDate = (dateObj: any) => {
    if (!dateObj) return "N/A";
    const date = dateObj.seconds ? new Date(dateObj.seconds * 1000) : new Date(dateObj);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.userName.toLowerCase().includes(search.toLowerCase()) ||
                          t.userEmail.toLowerCase().includes(search.toLowerCase()) ||
                          t.issue.toLowerCase().includes(search.toLowerCase()) ||
                          t.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Support Tickets</h1>
        <p className="text-gray-400 text-xs mt-1">Resolve user account inquiries, billing disputes, and system bugs.</p>
      </div>

      {/* Filters */}
      <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by ID, creator, message content..."
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
            <option value="ALL">All Tickets</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Tickets Table */}
        <div className="lg:col-span-8 glass-panel rounded-xl overflow-hidden self-start">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.01]">
                  <th className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ticket ID</th>
                  <th className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">User</th>
                  <th className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Issue Description</th>
                  <th className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Priority</th>
                  <th className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-xs text-gray-500">
                      <div className="flex justify-center items-center gap-2">
                        <Loader2 className="h-4.5 w-4.5 text-primary animate-spin" />
                        Synchronizing support desks...
                      </div>
                    </td>
                  </tr>
                ) : filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-xs text-gray-500">No active support requests.</td>
                  </tr>
                ) : (
                  filteredTickets.map((t) => (
                    <tr 
                      key={t.id} 
                      className={`hover:bg-white/[0.02] cursor-pointer transition-all ${activeTicket?.id === t.id ? "bg-white/[0.03]" : ""}`}
                      onClick={() => setActiveTicket(t)}
                    >
                      {/* Ticket ID */}
                      <td className="p-3">
                        <span className="font-mono text-[10px] text-gray-400 uppercase">{t.id.substring(0, 10)}</span>
                      </td>

                      {/* User */}
                      <td className="p-3">
                        <div>
                          <p className="text-xs font-semibold text-white leading-none">{t.userName}</p>
                          <span className="text-[9px] text-gray-500 mt-0.5 block truncate max-w-[120px]">{t.userEmail}</span>
                        </div>
                      </td>

                      {/* Issue */}
                      <td className="p-3 max-w-[200px]">
                        <p className="text-xs text-gray-300 truncate leading-normal">{t.issue}</p>
                      </td>

                      {/* Priority */}
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border ${
                          t.priority === "high" 
                            ? "bg-red-950/40 text-red-400 border-red-800/30" 
                            : t.priority === "medium" 
                              ? "bg-amber-950/40 text-amber-400 border-amber-800/30" 
                              : "bg-sky-950/40 text-sky-400 border-sky-800/30"
                        }`}>
                          {t.priority}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-semibold ${
                          t.status === "open" 
                            ? "bg-emerald-950/40 text-emerald-400" 
                            : t.status === "resolved"
                              ? "bg-blue-950/40 text-sky-400"
                              : "bg-gray-800 text-gray-400"
                        }`}>
                          {t.status}
                        </span>
                      </td>

                      {/* Action trigger row */}
                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setActiveTicket(t)}
                            className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTicket(t.id)}
                            className="p-1 rounded bg-red-950/20 text-gray-400 hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column - Chat Panel */}
        <div className="lg:col-span-4">
          <div className="glass-panel rounded-xl overflow-hidden sticky top-20 min-h-[400px] flex flex-col justify-between">
            {activeTicket ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">{activeTicket.userName}</h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">{activeTicket.userEmail}</p>
                  </div>
                  
                  {/* Status update shortcut */}
                  <div className="flex gap-1 shrink-0">
                    {activeTicket.status !== "resolved" && (
                      <button
                        onClick={() => handleUpdateStatus(activeTicket.id, "resolved")}
                        className="px-2 py-1 rounded bg-emerald-950/20 border border-emerald-950/30 text-emerald-400 text-[9px] font-bold cursor-pointer"
                      >
                        Resolve
                      </button>
                    )}
                    {activeTicket.status !== "closed" && (
                      <button
                        onClick={() => handleUpdateStatus(activeTicket.id, "closed")}
                        className="px-2 py-1 rounded bg-gray-800 text-gray-400 text-[9px] font-bold cursor-pointer"
                      >
                        Close
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 p-4 space-y-4 max-h-[300px] overflow-y-auto bg-black/10">
                  {/* Issue description as first message */}
                  <div className="flex gap-2.5 items-start text-xs max-w-[85%]">
                    <div className="h-6.5 w-6.5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-[10px] font-bold text-white">
                      U
                    </div>
                    <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                      <p className="font-semibold text-gray-400 text-[10px] mb-1">Issue Reported:</p>
                      <p className="text-white leading-relaxed">{activeTicket.issue}</p>
                      <span className="text-[9px] text-gray-500 mt-2 block flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(activeTicket.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Reply Lists */}
                  {activeTicket.replies?.map((r, idx) => (
                    <div 
                      key={idx} 
                      className={`flex gap-2.5 items-start text-xs max-w-[85%] ${
                        r.sender === "admin" ? "ml-auto flex-row-reverse" : ""
                      }`}
                    >
                      <div className={`h-6.5 w-6.5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-white ${
                        r.sender === "admin" ? "bg-accent/20 text-accent" : "bg-primary/20 text-white"
                      }`}>
                        {r.sender === "admin" ? "A" : "U"}
                      </div>
                      <div className={`p-2.5 rounded-lg border ${
                        r.sender === "admin" 
                          ? "bg-accent/15 border-accent/25 text-white" 
                          : "bg-white/5 border-white/5 text-white"
                      }`}>
                        <p className="leading-relaxed">{r.message}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply Footer Input */}
                <div className="p-3 border-t border-white/5 flex gap-2 items-center bg-white/[0.01]">
                  <input
                    type="text"
                    placeholder="Type helper response..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    className="w-full bg-[#030712]/60 border border-white/5 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                    onKeyDown={(e) => { if (e.key === "Enter") handleSendReply(); }}
                  />
                  <button
                    onClick={handleSendReply}
                    className="p-2 rounded-lg bg-primary hover:bg-primary-hover text-white cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-500">
                <Ticket className="h-8 w-8 text-gray-700 mb-2" />
                <p className="text-xs">Select a ticket from the list to view conversations, send replies, or adjust status flags.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
