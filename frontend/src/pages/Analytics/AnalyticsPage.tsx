import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Users,
  Sparkles,
  Calendar,
} from "lucide-react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import {
  AnalyticsChart,
  StyleDistributionChart,
  WeeklyBarChart,
} from "../../components/dashboard/Charts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/Card";

import { ANIMATION_VARIANTS, STAGGER_CONTAINER } from "../../lib/utils";

const periodButtons = ["7D", "30D", "3M", "1Y", "All"];

const kpiData = [
  { label: "Total Revenue", value: "$48,295", change: "+22.4%", up: true, icon: TrendingUp },
  { label: "New Users", value: "1,284", change: "+15.7%", up: true, icon: Users },
  { label: "Transformations", value: "18,420", change: "+31.2%", up: true, icon: Sparkles },
  { label: "Avg. Session", value: "4m 32s", change: "-8.1%", up: false, icon: Calendar },
];

export const AnalyticsPage: React.FC = () => {
  const [period, setPeriod] = useState("30D");

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <motion.div
          variants={ANIMATION_VARIANTS.slideUp}
          initial="initial"
          animate="animate"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
              <BarChart3 size={20} className="text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Analytics</h1>
              <p className="text-sm text-white/50">
                Platform insights and performance metrics
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/5">
            {periodButtons.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  period === p
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </motion.div>

        {/* KPI Cards */}
        <motion.div
          variants={STAGGER_CONTAINER}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
        >
          {kpiData.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <motion.div
                key={kpi.label}
                variants={ANIMATION_VARIANTS.slideUp}
                whileHover={{ y: -3 }}
                className="rounded-2xl border border-white/8 p-5 bg-white/4 backdrop-blur-md"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="h-9 w-9 rounded-xl bg-violet-500/15 flex items-center justify-center">
                    <Icon size={18} className="text-violet-400" />
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      kpi.up
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-red-500/15 text-red-400"
                    }`}
                  >
                    {kpi.change}
                  </span>
                </div>
                <p className="text-2xl font-bold text-white">{kpi.value}</p>
                <p className="text-xs text-white/40 mt-1">{kpi.label}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Main chart */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <AnalyticsChart />
          <StyleDistributionChart />
        </div>

        {/* Bottom charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <WeeklyBarChart />
          <Card>
            <CardHeader>
              <CardTitle>Top Styles by Region</CardTitle>
              <CardDescription>Geographic distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { region: "North America", pct: 42, color: "violet" },
                  { region: "Europe", pct: 28, color: "blue" },
                  { region: "Asia Pacific", pct: 19, color: "cyan" },
                  { region: "Latin America", pct: 7, color: "emerald" },
                  { region: "Other", pct: 4, color: "amber" },
                ].map((r) => (
                  <div key={r.region} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/60">{r.region}</span>
                      <span className="font-semibold text-white">{r.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${r.pct}%` }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};
