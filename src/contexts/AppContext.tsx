/**
 * AgentPulse — Global App Context
 *
 * Manages API key (with demo fallback), chain selection, agent data,
 * and auto-refresh with localStorage caching and toast notifications.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
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

  // Tracked agents (watchlist)
  trackedAgents: TrackedAgent[];
  trackAgent: (agent: TrackedAgent) => void;
  untrackAgent: (address: string) => void;
  isTracked: (address: string) => boolean;

  // Actions
  refresh: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const AUTO_REFRESH_MS = 60_000;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const storedKey = getApiKey();
  // Use stored key if set, otherwise fall back to demo key
  const [apiKey, setApiKeyState] = useState(storedKey || DEMO_API_KEY);
  const [isDemo, setIsDemo] = useState(!storedKey);
  const [chain, setChainState] = useState<SupportedChain>(getSelectedChain);
  const [metricsMap, setMetricsMap] = useState<Record<string, AgentMetrics>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [trackedAgents, setTrackedAgents] = useState<TrackedAgent[]>(getTrackedAgents);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef(false);
  const lastRefreshTimeRef = useRef<number>(0);

  // Agents filtered by current chain
  const agents = KNOWN_AGENTS.filter((a) => a.chain === chain);

  // Flattened list of all txs across agents
  const allTxs = Object.values(metricsMap).flatMap((m) => m.recentTxs);

  const refresh = useCallback(async (silent = false) => {
    // Debounce: don't refresh if last refresh was <5s ago
    const now = Date.now();
    if (now - lastRefreshTimeRef.current < 5_000) return;
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
      const now = new Date();
      setLastRefreshed(now);

      if (silent) {
        toast({
          title: "Data refreshed",
          description: `Updated ${agents.length} agents on ${chain}`,
          duration: 2500,
        });
      }
    } catch (err) {
      if (!abortRef.current) {
        const msg = err instanceof Error ? err.message : "Unknown error fetching data";
        setError(msg);
      }
    } finally {
      if (!abortRef.current) {
        setIsLoading(false);
      }
    }
  }, [apiKey, agents, chain]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh every 60s — only set up once per key/chain combo
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    abortRef.current = false;

    // Initial load
    refresh(false);

    // Auto-refresh silently
    timerRef.current = setInterval(() => refresh(true), AUTO_REFRESH_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      abortRef.current = true;
    };
  }, [apiKey, chain]); // eslint-disable-line react-hooks/exhaustive-deps

  const setAndSaveApiKey = (key: string) => {
    const trimmed = key.trim();
    setApiKey(trimmed);
    setApiKeyState(trimmed || DEMO_API_KEY);
    setIsDemo(!trimmed);
    setMetricsMap({});
    lastRefreshTimeRef.current = 0;
  };

  const setAndSaveChain = (c: SupportedChain) => {
    setSelectedChain(c);
    setChainState(c);
    setMetricsMap({});
    lastRefreshTimeRef.current = 0;
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
        trackedAgents,
        trackAgent,
        untrackAgent,
        isTracked,
        refresh: () => { lastRefreshTimeRef.current = 0; refresh(true); },
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
