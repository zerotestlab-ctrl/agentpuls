/**
 * Agentpuls — Premium Layout (Birdeye-quality)
 * - Non-dismissible API key banner until key is added
 * - Refresh button disabled + tooltip when no key
 * - Sticky header: logo + search + settings + refresh
 * - Full-height sidebar layout, footer only
 */
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { SettingsModal } from "./SettingsModal";
import { EmbedModal } from "./EmbedModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApp } from "@/contexts/AppContext";
import { KNOWN_AGENTS, shortAddress } from "@/lib/agents";
import {
  Settings, RefreshCw, AlertTriangle, Search,
  X, Activity, Github, Twitter, KeyRound, ChevronRight
} from "lucide-react";

interface LayoutProps { children: React.ReactNode; }

const ETH_ADDR = /^0x[0-9a-fA-F]{40}$/;

export function Layout({ children }: LayoutProps) {
  const { isLoading, refresh, error, hasUserKey, loadProgress, lastRefreshed } = useApp();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement>(null);

  const searchResults = searchQuery.trim().length > 1
    ? KNOWN_AGENTS.filter(a =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.address.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 6)
    : [];

  const handleSearchSubmit = (address?: string) => {
    const addr = address ?? searchQuery.trim();
    if (ETH_ADDR.test(addr)) {
      navigate(`/agent/${addr}`);
      setSearchQuery("");
      searchRef.current?.blur();
    } else if (addr) {
      const found = KNOWN_AGENTS.find(a => a.name.toLowerCase().includes(addr.toLowerCase()));
      if (found) {
        navigate(`/agent/${found.address}`);
        setSearchQuery("");
        searchRef.current?.blur();
      }
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    // Handle open-settings custom event dispatched from pages (BubbleMap, Overview etc.)
    const onOpenSettings = () => setSettingsOpen(true);
    window.addEventListener("keydown", onKey);
    document.addEventListener("open-settings", onOpenSettings);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("open-settings", onOpenSettings);
    };
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* ─── Non-dismissible API key banner ─── */}
          {!hasUserKey && (
            <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 bg-gradient-to-r from-primary/10 via-primary/6 to-transparent border-b border-primary/20 flex-shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                  <KeyRound size={11} className="text-primary" />
                </div>
                <p className="text-xs text-foreground-muted leading-tight min-w-0">
                  <span className="text-primary font-semibold">Demo mode active.</span>
                  <span className="hidden sm:inline"> Add your free GoldRush API key in Settings to unlock live data & refresh.</span>
                </p>
              </div>
              <button
                onClick={() => setSettingsOpen(true)}
                className="flex items-center gap-1 text-primary text-xs font-semibold hover:text-primary/80 transition-colors flex-shrink-0 ml-3 group"
              >
                Add Key <ChevronRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}

          {/* ─── Top header ─── */}
          <header className="h-14 flex items-center justify-between px-3 sm:px-4 gap-3 border-b border-border bg-background/90 backdrop-blur-xl flex-shrink-0 sticky top-0 z-40">
            {/* Left: hamburger + logo */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <SidebarTrigger className="text-foreground-muted hover:text-foreground h-8 w-8" />
              <div className="flex items-center gap-2 select-none cursor-pointer" onClick={() => navigate("/")}>
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-neon-sm flex-shrink-0">
                  <Activity size={13} className="text-primary-foreground" />
                </div>
                <span className="font-bold text-sm text-foreground hidden sm:block tracking-tight">Agentpuls</span>
              </div>
            </div>

            {/* Center: search */}
            <div className="flex-1 max-w-sm sm:max-w-lg relative">
              <div className="relative">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-subtle z-10 pointer-events-none" />
                <Input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                  onKeyDown={e => {
                    if (e.key === "Enter") handleSearchSubmit();
                    if (e.key === "Escape") { setSearchQuery(""); searchRef.current?.blur(); }
                  }}
                  placeholder="Search agent address or ERC-8004 ID…"
                  className="pl-8 pr-14 bg-background-elevated border-border text-xs h-9 focus:border-primary/50 transition-all placeholder:text-foreground-subtle rounded-xl"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {searchQuery ? (
                    <button onClick={() => setSearchQuery("")} className="text-foreground-subtle hover:text-foreground transition-colors">
                      <X size={11} />
                    </button>
                  ) : (
                    <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md border border-border text-[9px] text-foreground-subtle font-mono bg-background-elevated">
                      ⌘K
                    </kbd>
                  )}
                </div>
              </div>

              {/* Search dropdown */}
              <AnimatePresence>
                {searchFocused && (searchResults.length > 0 || (searchQuery.length > 1 && ETH_ADDR.test(searchQuery))) && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full mt-1.5 left-0 right-0 bg-background-card border border-border rounded-xl shadow-card-elevated z-50 overflow-hidden"
                  >
                    {ETH_ADDR.test(searchQuery) && (
                      <button onMouseDown={() => handleSearchSubmit(searchQuery)}
                        className="w-full px-3.5 py-3 flex items-center gap-3 hover:bg-accent/50 text-left transition-colors border-b border-border/50">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Search size={11} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">Open agent profile</p>
                          <p className="text-[10px] text-foreground-muted font-mono">{shortAddress(searchQuery)}</p>
                        </div>
                      </button>
                    )}
                    {searchResults.map(agent => (
                      <button key={agent.address} onMouseDown={() => handleSearchSubmit(agent.address)}
                        className="w-full px-3.5 py-3 flex items-center gap-3 hover:bg-accent/50 text-left transition-colors last:rounded-b-xl">
                        <div className="w-7 h-7 rounded-lg bg-primary/8 border border-primary/15 flex items-center justify-center flex-shrink-0">
            <Zap size={11} className="text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-foreground truncate">{agent.name}</p>
                          <p className="text-[10px] text-foreground-muted font-mono">{shortAddress(agent.address)}</p>
                        </div>
                        <span className="badge-info text-[9px] px-1.5 py-0.5 rounded-md flex-shrink-0">{agent.framework}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right: refresh + settings */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Refresh — disabled with tooltip when no key */}
              <div className="relative group">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={hasUserKey ? refresh : undefined}
                  disabled={isLoading}
                  className={`h-8 w-8 p-0 rounded-lg transition-all ${
                    hasUserKey
                      ? "text-foreground-muted hover:text-foreground hover:bg-accent/50"
                      : "text-foreground-subtle cursor-not-allowed opacity-40"
                  }`}
                  title={hasUserKey ? "Refresh live data" : "Add GoldRush key first"}
                >
                  <RefreshCw size={14} className={isLoading ? "animate-spin text-primary" : ""} />
                </Button>
                {!hasUserKey && (
                  <div className="absolute right-0 top-full mt-1.5 z-50 bg-background-card border border-border rounded-lg px-2.5 py-1.5 text-[10px] text-foreground-muted whitespace-nowrap shadow-card-elevated pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    Add GoldRush key first
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSettingsOpen(true)}
                className="text-foreground-muted hover:text-foreground h-8 w-8 p-0 hover:bg-accent/50 rounded-lg"
                title="Settings"
              >
                <Settings size={14} />
              </Button>
            </div>
          </header>

          {/* ─── Error banner ─── */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                className="flex items-center gap-2 px-4 py-2.5 bg-destructive/8 border-b border-destructive/20 text-xs text-destructive flex-shrink-0">
                <AlertTriangle size={12} className="flex-shrink-0" />
                <span className="flex-1">{error}</span>
                {error.includes("key") && (
                  <button onClick={() => setSettingsOpen(true)} className="underline hover:no-underline font-medium flex-shrink-0">
                    Open Settings →
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Progress bar ─── */}
          {isLoading && loadProgress > 0 && loadProgress < 100 && (
            <div className="h-0.5 bg-background-elevated flex-shrink-0">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${loadProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}

          {/* ─── Main content ─── */}
          <main className="flex-1 overflow-auto">
            {children}

            {/* Footer */}
            <footer className="border-t border-border mt-12 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-foreground-subtle">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary pulse-neon flex-shrink-0" />
                <span>Powered by GoldRush + The Graph · 100% on-chain public data · No login · No custody</span>
              </div>
              <div className="flex items-center gap-3">
                <a href="https://github.com/agentpuls" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground-muted transition-colors">
                  <Github size={12} /> GitHub
                </a>
                <span>·</span>
                <a href="https://twitter.com/intent/tweet?text=Check+out+Agentpuls+—+on-chain+AI+agent+analytics!&url=https://agentpuls.app"
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground-muted transition-colors">
                  <Twitter size={12} /> Share
                </a>
                {lastRefreshed && (
                  <>
                    <span>·</span>
                    <span>Updated {lastRefreshed.toLocaleTimeString()}</span>
                  </>
                )}
              </div>
            </footer>
          </main>
        </div>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <EmbedModal open={embedOpen} onClose={() => setEmbedOpen(false)} />
    </SidebarProvider>
  );
}
