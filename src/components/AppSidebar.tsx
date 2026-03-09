/**
 * AgentPulse — Premium Sidebar (Birdeye-style)
 * Collapsible desktop (icon mode), drawer mobile auto-closes on selection.
 *
 * Route map matches App.tsx exactly:
 *   /           → Bubble Map (homepage)
 *   /overview   → Overview
 *   /performance → Performance Analytics
 *   /leaderboard → Leaderboard
 *   /benchmarks → Cross-Chain
 *   /watchlist  → My Agents
 *   /failures   → Failures
 *   /how-it-works → How It Works
 */
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard, TrendingUp, Trophy, GitCompareArrows,
  Bug, BookOpen, Star, Zap, ChevronLeft, ChevronRight, Radar,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { CHAIN_LABELS } from "@/lib/agents";

const NAV_ITEMS = [
  { title: "Bubble Map",   url: "/",            icon: Radar,            group: "analytics" },
  { title: "Overview",     url: "/overview",    icon: LayoutDashboard,  group: "analytics" },
  { title: "Performance",  url: "/performance", icon: TrendingUp,       group: "analytics" },
  { title: "Leaderboard",  url: "/leaderboard", icon: Trophy,           group: "analytics" },
  { title: "Cross-Chain",  url: "/benchmarks",  icon: GitCompareArrows, group: "analytics" },
  { title: "My Agents",    url: "/watchlist",   icon: Star,             group: "analytics" },
  { title: "Failures",     url: "/failures",    icon: Bug,              group: "tools" },
  { title: "How It Works", url: "/how-it-works",icon: BookOpen,         group: "tools" },
] as const;

export function AppSidebar() {
  const { state, setOpenMobile, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { chain, isLoading, lastRefreshed, trackedAgents } = useApp();

  const handleNavClick = (url: string) => {
    setOpenMobile(false); // auto-close mobile drawer
    navigate(url);
  };

  const isActive = (url: string) =>
    url === "/" ? location.pathname === "/" : location.pathname === url;

  const mainItems = NAV_ITEMS.filter(i => i.group === "analytics");
  const toolItems = NAV_ITEMS.filter(i => i.group === "tools");

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      {/* ── Logo ── */}
      <SidebarHeader className="px-3 py-3.5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 shadow-neon-sm">
            <Zap size={13} className="text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground leading-none tracking-tight">AgentPulse</p>
              <p className="text-[9px] text-foreground-subtle mt-0.5 uppercase tracking-widest font-medium">
                Agent Analytics
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={toggleSidebar}
              className="ml-auto text-foreground-subtle hover:text-foreground transition-colors p-1 rounded-md hidden md:flex hover:bg-accent/50"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={13} />
            </button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-3 px-2 space-y-1">
        {/* ── Analytics group ── */}
        <SidebarGroup>
          {!collapsed && (
            <p className="text-[9px] uppercase tracking-widest text-foreground-subtle font-semibold px-2 mb-2">
              Analytics
            </p>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {mainItems.map(item => {
                const active = isActive(item.url);
                const badge = item.url === "/watchlist" ? trackedAgents.length : 0;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild tooltip={collapsed ? item.title : undefined}>
                      <button
                        onClick={() => handleNavClick(item.url)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150 ${
                          active
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        }`}
                      >
                        <item.icon size={15} className={`flex-shrink-0 ${active ? "text-primary" : ""}`} />
                        {!collapsed && (
                          <>
                            <span className="flex-1 text-left truncate text-[13px]">{item.title}</span>
                            {badge > 0 && (
                              <span className="badge-info text-[9px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center flex-shrink-0">
                                {badge}
                              </span>
                            )}
                          </>
                        )}
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ── Tools group ── */}
        <SidebarGroup className="mt-2">
          {!collapsed && (
            <p className="text-[9px] uppercase tracking-widest text-foreground-subtle font-semibold px-2 mb-2 mt-2">
              Tools
            </p>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {toolItems.map(item => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild tooltip={collapsed ? item.title : undefined}>
                      <button
                        onClick={() => handleNavClick(item.url)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150 ${
                          active
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        }`}
                      >
                        <item.icon size={15} className={`flex-shrink-0 ${active ? "text-primary" : ""}`} />
                        {!collapsed && (
                          <span className="flex-1 text-left truncate text-[13px]">{item.title}</span>
                        )}
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── Footer status ── */}
      <SidebarFooter className="px-3 py-3 border-t border-sidebar-border">
        {collapsed ? (
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center text-foreground-subtle hover:text-foreground transition-colors p-1.5 rounded-lg hidden md:flex hover:bg-accent/50"
            aria-label="Expand sidebar"
          >
            <ChevronRight size={13} />
          </button>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                isLoading ? "bg-warning animate-pulse" : "bg-primary pulse-neon"
              }`} />
              <span className="text-[11px] text-foreground-muted truncate font-medium">
                {isLoading ? "Fetching data…" : CHAIN_LABELS[chain]}
              </span>
            </div>
            {lastRefreshed && !isLoading && (
              <p className="text-[9px] text-foreground-subtle">
                Updated {lastRefreshed.toLocaleTimeString()}
              </p>
            )}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
