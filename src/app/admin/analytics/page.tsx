"use client";

import React, { useState, useEffect } from "react";
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { 
  Calendar, 
  Download, 
  FileText, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Cpu, 
  Percent, 
  Activity,
  Loader2
} from "lucide-react";

// Mock Aggregated Data
const DAILY_DATA = [
  { name: "00:00", Signup: 12, Revenue: 290, Requests: 140 },
  { name: "04:00", Signup: 5, Revenue: 79, Requests: 85 },
  { name: "08:00", Signup: 18, Revenue: 420, Requests: 320 },
  { name: "12:00", Signup: 34, Revenue: 890, Requests: 580 },
  { name: "16:00", Signup: 28, Revenue: 680, Requests: 490 },
  { name: "20:00", Signup: 22, Revenue: 510, Requests: 410 },
];

const WEEKLY_DATA = [
  { name: "Mon", Signup: 45, Revenue: 1250, Requests: 2800 },
  { name: "Tue", Signup: 52, Revenue: 1430, Requests: 3100 },
  { name: "Wed", Signup: 49, Revenue: 1380, Requests: 2950 },
  { name: "Thu", Signup: 65, Revenue: 1980, Requests: 4200 },
  { name: "Fri", Signup: 58, Revenue: 1640, Requests: 3800 },
  { name: "Sat", Signup: 32, Revenue: 850, Requests: 2100 },
  { name: "Sun", Signup: 28, Revenue: 790, Requests: 1800 },
];

const MONTHLY_DATA = [
  { name: "Jan", Signup: 180, Revenue: 5200, Requests: 12500 },
  { name: "Feb", Signup: 220, Revenue: 6800, Requests: 15400 },
  { name: "Mar", Signup: 280, Revenue: 8500, Requests: 19800 },
  { name: "Apr", Signup: 340, Revenue: 10400, Requests: 24500 },
  { name: "May", Signup: 410, Revenue: 12900, Requests: 29800 },
  { name: "Jun", Signup: 470, Revenue: 14500, Requests: 32400 },
];

const YEARLY_DATA = [
  { name: "2022", Signup: 1200, Revenue: 34000, Requests: 85000 },
  { name: "2023", Signup: 2800, Revenue: 79000, Requests: 210000 },
  { name: "2024", Signup: 5400, Revenue: 156000, Requests: 480000 },
  { name: "2025", Signup: 8900, Revenue: 260000, Requests: 840000 },
];

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly" | "yearly">("monthly");
  const [mounted, setMounted] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  // Client hydration fix
  useEffect(() => {
    setMounted(true);
  }, []);

  const getChartData = () => {
    switch (timeframe) {
      case "daily": return DAILY_DATA;
      case "weekly": return WEEKLY_DATA;
      case "yearly": return YEARLY_DATA;
      default: return MONTHLY_DATA;
    }
  };

  const handleExport = (format: "csv" | "excel" | "pdf") => {
    setExporting(format);
    
    // Simulate generation and download pipeline
    setTimeout(() => {
      setExporting(null);
      
      const fileData = getChartData();
      let blob: Blob;
      let filename = `vidrank-analytics-report-${timeframe}.${format}`;

      if (format === "csv") {
        const headers = "Name,Signups,Revenue,Requests\n";
        const rows = fileData.map(d => `${d.name},${d.Signup},${d.Revenue},${d.Requests}`).join("\n");
        blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
      } else {
        // Mock download container for binary types
        const content = `VidRank Administrative Report - ${timeframe.toUpperCase()} aggregate. Data points: ${JSON.stringify(fileData)}`;
        blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
      }

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 1500);
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">System Analytics</h1>
          <p className="text-gray-400 text-xs mt-1">Review operational conversions, account growth rates, and retention models.</p>
        </div>

        {/* Timeframe selector */}
        <div className="flex bg-white/[0.02] border border-white/5 p-1 rounded-xl shrink-0 self-start sm:self-auto">
          {(["daily", "weekly", "monthly", "yearly"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                timeframe === t 
                  ? "bg-primary text-white shadow" 
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Conversion Rate Card */}
        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between h-[105px]">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Plan Conversion</span>
            <Percent className="h-4.5 w-4.5 text-accent" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold text-white leading-none">32.4%</h3>
            <p className="text-[9px] text-green-400 font-semibold mt-1 flex items-center gap-0.5">
              <TrendingUp className="h-2.5 w-2.5" />
              +2.5% vs last month
            </p>
          </div>
        </div>

        {/* Retention Rate */}
        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between h-[105px]">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Retention Rate</span>
            <Activity className="h-4.5 w-4.5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold text-white leading-none">94.8%</h3>
            <p className="text-[9px] text-gray-500 font-semibold mt-1">
              Standard SaaS cohort limits
            </p>
          </div>
        </div>

        {/* Total Registrations */}
        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between h-[105px]">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Registrations</span>
            <Users className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold text-white leading-none">
              {getChartData().reduce((acc, curr) => acc + curr.Signup, 0)}
            </h3>
            <span className="text-[9px] text-gray-500 mt-1 block">Summed for active range</span>
          </div>
        </div>

        {/* Period Revenue */}
        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between h-[105px]">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Accrued Revenue</span>
            <DollarSign className="h-4.5 w-4.5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold text-emerald-400 leading-none">
              ${new Intl.NumberFormat().format(getChartData().reduce((acc, curr) => acc + curr.Revenue, 0))}
            </h3>
            <span className="text-[9px] text-gray-500 mt-1 block">Taxes & gate fees excluded</span>
          </div>
        </div>
      </div>

      {/* Main Charts Block */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registrations and MRR Trend */}
        <div className="glass-panel p-5 rounded-xl">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-primary" />
            Acquisition & Income Vectors
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getChartData()} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#38BDF8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={10} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} />
                <Tooltip contentStyle={{ background: "#0b0f19", border: "1px solid rgba(255,255,255,0.1)", fontSize: 11 }} />
                <Area type="monotone" dataKey="Signup" stroke="#2563EB" fillOpacity={1} fill="url(#colorSignups)" strokeWidth={2} name="Signups" />
                <Area type="monotone" dataKey="Revenue" stroke="#38BDF8" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} name="Revenue ($)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Generator Volume Trend */}
        <div className="glass-panel p-5 rounded-xl">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Cpu className="h-4 w-4 text-accent" />
            AI Generator Throughput
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getChartData()} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={10} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} />
                <Tooltip contentStyle={{ background: "#0b0f19", border: "1px solid rgba(255,255,255,0.1)", fontSize: 11 }} />
                <Bar dataKey="Requests" fill="#8B5CF6" radius={[4, 4, 0, 0]} maxBarSize={35} name="API Requests" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Export Panel */}
      <div className="glass-panel p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-sm font-bold text-white">Analytical Data Export</h3>
          <p className="text-xs text-gray-400 mt-0.5">Package selected metrics for offline records or financial spreadsheets.</p>
        </div>
        
        <div className="flex gap-2">
          {/* CSV */}
          <button
            onClick={() => handleExport("csv")}
            disabled={exporting !== null}
            className="px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-white border border-white/5 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            {exporting === "csv" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            Download CSV
          </button>

          {/* Excel */}
          <button
            onClick={() => handleExport("excel")}
            disabled={exporting !== null}
            className="px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-white border border-white/5 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            {exporting === "excel" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
            ) : (
              <FileText className="h-3.5 w-3.5" />
            )}
            Download Excel
          </button>

          {/* PDF */}
          <button
            onClick={() => handleExport("pdf")}
            disabled={exporting !== null}
            className="px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-white border border-white/5 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            {exporting === "pdf" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
            ) : (
              <Download className="h-3.5 w-3.5 text-primary" />
            )}
            Export PDF
          </button>
        </div>
      </div>
    </div>
  );
}
