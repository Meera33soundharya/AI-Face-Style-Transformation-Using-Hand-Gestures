import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Sun,
  Moon,
  Menu,
  LogOut,
  User,
  Settings,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useThemeStore, useSidebarStore, useNotificationStore } from "../../store";
import { Avatar } from "../ui/Avatar";
import { SearchBar } from "../ui/SearchBar";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useThemeStore();
  const { toggleMobile } = useSidebarStore();
  const { notifications, unreadCount, markAllRead, markRead } = useNotificationStore();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
    setShowUserMenu(false);
  };

  const notifTypeColors: Record<string, string> = {
    success: "bg-emerald-500",
    info: "bg-blue-500",
    warning: "bg-amber-500",
    error: "bg-red-500",
  };

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl flex items-center px-4 gap-4">
      {/* Mobile Menu Toggle */}
      <button
        onClick={toggleMobile}
        className="lg:hidden text-white/60 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
      >
        <Menu size={20} />
      </button>

      {/* Logo (mobile) */}
      <Link
        to="/studio"
        className="lg:hidden flex items-center gap-2 flex-shrink-0"
      >
        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
          <Sparkles size={14} className="text-white" />
        </div>
        <span className="font-bold text-sm text-white">GesturAI</span>
      </Link>

      {/* Search */}
      <div className="flex-1 max-w-sm hidden sm:block">
        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search anything..."
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-1.5">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title="Toggle theme"
          className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/8 transition-all"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifs(!showNotifs);
              setShowUserMenu(false);
            }}
            className="relative p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/8 transition-all"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 bg-violet-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden"
              >
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                  <h3 className="font-semibold text-white text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className="w-full flex items-start gap-3 p-3.5 hover:bg-white/5 transition-colors text-left"
                    >
                      <div
                        className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
                          n.read ? "bg-white/20" : notifTypeColors[n.type]
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs font-medium ${
                            n.read ? "text-white/50" : "text-white"
                          }`}
                        >
                          {n.title}
                        </p>
                        <p className="text-[11px] text-white/40 mt-0.5 truncate">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-white/30 mt-1">{n.time}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="p-3 border-t border-white/5">
                  <button className="w-full text-xs text-violet-400 hover:text-violet-300 transition-colors py-1">
                    View all notifications
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifs(false);
            }}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl hover:bg-white/8 transition-all"
          >
            <Avatar
              fallback={user?.username || "U"}
              size="sm"
              online={true}
            />
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-white leading-none">
                {user?.username || "User"}
              </p>
              <p className="text-[10px] text-white/40 mt-0.5">
                {user?.email || "user@example.com"}
              </p>
            </div>
            <ChevronDown
              size={14}
              className={`text-white/40 hidden md:block transition-transform ${
                showUserMenu ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* User Dropdown */}
          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-56 bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden"
              >
                <div className="p-3 border-b border-white/5">
                  <p className="text-sm font-semibold text-white">
                    {user?.username}
                  </p>
                  <p className="text-xs text-white/40">{user?.email}</p>
                </div>
                <div className="p-1.5">
                  <Link
                    to="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/8 rounded-xl transition-all"
                  >
                    <User size={15} /> Profile
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/8 rounded-xl transition-all"
                  >
                    <Settings size={15} /> Settings
                  </Link>
                </div>
                <div className="p-1.5 border-t border-white/5">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all"
                  >
                    <LogOut size={15} /> Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Click outside handler */}
      {(showNotifs || showUserMenu) && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => {
            setShowNotifs(false);
            setShowUserMenu(false);
          }}
        />
      )}
    </header>
  );
};
