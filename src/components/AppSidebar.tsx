/**
 * AgentPulse — App Sidebar Navigation
 * Collapsible on desktop (icon mode), drawer on mobile
 */
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  TrendingUp,
  Trophy,
  GitCompareArrows,
  Bug,
  BookOpen,
  Activity,
  Star,
  Zap,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { CHAIN_LABELS } from "@/lib/agents";

const NAV_ITEMS = [
  { title: "Overview", url: "/", icon: LayoutDashboard },
  { title: "Performance", url: "/performance", icon: TrendingUp },
  { title: "Leaderboard", url: "/leaderboard", icon: Trophy },
  { title: "Cross-Chain", url: "/benchmarks", icon: GitCompareArrows },
  { title: "My Agents", url: "/watchlist", icon: Star },
  { title: "Failures", url: "/failures", icon: Bug },
  { title: "How It Works", url: "/how-it-works", icon: BookOpen },
];

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { chain, isLoading, lastRefreshed, trackedAgents } = useApp();

  const handleNavClick = (url: string) => {
    // Close mobile sidebar on navigation
    setOpenMobile(false);
    navigate(url);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <SidebarHeader className="px-4 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 shadow-neon">
            <Zap size={14} className="text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground leading-none">AgentPulse</p>
              <p className="text-[10px] text-foreground-muted mt-0.5 truncate">
                AI Agent Analytics
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const active = location.pathname === item.url;
                const badgeCount = item.url === "/watchlist" ? trackedAgents.length : 0;

                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild>
                      <button
                        onClick={() => handleNavClick(item.url)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                          active
                            ? "bg-primary/10 text-primary border border-primary/20 shadow-neon-sm"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border border-transparent"
                        }`}
                      >
                        <item.icon
                          size={16}
                          className={`flex-shrink-0 ${active ? "text-primary" : ""}`}
                        />
                        {!collapsed && (
                          <span className="font-medium flex-1 text-left">{item.title}</span>
                        )}
                        {!collapsed && badgeCount > 0 && (
                          <span className="badge-info text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                            {badgeCount}
                          </span>
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

      {/* Footer status */}
      {!collapsed && (
        <SidebarFooter className="px-4 py-3 border-t border-sidebar-border">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  isLoading ? "bg-warning animate-pulse" : "bg-success pulse-neon"
                }`}
              />
              <span className="text-[10px] text-foreground-muted truncate">
                {isLoading ? "Fetching..." : CHAIN_LABELS[chain]}
              </span>
            </div>
            {lastRefreshed && (
              <p className="text-[9px] text-foreground-subtle">
                Updated {lastRefreshed.toLocaleTimeString()}
              </p>
            )}
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
