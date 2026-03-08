/**
 * AgentPulse — Global App Context
 *
 * Manages API key (with demo fallback), chain selection, agent data.
 * NO auto-refresh. Data only loads when user explicitly clicks "Refresh Data".
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import {
  KNOWN_AGENTS,
  type AgentInfo,
  type SupportedChain,
} from "@/lib/agents";
import {
  fetchAllAgentTransactions,
  computeAgentMetrics,
  type AgentMetrics,
  type CovalentTx,
} from "@/lib/covalent";
import { getApiKey, getSelectedChain, setApiKey, setSelectedChain } from "@/lib/storage";
import { toast } from "@/hooks/use-toast";

/** Demo key — publicly listed, rate-limited but functional */
export const DEMO_API_KEY = "cqt_rQD4VjTpxmhgmxJBkjRhr9MYhrVP";

export interface TrackedAgent {
  address: string;
  name: string;
  chain: SupportedChain;
  addedAt: number;
}

const TRACKED_AGENTS_KEY = "agentpulse_tracked_agents";

function getTrackedAgents(): TrackedAgent[] {
  try {
    return JSON.parse(localStorage.getItem(TRACKED_AGENTS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveTrackedAgents(agents: TrackedAgent[]) {
  localStorage.setItem(TRACKED_AGENTS_KEY, JSON.stringify(agents));
}

interface AppContextValue {
  // Settings
  apiKey: string;
  isDemo: boolean;
  setAndSaveApiKey: (key: string) => void;
  chain: SupportedChain;
  setAndSaveChain: (chain: SupportedChain) => void;

  // Data state
  agents: AgentInfo[];
  metricsMap: Record<string, AgentMetrics>;
  allTxs: CovalentTx[];
  isLoading: boolean;
  loadProgress: number; // 0-100
  error: string | null;
  lastRefreshed: Date | null;
  hasLoaded: boolean; // whether any data load has ever completed

  // Tracked agents (watchlist)
  trackedAgents: TrackedAgent[];
  trackAgent: (agent: TrackedAgent) => void;
  untrackAgent: (address: string) => void;
  isTracked: (address: string) => boolean;

  // Actions — manual only, no auto-refresh
  refresh: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const storedKey = getApiKey();
  const [apiKey, setApiKeyState] = useState(storedKey || DEMO_API_KEY);
  const [isDemo, setIsDemo] = useState(!storedKey);
  const [chain, setChainState] = useState<SupportedChain>(getSelectedChain);
  const [metricsMap, setMetricsMap] = useState<Record<string, AgentMetrics>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [trackedAgents, setTrackedAgents] = useState<TrackedAgent[]>(getTrackedAgents);

  // Abort ref to cancel in-flight requests on chain/key change
  const abortRef = useRef(false);
  // Debounce: prevent double-clicks
  const lastRefreshTimeRef = useRef<number>(0);

  // Agents filtered by current chain
  const agents = KNOWN_AGENTS.filter((a) => a.chain === chain);

  // Flattened list of all txs across agents
  const allTxs = Object.values(metricsMap).flatMap((m) => m.recentTxs);

  /** Manual refresh — called only by explicit user action */
  const refresh = useCallback(async () => {
    // 3s debounce to prevent rapid clicks
    const now = Date.now();
    if (now - lastRefreshTimeRef.current < 3_000) return;
    lastRefreshTimeRef.current = now;

    abortRef.current = false;
    setIsLoading(true);
    setError(null);
    setLoadProgress(0);

    try {
      const txMap = await fetchAllAgentTransactions(
        agents,
        apiKey,
        (done, total) => {
          if (!abortRef.current) {
            setLoadProgress(Math.round((done / total) * 100));
          }
        },
      );

      if (abortRef.current) return;

      const newMetrics: Record<string, AgentMetrics> = {};
      for (const agent of agents) {
        const txs = txMap[agent.address] ?? [];
        newMetrics[agent.address] = computeAgentMetrics(agent, txs);
      }

      setMetricsMap(newMetrics);
      setLastRefreshed(new Date());
      setHasLoaded(true);

      toast({
        title: "Data refreshed",
        description: `Updated ${agents.length} agents on ${chain}`,
        duration: 2500,
      });
    } catch (err) {
      if (!abortRef.current) {
        const msg = err instanceof Error ? err.message : "Unknown error fetching data";
        setError(msg);
        toast({
          title: "Refresh failed",
          description: msg,
          variant: "destructive",
          duration: 4000,
        });
      }
    } finally {
      if (!abortRef.current) {
        setIsLoading(false);
        setLoadProgress(100);
      }
    }
  }, [apiKey, agents, chain]); // eslint-disable-line react-hooks/exhaustive-deps

  const setAndSaveApiKey = (key: string) => {
    const trimmed = key.trim();
    setApiKey(trimmed);
    setApiKeyState(trimmed || DEMO_API_KEY);
    setIsDemo(!trimmed);
    // Clear data so user can re-fetch with new key
    setMetricsMap({});
    setHasLoaded(false);
    lastRefreshTimeRef.current = 0;
    abortRef.current = true;
  };

  const setAndSaveChain = (c: SupportedChain) => {
    setSelectedChain(c);
    setChainState(c);
    // Clear data for new chain
    setMetricsMap({});
    setHasLoaded(false);
    lastRefreshTimeRef.current = 0;
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

  const isTracked = (address: string) =>
    trackedAgents.some((a) => a.address === address);

  return (
    <AppContext.Provider
      value={{
        apiKey,
        isDemo,
        setAndSaveApiKey,
        chain,
        setAndSaveChain,
        agents,
        metricsMap,
        allTxs,
        isLoading,
        loadProgress,
        error,
        lastRefreshed,
        hasLoaded,
        trackedAgents,
        trackAgent,
        untrackAgent,
        isTracked,
        refresh,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
