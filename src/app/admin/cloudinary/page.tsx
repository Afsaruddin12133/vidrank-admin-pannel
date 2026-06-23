"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { 
  Cloud, 
  Settings2, 
  UploadCloud, 
  Check, 
  X, 
  Save, 
  Loader2,
  AlertCircle,
  ShieldCheck
} from "lucide-react";

export default function CloudinarySettingsPage() {
  const [cloudName, setCloudName] = useState("");
  const [uploadPreset, setUploadPreset] = useState("");
  const [loading, setLoading] = useState(true);

  // Form edit states
  const [isEditing, setIsEditing] = useState(false);
  const [tempCloud, setTempCloud] = useState("");
  const [tempPreset, setTempPreset] = useState("");
  const [saving, setSaving] = useState(false);

  // Upload test states
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string; url?: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    // Listen to firestore doc cloudinary/cloudinary
    const docRef = doc(db, "cloudinary", "cloudinary");
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setCloudName(data.cloudname || "");
        setUploadPreset(data.uploadpreset || "");
        setTempCloud(data.cloudname || "");
        setTempPreset(data.uploadpreset || "");
      } else {
        console.warn("cloudinary/cloudinary document missing in database");
      }
      setLoading(false);
    }, (err) => {
      console.warn("Firestore query error on Cloudinary settings, loading fallback:", err);
      // Fallback
      setCloudName("vidrank-media-cloud");
      setUploadPreset("vidrank_avatar_presets");
      setTempCloud("vidrank-media-cloud");
      setTempPreset("vidrank_avatar_presets");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!tempCloud.trim() || !tempPreset.trim()) return;
    setSaving(true);
    try {
      const docRef = doc(db, "cloudinary", "cloudinary");
      const data = {
        cloudname: tempCloud.trim(),
        uploadpreset: tempPreset.trim(),
        lastUpdated: new Date()
      };
      await setDoc(docRef, data, { merge: true });
      setCloudName(tempCloud.trim());
      setUploadPreset(tempPreset.trim());
      setIsEditing(false);
    } catch (e) {
      console.error("Error updating Cloudinary credentials:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleTestUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Upload request failed. Verify your Cloud Name and Upload Preset settings.");
      }

      const resData = await response.json();
      setUploadResult({
        success: true,
        message: `Media uploaded successfully to Cloudinary! File: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
        url: resData.secure_url || resData.url
      });
    } catch (error: any) {
      setUploadResult({
        success: false,
        message: `Diagnostics Failed: ${error.message || error}`
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Cloudinary Configuration</h1>
        <p className="text-gray-400 text-xs mt-1">Manage global image and video file asset bucket endpoints.</p>
      </div>

      {loading ? (
        <div className="glass-panel p-8 rounded-xl flex items-center justify-center gap-2 text-xs text-gray-500">
          <Loader2 className="h-4.5 w-4.5 text-accent animate-spin" />
          Synchronizing storage keys...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Credentials Display */}
          <div className="glass-panel p-6 rounded-xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Cloud className="h-4.5 w-4.5 text-primary" />
                Cloudinary Storage Bucket
              </span>
              
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/[0.02] border border-white/5 text-[10px]">
                {cloudName && uploadPreset ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400"></span>
                    <span className="text-green-400 font-semibold">Configured</span>
                  </>
                ) : (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                    <span className="text-amber-500 font-semibold">Unset</span>
                  </>
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Cloud Name</label>
                    <input
                      type="text"
                      value={tempCloud}
                      onChange={(e) => setTempCloud(e.target.value)}
                      placeholder="e.g. vidrank-media"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-white/10 bg-black/40 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Upload Preset</label>
                    <input
                      type="text"
                      value={tempPreset}
                      onChange={(e) => setTempPreset(e.target.value)}
                      placeholder="e.g. avatar_unsigned_upload"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-white/10 bg-black/40 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1.5">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {saving && <Loader2 className="h-3 w-3 animate-spin" />}
                    <Save className="h-3.5 w-3.5" />
                    Save Settings
                  </button>
                  <button
                    onClick={() => { setIsEditing(false); setTempCloud(cloudName); setTempPreset(uploadPreset); }}
                    className="px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold border border-white/5 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-lg bg-black/30 border border-white/5">
                    <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider block">Cloud Name</span>
                    <span className="text-xs font-semibold text-white mt-1.5 block">{cloudName || "Unavailable"}</span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-black/30 border border-white/5">
                    <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider block">Upload Preset</span>
                    <span className="text-xs font-semibold text-white mt-1.5 block">{uploadPreset || "Unavailable"}</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-white border border-white/5 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  Edit Parameters
                </button>
              </div>
            )}
          </div>

          {/* Diagnostics Test Panel */}
          <div className="glass-panel p-6 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Storage Diagnostics</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Verify upload compatibility by submitting a diagnostic file. This confirms signature validation and preset constraints are functioning.
            </p>

            <div className="relative inline-block">
              <input
                type="file"
                accept="image/*"
                id="cloudinary-test-upload"
                className="hidden"
                disabled={uploading || !cloudName}
                onChange={handleTestUpload}
              />
              <label
                htmlFor="cloudinary-test-upload"
                className={`px-4 py-2.5 rounded-lg border border-white/5 bg-white/5 text-xs font-semibold text-white transition-all flex items-center gap-2 cursor-pointer ${
                  uploading || !cloudName ? "opacity-50 cursor-not-allowed" : "hover:bg-white/10"
                }`}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-accent" />
                    Uploading Image File...
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4 text-primary" />
                    Perform Test Upload
                  </>
                )}
              </label>
            </div>

            {uploadResult && (
              <div className={`p-4 rounded-xl border flex items-start gap-3 mt-4 text-xs ${
                uploadResult.success 
                  ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-300" 
                  : "bg-red-950/20 border-red-500/20 text-red-300"
              }`}>
                {uploadResult.success ? (
                  <ShieldCheck className="h-4.5 w-4.5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4.5 w-4.5 text-red-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">{uploadResult.success ? "Asset Upload Successful" : "Upload Failed"}</p>
                  <p className="text-gray-400 mt-1 leading-normal">{uploadResult.message}</p>
                  {uploadResult.url && (
                    <a
                      href={uploadResult.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent underline font-semibold mt-2 inline-block hover:text-accent-light"
                    >
                      View Uploaded Resource
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
