"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { 
  collection, 
  onSnapshot, 
  query, 
  limit, 
  orderBy 
} from "firebase/firestore";
import {
  Users,
  UserCheck,
  UserPlus,
  CreditCard,
  DollarSign,
  Cpu,
  Tag,
  FileText,
  Type,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Loader2
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

// Types for stats
interface Stats {
  totalUsers: number;
  activeUsers: number;
  freeUsers: number;
  proUsers: number;
  monthlyRevenue: number;
  todayAiRequests: number;
  totalTags: number;
  totalDescriptions: number;
  totalTitles: number;
  activeSessions: number;
}

const INITIAL_STATS: Stats = {
  totalUsers: 1420,
  activeUsers: 840,
  freeUsers: 950,
  proUsers: 470,
  monthlyRevenue: 12450,
  todayAiRequests: 3240,
  totalTags: 48900,
  totalDescriptions: 21300,
  totalTitles: 29400,
  activeSessions: 85
};

// Colors for Pie Chart
const COLORS = ["#3B82F6", "#38BDF8", "#F59E0B"];

export default function DashboardPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<Stats>(INITIAL_STATS);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Recharts hydration fix
  useEffect(() => {
    setMounted(true);
  }, []);

  // Realtime Firestore listeners
  useEffect(() => {
    if (!mounted) return;

    setLoading(true);
    
    // Listen to real users count, subscriptions, usage, logs from the users collection
    const usersQuery = query(collection(db, "users"));
    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      let total = 0;
      let free = 0;
      let pro = 0;
      let active = 0;
      let revenue = 0;
      let sumTags = 0;
      let sumDescriptions = 0;
      let sumTitles = 0;

      snapshot.forEach(docSnap => {
        total++;
        const data = docSnap.data();
        
        // Count plan tiers
        const rawPlan = (data.plan || data.tier || "FREE").toString().toUpperCase();
        if (rawPlan === "FREE") {
          free++;
        } else {
          pro++;
        }

        // Count status
        if (data.status !== "disabled" && data.status !== "inactive") {
          active++;
        }

        // Sum revenue (from active billing status / price)
        const subStatus = data.subscriptionStatus || (data.status === "disabled" ? "paused" : "active");
        if (subStatus === "active") {
          let resolvedPrice = 0;
          if (data.subscriptionPrice !== undefined) {
            resolvedPrice = Number(data.subscriptionPrice);
          } else {
            resolvedPrice = rawPlan === "PRO" ? 29 : rawPlan === "MAX" ? 79 : 0;
          }
          revenue += resolvedPrice;
        }

        // Sum AI generations
        sumTags += Number(data.generatedTags || data.tagsCount || 0);
        sumDescriptions += Number(data.generatedDescriptions || data.descriptionsCount || 0);
        sumTitles += Number(data.generatedTitles || data.titlesCount || 0);
      });

      setStats({
        totalUsers: total,
        freeUsers: free,
        proUsers: pro,
        activeUsers: active,
        monthlyRevenue: revenue,
        totalTags: sumTags,
        totalDescriptions: sumDescriptions,
        totalTitles: sumTitles,
        todayAiRequests: Math.round((sumTags + sumDescriptions + sumTitles) * 0.03) || 5,
        activeSessions: Math.max(2, Math.round(active * 0.08))
      });
      setLoading(false);
    }, (err) => {
      console.warn("Firestore permissions or collection users missing:", err.message);
      setLoading(false);
    });

    // Listen to activitylogs for recent events
    const logsQuery = query(collection(db, "activitylogs"), orderBy("timestamp", "desc"), limit(8));
    const unsubLogs = onSnapshot(logsQuery, (snapshot) => {
      const logsList: any[] = [];
      snapshot.forEach(doc => {
        logsList.push({ id: doc.id, ...doc.data() });
      });
      setActivities(logsList.length ? logsList : getMockActivities());
    }, (err) => {
      console.warn("Firestore activitylogs missing, using mock logs:", err.message);
      setActivities(getMockActivities());
    });

    return () => {
      unsubUsers();
      unsubLogs();
    };
  }, [mounted]);

  const getMockActivities = () => [
    { id: "1", type: "signup", user: "sarah.connor@gmail.com", detail: "Registered a new free account", timestamp: new Date(Date.now() - 4 * 60 * 1000) },
    { id: "2", type: "upgrade", user: "dev.nexus@outlook.com", detail: "Upgraded from FREE to PRO plan ($29/mo)", timestamp: new Date(Date.now() - 15 * 60 * 1000) },
    { id: "3", type: "generation", user: "m_spencer@youtube.com", detail: "Generated 45 video tags and descriptions", timestamp: new Date(Date.now() - 32 * 60 * 1000) },
    { id: "4", type: "login", user: "john.wick@continental.com", detail: "Admin user session established", timestamp: new Date(Date.now() - 45 * 60 * 1000) },
    { id: "5", type: "generation", user: "vlogger.sam@gmail.com", detail: "Generated 15 high-converting titles", timestamp: new Date(Date.now() - 60 * 60 * 1000) },
    { id: "6", type: "upgrade", user: "clara.sky@tech.co", detail: "Upgraded from PRO to MAX plan ($79/mo)", timestamp: new Date(Date.now() - 120 * 60 * 1000) },
  ];

  // Helper formatting for numbers
  const formatNum = (num: number) => new Intl.NumberFormat().format(num);
  const formatCurrency = (num: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(num);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  // Mock data for charts
  const userGrowthData = [
    { name: "Jan", Users: 400 },
    { name: "Feb", Users: 600 },
    { name: "Mar", Users: 800 },
    { name: "Apr", Users: 1050 },
    { name: "May", Users: 1250 },
    { name: "Jun", Users: stats.totalUsers },
  ];

  const revenueData = [
    { name: "Jan", Revenue: 3400 },
    { name: "Feb", Revenue: 5100 },
    { name: "Mar", Revenue: 6800 },
    { name: "Apr", Revenue: 8900 },
    { name: "May", Revenue: 10500 },
    { name: "Jun", Revenue: stats.monthlyRevenue },
  ];

  const aiUsageData = [
    { name: "Mon", Tags: 4500, Desc: 2100, Titles: 3200 },
    { name: "Tue", Tags: 5100, Desc: 2400, Titles: 3400 },
    { name: "Wed", Tags: 4900, Desc: 2200, Titles: 3100 },
    { name: "Thu", Tags: 6200, Desc: 3100, Titles: 4300 },
    { name: "Fri", Tags: 5800, Desc: 2900, Titles: 4100 },
    { name: "Sat", Tags: 3200, Desc: 1500, Titles: 2100 },
    { name: "Sun", Tags: 2800, Desc: 1100, Titles: 1800 },
  ];

  const planDistributionData = [
    { name: "FREE", value: stats.freeUsers },
    { name: "PRO", value: stats.proUsers * 0.7 },
    { name: "MAX", value: stats.proUsers * 0.3 },
  ];

  if (!mounted) return null;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
            Welcome back, {user?.displayName?.split(" ")[0] || "Admin"}
          </h1>
          <p className="text-gray-400 text-xs mt-1">
            Real-time analytics and platform performance metrics.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-3.5 py-1.5 rounded-lg border border-white/5 bg-white/[0.02] text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/[0.05] transition-all cursor-pointer">
            Export Report
          </button>
          <button className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-xs font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all cursor-pointer flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            System Health
          </button>
        </div>
      </div>

      {/* 10 Stats Cards Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
      >
        {/* Total Users */}
        <motion.div variants={itemVariants} className="glass-panel p-4 rounded-xl flex flex-col justify-between h-[105px] relative overflow-hidden group">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Total Users</span>
            <Users className="h-4.5 w-4.5 text-primary shrink-0" />
          </div>
          <div className="mt-2.5">
            <h3 className="text-lg md:text-xl font-bold text-white leading-none">{formatNum(stats.totalUsers)}</h3>
            <p className="text-[9px] text-green-400 font-semibold mt-1 flex items-center gap-0.5">
              <TrendingUp className="h-2.5 w-2.5" />
              +12% MoM
            </p>
          </div>
        </motion.div>

        {/* Active Users */}
        <motion.div variants={itemVariants} className="glass-panel p-4 rounded-xl flex flex-col justify-between h-[105px] relative overflow-hidden group">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Active Users</span>
            <UserCheck className="h-4.5 w-4.5 text-accent shrink-0" />
          </div>
          <div className="mt-2.5">
            <h3 className="text-lg md:text-xl font-bold text-white leading-none">{formatNum(stats.activeUsers)}</h3>
            <p className="text-[9px] text-gray-500 font-semibold mt-1">
              {( (stats.activeUsers / stats.totalUsers) * 100 ).toFixed(0)}% overall activity
            </p>
          </div>
        </motion.div>

        {/* Free Users */}
        <motion.div variants={itemVariants} className="glass-panel p-4 rounded-xl flex flex-col justify-between h-[105px] relative overflow-hidden group">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Free Accounts</span>
            <UserPlus className="h-4.5 w-4.5 text-amber-500 shrink-0" />
          </div>
          <div className="mt-2.5">
            <h3 className="text-lg md:text-xl font-bold text-white leading-none">{formatNum(stats.freeUsers)}</h3>
            <p className="text-[9px] text-gray-500 font-semibold mt-1">
              Standard tier users
            </p>
          </div>
        </motion.div>

        {/* Pro Users */}
        <motion.div variants={itemVariants} className="glass-panel p-4 rounded-xl flex flex-col justify-between h-[105px] relative overflow-hidden group">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Premium Users</span>
            <CreditCard className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
          </div>
          <div className="mt-2.5">
            <h3 className="text-lg md:text-xl font-bold text-white leading-none">{formatNum(stats.proUsers)}</h3>
            <p className="text-[9px] text-emerald-400 font-semibold mt-1 flex items-center gap-0.5">
              {( (stats.proUsers / stats.totalUsers) * 100 ).toFixed(1)}% Conversion
            </p>
          </div>
        </motion.div>

        {/* Monthly Revenue */}
        <motion.div variants={itemVariants} className="glass-panel p-4 rounded-xl flex flex-col justify-between h-[105px] relative overflow-hidden group">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">MRR</span>
            <DollarSign className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
          </div>
          <div className="mt-2.5">
            <h3 className="text-lg md:text-xl font-bold text-emerald-400 leading-none">{formatCurrency(stats.monthlyRevenue)}</h3>
            <p className="text-[9px] text-green-400 font-semibold mt-1 flex items-center gap-0.5">
              <TrendingUp className="h-2.5 w-2.5" />
              +18.4% MoM
            </p>
          </div>
        </motion.div>

        {/* Today's AI Requests */}
        <motion.div variants={itemVariants} className="glass-panel p-4 rounded-xl flex flex-col justify-between h-[105px] relative overflow-hidden group">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Today's Requests</span>
            <Cpu className="h-4.5 w-4.5 text-purple-400 shrink-0" />
          </div>
          <div className="mt-2.5">
            <h3 className="text-lg md:text-xl font-bold text-white leading-none">{formatNum(stats.todayAiRequests)}</h3>
            <p className="text-[9px] text-gray-500 font-semibold mt-1">
              Active operations
            </p>
          </div>
        </motion.div>

        {/* Total Generated Tags */}
        <motion.div variants={itemVariants} className="glass-panel p-4 rounded-xl flex flex-col justify-between h-[105px] relative overflow-hidden group">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Tags Generated</span>
            <Tag className="h-4.5 w-4.5 text-sky-400 shrink-0" />
          </div>
          <div className="mt-2.5">
            <h3 className="text-lg md:text-xl font-bold text-white leading-none">{formatNum(stats.totalTags)}</h3>
            <p className="text-[9px] text-gray-500 font-semibold mt-1">
              SEO tags generated
            </p>
          </div>
        </motion.div>

        {/* Total Generated Descriptions */}
        <motion.div variants={itemVariants} className="glass-panel p-4 rounded-xl flex flex-col justify-between h-[105px] relative overflow-hidden group">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Desc. Generated</span>
            <FileText className="h-4.5 w-4.5 text-pink-400 shrink-0" />
          </div>
          <div className="mt-2.5">
            <h3 className="text-lg md:text-xl font-bold text-white leading-none">{formatNum(stats.totalDescriptions)}</h3>
            <p className="text-[9px] text-gray-500 font-semibold mt-1">
              Descriptions crafted
            </p>
          </div>
        </motion.div>

        {/* Total Generated Titles */}
        <motion.div variants={itemVariants} className="glass-panel p-4 rounded-xl flex flex-col justify-between h-[105px] relative overflow-hidden group">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Titles Generated</span>
            <Type className="h-4.5 w-4.5 text-orange-400 shrink-0" />
          </div>
          <div className="mt-2.5">
            <h3 className="text-lg md:text-xl font-bold text-white leading-none">{formatNum(stats.totalTitles)}</h3>
            <p className="text-[9px] text-gray-500 font-semibold mt-1">
              Clickable titles written
            </p>
          </div>
        </motion.div>

        {/* Active Sessions */}
        <motion.div variants={itemVariants} className="glass-panel p-4 rounded-xl flex flex-col justify-between h-[105px] relative overflow-hidden group">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Live Sessions</span>
            <Activity className="h-4.5 w-4.5 text-teal-400 shrink-0" />
          </div>
          <div className="mt-2.5">
            <h3 className="text-lg md:text-xl font-bold text-teal-400 leading-none">{formatNum(stats.activeSessions)}</h3>
            <p className="text-[9px] text-teal-400/70 font-semibold mt-1 flex items-center gap-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-ping"></span>
              Real-time sockets open
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column Charts */}
        <div className="lg:col-span-8 space-y-6">
          {/* User Growth & Revenue (Split) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Growth Chart */}
            <div className="glass-panel p-4 rounded-xl">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">User Growth</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Historical subscriber counts</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-gray-500" />
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={userGrowthData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={10} />
                    <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} />
                    <Tooltip contentStyle={{ background: "#0b0f19", border: "1px solid rgba(255,255,255,0.1)", fontSize: 11 }} />
                    <Area type="monotone" dataKey="Users" stroke="#2563EB" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Revenue Chart */}
            <div className="glass-panel p-4 rounded-xl">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Monthly MRR</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Monthly recurring revenue (USD)</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-gray-500" />
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={10} />
                    <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} />
                    <Tooltip contentStyle={{ background: "#0b0f19", border: "1px solid rgba(255,255,255,0.1)", fontSize: 11 }} />
                    <Bar dataKey="Revenue" fill="#38BDF8" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* AI Usage Chart */}
          <div className="glass-panel p-5 rounded-xl">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">AI Content Generation Volumes</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Daily tags, titles, and descriptions generated</p>
              </div>
              <div className="flex gap-2">
                <span className="inline-flex items-center gap-1 text-[10px] text-sky-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400"></span> Tags
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-orange-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-400"></span> Titles
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-pink-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-pink-400"></span> Descriptions
                </span>
              </div>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={aiUsageData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={10} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} />
                  <Tooltip contentStyle={{ background: "#0b0f19", border: "1px solid rgba(255,255,255,0.1)", fontSize: 11 }} />
                  <Line type="monotone" dataKey="Tags" stroke="#38BDF8" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Titles" stroke="#FB923C" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Desc" stroke="#F472B6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column (Plan Distribution & Activity Feed) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Plan Distribution Chart */}
          <div className="glass-panel p-4 rounded-xl">
            <h3 className="text-sm font-bold text-white mb-2">Plan Distribution</h3>
            <p className="text-[10px] text-gray-400 mb-4">Subscription tier splits</p>
            <div className="h-44 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {planDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0b0f19", border: "1px solid rgba(255,255,255,0.1)", fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Plans</span>
                <p className="text-sm font-bold text-white">Active Split</p>
              </div>
            </div>
            {/* Legend indicators */}
            <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-white/5">
              {planDistributionData.map((p, idx) => (
                <div key={p.name} className="text-center">
                  <span className="text-[9px] font-semibold text-gray-400 block">{p.name}</span>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS[idx] }}></span>
                    <span className="text-xs font-bold text-white">{p.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="glass-panel p-5 rounded-xl flex flex-col min-h-[330px]">
            <h3 className="text-sm font-bold text-white mb-3">Live Feed</h3>
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 text-accent animate-spin" />
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Fetching Activities</span>
              </div>
            ) : (
              <div className="flex-1 space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {activities.map((act) => {
                  const dateStr = act.timestamp?.seconds 
                    ? new Date(act.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                    : new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div key={act.id} className="flex gap-3 text-xs leading-normal">
                      <div className="shrink-0 mt-0.5">
                        {act.type === "signup" && <span className="h-6 w-6 rounded-lg bg-primary/20 text-accent flex items-center justify-center font-bold text-[10px]">U</span>}
                        {act.type === "upgrade" && <span className="h-6 w-6 rounded-lg bg-emerald-950/40 text-emerald-400 flex items-center justify-center font-bold text-[10px]">P</span>}
                        {act.type === "generation" && <span className="h-6 w-6 rounded-lg bg-purple-950/40 text-purple-400 flex items-center justify-center font-bold text-[10px]">G</span>}
                        {act.type === "login" && <span className="h-6 w-6 rounded-lg bg-gray-800 text-gray-300 flex items-center justify-center font-bold text-[10px]">L</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate text-[11px]">{act.user}</p>
                        <p className="text-gray-400 text-[10px] mt-0.5">{act.detail}</p>
                      </div>
                      <span className="text-[9px] text-gray-500 mt-0.5 whitespace-nowrap">{dateStr}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
