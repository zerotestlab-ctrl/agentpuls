/**
 * AgentPulse — Root App
 *
 * Routing:
 *   /              → BubbleMap (main discovery page)
 *   /overview      → Overview (KPI dashboard)
 *   /bubblemap     → BubbleMap (alias)
 *   /leaderboard   → AgentLeaderboard
 *   /performance   → PerformanceAnalytics
 *   /benchmarks    → CrossChainBenchmarks
 *   /watchlist     → MyTrackedAgents
 *   /failures      → FailuresExplorer
 *   /how-it-works  → HowItWorks
 *   /agent/:address → AgentProfile
 *   *              → NotFound
 *
 * Providers (outermost → innermost):
 *   QueryClientProvider → TooltipProvider → BrowserRouter → AppProvider → Layout
 *
 * Data strategy:
 *   - Demo data loads instantly (<300ms) from demoData.ts
 *   - "Refresh Data" button manual-only; disabled until user adds GoldRush key
 *   - React Query: staleTime 5min, gcTime 30min, no auto-refetch
 */
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { Layout } from "@/components/Layout";

// ── Pages ──────────────────────────────────────────────────────────────────
import BubbleMap            from "./pages/BubbleMap";
import Overview             from "./pages/Overview";
import AgentLeaderboard     from "./pages/AgentLeaderboard";
import PerformanceAnalytics from "./pages/PerformanceAnalytics";
import CrossChainBenchmarks from "./pages/CrossChainBenchmarks";
import MyTrackedAgents      from "./pages/MyTrackedAgents";
import FailuresExplorer     from "./pages/FailuresExplorer";
import HowItWorks           from "./pages/HowItWorks";
import AgentProfile         from "./pages/AgentProfile";
import NotFound             from "./pages/NotFound";

// ── React Query client ─────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // 5 min — never re-fetch stale data silently
      gcTime:    30 * 60 * 1000,        // 30 min cache retention
      refetchOnWindowFocus: false,      // NO auto-refetch ever
      refetchOnMount: false,            // data stays fresh until manual refresh
      retry: 1,
    },
  },
});

// ── App ────────────────────────────────────────────────────────────────────
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppProvider>
          <Layout>
            <Routes>
              {/* ── Main discovery (Bubble Map as homepage) ── */}
              <Route path="/"              element={<BubbleMap />} />
              <Route path="/bubblemap"     element={<Navigate to="/" replace />} />

              {/* ── Analytics pages ── */}
              <Route path="/overview"      element={<Overview />} />
              <Route path="/leaderboard"   element={<AgentLeaderboard />} />
              <Route path="/performance"   element={<PerformanceAnalytics />} />
              <Route path="/benchmarks"    element={<CrossChainBenchmarks />} />
              <Route path="/watchlist"     element={<MyTrackedAgents />} />

              {/* ── Tools ── */}
              <Route path="/failures"      element={<FailuresExplorer />} />
              <Route path="/how-it-works"  element={<HowItWorks />} />

              {/* ── Agent profile (shareable: ?agent=0x... also supported via search) ── */}
              <Route path="/agent/:address" element={<AgentProfile />} />

              {/* ── 404 ── */}
              <Route path="*"              element={<NotFound />} />
            </Routes>
          </Layout>
        </AppProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
