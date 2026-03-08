import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { Layout } from "@/components/Layout";

// Pages
import Overview from "./pages/Overview";
import PerformanceAnalytics from "./pages/PerformanceAnalytics";
import AgentLeaderboard from "./pages/AgentLeaderboard";
import CrossChainBenchmarks from "./pages/CrossChainBenchmarks";
import FailuresExplorer from "./pages/FailuresExplorer";
import HowItWorks from "./pages/HowItWorks";
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
              <Route path="/performance" element={<PerformanceAnalytics />} />
              <Route path="/leaderboard" element={<AgentLeaderboard />} />
              <Route path="/benchmarks" element={<CrossChainBenchmarks />} />
              <Route path="/failures" element={<FailuresExplorer />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </AppProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
