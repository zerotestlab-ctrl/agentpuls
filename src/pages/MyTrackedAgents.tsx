/**
 * Agentpuls — My Tracked Agents (Birdeye portfolio watchlist)
 * Shows saved agents as performance tiles. Load Metrics requires user API key.
 */
import { useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { useApp } from "@/contexts/AppContext";
import {
  fetchTransactions, computeAgentMetrics, buildDailyTimeSeries, type AgentMetrics,
} from "@/lib/covalent";
import { shortAddress, CHAIN_LABELS } from "@/lib/agents";
import { Button } from "@/components/ui/button";
import {
  Star, StarOff, TrendingUp, Activity, Zap, Search,
  Plus, RefreshCw, CheckCircle2, KeyRound
} from "lucide-react";

export default function MyTrackedAgents() {
  const { trackedAgents, untrackAgent, apiKey, hasUserKey, metricsMap } = useApp();
  const navigate = useNavigate();
  const [agentMetrics, setAgentMetrics] = useState<Record<string, AgentMetrics>>({});
  const [loadingSet, setLoadingSet] = useState<Set<string>>(new Set());

const ETH_ADDR_RE = /^0x[0-9a-fA-F]{40}$/;

  const loadAll = useCallback(async () => {
    if (!hasUserKey) return;
    // Filter out any tracked agents with invalid address format before API calls
    const toLoad = trackedAgents.filter(
      a => ETH_ADDR_RE.test(a.address) && !metricsMap[a.address] && !agentMetrics[a.address]
    );
    if (!toLoad.length) return;
    setLoadingSet(new Set(toLoad.map(a => a.address)));
    const results = await Promise.allSettled(
      toLoad.map(async (agent) => {
        const txs = await fetchTransactions(agent.chain, agent.address, apiKey, 50);
        const m = computeAgentMetrics({ ...agent, framework: (agent as any).framework ?? "Unknown" }, txs);
        return { address: agent.address, metrics: m };
      })
    );
    const updates: Record<string, AgentMetrics> = {};
    results.forEach(r => { if (r.status === "fulfilled") updates[r.value.address] = r.value.metrics; });
    setAgentMetrics(prev => ({ ...prev, ...updates }));
    setLoadingSet(new Set());
  }, [trackedAgents, apiKey, hasUserKey, metricsMap, agentMetrics]);

  const getMetrics = (address: string) => metricsMap[address] ?? agentMetrics[address];

  const summary = useMemo(() => {
    const ms = trackedAgents.map(a => getMetrics(a.address)).filter(Boolean) as AgentMetrics[];
    return {
      totalTxs: ms.reduce((a, m) => a + m.txCount, 0),
      avgSuccess: ms.length ? ms.reduce((a, m) => a + m.successRate, 0) / ms.length : 0,
      totalFails: ms.reduce((a, m) => a + m.failCount, 0),
    };
  }, [trackedAgents, agentMetrics, metricsMap]); // eslint-disable-line

  return (
    <div className="p-4 sm:p-6 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2.5">
            <Star size={20} className="text-warning" /> My Tracked Agents
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            {trackedAgents.length} agent{trackedAgents.length !== 1 ? "s" : ""} in your watchlist
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => navigate("/leaderboard")}
            className="border-border text-foreground-muted gap-1.5 text-xs rounded-xl">
            <Plus size={12} /> Add Agents
          </Button>
          {trackedAgents.length > 0 && (
            hasUserKey ? (
              <Button size="sm" onClick={loadAll} disabled={loadingSet.size > 0}
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 text-xs rounded-xl shadow-neon-sm">
                <RefreshCw size={12} className={loadingSet.size > 0 ? "animate-spin" : ""} />
                {loadingSet.size > 0 ? "Loading…" : "Load Metrics"}
              </Button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border border-dashed border-border/50 text-foreground-subtle cursor-default"
                title="Add GoldRush key in Settings for live metrics">
                <KeyRound size={11} className="text-primary/60" /> Key required
              </div>
            )
          )}
        </div>
      </div>

      {/* Empty state */}
      {trackedAgents.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="card-glass rounded-2xl border border-border p-16 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-warning/10 border border-warning/20 flex items-center justify-center mx-auto">
            <Star size={26} className="text-warning" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">No agents tracked yet</p>
            <p className="text-sm text-foreground-muted mt-2 max-w-sm mx-auto">
              Browse the leaderboard or search any agent address to start tracking performance.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Button onClick={() => navigate("/leaderboard")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 rounded-xl shadow-neon-sm">
              <TrendingUp size={13} /> Browse Leaderboard
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/bubblemap")}
              className="border-border gap-2 rounded-xl">
              <Search size={13} /> Explore Bubble Map
            </Button>
          </div>
        </motion.div>
      )}

      {/* Portfolio summary */}
      {trackedAgents.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Tracked", value: trackedAgents.length.toString(), icon: <Star size={13} className="text-warning" /> },
              { label: "Total Txs", value: summary.totalTxs.toLocaleString(), icon: <Activity size={13} className="text-primary" /> },
              { label: "Avg Success", value: summary.avgSuccess > 0 ? `${summary.avgSuccess.toFixed(1)}%` : "—", icon: <CheckCircle2 size={13} className="text-success" /> },
              { label: "Total Fails", value: summary.totalFails.toString(), icon: <Zap size={13} className="text-destructive" /> },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="card-glass rounded-2xl border border-border p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] uppercase tracking-widest text-foreground-subtle font-semibold">{s.label}</p>
                  {s.icon}
                </div>
                <p className="text-2xl font-black text-foreground num-ticker">{s.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Agent tiles grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trackedAgents.map((agent, i) => {
              const m = getMetrics(agent.address);
              const loading = loadingSet.has(agent.address);
              return (
                <motion.div key={agent.address}
                  initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}>
                  <AgentTile
                    agent={agent}
                    metrics={m}
                    isLoading={loading}
                    hasUserKey={hasUserKey}
                    onView={() => navigate(`/agent/${agent.address}`)}
                    onUntrack={() => untrackAgent(agent.address)}
                  />
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function AgentTile({
  agent, metrics, isLoading, hasUserKey, onView, onUntrack
}: {
  agent: { address: string; name: string; chain: string; addedAt: number };
  metrics?: AgentMetrics; isLoading: boolean; hasUserKey: boolean; onView: () => void; onUntrack: () => void;
}) {
  const spark = useMemo(() => metrics ? buildDailyTimeSeries(metrics.recentTxs, 7) : [], [metrics]);
  const successColor = !metrics ? "text-foreground-muted"
    : metrics.successRate >= 90 ? "text-success"
    : metrics.successRate >= 70 ? "text-warning" : "text-destructive";
  const sparkColor = !metrics ? "hsl(142,76%,48%)"
    : metrics.successRate >= 90 ? "hsl(142,76%,48%)"
    : metrics.successRate >= 70 ? "hsl(38,100%,55%)" : "hsl(0,84%,60%)";

  return (
    <div className="card-glass card-glass-hover rounded-2xl border border-border p-5 cursor-pointer group" onClick={onView}>
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center flex-shrink-0">
            <Zap size={14} className="text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{agent.name}</p>
            <p className="text-[9px] font-mono text-foreground-subtle">{shortAddress(agent.address)}</p>
          </div>
        </div>
        <button onClick={e => { e.stopPropagation(); onUntrack(); }}
          className="text-warning/60 hover:text-warning transition-colors flex-shrink-0 p-1.5 hover:bg-warning/10 rounded-lg">
          <StarOff size={13} />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2.5">
          <div className="h-14 bg-background-elevated rounded-xl animate-shimmer" />
          <div className="h-3.5 w-1/2 bg-background-elevated rounded animate-shimmer" />
        </div>
      ) : metrics ? (
        <>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div>
              <p className="text-[9px] text-foreground-subtle uppercase tracking-wider font-semibold">Txs</p>
              <p className="text-base font-black text-foreground num-ticker">{metrics.txCount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[9px] text-foreground-subtle uppercase tracking-wider font-semibold">Success</p>
              <p className={`text-base font-black num-ticker ${successColor}`}>{metrics.successRate.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-[9px] text-foreground-subtle uppercase tracking-wider font-semibold">Fails</p>
              <p className="text-base font-black text-destructive num-ticker">{metrics.failCount}</p>
            </div>
          </div>
          {spark.length > 0 && (
            <div className="h-14 -mx-1 mb-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spark} margin={{ top: 2, right: 2, bottom: 0, left: 2 }}>
                  <defs>
                    <linearGradient id={`sp-${agent.address.slice(2, 8)}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={sparkColor} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={sparkColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="successRate" stroke={sparkColor} strokeWidth={1.5}
                    fill={`url(#sp-${agent.address.slice(2, 8)})`} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      ) : (
        <div className="h-16 flex items-center justify-center">
          {hasUserKey ? (
            <p className="text-xs text-foreground-subtle">Click "Load Metrics" to fetch data</p>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-foreground-subtle">
              <KeyRound size={11} className="text-primary/60" /> Add key to load metrics
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <span className="badge-info text-[9px] px-2 py-0.5 rounded-lg font-medium">
          {CHAIN_LABELS[agent.chain as any] ?? agent.chain}
        </span>
        <span className="text-[9px] text-foreground-subtle">
          Added {new Date(agent.addedAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
