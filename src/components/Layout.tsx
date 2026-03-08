/**
 * AgentLens — Main Layout (header + sidebar + content)
 */
import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { SettingsModal } from "./SettingsModal";
import { EmbedModal } from "./EmbedModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/contexts/AppContext";
import { CHAIN_LABELS } from "@/lib/agents";
import {
  Settings,
  RefreshCw,
  Code2,
  AlertTriangle,
  KeyRound,
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isLoading, refresh, error, apiKey, chain, loadProgress } = useApp();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Header */}
          <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-background-secondary/50 backdrop-blur-sm flex-shrink-0 sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-foreground-muted hover:text-foreground" />

              {/* Chain badge */}
              <Badge
                variant="outline"
                className="text-xs border-border-accent/50 text-primary bg-primary-dim/20 hidden sm:flex"
              >
                {CHAIN_LABELS[chain]}
              </Badge>

              {/* Loading progress */}
              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-foreground-muted">
                  <RefreshCw size={12} className="animate-spin text-primary" />
                  <span className="hidden sm:inline">
                    Loading... {loadProgress}%
                  </span>
                </div>
              )}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {!apiKey && (
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="flex items-center gap-1.5 text-xs text-warning bg-warning/10 border border-warning/30 px-2.5 py-1 rounded-md hover:bg-warning/20 transition-colors"
                >
                  <KeyRound size={12} />
                  <span className="hidden sm:inline">Add API Key</span>
                </button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={refresh}
                disabled={isLoading || !apiKey}
                className="text-foreground-muted hover:text-foreground h-8 w-8 p-0"
                title="Refresh data"
              >
                <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEmbedOpen(true)}
                className="text-foreground-muted hover:text-foreground h-8 w-8 p-0"
                title="Get embed code"
              >
                <Code2 size={14} />
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
              <span>{error}</span>
              {error.includes("API key") && (
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="ml-2 underline hover:no-underline"
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
            <footer className="border-t border-border mt-8 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-foreground-subtle">
              <p>
                100% public on-chain data — no custody, no login, no tracking
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="https://github.com/agentlens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground-muted transition-colors"
                >
                  GitHub
                </a>
                <span>·</span>
                <a
                  href="https://8004agents.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground-muted transition-colors"
                >
                  8004agents.ai
                </a>
                <span>·</span>
                <a
                  href="https://www.covalenthq.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground-muted transition-colors"
                >
                  Powered by Covalent
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
