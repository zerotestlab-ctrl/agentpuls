/**
 * AgentPulse — 404 Not Found
 * Premium dark styling matching the rest of the app.
 */
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404: No route for", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="text-center space-y-6 max-w-md"
      >
        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto shadow-neon-sm">
          <Zap size={32} className="text-primary" />
        </div>

        {/* Copy */}
        <div className="space-y-2">
          <p className="text-6xl font-black text-foreground tracking-tighter">404</p>
          <p className="text-lg font-semibold text-foreground">Agent not found</p>
          <p className="text-sm text-foreground-muted max-w-xs mx-auto leading-relaxed">
            This route doesn't exist. Try searching for an agent address or browsing the Bubble Map.
          </p>
        </div>

        {/* Mono path display */}
        <div className="inline-flex items-center gap-2 px-3 py-2 bg-background-elevated border border-border rounded-xl text-xs font-mono text-foreground-subtle">
          <span className="text-destructive">✗</span>
          {location.pathname}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="border-border text-foreground-muted hover:border-primary/40 gap-2 rounded-xl"
          >
            <ArrowLeft size={13} /> Go Back
          </Button>
          <Button
            onClick={() => navigate("/")}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 rounded-xl shadow-neon-sm font-semibold"
          >
            <Search size={13} /> Explore Bubble Map
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
