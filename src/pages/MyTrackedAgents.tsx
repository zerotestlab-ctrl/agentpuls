/**
 * AgentPulse — My Tracked Agents Watchlist
 * Portfolio-style page of user-tracked agents with live performance tiles.
 */
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useApp } from "@/contexts/AppContext";
import {
  fetchTransactions,
  computeAgentMetrics,
  buildDailyTimeSeries,
  type AgentMetrics,
} from "@/lib/covalent";
import { shortAddress, CHAIN_LABELS } from "@/lib/agents";
import { Button } from "@/components/ui/button";
import {
  Star,
  StarOff,
  ExternalLink,
  TrendingUp,
  Activity,
  Zap,
  Search,
  Plus,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect } from "react";

export default function MyTrackedAgents() {
  const { trackedAgents, untrackAgent, apiKey, metricsMap } = useApp();
  const navigate = useNavigate();
  const [agentMetrics, setAgentMetrics] = useState<Record<string, AgentMetrics>>({});
  const [loadingAddresses, setLoadingAddresses] = useState<Set<string>>(new Set());

  // Load metrics for tracked agents not already in metricsMap
  useEffect(() => {
    const toLoad = trackedAgents.filter(
      (a) => !metricsMap[a.address] && !agentMetrics[a.address],
    );
    if (!toLoad.length) return;

    setLoadingAddresses((prev) => {
      const next = new Set(prev);
      toLoad.forEach((a) => next.add(a.address));
      return next;
    });

    Promise.allSettled(
      toLoad.map(async (agent) => {
        const txs = await fetchTransactions(agent.chain, agent.address, apiKey, 50);
        const agentInfo = { ...agent, framework: (agent as any).framework ?? "Unknown" };
        const m = computeAgentMetrics(agentInfo, txs);
        return { address: agent.address, metrics: m };
      }),
    ).then((results) => {
      const updates: Record<string, AgentMetrics> = {};
      for (const result of results) {
        if (result.status === "fulfilled") {
          updates[result.value.address] = result.value.metrics;
        }
      }
      setAgentMetrics((prev) => ({ ...prev, ...updates }));
      setLoadingAddresses(new Set());
    });
  }, [trackedAgents, apiKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const allMetrics = (address: string) =>
    metricsMap[address] ?? agentMetrics[address];

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Star size={18} className="text-warning" />
            My Tracked Agents
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            {trackedAgents.length} agent{trackedAgents.length !== 1 ? "s" : ""} in your watchlist
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/leaderboard")}
          className="border-border text-foreground-muted gap-1.5 text-xs"
        >
          <Plus size={12} /> Add Agents
        </Button>
      </div>

      {/* Empty state */}
      {trackedAgents.length === 0 && (
        <div className="card-glow rounded-xl bg-background-card p-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
            <Star size={24} className="text-primary" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">No agents tracked yet</p>
            <p className="text-sm text-foreground-muted mt-1 max-w-xs mx-auto">
              Search for any agent address in the top bar, or browse the leaderboard to start tracking.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Button
              onClick={() => navigate("/leaderboard")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
              size="sm"
            >
              <TrendingUp size={13} /> Browse Leaderboard
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const input = document.querySelector<HTMLInputElement>('input[placeholder*="Search agent"]');
                input?.focus();
              }}
              className="border-border gap-1.5"
            >
              <Search size={13} /> Search Address
            </Button>
          </div>
        </div>
      )}

      {/* Portfolio summary */}
      {trackedAgents.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <SummaryCard
              label="Tracked Agents"
              value={trackedAgents.length.toString()}
              icon={<Star size={13} className="text-warning" />}
            />
            <SummaryCard
              label="Total Txs"
              value={Object.values(agentMetrics)
                .concat(Object.values(metricsMap).filter((m) => trackedAgents.some((a) => a.address === m.address)))
                .reduce((a, m) => a + m.txCount, 0)
                .toLocaleString()}
              icon={<Activity size={13} className="text-primary" />}
            />
            <SummaryCard
              label="Avg Success Rate"
              value={(() => {
                const ms = trackedAgents.map((a) => allMetrics(a.address)).filter(Boolean) as AgentMetrics[];
                if (!ms.length) return "—";
                return `${(ms.reduce((a, m) => a + m.successRate, 0) / ms.length).toFixed(1)}%`;
              })()}
              icon={<TrendingUp size={13} className="text-success" />}
            />
            <SummaryCard
              label="Total Failures"
              value={trackedAgents.map((a) => allMetrics(a.address)).filter(Boolean).reduce((a, m) => a + (m?.failCount ?? 0), 0).toString()}
              icon={<Zap size={13} className="text-destructive" />}
            />
          </div>

          {/* Agent tiles grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trackedAgents.map((agent) => {
              const m = allMetrics(agent.address);
              const isLoading = loadingAddresses.has(agent.address);
              return (
                <AgentTile
                  key={agent.address}
                  agent={agent}
                  metrics={m}
                  isLoading={isLoading}
                  onView={() => navigate(`/agent/${agent.address}`)}
                  onUntrack={() => untrackAgent(agent.address)}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="card-glow rounded-xl bg-background-card p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] uppercase tracking-wider text-foreground-muted font-medium">{label}</p>
        {icon}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function AgentTile({
  agent,
  metrics,
  isLoading,
  onView,
  onUntrack,
}: {
  agent: { address: string; name: string; chain: string; addedAt: number };
  metrics?: AgentMetrics;
  isLoading: boolean;
  onView: () => void;
  onUntrack: () => void;
}) {
  // Mini sparkline data
  const spark = useMemo(() => {
    if (!metrics) return [];
    return buildDailyTimeSeries(metrics.recentTxs, 7);
  }, [metrics]);

  const successColor =
    !metrics || metrics.successRate === 0
      ? "text-foreground-muted"
      : metrics.successRate >= 90
      ? "text-success"
      : metrics.successRate >= 70
      ? "text-warning"
      : "text-destructive";

  return (
    <div
      className="card-glow rounded-xl bg-background-card p-4 cursor-pointer hover:border-primary/30 transition-all group"
      onClick={onView}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {agent.name}
          </p>
          <p className="text-[10px] font-mono text-foreground-subtle mt-0.5">
            {shortAddress(agent.address)}
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onUntrack(); }}
          className="text-warning hover:text-warning/60 transition-colors flex-shrink-0 mt-0.5"
          title="Remove from watchlist"
        >
          <StarOff size={14} />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <div className="h-12 bg-background-elevated rounded animate-shimmer bg-[length:200%_100%]" />
          <div className="h-4 w-1/2 bg-background-elevated rounded animate-shimmer bg-[length:200%_100%]" />
        </div>
      ) : metrics ? (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div>
              <p className="text-[9px] text-foreground-subtle uppercase tracking-wider">Txs</p>
              <p className="text-sm font-bold text-foreground">{metrics.txCount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[9px] text-foreground-subtle uppercase tracking-wider">Success</p>
              <p className={`text-sm font-bold ${successColor}`}>
                {metrics.successRate.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-[9px] text-foreground-subtle uppercase tracking-wider">Failures</p>
              <p className="text-sm font-bold text-destructive">{metrics.failCount}</p>
            </div>
          </div>

          {/* Sparkline */}
          {spark.length > 0 && (
            <div className="h-12 -mx-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spark} margin={{ top: 2, right: 2, bottom: 0, left: 2 }}>
                  <defs>
                    <linearGradient id={`spark-${agent.address.slice(2, 8)}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(182,100%,45%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(182,100%,45%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.length ? (
                        <div className="bg-background-elevated border border-border rounded px-2 py-1 text-[9px]">
                          {typeof payload[0]?.value === "number" ? payload[0].value.toFixed(0) : payload[0]?.value}% success
                        </div>
                      ) : null
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="successRate"
                    stroke="hsl(182,100%,45%)"
                    strokeWidth={1.5}
                    fill={`url(#spark-${agent.address.slice(2, 8)})`}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center gap-2 text-xs text-foreground-muted">
          <RefreshCw size={11} className="animate-spin" />
          <span>Loading…</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
        <span className="badge-info text-[9px] px-1.5 py-0.5 rounded">
          {CHAIN_LABELS[agent.chain as any] ?? agent.chain}
        </span>
        <span className="text-[9px] text-foreground-subtle">
          Added {new Date(agent.addedAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
