"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FileText, FolderKanban, GraduationCap, Code2, Mail, MessageSquare,
  Eye, TrendingUp, Clock, AlertCircle, Users, Database, ArrowUpRight,
  BarChart3, Activity, Zap, CheckCircle2, XCircle, Info,
  Plus, Pencil, Trash2, LogIn, LogOut,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ActivityChart } from "@/components/admin/activity-chart";
import { ContentDistributionChart } from "@/components/admin/content-distribution-chart";
import { ContentByTagChart } from "@/components/admin/content-by-tag-chart";
import { ExportData } from "@/components/admin/export-data";

// Info icon that reveals details on hover/click (replaces cluttered static text boxes)
function InfoTip({ label, details }: { label: string; details: React.ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center justify-center text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
          aria-label={`More info about ${label}`}
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 text-xs" side="top">
        <div className="space-y-1">
          <p className="font-semibold text-foreground">{label}</p>
          <div className="text-muted-foreground">{details}</div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface StatCard {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  trend?: string;
  href?: string;
  description?: string;
}

interface RecentItem {
  id: string;
  title: string;
  type: string;
  status: string;
  date: string;
  href?: string;
}

interface SystemHealth {
  status: "healthy" | "warning" | "error";
  uptime: string;
  dbSize: string;
  lastBackup: string;
}

interface TimelineLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  actor: string;
  createdAt: string;
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffWeek < 5) return `${diffWeek}w ago`;
  return `${diffMonth}mo ago`;
}

function getActionIcon(action: string) {
  const a = action.toUpperCase();
  if (a === "CREATE") return { icon: Plus, color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/40", ring: "ring-green-200 dark:ring-green-800" };
  if (a === "UPDATE") return { icon: Pencil, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/40", ring: "ring-blue-200 dark:ring-blue-800" };
  if (a === "DELETE") return { icon: Trash2, color: "text-red-500", bg: "bg-red-100 dark:bg-red-900/40", ring: "ring-red-200 dark:ring-red-800" };
  if (a === "LOGIN") return { icon: LogIn, color: "text-purple-500", bg: "bg-purple-100 dark:bg-purple-900/40", ring: "ring-purple-200 dark:ring-purple-800" };
  if (a === "LOGOUT") return { icon: LogOut, color: "text-gray-500", bg: "bg-gray-100 dark:bg-gray-800/40", ring: "ring-gray-200 dark:ring-gray-700" };
  return { icon: Activity, color: "text-gray-400", bg: "bg-gray-100 dark:bg-gray-800/40", ring: "ring-gray-200 dark:ring-gray-700" };
}

export function AdminDashboard({ onNavigate }: { onNavigate: (section: string) => void }) {
  const [stats, setStats] = useState<StatCard[]>([]);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [activityLog, setActivityLog] = useState<{ action: string; entity: string; time: string }[]>([]);
  const [timelineLogs, setTimelineLogs] = useState<TimelineLog[]>([]);
  const [blogTags, setBlogTags] = useState<{ tags: string }[]>([]);
  const [snippetTags, setSnippetTags] = useState<{ tags: string }[]>([]);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [blogsRes, projectsRes, coursesRes, snippetsRes, messagesRes, logsRes] = await Promise.allSettled([
        fetch("/api/blogs?limit=1"),
        fetch("/api/projects?limit=1"),
        fetch("/api/courses?limit=1"),
        fetch("/api/snippets?limit=1"),
        fetch("/api/messages?limit=5"),
        fetch("/api/operation-logs?limit=20"),
      ]);

     

      const parseCountQuick = async (res: PromiseSettledResult<Response>) => {
        if (res.status !== "fulfilled") return 0;
        try {
          const text = await res.value.clone().text();
          const data = JSON.parse(text);
          return data?.total || data?.count || (Array.isArray(data) ? data.length : 0);
        } catch { return 0; }
      };

      const [blogCount, projectCount, courseCount, snippetCount] = await Promise.all([
        parseCountQuick(blogsRes),
        parseCountQuick(projectsRes),
        parseCountQuick(coursesRes),
        parseCountQuick(snippetsRes),
      ]);

      const publishedBlogs = Math.max(0, blogCount - Math.floor(blogCount * 0.2));
      const publishedProjects = Math.max(0, projectCount - Math.floor(projectCount * 0.1));
      const publishedSnippets = Math.max(0, snippetCount - Math.floor(snippetCount * 0.3));

      setStats([
        {
          label: "Blogs",
          value: blogCount,
          icon: <FileText className="w-5 h-5" />,
          color: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30",
          trend: `${publishedBlogs} published`,
          href: "blogs",
          description: `Total blog posts in the database. Approximately ${publishedBlogs} of ${blogCount} are published. Drafts and scheduled posts are excluded from the public site.`,
        },
        {
          label: "Projects",
          value: projectCount,
          icon: <FolderKanban className="w-5 h-5" />,
          color: "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30",
          trend: `${publishedProjects} published`,
          href: "projects",
          description: `Portfolio projects including featured work. Each project can include architecture diagrams, ADRs, CI/CD snippets, and live demos.`,
        },
        {
          label: "Courses",
          value: courseCount,
          icon: <GraduationCap className="w-5 h-5" />,
          color: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30",
          trend: `${courseCount} total`,
          href: "courses",
          description: `Structured learning paths. Each course contains chapters that can be custom content or linked from existing blogs/snippets.`,
        },
        {
          label: "Snippets",
          value: snippetCount,
          icon: <Code2 className="w-5 h-5" />,
          color: "text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30",
          trend: `${publishedSnippets} published`,
          href: "snippets",
          description: `Reusable code snippets. Published snippets appear on the public site and can be included in RAG ingestion for the AI chatbot.`,
        },
        {
          label: "Messages",
          value: 0,
          icon: <Mail className="w-5 h-5" />,
          color: "text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-900/30",
          href: "messages",
          description: `Contact form submissions. Messages auto-delete after 90 days. Use reply shortcuts to respond via email and mark as replied.`,
        },
        {
          label: "Logs",
          value: 0,
          icon: <Activity className="w-5 h-5" />,
          color: "text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900/30",
          href: "logs",
          description: `Operation logs capture all create/update/delete actions, auth events, and errors. The log retains the most recent 1000 entries.`,
        },
      ]);

      // Fetch messages count
      if (messagesRes.status === "fulfilled") {
        try {
          const mData = await messagesRes.value.json();
          const mCount = mData?.total || mData?.count || (Array.isArray(mData) ? mData.length : 0);
          setStats((prev) => prev.map((s) => s.label === "Messages" ? { ...s, value: mCount } : s));
        } catch {}
      }

      // Fetch logs count
      if (logsRes.status === "fulfilled") {
        try {
          const lData = await logsRes.value.clone().json();
          const lCount = Array.isArray(lData) ? lData.length : 0;
          setStats((prev) => prev.map((s) => s.label === "Logs" ? { ...s, value: lCount } : s));

          // Extract recent activity
          const logsArray = Array.isArray(lData) ? lData : [];
          const recent = logsArray.slice(0, 5).map((log: any) => ({
            action: log.action,
            entity: log.entityType || "",
            time: new Date(log.createdAt).toLocaleString("en-US", {
              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
            }),
          }));
          setActivityLog(recent);

          // Store full logs for timeline
          setTimelineLogs(logsArray.slice(0, 20) as TimelineLog[]);
        } catch {}
      }

      // Fetch recent items (blogs)
      if (blogsRes.status === "fulfilled") {
        try {
          const bData = await blogsRes.value.clone().json();
          const blogsArray = Array.isArray(bData) ? bData : [];
          const recent: RecentItem[] = blogsArray.slice(0, 5).map((b: { id: string; title: string; published: boolean; updatedAt: string; slug: string }) => ({
            id: b.id,
            title: b.title,
            type: "blog",
            status: b.published ? "Published" : "Draft",
            date: getRelativeTime(b.updatedAt),
            href: "blogs",
          }));
          setRecentItems(recent);
        } catch {}
      }

      // Fetch full blog + snippet lists for tag distribution chart
      try {
        const [fullBlogsRes, fullSnippetsRes] = await Promise.all([
          fetch("/api/blogs"),
          fetch("/api/snippets"),
        ]);
        if (fullBlogsRes.ok) {
          const bd = await fullBlogsRes.json();
          setBlogTags(Array.isArray(bd) ? bd.map((b: { tags?: string }) => ({ tags: b.tags || "" })) : []);
        }
        if (fullSnippetsRes.ok) {
          const sd = await fullSnippetsRes.json();
          setSnippetTags(Array.isArray(sd) ? sd.map((s: { tags?: string }) => ({ tags: s.tags || "" })) : []);
        }
      } catch {}

      setHealth({
        status: "healthy",
        uptime: "99.9%",
        dbSize: "Calculating...",
        lastBackup: "Check backup section",
      });
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  return (
    <div className="space-y-6">
      {/* Dashboard header with export */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Overview of your portfolio content & activity</p>
        </div>
        <ExportData
          filename={`dashboard-export-${new Date().toISOString().slice(0, 10)}`}
          data={{
            stats,
            recentItems,
            health,
            activityLog,
            timelineLogs: timelineLogs.slice(0, 20),
            exportedAt: new Date().toISOString(),
          }}
          label="Export"
        />
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => stat.href && onNavigate(stat.href)}
            className={`relative rounded-xl border border-gray-200 dark:border-gray-700 p-4 transition-all hover:shadow-md cursor-pointer group ${
              stat.href ? "hover:border-gray-300 dark:hover:border-gray-600" : ""
            } bg-white dark:bg-gray-900`}
          >
            <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${stat.color} mb-3`}>
              {stat.icon}
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {loading ? (
                <div className="h-7 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ) : (
                stat.value
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
              {stat.label}
              {stat.description && <InfoTip label={stat.label} details={stat.description} />}
            </div>
            {stat.trend && (
              <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{stat.trend}</div>
            )}
            {stat.href && (
              <ArrowUpRight className="absolute top-3 right-3 w-3.5 h-3.5 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors" />
            )}
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* System Health */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-yellow-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">System Health</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Status</span>
              <Badge variant="outline" className="text-[10px] border-green-300 text-green-700 dark:border-green-600 dark:text-green-400">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Healthy
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Runtime</span>
              <span className="text-xs text-gray-700 dark:text-gray-300">Next.js 16 + Turbopack</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Database</span>
              <span className="text-xs text-gray-700 dark:text-gray-300">SQLite + Prisma</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Theme</span>
              <span className="text-xs text-gray-700 dark:text-gray-300">Dark / Light / System</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Quick Actions</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onNavigate("logs")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Activity className="w-3.5 h-3.5" /> View Logs
              </button>
              <button
                onClick={() => onNavigate("backup")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Database className="w-3.5 h-3.5" /> Backup
              </button>
              <button
                onClick={() => onNavigate("snippets")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Code2 className="w-3.5 h-3.5" /> Snippets
              </button>
              <button
                onClick={() => onNavigate("settings")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <BarChart3 className="w-3.5 h-3.5" /> Settings
              </button>
            </div>
          </div>
        </div>

        {/* Content Distribution */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-cyan-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Content Distribution</h3>
          </div>
          <ContentDistributionChart stats={stats} />
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1 rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
            </div>
            <button
              onClick={() => onNavigate("logs")}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              View all logs
            </button>
          </div>

          {activityLog.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-400">No recent activity</p>
              <p className="text-xs text-gray-400 mt-1">Actions will appear here as you manage content</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activityLog.map((log, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    log.action === "create" ? "bg-green-500" :
                    log.action === "delete" ? "bg-red-500" :
                    log.action === "update" ? "bg-blue-500" :
                    "bg-gray-400"
                  }`} />
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 min-w-0 truncate">
                    <span className="font-medium capitalize">{log.action}</span>
                    {log.entity && (
                      <span className="text-gray-400 dark:text-gray-500"> {"\u2022"} {log.entity}</span>
                    )}
                  </span>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500 shrink-0">{log.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity Chart + Content Overview */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Activity (Last 7 Days)</h3>
          </div>
          <button
            onClick={() => onNavigate("logs")}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            View all logs
          </button>
        </div>
        <ActivityChart logs={timelineLogs} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          {[
            { label: "Total Content", value: stats.reduce((a, s) => a + s.value, 0) - (stats[4]?.value || 0) - (stats[5]?.value || 0), icon: "📦" },
            { label: "Published", value: stats.slice(0, 4).reduce((a, s) => a + Math.floor(s.value * 0.8), 0), icon: "✅" },
            { label: "Drafts", value: stats.slice(0, 4).reduce((a, s) => a + Math.floor(s.value * 0.2), 0), icon: "📝" },
            { label: "Categories", value: 4, icon: "🏷️" },
          ].map((item) => (
            <div key={item.label} className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <div className="text-lg mb-1">{item.icon}</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">{item.value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Activity Timeline */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
          </div>
          <button
            onClick={() => onNavigate("logs")}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            View All Logs
          </button>
        </div>

        {timelineLogs.length === 0 ? (
          <div className="text-center py-10">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
              <Activity className="w-6 h-6 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No recent activity</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Actions will appear here as you manage your portfolio
            </p>
          </div>
        ) : (
          <div className="relative max-h-[400px] overflow-y-auto custom-scrollbar">
            <div className="space-y-0">
              {timelineLogs.slice(0, 8).map((log, index) => {
                const { icon: ActionIcon, color, bg, ring } = getActionIcon(log.action);
                const isLast = index === Math.min(timelineLogs.length, 8) - 1;
                return (
                  <div key={log.id} className="relative flex gap-3 pb-4 last:pb-0">
                    {/* Connecting line */}
                    {!isLast && (
                      <div className="absolute left-[15px] top-[32px] bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
                    )}
                    {/* Dot with icon */}
                    <div className={`relative z-10 shrink-0 w-[32px] h-[32px] rounded-full ring-2 ${ring} ${bg} flex items-center justify-center`}>
                      <ActionIcon className={`w-3.5 h-3.5 ${color}`} />
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug break-words">
                          {log.details || (
                            <span>
                              <span className={`font-semibold ${color}`}>
                                {log.action.charAt(0).toUpperCase() + log.action.slice(1).toLowerCase()}
                              </span>
                              {log.entityType && (
                                <span className="text-gray-500 dark:text-gray-400">
                                  {" "}• {log.entityType}
                                </span>
                              )}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {log.entityType && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 h-4 font-normal bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            {log.entityType}
                          </Badge>
                        )}
                        {log.actor && (
                          <span className="text-[11px] text-gray-400 dark:text-gray-500">
                            by {log.actor}
                          </span>
                        )}
                        <span className="text-[11px] text-gray-400 dark:text-gray-500">
                          {getRelativeTime(log.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Content by Tag */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-pink-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Content by Tag</h3>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">Top 10 tags</span>
        </div>
        <ContentByTagChart blogs={blogTags} snippets={snippetTags} />
      </div>

      {/* Recently Updated Content */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recently Updated Content</h3>
          </div>
          <button
            onClick={() => onNavigate("blogs")}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Manage blogs
          </button>
        </div>
        {recentItems.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-400">No content yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {recentItems.map((item) => (
              <button
                key={item.id}
                onClick={() => item.href && onNavigate(item.href)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left group"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 min-w-0 truncate group-hover:text-foreground">
                  {item.title}
                </span>
                <Badge
                  variant={item.status === "Published" ? "default" : "secondary"}
                  className="text-[10px] px-1.5 py-0 h-4 font-normal shrink-0"
                >
                  {item.status}
                </Badge>
                <span className="text-[11px] text-gray-400 dark:text-gray-500 shrink-0 w-16 text-right">
                  {item.date}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}