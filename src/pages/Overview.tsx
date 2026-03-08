/**
 * AgentPulse — Overview Page
 * KPI cards + 24h summary chart + top agents table linking to profiles
 */
import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { KpiCard } from "@/components/KpiCard";
import { useApp } from "@/contexts/AppContext";
import {
  Activity,
  CheckCircle2,
  Zap,
  Bot,
  ArrowRight,
  Star,
  StarOff,
} from "lucide-react";
import { buildDailyTimeSeries } from "@/lib/covalent";
import { CHAIN_LABELS, shortAddress } from "@/lib/agents";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.png";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background-elevated border border-border rounded-lg px-3 py-2 text-xs shadow-card-elevated">
      <p className="text-foreground-muted mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
          {p.name === "Success Rate" ? "%" : ""}
        </p>
      ))}
    </div>
  );
};

export default function Overview() {
  const { metricsMap, allTxs, isLoading, chain, isTracked, trackAgent, untrackAgent } = useApp();
  const navigate = useNavigate();
  const metrics = Object.values(metricsMap);

  const kpis = useMemo(() => {
    const now = Date.now();
    const ONE_DAY = 86_400_000;
    const txs24h = allTxs.filter(
      (tx) => now - new Date(tx.block_signed_at).getTime() < ONE_DAY,
    );
    const totalTx24h = txs24h.length;
    const success24h = txs24h.filter((t) => t.successful);
    const successRate = totalTx24h > 0 ? ((success24h.length / totalTx24h) * 100).toFixed(1) : "—";
    const gasValues = success24h.map((t) => t.gas_quote ?? 0).filter((v) => v > 0);
    const avgGasUsd =
      gasValues.length > 0
        ? (gasValues.reduce((a, b) => a + b, 0) / gasValues.length).toFixed(4)
        : "—";
    const activeAgents = metrics.filter((m) => m.last24hTxCount > 0).length;
    return { totalTx24h, successRate, avgGasUsd, activeAgents };
  }, [allTxs, metrics]);

  const timeSeries = useMemo(() => buildDailyTimeSeries(allTxs, 14), [allTxs]);

  const topAgents = useMemo(
    () => [...metrics].sort((a, b) => b.txCount - a.txCount).slice(0, 5),
    [metrics],
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
      {/* Hero banner */}
      <div
        className="relative rounded-2xl overflow-hidden border border-border-accent/30"
        style={{ minHeight: 160 }}
      >
        <img
          src={heroBg}
          alt="AgentPulse background"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-30"
        />
        <div className="relative z-10 p-6 flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-info text-[10px] font-semibold px-2 py-0.5 rounded-full animate-pulse-neon">LIVE</span>
            <span className="badge-info text-[10px] px-2 py-0.5 rounded-full">{CHAIN_LABELS[chain]}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neon leading-tight">AgentPulse</h1>
          <p className="text-sm text-foreground-muted max-w-lg">
            On-Chain AI Agent Performance Analytics — powered by ERC-8004 &amp; Covalent GoldRush.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="24h Agent Txs" value={isLoading ? "…" : kpis.totalTx24h.toLocaleString()} subValue="transactions last 24 hours" icon={<Activity size={14} />} accentColor="primary" loading={isLoading} />
        <KpiCard title="Overall Success Rate" value={isLoading ? "…" : `${kpis.successRate}%`} subValue="24h success / total" icon={<CheckCircle2 size={14} />} accentColor="success" loading={isLoading} />
        <KpiCard title="Avg Gas (Success)" value={isLoading ? "…" : kpis.avgGasUsd === "—" ? "—" : `$${kpis.avgGasUsd}`} subValue="USD per successful tx" icon={<Zap size={14} />} accentColor="warning" loading={isLoading} />
        <KpiCard title="Active Agents" value={isLoading ? "…" : kpis.activeAgents} subValue={`ERC-8004 registry on ${CHAIN_LABELS[chain]}`} icon={<Bot size={14} />} accentColor="secondary" loading={isLoading} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card-glow rounded-xl bg-background-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">Success Rate — 14 Days</h3>
          <p className="text-xs text-foreground-muted mt-0.5 mb-4">Daily agent transaction success %</p>
          {isLoading ? (
            <div className="h-48 bg-background-elevated rounded-lg animate-shimmer bg-[length:200%_100%]" />
          ) : allTxs.length === 0 ? (
            <EmptyChart message="No tx data yet — API key loading…" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={timeSeries} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="successGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(182,100%,45%)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(182,100%,45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(224,24%,14%)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(215,20%,50%)" }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(215,20%,50%)" }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="successRate" name="Success Rate" stroke="hsl(182,100%,45%)" strokeWidth={2} fill="url(#successGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card-glow rounded-xl bg-background-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">Tx Volume</h3>
          <p className="text-xs text-foreground-muted mt-0.5 mb-4">Daily transactions</p>
          {isLoading ? (
            <div className="h-48 bg-background-elevated rounded-lg animate-shimmer bg-[length:200%_100%]" />
          ) : allTxs.length === 0 ? (
            <EmptyChart message="Loading…" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={timeSeries} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(258,90%,66%)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(258,90%,66%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(224,24%,14%)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(215,20%,50%)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(215,20%,50%)" }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="txCount" name="Transactions" stroke="hsl(258,90%,66%)" strokeWidth={2} fill="url(#volGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top agents table */}
      <div className="card-glow rounded-xl bg-background-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Top Agents by Volume</h3>
            <p className="text-xs text-foreground-muted mt-0.5">{CHAIN_LABELS[chain]} · click to view full profile</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/leaderboard")} className="text-primary text-xs gap-1 h-7">
            Full Leaderboard <ArrowRight size={11} />
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-background-elevated rounded animate-shimmer bg-[length:200%_100%]" />
            ))}
          </div>
        ) : topAgents.length === 0 ? (
          <p className="text-sm text-foreground-muted text-center py-8">
            Loading agent data…
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-foreground-muted border-b border-border">
                  <th className="text-left pb-2 font-medium">Agent</th>
                  <th className="text-right pb-2 font-medium">Txs</th>
                  <th className="text-right pb-2 font-medium">Success %</th>
                  <th className="text-right pb-2 font-medium hidden sm:table-cell">Avg Gas</th>
                  <th className="text-right pb-2 font-medium hidden sm:table-cell">Framework</th>
                  <th className="text-right pb-2 font-medium">Track</th>
                </tr>
              </thead>
              <tbody>
                {topAgents.map((agent) => {
                  const tracked = isTracked(agent.address);
                  return (
                    <tr
                      key={agent.address}
                      className="border-b border-border/40 table-row-hover cursor-pointer group"
                      onClick={() => navigate(`/agent/${agent.address}`)}
                    >
                      <td className="py-2.5 pr-3">
                        <div>
                          <p className="font-medium text-foreground group-hover:text-primary transition-colors">{agent.name}</p>
                          <p className="text-foreground-subtle font-mono">{shortAddress(agent.address)}</p>
                        </div>
                      </td>
                      <td className="text-right py-2.5 text-foreground">{agent.txCount.toLocaleString()}</td>
                      <td className="text-right py-2.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          agent.successRate >= 90 ? "badge-success" : agent.successRate >= 70 ? "badge-warning" : "badge-error"
                        }`}>
                          {agent.successRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-right py-2.5 text-foreground-muted hidden sm:table-cell">
                        {agent.avgGasUsd > 0 ? `$${agent.avgGasUsd.toFixed(4)}` : "—"}
                      </td>
                      <td className="text-right py-2.5 hidden sm:table-cell">
                        <span className="badge-info px-1.5 py-0.5 rounded text-[10px]">{agent.framework}</span>
                      </td>
                      <td className="text-right py-2.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (tracked) {
                              untrackAgent(agent.address);
                            } else {
                              trackAgent({ address: agent.address, name: agent.name, chain: agent.chain, addedAt: Date.now() });
                            }
                          }}
                          className={`p-1 rounded transition-colors ${tracked ? "text-warning" : "text-foreground-subtle hover:text-warning"}`}
                        >
                          {tracked ? <StarOff size={12} /> : <Star size={12} />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-48 flex items-center justify-center text-xs text-foreground-subtle border border-border/40 rounded-lg bg-background-elevated/30">
      {message}
    </div>
  );
}
