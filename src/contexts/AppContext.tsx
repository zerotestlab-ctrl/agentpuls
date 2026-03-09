/**
 * Agentpuls — Global App Context
 *
 * Two-mode system:
 *  - Demo mode (no user key): static demo data, instant render
 *  - Live mode (user key saved): manual refresh with GoldRush/Covalent
 *
 * NO auto-refresh. User manually clicks "Refresh Data".
 * Refresh is DISABLED unless a user API key is saved.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { KNOWN_AGENTS, type AgentInfo, type SupportedChain } from "@/lib/agents";
import {
  fetchAllAgentTransactions,
  computeAgentMetrics,
  type AgentMetrics,
  type CovalentTx,
} from "@/lib/covalent";
import { getApiKey, getSelectedChain, setApiKey, setSelectedChain } from "@/lib/storage";
import { buildDemoMetricsMap, DEMO_KPIS, type DemoAgent, DEMO_AGENTS } from "@/lib/demoData";
import { toast } from "@/hooks/use-toast";

export interface TrackedAgent {
  address: string;
  name: string;
  chain: SupportedChain;
  addedAt: number;
}

const TRACKED_KEY = "agentpuls_tracked_v2";

function getTrackedAgents(): TrackedAgent[] {
  try { return JSON.parse(localStorage.getItem(TRACKED_KEY) ?? "[]"); }
  catch { return []; }
}
function saveTrackedAgents(a: TrackedAgent[]) {
  localStorage.setItem(TRACKED_KEY, JSON.stringify(a));
}

interface AppContextValue {
  // Settings
  apiKey: string;           // user's personal key (empty = no key set)
  hasUserKey: boolean;      // true only when user has saved their own key
  isLiveMode: boolean;      // true after first successful live fetch
  setAndSaveApiKey: (k: string) => void;
  chain: SupportedChain;
  setAndSaveChain: (c: SupportedChain) => void;

  // Data state
  agents: AgentInfo[];
  demoAgents: DemoAgent[];
  metricsMap: Record<string, AgentMetrics>;
  allTxs: CovalentTx[];
  isLoading: boolean;
  loadProgress: number;
  error: string | null;
  lastRefreshed: Date | null;

  // Demo KPIs (always available)
  demoKpis: typeof DEMO_KPIS;

  // Tracked agents
  trackedAgents: TrackedAgent[];
  trackAgent: (a: TrackedAgent) => void;
  untrackAgent: (address: string) => void;
  isTracked: (address: string) => boolean;

  // Actions
  refresh: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const storedKey = getApiKey();
  const [apiKey, setApiKeyState] = useState(storedKey);
  const hasUserKey = !!apiKey;
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [chain, setChainState] = useState<SupportedChain>(getSelectedChain);

  // Always start with demo data for instant render
  const [metricsMap, setMetricsMap] = useState<Record<string, AgentMetrics>>(
    () => buildDemoMetricsMap()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [trackedAgents, setTrackedAgents] = useState<TrackedAgent[]>(getTrackedAgents);

  const abortRef = useRef(false);
  const lastRefreshRef = useRef<number>(0);

  const agents = KNOWN_AGENTS.filter((a) => a.chain === chain);
  const demoAgents = DEMO_AGENTS.filter((a) => a.chain === chain);
  const allTxs = Object.values(metricsMap).flatMap((m) => m.recentTxs);

  /** Live data fetch — manual only, requires user key */
  const refresh = useCallback(async () => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Add your free GoldRush key in Settings to load live data.",
        variant: "destructive",
        duration: 3500,
      });
      return;
    }

    const now = Date.now();
    if (now - lastRefreshRef.current < 3_000) return;
    lastRefreshRef.current = now;

    abortRef.current = false;
    setIsLoading(true);
    setError(null);
    setLoadProgress(0);

    try {
      const txMap = await fetchAllAgentTransactions(
        agents,
        apiKey,
        (done, total) => {
          if (!abortRef.current) setLoadProgress(Math.round((done / total) * 100));
        }
      );

      if (abortRef.current) return;

      const newMetrics: Record<string, AgentMetrics> = {};
      for (const agent of agents) {
        newMetrics[agent.address] = computeAgentMetrics(
          agent,
          txMap[agent.address] ?? []
        );
      }

      setMetricsMap(newMetrics);
      setLastRefreshed(new Date());
      setIsLiveMode(true);

      toast({
        title: "✓ Live data loaded",
        description: `${agents.length} agents refreshed on ${chain}`,
        duration: 2500,
      });
    } catch (err) {
      if (!abortRef.current) {
        const msg = err instanceof Error ? err.message : "Unknown fetch error";
        setError(msg);
        toast({ title: "Fetch failed", description: msg, variant: "destructive", duration: 4000 });
      }
    } finally {
      if (!abortRef.current) {
        setIsLoading(false);
        setLoadProgress(100);
      }
    }
  }, [apiKey, agents, chain]);

  const setAndSaveApiKey = (key: string) => {
    const trimmed = key.trim();
    setApiKey(trimmed);
    setApiKeyState(trimmed);
    // Reset to demo data on key change
    setMetricsMap(buildDemoMetricsMap());
    setIsLiveMode(false);
    lastRefreshRef.current = 0;
    abortRef.current = true;

    if (trimmed) {
      toast({
        title: "Live data unlocked!",
        description: "API key saved — click Refresh Data to load live transactions.",
        duration: 3500,
      });
    }
  };

  const setAndSaveChain = (c: SupportedChain) => {
    setSelectedChain(c);
    setChainState(c);
    setMetricsMap(buildDemoMetricsMap());
    setIsLiveMode(false);
    lastRefreshRef.current = 0;
    abortRef.current = true;
  };

  const trackAgent = (agent: TrackedAgent) => {
    setTrackedAgents((prev) => {
      if (prev.find((a) => a.address === agent.address)) return prev;
      const updated = [...prev, agent];
      saveTrackedAgents(updated);
      return updated;
    });
    toast({ title: "Agent tracked", description: `${agent.name} added to watchlist`, duration: 2000 });
  };

  const untrackAgent = (address: string) => {
    setTrackedAgents((prev) => {
      const updated = prev.filter((a) => a.address !== address);
      saveTrackedAgents(updated);
      return updated;
    });
  };

  const isTracked = (address: string) => trackedAgents.some((a) => a.address === address);

  return (
    <AppContext.Provider
      value={{
        apiKey, hasUserKey, isLiveMode,
        setAndSaveApiKey,
        chain, setAndSaveChain,
        agents, demoAgents, metricsMap, allTxs,
        isLoading, loadProgress, error,
        lastRefreshed,
        demoKpis: DEMO_KPIS,
        trackedAgents, trackAgent, untrackAgent, isTracked,
        refresh,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
