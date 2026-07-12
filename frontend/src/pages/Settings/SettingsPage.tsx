import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  Check,
} from "lucide-react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useThemeStore } from "../../store";
import { useToast } from "../../components/ui/Toast";
import { cn, ANIMATION_VARIANTS } from "../../lib/utils";

type SettingsTab =
  | "account"
  | "notifications"
  | "appearance"
  | "security"
  | "language";

const tabs = [
  { id: "account" as SettingsTab, label: "Account", icon: User },
  { id: "notifications" as SettingsTab, label: "Notifications", icon: Bell },
  { id: "appearance" as SettingsTab, label: "Appearance", icon: Palette },
  { id: "security" as SettingsTab, label: "Security", icon: Shield },
  { id: "language" as SettingsTab, label: "Language", icon: Globe },
];

const Toggle: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}> = ({ checked, onChange, label }) => (
  <div className="flex items-center justify-between gap-3">
    {label && <span className="text-sm text-white/70">{label}</span>}
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none",
        checked ? "bg-violet-600" : "bg-white/10"
      )}
    >
      <div
        className={cn(
          "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  </div>
);

export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useThemeStore();
  const { success } = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [notifs, setNotifs] = useState({
    email: true,
    push: true,
    updates: false,
    security: true,
  });

  const themeOptions = [
    { value: "dark", label: "Dark", icon: Moon },
    { value: "light", label: "Light", icon: Sun },
    { value: "system", label: "System", icon: Monitor },
  ];

  const accentColors = [
    { value: "violet", class: "bg-violet-500" },
    { value: "blue", class: "bg-blue-500" },
    { value: "emerald", class: "bg-emerald-500" },
    { value: "rose", class: "bg-rose-500" },
    { value: "amber", class: "bg-amber-500" },
    { value: "cyan", class: "bg-cyan-500" },
  ];

  const [accent, setAccent] = useState("violet");

  const handleSave = () => {
    success("Settings saved", "Your preferences have been updated.");
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          variants={ANIMATION_VARIANTS.slideUp}
          initial="initial"
          animate="animate"
          className="flex items-center gap-3"
        >
          <div className="h-10 w-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
            <Settings size={20} className="text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Settings</h1>
            <p className="text-sm text-white/50">Manage your account preferences</p>
          </div>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Tabs */}
          <motion.nav
            variants={ANIMATION_VARIANTS.slideUp}
            initial="initial"
            animate="animate"
            className="md:w-48 flex md:flex-col gap-1"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left",
                    activeTab === tab.id
                      ? "bg-violet-500/15 text-violet-400 border border-violet-500/20"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <ChevronRight size={14} className="ml-auto" />
                  )}
                </button>
              );
            })}
          </motion.nav>

          {/* Content */}
          <motion.div
            key={activeTab}
            variants={ANIMATION_VARIANTS.slideRight}
            initial="initial"
            animate="animate"
            className="flex-1 space-y-4"
          >
            {/* Account Tab */}
            {activeTab === "account" && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>Update your personal details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="First Name" placeholder="John" defaultValue="John" />
                      <Input label="Last Name" placeholder="Doe" defaultValue="Doe" />
                    </div>
                    <Input
                      label="Username"
                      placeholder="johndoe"
                      defaultValue="johndoe"
                    />
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="john@example.com"
                      defaultValue="john@example.com"
                    />
                    <Input
                      label="Phone Number"
                      placeholder="+1 (555) 000-0000"
                    />
                    <div className="flex justify-end pt-2">
                      <Button variant="gradient" onClick={handleSave}>
                        Save Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-400">Danger Zone</CardTitle>
                    <CardDescription>Irreversible account actions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 border border-red-500/20 rounded-xl bg-red-500/5">
                      <div>
                        <p className="text-sm font-medium text-white">
                          Delete Account
                        </p>
                        <p className="text-xs text-white/40 mt-0.5">
                          Permanently delete your account and all data
                        </p>
                      </div>
                      <Button variant="destructive" size="sm">
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Choose what you want to be notified about
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      key: "email" as keyof typeof notifs,
                      label: "Email Notifications",
                      desc: "Receive email updates about your transformations",
                    },
                    {
                      key: "push" as keyof typeof notifs,
                      label: "Push Notifications",
                      desc: "Browser push notifications for real-time updates",
                    },
                    {
                      key: "updates" as keyof typeof notifs,
                      label: "Product Updates",
                      desc: "News about new features and improvements",
                    },
                    {
                      key: "security" as keyof typeof notifs,
                      label: "Security Alerts",
                      desc: "Important alerts about your account security",
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/3 border border-white/5"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">
                          {item.label}
                        </p>
                        <p className="text-xs text-white/40 mt-0.5">{item.desc}</p>
                      </div>
                      <Toggle
                        checked={notifs[item.key]}
                        onChange={(v) =>
                          setNotifs((n) => ({ ...n, [item.key]: v }))
                        }
                      />
                    </div>
                  ))}
                  <div className="flex justify-end">
                    <Button variant="gradient" onClick={handleSave}>
                      Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Appearance Tab */}
            {activeTab === "appearance" && (
              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>Customize how the app looks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Theme */}
                  <div>
                    <p className="text-sm font-medium text-white/70 mb-3">
                      Color Theme
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {themeOptions.map((opt) => {
                        const Icon = opt.icon;
                        const selected = theme === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => setTheme(opt.value as any)}
                            className={cn(
                              "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                              selected
                                ? "border-violet-500 bg-violet-500/15 text-violet-400"
                                : "border-white/10 bg-white/3 text-white/50 hover:border-white/20 hover:bg-white/5"
                            )}
                          >
                            <Icon size={20} />
                            <span className="text-xs font-medium">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div>
                    <p className="text-sm font-medium text-white/70 mb-3">
                      Accent Color
                    </p>
                    <div className="flex gap-3">
                      {accentColors.map((c) => (
                        <button
                          key={c.value}
                          onClick={() => setAccent(c.value)}
                          className={cn(
                            "h-8 w-8 rounded-full transition-all hover:scale-110",
                            c.class,
                            accent === c.value &&
                              "ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110"
                          )}
                        >
                          {accent === c.value && (
                            <Check size={14} className="text-white mx-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button variant="gradient" onClick={handleSave}>
                      Save Appearance
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Protect your account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    label="Current Password"
                    type="password"
                    placeholder="••••••••"
                  />
                  <Input
                    label="New Password"
                    type="password"
                    placeholder="••••••••"
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    placeholder="••••••••"
                  />

                  <div className="p-4 border border-white/5 rounded-xl bg-white/3 mt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">
                          Two-Factor Authentication
                        </p>
                        <p className="text-xs text-white/40 mt-0.5">
                          Add an extra layer of security
                        </p>
                      </div>
                      <Toggle checked={false} onChange={() => {}} />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button variant="gradient" onClick={handleSave}>
                      Update Password
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Language Tab */}
            {activeTab === "language" && (
              <Card>
                <CardHeader>
                  <CardTitle>Language & Region</CardTitle>
                  <CardDescription>Set your locale preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-white/70">
                      Language
                    </label>
                    <select className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50">
                      <option value="en">English (US)</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="ja">Japanese</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-white/70">
                      Timezone
                    </label>
                    <select className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50">
                      <option>UTC-8 (Pacific Time)</option>
                      <option>UTC-5 (Eastern Time)</option>
                      <option>UTC+0 (GMT)</option>
                      <option>UTC+1 (Central European)</option>
                      <option>UTC+5:30 (India Standard)</option>
                    </select>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button variant="gradient" onClick={handleSave}>
                      Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};
