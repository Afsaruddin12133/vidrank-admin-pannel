"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc 
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  X, 
  Save, 
  Sparkles, 
  Loader2
} from "lucide-react";

interface Plan {
  id: string; // free, pro, max, etc.
  name: string;
  price: string; // Stored as a string in Firestore (e.g., "0")
  plandetails: string; // Stored as a single string (e.g., "✓ Feature 1 ✓ Feature 2")
  features: string[];
  dailyCredits?: number;
  monthlyCredits?: number;
  description?: string;
}

const MOCK_PLANS: Plan[] = [
  {
    id: "free",
    name: "FREE",
    price: "0",
    plandetails: "✓ SEO YouTube Description Generator ✓ YouTube Tag Generator ✓ AI Keyword Optimization ✓ Basic SEO Suggestions ✓ Google Login Access ✓ Chrome Extension Access ✓ 20 AI Generations Per Day",
    features: [
      "SEO YouTube Description Generator",
      "YouTube Tag Generator",
      "AI Keyword Optimization",
      "Basic SEO Suggestions",
      "Google Login Access",
      "Chrome Extension Access",
      "20 AI Generations Per Day"
    ]
  },
  {
    id: "pro",
    name: "PRO",
    price: "29",
    plandetails: "✓ All Free Features ✓ Unlimited Tag Generator ✓ Bulk Processing ✓ 100 AI Generations Per Day",
    features: [
      "All Free Features",
      "Unlimited Tag Generator",
      "Bulk Processing",
      "100 AI Generations Per Day"
    ]
  }
];

export default function PlansManagementPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal & Form States
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [tempFeature, setTempFeature] = useState("");

  useEffect(() => {
    setLoading(true);
    const q = collection(db, "plan");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const plansList: Plan[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const detailsStr = data.plandetails || "";
        const parsedFeatures = detailsStr
          .split("✓")
          .map((f: string) => f.trim())
          .filter((f: string) => f.length > 0);

        plansList.push({
          id: docSnap.id,
          name: docSnap.id.toUpperCase(),
          price: String(data.price ?? "0"),
          plandetails: detailsStr,
          features: parsedFeatures,
          dailyCredits: data.dailyCredits,
          monthlyCredits: data.monthlyCredits,
          description: data.description
        });
      });
      setPlans(plansList.length ? plansList : MOCK_PLANS);
      setLoading(false);
    }, (err) => {
      console.warn("Firestore plans collection unavailable, loading mock plans:", err);
      setPlans(MOCK_PLANS);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleEditClick = (plan: Plan) => {
    setEditingPlan({ ...plan, features: [...plan.features] });
    setIsAddMode(false);
  };

  const handleCreateClick = () => {
    setEditingPlan({
      id: "",
      name: "",
      price: "0",
      plandetails: "",
      features: []
    });
    setIsAddMode(true);
  };

  const handleFormChange = (key: keyof Plan, value: any) => {
    if (!editingPlan) return;
    setEditingPlan({ ...editingPlan, [key]: value });
  };

  const handleAddFeature = () => {
    if (!editingPlan || !tempFeature.trim()) return;
    setEditingPlan({
      ...editingPlan,
      features: [...editingPlan.features, tempFeature.trim()]
    });
    setTempFeature("");
  };

  const handleRemoveFeature = (index: number) => {
    if (!editingPlan) return;
    const nextFeatures = [...editingPlan.features];
    nextFeatures.splice(index, 1);
    setEditingPlan({
      ...editingPlan,
      features: nextFeatures
    });
  };

  const handleSave = async () => {
    if (!editingPlan) return;
    
    // Set plan ID: in Add Mode it's the custom ID input, in Edit Mode it's the existing document ID
    const planId = (isAddMode ? editingPlan.id : editingPlan.id).toLowerCase().trim().replace(/\s+/g, "_");
    if (!planId) {
      alert("Plan ID is required.");
      return;
    }

    try {
      const planRef = doc(db, "plan", planId);
      const planData: any = {
        price: String(editingPlan.price),
        plandetails: editingPlan.features.length > 0 
          ? "✓ " + editingPlan.features.map(f => f.trim()).join(" ✓ ")
          : ""
      };

      // Retain optional fields if they are edited/provided
      if (editingPlan.dailyCredits !== undefined) planData.dailyCredits = Number(editingPlan.dailyCredits);
      if (editingPlan.monthlyCredits !== undefined) planData.monthlyCredits = Number(editingPlan.monthlyCredits);
      if (editingPlan.description !== undefined) planData.description = editingPlan.description;

      await setDoc(planRef, planData, { merge: true });

      setEditingPlan(null);
      setIsAddMode(false);
    } catch (e) {
      console.error("Error saving plan:", e);
      alert("Failed to save plan. Please check your Firestore rules.");
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm(`Are you sure you want to delete the plan "${planId}"?`)) return;
    try {
      await deleteDoc(doc(db, "plan", planId));
    } catch (e) {
      console.error("Error deleting plan:", e);
      alert("Failed to delete plan.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Subscription Plans</h1>
          <p className="text-gray-400 text-xs mt-1">Configure pricing tiers and features for VidRank users.</p>
        </div>
        <button
          onClick={handleCreateClick}
          className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-xs font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> Add Plan
        </button>
      </div>

      {/* Plan Card Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20 text-xs text-gray-500 gap-2">
          <Loader2 className="h-5 w-5 text-accent animate-spin" />
          Synchronizing pricing tables...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              className="glass-panel rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group hover:border-primary/40 transition-all duration-300"
            >
              {/* Card visual detail */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent opacity-70"></div>
              
              <div>
                {/* Header info */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-accent tracking-widest font-mono">{plan.id}</span>
                    <h3 className="text-lg font-bold text-white mt-0.5">{plan.name}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditClick(plan)}
                      className="p-1.5 rounded-md hover:bg-white/5 text-gray-400 hover:text-white cursor-pointer"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="p-1.5 rounded-md hover:bg-red-950/20 text-gray-400 hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Price tag */}
                <div className="flex items-baseline gap-1 my-5">
                  <span className="text-2xl font-bold text-white">${plan.price}</span>
                  <span className="text-[10px] text-gray-400">/ month</span>
                </div>

                {plan.description && (
                  <p className="text-xs text-gray-400 leading-relaxed mb-6">{plan.description}</p>
                )}

                {/* Credits summary (conditional) */}
                {(plan.dailyCredits !== undefined || plan.monthlyCredits !== undefined) && (
                  <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5 mb-6 text-center">
                    {plan.dailyCredits !== undefined && (
                      <div>
                        <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider block">Daily Credits</span>
                        <span className="text-xs font-bold text-white mt-0.5 block">{plan.dailyCredits}</span>
                      </div>
                    )}
                    {plan.monthlyCredits !== undefined && (
                      <div>
                        <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider block">Monthly cap</span>
                        <span className="text-xs font-bold text-white mt-0.5 block">{plan.monthlyCredits}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Feature checklist */}
                <div className="space-y-2.5 mb-6">
                  <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Features Included</p>
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-300">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                  {plan.features.length === 0 && (
                    <p className="text-xs text-gray-500 italic">No features listed.</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Plan Form Modal */}
      <AnimatePresence>
        {editingPlan && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingPlan(null)}
              className="fixed inset-0 bg-black z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-x-4 md:inset-x-auto top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg glass-panel rounded-2xl p-6 z-50 max-h-[85vh] overflow-y-auto"
            >
              {/* Modal Title */}
              <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-accent" />
                  {isAddMode ? "Formulate New Tier" : `Edit Plan: ${editingPlan.name}`}
                </h3>
                <button
                  onClick={() => setEditingPlan(null)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Form Body */}
              <div className="space-y-4">
                {/* Plan ID (slug) - editable only when adding */}
                {isAddMode ? (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Plan ID (Slug / Document ID)</label>
                    <input
                      type="text"
                      value={editingPlan.id}
                      onChange={(e) => handleFormChange("id", e.target.value.toLowerCase().replace(/\s+/g, ""))}
                      placeholder="e.g. free, pro, enterprise"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-white/10 bg-black/30 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-primary transition-all font-mono"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Must match the lowercase plan identifier used by your main application.</p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Plan ID (Firestore Key)</label>
                    <div className="text-xs font-semibold text-gray-400 bg-white/[0.02] border border-white/5 rounded-lg px-3 py-2 font-mono select-none">
                      {editingPlan.id}
                    </div>
                  </div>
                )}

                {/* Price (String in DB, edit as text) */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Monthly Price ($)</label>
                  <input
                    type="text"
                    value={editingPlan.price}
                    onChange={(e) => handleFormChange("price", e.target.value)}
                    placeholder="e.g. 0 or 29"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-white/10 bg-black/30 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                {/* Description (Optional) */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Description Summary (Optional)</label>
                  <textarea
                    value={editingPlan.description || ""}
                    onChange={(e) => handleFormChange("description", e.target.value)}
                    placeholder="Pitch the value proposition of this tier..."
                    rows={2}
                    className="w-full px-3.5 py-2 rounded-lg border border-white/10 bg-black/30 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-primary transition-all resize-none"
                  />
                </div>

                {/* Feature Lists */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Included Features</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tempFeature}
                      onChange={(e) => setTempFeature(e.target.value)}
                      placeholder="Add key feature item..."
                      className="w-full px-3 py-1.5 rounded-lg border border-white/10 bg-black/30 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-primary transition-all"
                      onKeyDown={(e) => { if (e.key === "Enter") handleAddFeature(); }}
                    />
                    <button
                      onClick={handleAddFeature}
                      className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold shrink-0 cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                  {/* Active List */}
                  <div className="space-y-1.5 max-h-36 overflow-y-auto bg-black/20 p-2 rounded-lg border border-white/5">
                    {editingPlan.features.map((feat, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white/[0.02] border border-white/5 px-2.5 py-1 rounded text-xs">
                        <span className="text-gray-300 truncate mr-2">{feat}</span>
                        <button
                          onClick={() => handleRemoveFeature(idx)}
                          className="text-red-400 hover:text-red-300 p-0.5 rounded cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {editingPlan.features.length === 0 && (
                      <span className="text-[10px] text-gray-500 italic block text-center py-2">No features listed. Add features above.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-2.5 border-t border-white/5 pt-4 mt-6">
                <button
                  onClick={() => setEditingPlan(null)}
                  className="px-3.5 py-2 rounded-lg hover:bg-white/5 text-xs text-gray-400 hover:text-white border border-transparent transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-xs font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-primary/45 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save Changes
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
