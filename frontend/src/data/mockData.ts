// Mock data for analytics charts and tables
export const analyticsData = [
  { month: "Jan", transformations: 420, users: 89, sessions: 320 },
  { month: "Feb", transformations: 580, users: 124, sessions: 450 },
  { month: "Mar", transformations: 720, users: 158, sessions: 610 },
  { month: "Apr", transformations: 640, users: 142, sessions: 530 },
  { month: "May", transformations: 890, users: 198, sessions: 740 },
  { month: "Jun", transformations: 1120, users: 234, sessions: 920 },
  { month: "Jul", transformations: 980, users: 215, sessions: 810 },
  { month: "Aug", transformations: 1340, users: 289, sessions: 1100 },
  { month: "Sep", transformations: 1560, users: 312, sessions: 1280 },
  { month: "Oct", transformations: 1420, users: 298, sessions: 1190 },
  { month: "Nov", transformations: 1780, users: 367, sessions: 1490 },
  { month: "Dec", transformations: 2100, users: 420, sessions: 1760 },
];

export const styleDistribution = [
  { name: "Anime", value: 35, color: "#8b5cf6" },
  { name: "Cyberpunk", value: 22, color: "#06b6d4" },
  { name: "Vintage", value: 18, color: "#f59e0b" },
  { name: "Fantasy", value: 15, color: "#ec4899" },
  { name: "Other", value: 10, color: "#6b7280" },
];

export const weeklyActivity = [
  { day: "Mon", value: 65 },
  { day: "Tue", value: 82 },
  { day: "Wed", value: 54 },
  { day: "Thu", value: 91 },
  { day: "Fri", value: 76 },
  { day: "Sat", value: 48 },
  { day: "Sun", value: 38 },
];

export const recentTransformations = [
  {
    id: "tx-001",
    user: "Alex Johnson",
    email: "alex@example.com",
    style: "Anime",
    status: "completed",
    date: "2024-12-28",
    duration: "2.3s",
    avatar: "AJ",
  },
  {
    id: "tx-002",
    user: "Maria Garcia",
    email: "maria@example.com",
    style: "Cyberpunk",
    status: "completed",
    date: "2024-12-28",
    duration: "1.8s",
    avatar: "MG",
  },
  {
    id: "tx-003",
    user: "James Wilson",
    email: "james@example.com",
    style: "Fantasy",
    status: "processing",
    date: "2024-12-27",
    duration: "3.1s",
    avatar: "JW",
  },
  {
    id: "tx-004",
    user: "Sarah Lee",
    email: "sarah@example.com",
    style: "Vintage",
    status: "failed",
    date: "2024-12-27",
    duration: "-",
    avatar: "SL",
  },
  {
    id: "tx-005",
    user: "David Kim",
    email: "david@example.com",
    style: "Anime",
    status: "completed",
    date: "2024-12-26",
    duration: "2.1s",
    avatar: "DK",
  },
  {
    id: "tx-006",
    user: "Emily Chen",
    email: "emily@example.com",
    style: "Cyberpunk",
    status: "completed",
    date: "2024-12-26",
    duration: "1.9s",
    avatar: "EC",
  },
  {
    id: "tx-007",
    user: "Ryan Taylor",
    email: "ryan@example.com",
    style: "Vintage",
    status: "completed",
    date: "2024-12-25",
    duration: "2.5s",
    avatar: "RT",
  },
];

export const navItems = [
  { label: "Studio", path: "/studio", icon: "Wand2" },
  { label: "Analytics", path: "/analytics", icon: "BarChart3" },
  { label: "Profile", path: "/profile", icon: "User" },
  { label: "Settings", path: "/settings", icon: "Settings" },
];

export const statsCards = [
  {
    title: "Total Transformations",
    value: "12,482",
    change: "+18.2%",
    trend: "up",
    icon: "Sparkles",
    color: "purple",
  },
  {
    title: "Active Users",
    value: "3,291",
    change: "+7.4%",
    trend: "up",
    icon: "Users",
    color: "blue",
  },
  {
    title: "Avg. Process Time",
    value: "2.1s",
    change: "-12.5%",
    trend: "down",
    icon: "Zap",
    color: "cyan",
  },
  {
    title: "Success Rate",
    value: "98.7%",
    change: "+0.3%",
    trend: "up",
    icon: "TrendingUp",
    color: "emerald",
  },
];
