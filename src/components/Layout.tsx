/**
 * AgentPulse — Main Layout
 * Header: logo + search + settings only
 * Demo banner, error banner, footer with GoldRush credit
 */
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { SettingsModal } from "./SettingsModal";
import { EmbedModal } from "./EmbedModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApp } from "@/contexts/AppContext";
import { KNOWN_AGENTS, shortAddress } from "@/lib/agents";
import {
  Settings,
  RefreshCw,
  AlertTriangle,
  Search,
  X,
  Zap,
  Info,
  Github,
  Twitter,
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

const ETH_ADDR = /^0x[0-9a-fA-F]{40}$/;

export function Layout({ children }: LayoutProps) {
  const { isLoading, refresh, error, isDemo, loadProgress } = useApp();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [showDemoBanner, setShowDemoBanner] = useState(true);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement>(null);

  // Filter agents for search dropdown
  const searchResults = searchQuery.trim().length > 1
    ? KNOWN_AGENTS.filter(
        (a) =>
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.address.toLowerCase().includes(searchQuery.toLowerCase()),
      ).slice(0, 6)
    : [];

  const handleSearchSubmit = (address?: string) => {
    const addr = address ?? searchQuery.trim();
    if (ETH_ADDR.test(addr)) {
      navigate(`/agent/${addr}`);
      setSearchQuery("");
      searchRef.current?.blur();
    } else if (addr) {
      const found = KNOWN_AGENTS.find((a) => a.name.toLowerCase().includes(addr.toLowerCase()));
      if (found) {
        navigate(`/agent/${found.address}`);
        setSearchQuery("");
        searchRef.current?.blur();
      }
    }
  };

  // Global keyboard shortcut: Cmd+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Demo mode banner */}
          {isDemo && showDemoBanner && (
            <div className="flex items-center justify-between px-4 py-2 bg-secondary-dim/40 border-b border-secondary/20 text-xs flex-shrink-0">
              <div className="flex items-center gap-2 text-secondary">
                <Info size={12} className="flex-shrink-0" />
                <span className="font-medium">Demo mode active (rate-limited).</span>
                <span className="text-foreground-muted hidden sm:inline">
                  Add your free{" "}
                  <a
                    href="https://www.covalenthq.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-secondary transition-colors"
                  >
                    GoldRush key
                  </a>{" "}
                  in Settings for unlimited access.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="text-secondary underline hover:no-underline text-xs font-medium"
                >
                  Add Key →
                </button>
                <button
                  onClick={() => setShowDemoBanner(false)}
                  className="text-foreground-subtle hover:text-foreground p-0.5 rounded"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          )}

          {/* ── Top Header ── */}
          <header className="h-14 flex items-center justify-between px-3 sm:px-4 gap-3 border-b border-border bg-background-secondary/60 backdrop-blur-sm flex-shrink-0 sticky top-0 z-40">
            {/* Left: trigger + logo */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <SidebarTrigger className="text-foreground-muted hover:text-foreground h-8 w-8" />
              <div className="flex items-center gap-1.5 select-none">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-neon-sm">
                  <Zap size={12} className="text-primary-foreground" />
                </div>
                <span className="font-bold text-sm text-foreground hidden sm:block">AgentPulse</span>
              </div>
            </div>

            {/* Center: global search */}
            <div className="flex-1 max-w-sm sm:max-w-md relative">
              <div className="relative">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted z-10 pointer-events-none" />
                <Input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearchSubmit();
                    if (e.key === "Escape") { setSearchQuery(""); searchRef.current?.blur(); }
                  }}
                  placeholder="Search agent address or name…"
                  className="pl-8 pr-14 bg-background-input border-border text-xs h-8 focus:border-primary/50 transition-colors placeholder:text-foreground-subtle"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {searchQuery ? (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="text-foreground-subtle hover:text-foreground"
                    >
                      <X size={11} />
                    </button>
                  ) : (
                    <kbd className="hidden sm:inline-flex items-center px-1 py-0.5 rounded border border-border text-[9px] text-foreground-subtle font-mono">
                      ⌘K
                    </kbd>
                  )}
                </div>
              </div>

              {/* Search dropdown */}
              {searchFocused && (searchResults.length > 0 || (searchQuery.length > 1 && ETH_ADDR.test(searchQuery))) && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-background-card border border-border rounded-lg shadow-card-elevated z-50 overflow-hidden">
                  {ETH_ADDR.test(searchQuery) && (
                    <button
                      onMouseDown={() => handleSearchSubmit(searchQuery)}
                      className="w-full px-3 py-2.5 flex items-center gap-2.5 hover:bg-accent text-left transition-colors border-b border-border/50"
                    >
                      <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Search size={11} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground">Open agent profile</p>
                        <p className="text-[10px] text-foreground-muted font-mono">{shortAddress(searchQuery)}</p>
                      </div>
                    </button>
                  )}
                  {searchResults.map((agent) => (
                    <button
                      key={agent.address}
                      onMouseDown={() => handleSearchSubmit(agent.address)}
                      className="w-full px-3 py-2.5 flex items-center gap-2.5 hover:bg-accent text-left transition-colors"
                    >
                      <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Zap size={11} className="text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground truncate">{agent.name}</p>
                        <p className="text-[10px] text-foreground-muted font-mono">{shortAddress(agent.address)}</p>
                      </div>
                      <span className="badge-info text-[9px] px-1.5 py-0.5 rounded flex-shrink-0">
                        {agent.framework}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={refresh}
                disabled={isLoading}
                className="text-foreground-muted hover:text-foreground h-8 w-8 p-0"
                title="Refresh data"
              >
                <RefreshCw size={14} className={isLoading ? "animate-spin text-primary" : ""} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSettingsOpen(true)}
                className="text-foreground-muted hover:text-foreground h-8 w-8 p-0"
                title="Settings"
              >
                <Settings size={14} />
              </Button>
            </div>
          </header>

          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-destructive-dim border-b border-destructive/30 text-xs text-destructive flex-shrink-0">
              <AlertTriangle size={12} className="flex-shrink-0" />
              <span className="flex-1">{error}</span>
              {error.includes("key") && (
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="underline hover:no-underline font-medium flex-shrink-0"
                >
                  Open Settings →
                </button>
              )}
            </div>
          )}

          {/* Progress bar */}
          {isLoading && loadProgress > 0 && loadProgress < 100 && (
            <div className="h-0.5 bg-background-elevated flex-shrink-0">
              <div
                className="h-full bg-gradient-primary transition-all duration-300"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
          )}

          {/* Main content */}
          <main className="flex-1 overflow-auto">
            {children}

            {/* Footer */}
            <footer className="border-t border-border mt-8 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-foreground-subtle">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-success pulse-neon flex-shrink-0" />
                <span>Powered by GoldRush · 100% on-chain public data · No login · No custody</span>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href="https://github.com/agentpulse"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground-muted transition-colors"
                >
                  <Github size={12} /> GitHub
                </a>
                <span>·</span>
                <a
                  href="https://twitter.com/intent/tweet?text=Check+out+AgentPulse+—+on-chain+AI+agent+analytics!&url=https://agentpulse.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground-muted transition-colors"
                >
                  <Twitter size={12} /> Share on X
                </a>
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
