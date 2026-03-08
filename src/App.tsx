import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { Layout } from "@/components/Layout";

import Overview from "./pages/Overview";
import BubbleMap from "./pages/BubbleMap";
import PerformanceAnalytics from "./pages/PerformanceAnalytics";
import AgentLeaderboard from "./pages/AgentLeaderboard";
import CrossChainBenchmarks from "./pages/CrossChainBenchmarks";
import FailuresExplorer from "./pages/FailuresExplorer";
import HowItWorks from "./pages/HowItWorks";
import AgentProfile from "./pages/AgentProfile";
import MyTrackedAgents from "./pages/MyTrackedAgents";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/bubblemap" element={<BubbleMap />} />
              <Route path="/performance" element={<PerformanceAnalytics />} />
              <Route path="/leaderboard" element={<AgentLeaderboard />} />
              <Route path="/benchmarks" element={<CrossChainBenchmarks />} />
              <Route path="/watchlist" element={<MyTrackedAgents />} />
              <Route path="/failures" element={<FailuresExplorer />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/agent/:address" element={<AgentProfile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </AppProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
