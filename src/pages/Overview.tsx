/**
 * AgentPulse — Premium Overview Page (Birdeye-style)
 * Hero section, animated KPI cards, area charts, top agents
 */
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useApp } from "@/contexts/AppContext";
import { buildDailyTimeSeries } from "@/lib/covalent";
import { CHAIN_LABELS, shortAddress } from "@/lib/agents";
import { Button } from "@/components/ui/button";
import {
  Activity, CheckCircle2, Zap, Bot, ArrowRight,
  Star, StarOff, RefreshCw, TrendingUp, TrendingDown,
} from "lucide-react";

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background-card border border-border rounded-xl px-3.5 py-2.5 text-xs shadow-card-elevated">
      <p className="text-foreground-muted mb-1.5 font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="font-semibold" style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
          {p.name?.includes("Rate") || p.name?.includes("%") ? "%" : ""}
        </p>
      ))}
    </div>
  );
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.35 } }),
};

export default function Overview() {
  const { metricsMap, allTxs, isLoading, chain, isTracked, trackAgent, untrackAgent, hasLoaded, refresh } = useApp();
  const navigate = useNavigate();
  const metrics = Object.values(metricsMap);

  const kpis = useMemo(() => {
    const now = Date.now();
    const ONE_DAY = 86_400_000;
    const txs24h = allTxs.filter(tx => now - new Date(tx.block_signed_at).getTime() < ONE_DAY);
    const success24h = txs24h.filter(t => t.successful);
    const successRate = txs24h.length > 0 ? ((success24h.length / txs24h.length) * 100).toFixed(1) : "—";
    const gasValues = success24h.map(t => t.gas_quote ?? 0).filter(v => v > 0);
    const avgGasUsd = gasValues.length > 0 ? (gasValues.reduce((a, b) => a + b, 0) / gasValues.length).toFixed(4) : "—";
    const activeAgents = metrics.filter(m => m.last24hTxCount > 0).length;
    return { totalTx24h: txs24h.length, successRate, avgGasUsd, activeAgents };
  }, [allTxs, metrics]);

  const timeSeries = useMemo(() => buildDailyTimeSeries(allTxs, 14), [allTxs]);
  const topAgents = useMemo(() => [...metrics].sort((a, b) => b.txCount - a.txCount).slice(0, 6), [metrics]);

  return (
    <div className="p-4 sm:p-6 space-y-8">
      {/* Hero section */}
      <div className="relative rounded-2xl overflow-hidden border border-border"
        style={{ background: "linear-gradient(135deg, hsl(0 0% 7%) 0%, hsl(0 0% 6%) 100%)" }}>
        {/* Background glow */}
        <div className="absolute inset-0 bg-hero-glow opacity-80" />
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />

        <div className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="badge-info text-[10px] font-semibold px-2.5 py-1 rounded-full">
                {CHAIN_LABELS[chain]}
              </span>
              {hasLoaded && (
                <span className="flex items-center gap-1.5 text-[10px] text-primary font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary pulse-neon" /> Live Data
                </span>
              )}
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight leading-none">
                Agent<span className="text-neon">Pulse</span>
              </h1>
              <p className="text-sm text-foreground-muted mt-2 max-w-md leading-relaxed">
                On-Chain AI Agent Performance Analytics — ERC-8004 & Covalent GoldRush. Track, analyze, and debug AI agents in real time.
              </p>
            </div>
          </div>

          <Button onClick={refresh} disabled={isLoading}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shadow-neon font-bold h-11 px-6 text-sm flex-shrink-0 rounded-xl">
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            {isLoading ? "Loading…" : hasLoaded ? "Refresh Data" : "Load Data"}
          </Button>
        </div>
      </div>

      {/* No-data prompt */}
      {!hasLoaded && !isLoading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="card-glass rounded-2xl border border-border p-12 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
            <Bot size={24} className="text-primary" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">No data loaded yet</p>
            <p className="text-sm text-foreground-muted mt-2 max-w-sm mx-auto">
              Click "Load Data" to fetch live on-chain metrics from Covalent GoldRush for all tracked agents.
            </p>
          </div>
          <Button onClick={refresh}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shadow-neon font-semibold rounded-xl">
            <RefreshCw size={13} /> Load Data Now
          </Button>
        </motion.div>
      )}

      {/* KPI Cards */}
      {(hasLoaded || isLoading) && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "24h Agent Txs", value: isLoading ? "—" : kpis.totalTx24h.toLocaleString(), sub: "transactions last 24h", icon: <Activity size={15} />, color: "primary" as const },
              { title: "Success Rate", value: isLoading ? "—" : `${kpis.successRate}%`, sub: "24h success / total", icon: <CheckCircle2 size={15} />, color: "success" as const },
              { title: "Avg Gas (Success)", value: isLoading ? "—" : kpis.avgGasUsd === "—" ? "—" : `$${kpis.avgGasUsd}`, sub: "USD per successful tx", icon: <Zap size={15} />, color: "warning" as const },
              { title: "Active Agents", value: isLoading ? "—" : kpis.activeAgents, sub: `ERC-8004 on ${CHAIN_LABELS[chain]}`, icon: <Bot size={15} />, color: "secondary" as const },
            ].map((kpi, i) => (
              <motion.div key={kpi.title} custom={i} initial="hidden" animate="visible" variants={cardVariants}>
                <PremiumKpiCard {...kpi} loading={isLoading} />
              </motion.div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Main chart */}
            <div className="lg:col-span-3 card-glass rounded-2xl border border-border p-5 sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Success Rate Trend</h3>
                  <p className="text-xs text-foreground-muted mt-0.5">14-day daily agent success %</p>
                </div>
                <span className="text-xs text-primary font-semibold bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                  {timeSeries.length > 0 ? `${timeSeries[timeSeries.length - 1]?.successRate ?? 0}% today` : "—"}
                </span>
              </div>
              {isLoading ? (
                <div className="h-52 bg-background-elevated rounded-xl animate-shimmer" />
              ) : allTxs.length === 0 ? (
                <EmptyChart />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={timeSeries} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="successGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142,76%,48%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(142,76%,48%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,12%)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(0,0%,45%)" }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(0,0%,45%)" }} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="successRate" name="Success Rate" stroke="hsl(142,76%,48%)" strokeWidth={2.5} fill="url(#successGrad)" dot={false} activeDot={{ r: 5, fill: "hsl(142,76%,48%)" }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Volume chart */}
            <div className="lg:col-span-2 card-glass rounded-2xl border border-border p-5 sm:p-6">
              <div className="mb-5">
                <h3 className="text-sm font-bold text-foreground">Tx Volume</h3>
                <p className="text-xs text-foreground-muted mt-0.5">Daily transaction count</p>
              </div>
              {isLoading ? (
                <div className="h-52 bg-background-elevated rounded-xl animate-shimmer" />
              ) : allTxs.length === 0 ? (
                <EmptyChart />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={timeSeries} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(220,100%,60%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(220,100%,60%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,12%)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(0,0%,45%)" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(0,0%,45%)" }} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="txCount" name="Transactions" stroke="hsl(220,100%,60%)" strokeWidth={2} fill="url(#volGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top agents */}
          <div className="card-glass rounded-2xl border border-border p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-bold text-foreground">Top Agents by Volume</h3>
                <p className="text-xs text-foreground-muted mt-0.5">{CHAIN_LABELS[chain]} · Click row to view full profile</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/leaderboard")}
                className="text-primary text-xs gap-1.5 h-8 hover:bg-primary/10 rounded-lg">
                Full Leaderboard <ArrowRight size={11} />
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-2.5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 bg-background-elevated rounded-xl animate-shimmer" />
                ))}
              </div>
            ) : topAgents.length === 0 ? (
              <p className="text-sm text-foreground-muted text-center py-10">
                No agent data — click "Load Data" to fetch.
              </p>
            ) : (
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-xs min-w-[500px]">
                  <thead>
                    <tr className="text-foreground-subtle text-[10px] uppercase tracking-wider">
                      <th className="text-left pb-3 font-semibold">#</th>
                      <th className="text-left pb-3 font-semibold">Agent</th>
                      <th className="text-right pb-3 font-semibold">Txs</th>
                      <th className="text-right pb-3 font-semibold">Success</th>
                      <th className="text-right pb-3 font-semibold hidden sm:table-cell">Avg Gas</th>
                      <th className="text-right pb-3 font-semibold hidden md:table-cell">Framework</th>
                      <th className="text-right pb-3 font-semibold">Track</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topAgents.map((agent, idx) => {
                      const tracked = isTracked(agent.address);
                      return (
                        <tr key={agent.address}
                          className="border-t border-border/50 table-row-hover cursor-pointer group"
                          onClick={() => navigate(`/agent/${agent.address}`)}>
                          <td className="py-3.5 pr-3 text-foreground-subtle font-medium">{idx + 1}</td>
                          <td className="py-3.5 pr-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center flex-shrink-0">
                                <Zap size={11} className="text-primary" />
                              </div>
                              <div>
                                <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                  {agent.name}
                                </p>
                                <p className="text-foreground-subtle font-mono text-[10px]">{shortAddress(agent.address)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 pr-3 text-right font-semibold text-foreground">{agent.txCount.toLocaleString()}</td>
                          <td className="py-3.5 pr-3 text-right">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                              agent.successRate >= 90 ? "badge-success" : agent.successRate >= 70 ? "badge-warning" : "badge-error"
                            }`}>
                              {agent.successRate.toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-3.5 pr-3 text-right text-foreground-muted hidden sm:table-cell">
                            {agent.avgGasUsd > 0 ? `$${agent.avgGasUsd.toFixed(4)}` : "—"}
                          </td>
                          <td className="py-3.5 pr-3 text-right hidden md:table-cell">
                            <span className="badge-info px-2 py-0.5 rounded-lg text-[10px] font-medium">{agent.framework}</span>
                          </td>
                          <td className="py-3.5 text-right">
                            <button onClick={e => {
                              e.stopPropagation();
                              tracked
                                ? untrackAgent(agent.address)
                                : trackAgent({ address: agent.address, name: agent.name, chain: agent.chain, addedAt: Date.now() });
                            }} className={`p-1.5 rounded-lg transition-all ${tracked ? "text-warning bg-warning/10" : "text-foreground-subtle hover:text-warning hover:bg-warning/10"}`}>
                              {tracked ? <StarOff size={13} /> : <Star size={13} />}
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
        </>
      )}
    </div>
  );
}

function PremiumKpiCard({
  title, value, sub, icon, color, loading
}: {
  title: string; value: string | number; sub: string; icon: React.ReactNode;
  color: "primary" | "success" | "warning" | "secondary"; loading?: boolean;
}) {
  const colorMap = {
    primary: { text: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
    success: { text: "text-success", bg: "bg-success/10", border: "border-success/20" },
    warning: { text: "text-warning", bg: "bg-warning/10", border: "border-warning/20" },
    secondary: { text: "text-secondary", bg: "bg-secondary/10", border: "border-secondary/20" },
  };
  const c = colorMap[color];

  return (
    <div className="card-glass rounded-2xl border border-border p-5 hover:border-border-accent/40 transition-all">
      <div className="flex items-start justify-between mb-4">
        <p className="text-[10px] uppercase tracking-widest text-foreground-subtle font-semibold">{title}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.bg} border ${c.border} ${c.text}`}>
          {icon}
        </div>
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="h-8 w-3/4 rounded-lg bg-background-elevated animate-shimmer" />
          <div className="h-3 w-1/2 rounded-md bg-background-elevated animate-shimmer" />
        </div>
      ) : (
        <>
          <p className={`text-3xl font-black tracking-tight num-ticker ${c.text}`}>{value}</p>
          <p className="text-[11px] text-foreground-muted mt-1.5">{sub}</p>
        </>
      )}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-52 flex items-center justify-center text-xs text-foreground-subtle border border-border/30 rounded-xl bg-background-elevated/20">
      No data loaded
    </div>
  );
}
