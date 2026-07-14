import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Wand2,
  BarChart3,
  User,
  Settings,
  Sparkles,
  ChevronLeft,
  LogOut,
  X,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useSidebarStore } from "../../store";
import { cn } from "../../lib/utils";
import { Avatar } from "../ui/Avatar";

const navItems = [
  { label: "Studio", path: "/studio", icon: Wand2 },
  { label: "Analytics", path: "/analytics", icon: BarChart3 },
  { label: "Profile", path: "/profile", icon: User },
  { label: "Settings", path: "/settings", icon: Settings },
];

const bottomItems = [
  { label: "Help & Support", path: "/help", icon: HelpCircle },
];

const NavItem: React.FC<{
  item: (typeof navItems)[0];
  collapsed: boolean;
}> = ({ item, collapsed }) => {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-violet-500/15 text-violet-400 border border-violet-500/20"
            : "text-white/50 hover:text-white hover:bg-white/8 border border-transparent"
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div
              layoutId="activeNav"
              className="absolute inset-0 rounded-xl bg-violet-500/10"
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
            />
          )}
          <Icon
            size={18}
            className={cn(
              "flex-shrink-0 relative",
              isActive ? "text-violet-400" : "text-white/40 group-hover:text-white/80"
            )}
          />
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="relative whitespace-nowrap overflow-hidden"
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>
          {/* Tooltip on collapse */}
          {collapsed && (
            <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-slate-800 border border-white/10 text-xs text-white rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-xl z-50">
              {item.label}
            </div>
          )}
        </>
      )}
    </NavLink>
  );
};

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isOpen, isMobileOpen, toggle, toggleMobile } = useSidebarStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={toggleMobile}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        animate={{ width: isOpen ? 240 : 72 }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        className={cn(
          "fixed lg:relative inset-y-0 left-0 z-50 flex flex-col bg-slate-950/95 border-r border-white/5 backdrop-blur-xl overflow-hidden",
          // Mobile: show/hide via transform
          isMobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0",
          "transition-transform duration-300 lg:transition-none"
        )}
        style={{ width: isOpen ? 240 : 72 }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center shadow-lg shadow-violet-500/30 flex-shrink-0">
              <Sparkles size={16} className="text-white" />
            </div>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="font-bold text-white text-sm whitespace-nowrap">
                    GesturAI
                  </p>
                  <p className="text-[10px] text-white/30 whitespace-nowrap">
                    AI Platform
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Mobile close */}
          <button
            onClick={toggleMobile}
            className="ml-auto lg:hidden text-white/40 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavItem key={item.path} item={item} collapsed={!isOpen} />
          ))}

          <div className="pt-4 mt-4 border-t border-white/5">
            {bottomItems.map((item) => (
              <NavItem key={item.path} item={item} collapsed={!isOpen} />
            ))}
          </div>
        </nav>

        {/* User section */}
        <div className="flex-shrink-0 p-3 border-t border-white/5">
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl p-2",
              isOpen && "hover:bg-white/5 transition-colors"
            )}
          >
            <Avatar
              fallback={user?.username || "U"}
              size="sm"
              online={true}
              className="flex-shrink-0"
            />
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-xs font-semibold text-white truncate">
                    {user?.username || "User"}
                  </p>
                  <p className="text-[10px] text-white/40 truncate">
                    {user?.email}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={handleLogout}
                  className="text-white/30 hover:text-red-400 transition-colors flex-shrink-0 p-1"
                  title="Sign out"
                >
                  <LogOut size={15} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Toggle button */}
        <button
          onClick={toggle}
          className="hidden lg:flex absolute -right-3 top-20 h-6 w-6 items-center justify-center rounded-full bg-slate-800 border border-white/10 text-white/50 hover:text-white shadow-lg transition-all hover:scale-110"
        >
          <motion.div animate={{ rotate: isOpen ? 0 : 180 }}>
            <ChevronLeft size={12} />
          </motion.div>
        </button>
      </motion.aside>
    </>
  );
};
