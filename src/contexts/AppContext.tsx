/**
 * AgentLens — Global App Context
 *
 * Manages API key, chain selection, agent data, and auto-refresh.
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

interface AppContextValue {
  // Settings
  apiKey: string;
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

  // Actions
  refresh: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const AUTO_REFRESH_MS = 60_000;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKeyState] = useState(getApiKey);
  const [chain, setChainState] = useState<SupportedChain>(getSelectedChain);
  const [metricsMap, setMetricsMap] = useState<Record<string, AgentMetrics>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef(false);

  // Agents filtered by current chain
  const agents = KNOWN_AGENTS.filter((a) => a.chain === chain);

  // Flattened list of all txs across agents
  const allTxs = Object.values(metricsMap).flatMap((m) => m.recentTxs);

  const refresh = useCallback(async () => {
    if (!apiKey) {
      setError("No API key set — open Settings to add your Covalent key.");
      return;
    }

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
    } catch (err) {
      if (!abortRef.current) {
        setError(err instanceof Error ? err.message : "Unknown error fetching data");
      }
    } finally {
      if (!abortRef.current) {
        setIsLoading(false);
      }
    }
  }, [apiKey, agents]);

  // Auto-refresh every 60s
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (apiKey) {
      refresh();
      timerRef.current = setInterval(refresh, AUTO_REFRESH_MS);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      abortRef.current = true;
    };
  }, [apiKey, chain]); // eslint-disable-line react-hooks/exhaustive-deps

  const setAndSaveApiKey = (key: string) => {
    setApiKey(key);
    setApiKeyState(key);
  };

  const setAndSaveChain = (c: SupportedChain) => {
    setSelectedChain(c);
    setChainState(c);
    setMetricsMap({});
  };

  return (
    <AppContext.Provider
      value={{
        apiKey,
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
