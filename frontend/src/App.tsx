import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { ToastProvider } from "./components/ui/Toast";

// Auth pages
import { Login } from "./pages/Auth/Login";
import { Register } from "./pages/Auth/Register";

// Error pages
import { NotFoundPage } from "./pages/Errors/NotFoundPage";

// Studio
import { GestureStudio } from "./pages/Studio/GestureStudio";

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Public */}
        <Route path="/" element={<Navigate to="/studio" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected */}
        <Route
          path="/studio"
          element={
            <ProtectedRoute>
              <GestureStudio />
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirects to studio if authenticated, else login is handled by ProtectedRoute if applied, but for 404 we can just show NotFoundPage */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

import React from "react";
export default App;
