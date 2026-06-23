"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { 
  Settings2, 
  Mail, 
  Globe, 
  ShieldAlert, 
  Lock, 
  Save, 
  Loader2,
  AlertTriangle,
  ToggleLeft,
  ToggleRight
} from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [siteName, setSiteName] = useState("VidRank");
  const [contactEmail, setContactEmail] = useState("contact@vidrank.co");
  const [supportEmail, setSupportEmail] = useState("support@vidrank.co");
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Security Form Fields
  const [sessionTimeout, setSessionTimeout] = useState(60); // minutes
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [adminPermissionsRule, setAdminPermissionsRule] = useState("standard");

  useEffect(() => {
    setLoading(true);
    // Listen to firestore doc settings/general
    const docRef = doc(db, "settings", "general");
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setSiteName(data.siteName || "VidRank");
        setContactEmail(data.contactEmail || "contact@vidrank.co");
        setSupportEmail(data.supportEmail || "support@vidrank.co");
        setMaintenanceMode(!!data.maintenanceMode);
        setSessionTimeout(Number(data.sessionTimeout) || 60);
        setTwoFactorAuth(!!data.twoFactorAuth);
        setAdminPermissionsRule(data.adminPermissionsRule || "standard");
      }
      setLoading(false);
    }, (err) => {
      console.warn("Firestore query error on general settings, loading fallback:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, "settings", "general");
      const data = {
        siteName,
        contactEmail,
        supportEmail,
        maintenanceMode,
        sessionTimeout,
        twoFactorAuth,
        adminPermissionsRule,
        lastUpdated: new Date()
      };
      await setDoc(docRef, data, { merge: true });
      alert("Settings saved successfully.");
    } catch (e) {
      console.error("Error writing settings:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">System Settings</h1>
          <p className="text-gray-400 text-xs mt-1">Configure global application domains, security rules, and user-facing notifications.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-xs font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-primary/45 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          Save Configuration
        </button>
      </div>

      {loading ? (
        <div className="glass-panel p-8 rounded-xl flex items-center justify-center gap-2 text-xs text-gray-500">
          <Loader2 className="h-4.5 w-4.5 text-accent animate-spin" />
          Loading system registries...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: General Settings */}
          <div className="md:col-span-8 space-y-6">
            {/* General Properties */}
            <div className="glass-panel p-6 rounded-xl space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-3">
                <Globe className="h-4 w-4 text-primary" />
                General System Settings
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Site Name</label>
                  <input
                    type="text"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-white/10 bg-black/30 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-primary transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5 font-sans">Contact Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-white/10 bg-black/30 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-primary transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5 font-sans">Support/Billing Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-white/10 bg-black/30 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-primary transition-all font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Security Parameters */}
            <div className="glass-panel p-6 rounded-xl space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-3">
                <Lock className="h-4 w-4 text-accent" />
                Security & Session Config
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Session Timeout (minutes)</label>
                    <input
                      type="number"
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-lg border border-white/10 bg-black/30 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-primary transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Admin Permission Set</label>
                    <select
                      value={adminPermissionsRule}
                      onChange={(e) => setAdminPermissionsRule(e.target.value)}
                      className="w-full bg-black/30 border border-white/10 text-gray-200 text-xs rounded-lg px-3.5 py-2 focus:outline-none focus:border-primary"
                    >
                      <option value="strict">Strict (MFA Required)</option>
                      <option value="standard">Standard Permissions</option>
                      <option value="lax">Lax (Internal Logs Only)</option>
                    </select>
                  </div>
                </div>

                {/* 2FA Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-lg bg-black/30 border border-white/5">
                  <div>
                    <h4 className="text-xs font-bold text-white leading-normal">Enforce Multi-Factor Authentication (2FA)</h4>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">Require mobile auth codes for all admin dashboard logins.</p>
                  </div>
                  <button
                    onClick={() => setTwoFactorAuth(!twoFactorAuth)}
                    className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white cursor-pointer"
                  >
                    {twoFactorAuth ? (
                      <ToggleRight className="h-8 w-8 text-primary" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Alerts / Maintenance */}
          <div className="md:col-span-4 space-y-6">
            {/* Maintenance Panel */}
            <div className="glass-panel p-5 rounded-xl space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-3">
                <ShieldAlert className="h-4 w-4 text-red-500" />
                Service Outage Triggers
              </h3>

              <div className="flex items-center justify-between p-2">
                <div>
                  <h4 className="text-xs font-bold text-white leading-none">Maintenance Mode</h4>
                  <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">Blocks standard app traffic and displays offline screens.</p>
                </div>
                <button
                  onClick={() => setMaintenanceMode(!maintenanceMode)}
                  className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white cursor-pointer"
                >
                  {maintenanceMode ? (
                    <ToggleRight className="h-8 w-8 text-red-500 animate-pulse" />
                  ) : (
                    <ToggleLeft className="h-8 w-8 text-gray-600" />
                  )}
                </button>
              </div>

              {maintenanceMode && (
                <div className="p-3.5 rounded-lg bg-red-950/20 border border-red-500/20 flex items-start gap-2.5 text-red-300 text-[10px] leading-relaxed">
                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Caution:</span>
                    <p className="mt-0.5">Enabling Maintenance Mode will disconnect client integrations and redirect web routes immediately.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
