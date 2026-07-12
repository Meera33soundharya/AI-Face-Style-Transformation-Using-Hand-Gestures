import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "../../components/ui/Button";

interface ErrorPageProps {
  error?: Error;
  reset?: () => void;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({ error, reset }) => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-red-600/15 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 text-center max-w-md"
      >
        <div className="flex justify-center mb-6">
          <div className="h-20 w-20 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
            <AlertTriangle size={36} className="text-red-400" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">
          Something Went Wrong
        </h1>
        <p className="text-white/50 text-sm mb-4 leading-relaxed">
          An unexpected error occurred. Our team has been notified. Please try
          again or return to the dashboard.
        </p>
        {error?.message && (
          <div className="text-xs text-red-400/70 bg-red-500/5 border border-red-500/10 rounded-xl p-3 mb-6 font-mono text-left">
            {error.message}
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          {reset && (
            <Button variant="gradient" onClick={reset}>
              <RefreshCw size={16} /> Try Again
            </Button>
          )}
          <Link to="/dashboard">
            <Button variant="secondary">
              <Home size={16} /> Go Home
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
