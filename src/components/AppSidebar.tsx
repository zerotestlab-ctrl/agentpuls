/**
 * AgentLens — App Sidebar Navigation
 */
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
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
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { CHAIN_LABELS } from "@/lib/agents";

const NAV_ITEMS = [
  { title: "Overview", url: "/", icon: LayoutDashboard },
  { title: "Performance", url: "/performance", icon: TrendingUp },
  { title: "Leaderboard", url: "/leaderboard", icon: Trophy },
  { title: "Cross-Chain", url: "/benchmarks", icon: GitCompareArrows },
  { title: "Failures", url: "/failures", icon: Bug },
  { title: "How It Works", url: "/how-it-works", icon: BookOpen },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { chain, isLoading, lastRefreshed } = useApp();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <SidebarHeader className="px-4 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 shadow-neon">
            <Activity size={14} className="text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground leading-none">AgentLens</p>
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
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                          active
                            ? "bg-primary/10 text-primary border border-primary/20 shadow-neon-sm"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border border-transparent"
                        }`}
                      >
                        <item.icon
                          size={16}
                          className={active ? "text-primary" : ""}
                        />
                        {!collapsed && (
                          <span className="font-medium">{item.title}</span>
                        )}
                      </NavLink>
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
