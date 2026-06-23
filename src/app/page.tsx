"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace("/admin");
      } else {
        router.replace("/login");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center relative overflow-hidden">
      <div className="glow-blue top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2" />
      <div className="glow-sky bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2" />

      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 animate-pulse">
          <Loader2 className="h-5 w-5 text-white animate-spin" />
        </div>
        <h2 className="text-sm font-bold tracking-widest text-white uppercase animate-pulse">
          Loading VidRank Portal
        </h2>
      </div>
    </div>
  );
}
