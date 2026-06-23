"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  limit 
} from "firebase/firestore";
import { 
  Search, 
  Filter, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User, 
  Activity,
  Loader2
} from "lucide-react";

interface ActivityLog {
  id: string;
  user: string;
  type: "signup" | "upgrade" | "login" | "generation" | "admin";
  detail: string;
  timestamp: any;
  ipAddress?: string;
}

const MOCK_LOGS: ActivityLog[] = [
  { id: "1", type: "signup", user: "sarah.connor@gmail.com", detail: "Registered a new FREE account", timestamp: { seconds: 1719056000 }, ipAddress: "192.168.1.1" },
  { id: "2", type: "upgrade", user: "dev.nexus@outlook.com", detail: "Upgraded from FREE to PRO plan ($29/mo)", timestamp: { seconds: 1719055000 }, ipAddress: "192.168.1.12" },
  { id: "3", type: "generation", user: "m_spencer@youtube.com", detail: "Generated 45 video tags and descriptions", timestamp: { seconds: 1719054000 }, ipAddress: "172.56.21.9" },
  { id: "4", type: "login", user: "john.wick@continental.com", detail: "Admin user session established", timestamp: { seconds: 1719053000 }, ipAddress: "10.0.0.45" },
  { id: "5", type: "generation", user: "vlogger.sam@gmail.com", detail: "Generated 15 high-converting titles", timestamp: { seconds: 1719052000 }, ipAddress: "192.168.2.14" },
  { id: "6", type: "upgrade", user: "clara.sky@tech.co", detail: "Upgraded from PRO to MAX plan ($79/mo)", timestamp: { seconds: 1719051000 }, ipAddress: "174.12.89.5" },
  { id: "7", type: "admin", user: "admin@vidrank.co", detail: "Adjusted credits (+200) for Sophie Martinez", timestamp: { seconds: 1719050000 }, ipAddress: "10.0.0.1" },
  { id: "8", type: "admin", user: "admin@vidrank.co", detail: "Modified price parameter for plan: PRO", timestamp: { seconds: 1719048000 }, ipAddress: "10.0.0.1" },
];

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [exporting, setExporting] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setLoading(true);
    // Fetch logs from activitylogs Firestore collection
    const q = query(collection(db, "activitylogs"), orderBy("timestamp", "desc"), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ActivityLog[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as ActivityLog);
      });
      setLogs(list.length ? list : MOCK_LOGS);
      setLoading(false);
    }, (err) => {
      console.warn("Firestore logs collection unavailable, loading mock logs:", err);
      setLogs(MOCK_LOGS);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);

      const headers = "ID,User,Type,Detail,Timestamp,IP Address\n";
      const rows = logs.map(l => {
        const timeStr = l.timestamp?.seconds 
          ? new Date(l.timestamp.seconds * 1000).toISOString() 
          : new Date(l.timestamp).toISOString();
        return `${l.id},"${l.user}",${l.type},"${l.detail.replace(/"/g, '""')}",${timeStr},${l.ipAddress || "N/A"}`;
      }).join("\n");

      const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", `vidrank-audit-logs-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 1200);
  };

  const formatDate = (dateObj: any) => {
    if (!dateObj) return "N/A";
    const date = dateObj.seconds ? new Date(dateObj.seconds * 1000) : new Date(dateObj);
    return date.toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const filteredLogs = logs.filter(l => {
    const matchesSearch = l.user.toLowerCase().includes(search.toLowerCase()) ||
                          l.detail.toLowerCase().includes(search.toLowerCase()) ||
                          (l.ipAddress && l.ipAddress.includes(search));
    const matchesType = typeFilter === "ALL" || l.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Audit Logs</h1>
          <p className="text-gray-400 text-xs mt-1">Review operational actions, logins, database changes, and system warnings.</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-white border border-white/5 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
        >
          {exporting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by operator email, action details..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-white/5 bg-[#030712]/60 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-primary/50 transition-all"
          />
        </div>

        {/* Filter type */}
        <div className="flex gap-2 items-center w-full md:w-auto justify-end">
          <Filter className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs text-gray-400 font-medium">Action Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            className="bg-[#030712]/60 border border-white/5 text-gray-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary/50"
          >
            <option value="ALL">All Actions</option>
            <option value="signup">User Signups</option>
            <option value="upgrade">Plan Upgrades</option>
            <option value="login">Account Logins</option>
            <option value="generation">AI Generations</option>
            <option value="admin">Admin Overrides</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Timestamp</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Actor / User</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Event Type</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Event Details</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-xs text-gray-500">
                    <div className="flex justify-center items-center gap-2">
                      <Loader2 className="h-4.5 w-4.5 text-primary animate-spin" />
                      Loading platform audit logs...
                    </div>
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-xs text-gray-500">No logs found matching query filters.</td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.01] transition-all">
                    {/* Timestamp */}
                    <td className="p-4 text-xs text-gray-400">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-gray-600 shrink-0" />
                        <span>{formatDate(log.timestamp)}</span>
                      </div>
                    </td>

                    {/* Actor */}
                    <td className="p-4 text-xs font-bold text-white">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-gray-500" />
                        <span>{log.user}</span>
                      </div>
                    </td>

                    {/* Event Type Badge */}
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                        log.type === "admin" 
                          ? "bg-red-950/40 text-red-400 border-red-800/30" 
                          : log.type === "signup" 
                            ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/30" 
                            : log.type === "upgrade"
                              ? "bg-purple-950/40 text-purple-400 border-purple-800/30"
                              : log.type === "login"
                                ? "bg-white/[0.03] text-gray-400 border-white/5"
                                : "bg-blue-950/40 text-sky-400 border-blue-800/30"
                      }`}>
                        {log.type}
                      </span>
                    </td>

                    {/* Detail */}
                    <td className="p-4 text-xs text-gray-300 leading-normal max-w-sm">
                      {log.detail}
                    </td>

                    {/* IP */}
                    <td className="p-4 text-xs font-mono text-gray-500">
                      {log.ipAddress || "N/A"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
          <span>Showing {paginatedLogs.length} of {filteredLogs.length} logs</span>
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
    </div>
  );
}
