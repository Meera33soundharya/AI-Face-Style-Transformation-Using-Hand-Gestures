import { create } from "zustand";

export type Theme = "dark" | "light";

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: (localStorage.getItem("theme") as Theme) || "dark",
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === "dark" ? "light" : "dark";
      localStorage.setItem("theme", next);
      document.documentElement.classList.toggle("dark", next === "dark");
      document.documentElement.classList.toggle("light", next === "light");
      return { theme: next };
    }),
  setTheme: (theme) => {
    localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.classList.toggle("light", theme === "light");
    set({ theme });
  },
}));

interface SidebarState {
  isOpen: boolean;
  isMobileOpen: boolean;
  toggle: () => void;
  toggleMobile: () => void;
  setOpen: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isOpen: true,
  isMobileOpen: false,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  toggleMobile: () =>
    set((state) => ({ isMobileOpen: !state.isMobileOpen })),
  setOpen: (open) => set({ isOpen: open }),
}));

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "info" | "success" | "warning" | "error";
}

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
  addNotification: (n: Omit<NotificationItem, "id">) => void;
}

const mockNotifications: NotificationItem[] = [
  {
    id: "1",
    title: "New gesture detected",
    message: "Hand gesture transformation completed successfully",
    time: "2 min ago",
    read: false,
    type: "success",
  },
  {
    id: "2",
    title: "Model update available",
    message: "AI model v2.1 is ready to install",
    time: "1 hr ago",
    read: false,
    type: "info",
  },
  {
    id: "3",
    title: "Session expiring",
    message: "Your session will expire in 30 minutes",
    time: "3 hr ago",
    read: true,
    type: "warning",
  },
  {
    id: "4",
    title: "Export complete",
    message: "Your transformation video has been exported",
    time: "5 hr ago",
    read: true,
    type: "success",
  },
];

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: mockNotifications,
  unreadCount: mockNotifications.filter((n) => !n.read).length,
  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: state.notifications.filter((n) => !n.read && n.id !== id)
        .length,
    })),
  addNotification: (n) =>
    set((state) => {
      const newN = { ...n, id: Date.now().toString() };
      return {
        notifications: [newN, ...state.notifications],
        unreadCount: state.unreadCount + (n.read ? 0 : 1),
      };
    }),
}));
