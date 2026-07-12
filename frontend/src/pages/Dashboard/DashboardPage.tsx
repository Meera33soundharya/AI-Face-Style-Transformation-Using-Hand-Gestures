import React from "react";
import { motion } from "framer-motion";
import { Activity, ArrowRight, Clock, Zap } from "lucide-react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { StatsCards } from "../../components/dashboard/StatsCards";
import { AnalyticsChart, StyleDistributionChart, WeeklyBarChart } from "../../components/dashboard/Charts";
import { TransformationsTable } from "../../components/dashboard/TransformationsTable";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Avatar } from "../../components/ui/Avatar";

import { Progress } from "../../components/ui/Progress";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ANIMATION_VARIANTS } from "../../lib/utils";

const recentActivity = [
  { user: "Alex J.", action: "Applied Anime style", time: "2m ago", avatar: "AJ" },
  { user: "Maria G.", action: "Applied Cyberpunk style", time: "8m ago", avatar: "MG" },
  { user: "James W.", action: "Started Gesture Studio", time: "15m ago", avatar: "JW" },
  { user: "Sarah L.", action: "Exported transformation", time: "31m ago", avatar: "SL" },
];

const systemStatus = [
  { label: "AI Model", value: 94, color: "violet" as const },
  { label: "GPU Usage", value: 67, color: "emerald" as const },
  { label: "API Latency", value: 23, color: "blue" as const },
  { label: "Storage", value: 48, color: "amber" as const },
];

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <motion.div
          variants={ANIMATION_VARIANTS.slideUp}
          initial="initial"
          animate="animate"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-white">
              {greeting},{" "}
              <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                {user?.username}
              </span>{" "}
              👋
            </h1>
            <p className="text-sm text-white/50 mt-1">
              Here's what's happening on your platform today
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm">
              <Clock size={14} /> Last 30 days
            </Button>
            <Link to="/studio">
              <Button variant="gradient" size="sm">
                <Zap size={14} /> Launch Studio
                <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <StatsCards />

        {/* Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <AnalyticsChart />
          <StyleDistributionChart />
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Transformations Table */}
          <div className="lg:col-span-2">
            <TransformationsTable />
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-violet-400" />
                  <CardTitle>Recent Activity</CardTitle>
                </div>
                <CardDescription>Live user actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-start gap-2.5"
                    >
                      <Avatar fallback={item.avatar} size="xs" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white">
                          {item.user}
                        </p>
                        <p className="text-[11px] text-white/40 truncate">
                          {item.action}
                        </p>
                      </div>
                      <span className="text-[10px] text-white/30 flex-shrink-0">
                        {item.time}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Real-time metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {systemStatus.map((s) => (
                    <div key={s.label}>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-xs text-white/60">{s.label}</span>
                        <span className="text-xs font-semibold text-white">
                          {s.value}%
                        </span>
                      </div>
                      <Progress value={s.value} size="xs" color={s.color} />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-white/50">
                    All systems operational
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Weekly chart */}
            <WeeklyBarChart />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
