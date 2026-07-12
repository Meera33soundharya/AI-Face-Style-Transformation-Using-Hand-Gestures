import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, Globe, MessageCircle, Heart } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/5 bg-slate-950/50 px-6 py-4 mt-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-white/40">
          <div className="h-5 w-5 rounded-md bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center">
            <Sparkles size={10} className="text-white" />
          </div>
          <span>GesturAI Platform</span>
          <span className="text-white/20">•</span>
          <span>v2.0</span>
        </div>

        <div className="flex items-center gap-4 text-xs text-white/30">
          <Link
            to="/privacy"
            className="hover:text-white/60 transition-colors"
          >
            Privacy
          </Link>
          <Link to="/terms" className="hover:text-white/60 transition-colors">
            Terms
          </Link>
          <span className="flex items-center gap-1">
            Made with{" "}
            <Heart size={11} className="text-pink-500 fill-pink-500" /> by the
            team
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-all"
          >
            <Globe size={15} />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-all"
          >
            <MessageCircle size={15} />
          </a>
        </div>
      </div>
    </footer>
  );
};
