"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc 
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Megaphone, 
  Plus, 
  X, 
  Send, 
  Calendar, 
  Trash2, 
  Edit3, 
  Check, 
  AlertCircle,
  Loader2
} from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: "low" | "medium" | "high";
  publishDate: any;
  target: "ALL" | "FREE" | "PRO";
  status: "published" | "scheduled" | "draft";
}

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "ann_1",
    title: "Scheduled Maintenance Window",
    message: "We will be upgrading database nodes on Sunday 2:00 AM UTC. Expect up to 10 minutes of intermittent connectivity.",
    priority: "high",
    publishDate: { seconds: 1719273600 }, // June 25 2026
    target: "ALL",
    status: "scheduled"
  },
  {
    id: "ann_2",
    title: "Double Credits for Pro Users!",
    message: "To thank our Pro members, we are doubling your standard daily generation limits for the entire month of July.",
    priority: "medium",
    publishDate: { seconds: 1718970000 },
    target: "PRO",
    status: "published"
  },
  {
    id: "ann_3",
    title: "Gemini 1.5 Flash Model Integration",
    message: "Our title generators have been migrated to the ultra-fast Gemini 1.5 Flash framework. Generations now resolve in sub-seconds.",
    priority: "low",
    publishDate: { seconds: 1718000000 },
    target: "ALL",
    status: "published"
  }
];

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Form edit states
  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // Temp form fields
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [target, setTarget] = useState<"ALL" | "FREE" | "PRO">("ALL");
  const [pubDate, setPubDate] = useState("");

  useEffect(() => {
    setLoading(true);
    const q = collection(db, "announcements");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Announcement[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as Announcement);
      });
      setAnnouncements(list.length ? list : MOCK_ANNOUNCEMENTS);
      setLoading(false);
    }, (err) => {
      console.warn("Firestore query error on announcements, loading fallback:", err);
      setAnnouncements(MOCK_ANNOUNCEMENTS);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreateOpen = () => {
    setTitle("");
    setMessage("");
    setPriority("medium");
    setTarget("ALL");
    setPubDate(new Date().toISOString().substring(0, 16));
    setEditingAnn({
      id: "",
      title: "",
      message: "",
      priority: "medium",
      target: "ALL",
      publishDate: null,
      status: "draft"
    });
    setIsAddMode(true);
  };

  const handleEditOpen = (ann: Announcement) => {
    setEditingAnn(ann);
    setTitle(ann.title);
    setMessage(ann.message);
    setPriority(ann.priority);
    setTarget(ann.target);
    const d = ann.publishDate?.seconds 
      ? new Date(ann.publishDate.seconds * 1000) 
      : new Date(ann.publishDate || Date.now());
    setPubDate(d.toISOString().substring(0, 16));
    setIsAddMode(false);
  };

  const handleSave = async (status: "published" | "scheduled" | "draft") => {
    if (!title.trim() || !message.trim()) return;
    setSaving(true);

    const annId = isAddMode ? "ann_" + Date.now() : editingAnn!.id;
    const finalDate = pubDate ? new Date(pubDate) : new Date();
    
    // Determine status automatically if they clicked schedule
    const finalStatus = status === "published" && finalDate > new Date() ? "scheduled" : status;

    try {
      const docRef = doc(db, "announcements", annId);
      const data = {
        title: title.trim(),
        message: message.trim(),
        priority,
        target,
        publishDate: finalDate,
        status: finalStatus
      };

      await setDoc(docRef, data, { merge: true });
      setAnnouncements(prev => {
        if (isAddMode) {
          return [...prev, { id: annId, ...data }];
        } else {
          return prev.map(a => a.id === annId ? { id: annId, ...data } : a);
        }
      });
      setEditingAnn(null);
    } catch (e) {
      console.error("Error writing announcement:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (annId: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    try {
      await deleteDoc(doc(db, "announcements", annId));
      setAnnouncements(prev => prev.filter(a => a.id !== annId));
    } catch (e) {
      console.error("Error deleting announcement:", e);
    }
  };

  const formatDate = (dateObj: any) => {
    if (!dateObj) return "Immediately";
    const date = dateObj.seconds ? new Date(dateObj.seconds * 1000) : new Date(dateObj);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">System Announcements</h1>
          <p className="text-gray-400 text-xs mt-1">Broadcast system maintenance, feature flags, or promotion terms to users.</p>
        </div>
        <button
          onClick={handleCreateOpen}
          className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-xs font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> Create Broadcast
        </button>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="flex justify-center items-center py-20 text-xs text-gray-500 gap-2">
          <Loader2 className="h-5 w-5 text-accent animate-spin" />
          Synchronizing broadcast history...
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div 
              key={ann.id} 
              className={`glass-panel p-5 rounded-2xl border-l-4 relative overflow-hidden flex flex-col md:flex-row justify-between gap-4 transition-all hover:bg-white/[0.01] ${
                ann.priority === "high" 
                  ? "border-l-red-500" 
                  : ann.priority === "medium" 
                    ? "border-l-amber-500" 
                    : "border-l-sky-500"
              }`}
            >
              <div className="space-y-2 flex-1">
                {/* Meta details */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    ann.priority === "high" 
                      ? "bg-red-950/40 text-red-400" 
                      : ann.priority === "medium" 
                        ? "bg-amber-950/40 text-amber-400" 
                        : "bg-sky-950/40 text-sky-400"
                  }`}>
                    {ann.priority} Priority
                  </span>
                  
                  <span className="text-[10px] text-gray-500">•</span>
                  
                  <span className="text-[10px] text-gray-400 font-semibold">
                    Target: <span className="text-accent">{ann.target === "ALL" ? "All Users" : ann.target + " Plan"}</span>
                  </span>

                  <span className="text-[10px] text-gray-500">•</span>

                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
                    ann.status === "published" ? "text-emerald-400" : ann.status === "scheduled" ? "text-amber-500" : "text-gray-500"
                  }`}>
                    {ann.status.toUpperCase()}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-white tracking-tight">{ann.title}</h3>
                
                {/* Message */}
                <p className="text-xs text-gray-300 leading-relaxed pr-6">{ann.message}</p>

                {/* Date */}
                <p className="text-[10px] text-gray-500 flex items-center gap-1 pt-1.5">
                  <Calendar className="h-3.5 w-3.5 text-gray-600" />
                  Release: {formatDate(ann.publishDate)}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex md:flex-col justify-end items-end gap-1.5 shrink-0">
                <button
                  onClick={() => handleEditOpen(ann)}
                  className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(ann.id)}
                  className="p-1.5 rounded bg-red-950/20 text-gray-400 hover:text-red-400 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {announcements.length === 0 && (
            <div className="glass-panel p-8 text-center text-xs text-gray-500">No active system announcements.</div>
          )}
        </div>
      )}

      {/* Editor Modal */}
      <AnimatePresence>
        {editingAnn && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingAnn(null)}
              className="fixed inset-0 bg-black z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-x-4 md:inset-x-auto top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg glass-panel rounded-2xl p-6 z-50 max-h-[85vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Megaphone className="h-4 w-4 text-accent" />
                  {isAddMode ? "Compose Broadcast" : "Edit Broadcast Draft"}
                </h3>
                <button
                  onClick={() => setEditingAnn(null)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Form Body */}
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Broadcast Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Server Migration Details"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-white/10 bg-black/30 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Message Body</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your system announcement message here..."
                    rows={4}
                    className="w-full px-3.5 py-2 rounded-lg border border-white/10 bg-black/30 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-primary transition-all resize-none"
                  />
                </div>

                {/* Priority & Target splits */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Urgency Factor</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full bg-black/30 border border-white/10 text-gray-200 text-xs rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-primary"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">User Segment Target</label>
                    <select
                      value={target}
                      onChange={(e) => setTarget(e.target.value as any)}
                      className="w-full bg-black/30 border border-white/10 text-gray-200 text-xs rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-primary"
                    >
                      <option value="ALL">All Accounts</option>
                      <option value="FREE">Free Plan Only</option>
                      <option value="PRO">Pro Plan Only</option>
                    </select>
                  </div>
                </div>

                {/* Publish Date */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Schedule Publish Date</label>
                  <input
                    type="datetime-local"
                    value={pubDate}
                    onChange={(e) => setPubDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-white/10 bg-black/30 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-2 border-t border-white/5 pt-4 mt-6">
                <button
                  onClick={() => setEditingAnn(null)}
                  className="px-3.5 py-2 rounded-lg hover:bg-white/5 text-xs text-gray-400 hover:text-white border border-transparent transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSave("draft")}
                  disabled={saving}
                  className="px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white border border-white/5 transition-all cursor-pointer"
                >
                  Save Draft
                </button>
                <button
                  onClick={() => handleSave("published")}
                  disabled={saving}
                  className="px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-xs font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-primary/45 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  Publish Broadcast
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
