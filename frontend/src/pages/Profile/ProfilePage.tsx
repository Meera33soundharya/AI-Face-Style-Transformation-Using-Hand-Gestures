import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Camera,
  MapPin,
  Link2,
  Edit3,
  Award,
  Activity,
} from "lucide-react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Progress } from "../../components/ui/Progress";
import { Modal } from "../../components/ui/Modal";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../components/ui/Toast";
import { ANIMATION_VARIANTS } from "../../lib/utils";

const achievements = [
  { label: "First Transform", icon: "🎨", earned: true },
  { label: "10 Transforms", icon: "⚡", earned: true },
  { label: "100 Transforms", icon: "🏆", earned: true },
  { label: "Style Master", icon: "👑", earned: false },
  { label: "Gesture Pro", icon: "🖐️", earned: false },
  { label: "Power User", icon: "🚀", earned: false },
];

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { success } = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.username || "User",
    email: user?.email || "",
    location: "San Francisco, CA",
    website: "https://example.com",
    bio: "AI enthusiast and creative developer. Building the future of face transformation with gesture technology.",
  });
  const [editForm, setEditForm] = useState(form);

  const handleSave = () => {
    setForm(editForm);
    setEditing(false);
    success("Profile updated", "Your changes have been saved.");
  };

  const stats = [
    { label: "Transformations", value: "284" },
    { label: "Sessions", value: "142" },
    { label: "Styles Used", value: "8" },
    { label: "Avg Speed", value: "2.1s" },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <motion.h1
          variants={ANIMATION_VARIANTS.slideUp}
          initial="initial"
          animate="animate"
          className="text-xl font-bold text-white"
        >
          My Profile
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <motion.div
            variants={ANIMATION_VARIANTS.slideUp}
            initial="initial"
            animate="animate"
          >
            <Card className="flex flex-col items-center text-center">
              {/* Avatar */}
              <div className="relative mb-4">
                <Avatar
                  fallback={form.name}
                  size="xl"
                  online={true}
                />
                <button className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-violet-600 flex items-center justify-center shadow-lg hover:bg-violet-700 transition-colors">
                  <Camera size={13} className="text-white" />
                </button>
              </div>

              <h2 className="text-lg font-bold text-white">{form.name}</h2>
              <p className="text-sm text-white/50">{form.email}</p>

              <div className="flex items-center gap-1.5 mt-2">
                <Badge variant="purple" dot>Pro Member</Badge>
              </div>

              <div className="w-full mt-5 pt-4 border-t border-white/5 space-y-2 text-left">
                {form.location && (
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <MapPin size={13} /> {form.location}
                  </div>
                )}
                {form.website && (
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <Link2 size={13} />
                    <a
                      href={form.website}
                      className="hover:text-violet-400 transition-colors truncate"
                    >
                      {form.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
                {form.bio && (
                  <p className="text-xs text-white/40 mt-2 leading-relaxed">
                    {form.bio}
                  </p>
                )}
              </div>

              <Button
                variant="gradient"
                size="sm"
                className="w-full mt-4"
                onClick={() => {
                  setEditForm(form);
                  setEditing(true);
                }}
              >
                <Edit3 size={14} /> Edit Profile
              </Button>
            </Card>
          </motion.div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Stats */}
            <motion.div
              variants={ANIMATION_VARIANTS.slideUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              {stats.map((s) => (
                <Card key={s.label} hover className="text-center py-3 px-2">
                  <p className="text-xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-white/40 mt-0.5">{s.label}</p>
                </Card>
              ))}
            </motion.div>

            {/* Activity */}
            <motion.div
              variants={ANIMATION_VARIANTS.slideUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.15 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-violet-400" />
                    <CardTitle>Usage Progress</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { label: "Anime Style", used: 84, max: 100, color: "violet" as const },
                      { label: "Cyberpunk Style", used: 56, max: 100, color: "blue" as const },
                      { label: "Fantasy Style", used: 37, max: 100, color: "pink" as const },
                      { label: "Vintage Style", used: 23, max: 100, color: "amber" as const },
                    ].map((s) => (
                      <div key={s.label}>
                        <div className="flex justify-between mb-1.5">
                          <span className="text-xs text-white/60">{s.label}</span>
                          <span className="text-xs font-semibold text-white">
                            {s.used} uses
                          </span>
                        </div>
                        <Progress
                          value={s.used}
                          max={100}
                          size="sm"
                          color={s.color}
                          showLabel
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Achievements */}
            <motion.div
              variants={ANIMATION_VARIANTS.slideUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Award size={16} className="text-violet-400" />
                    <CardTitle>Achievements</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {achievements.map((a) => (
                      <div
                        key={a.label}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                          a.earned
                            ? "border-violet-500/30 bg-violet-500/10"
                            : "border-white/5 bg-white/2 opacity-40 grayscale"
                        }`}
                      >
                        <span className="text-xl">{a.icon}</span>
                        <span className="text-[10px] text-white/60 text-center leading-tight">
                          {a.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={editing}
        onClose={() => setEditing(false)}
        title="Edit Profile"
        description="Update your profile information"
        size="md"
      >
        <div className="space-y-4 mt-2">
          <Input
            label="Display Name"
            value={editForm.name}
            onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            label="Email"
            type="email"
            value={editForm.email}
            onChange={(e) =>
              setEditForm((f) => ({ ...f, email: e.target.value }))
            }
          />
          <Input
            label="Location"
            value={editForm.location}
            onChange={(e) =>
              setEditForm((f) => ({ ...f, location: e.target.value }))
            }
          />
          <Input
            label="Website"
            value={editForm.website}
            onChange={(e) =>
              setEditForm((f) => ({ ...f, website: e.target.value }))
            }
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white/70">Bio</label>
            <textarea
              rows={3}
              value={editForm.bio}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, bio: e.target.value }))
              }
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
            />
          </div>
          <div className="flex gap-2 pt-2 justify-end">
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};
