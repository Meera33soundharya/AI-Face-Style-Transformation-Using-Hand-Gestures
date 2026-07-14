import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Home, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "../../components/ui/Button";

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "1s" }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 text-center max-w-lg"
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center shadow-2xl shadow-violet-500/30">
            <Sparkles size={36} className="text-white" />
          </div>
        </div>

        {/* 404 number */}
        <motion.h1
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-8xl font-black text-white/10 select-none mb-2"
          style={{
            background:
              "linear-gradient(135deg, rgba(139,92,246,0.5) 0%, rgba(236,72,153,0.3) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          404
        </motion.h1>

        <h2 className="text-2xl font-bold text-white mb-3">
          Page Not Found
        </h2>
        <p className="text-white/50 text-sm leading-relaxed mb-8">
          The page you're looking for doesn't exist or has been moved. Let's
          get you back on track.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Button
            variant="gradient"
            onClick={() => window.history.back()}
          >
            <ArrowLeft size={16} /> Go Back
          </Button>
          <Link to="/studio">
            <Button variant="secondary">
              <Home size={16} /> Studio
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
