/**
 * Agentpuls — Agent Profile Page (Birdeye token page style)
 * Hero header, stat grid, main chart, tabs (Overview/Performance/Failures/History)
 * AgentProfile fetches its own data on-demand using the user's API key.
 * If no user key, shows demo data from metricsMap.
 */
import { useMemo, useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useApp } from "@/contexts/AppContext";
import {
  fetchTransactions, computeAgentMetrics, buildDailyTimeSeries,
  buildFailureBreakdown, parseFailureReason,
  type AgentMetrics, type CovalentTx,
} from "@/lib/covalent";
import { buildDemoTimeSeries } from "@/lib/demoData";
import { KNOWN_AGENTS, shortAddress, CHAIN_LABELS, type SupportedChain } from "@/lib/agents";
import { exportToCsv } from "@/lib/exportCsv";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Star, StarOff, ExternalLink, Copy, CheckCircle2,
  Share2, Download, RefreshCw, Zap, Activity, AlertTriangle,
  Shield, Clock, KeyRound, Info,
} from "lucide-react";

const CHAIN_EXPLORER: Record<string, string> = {
  "base-mainnet": "https://basescan.org/address/",
  "eth-mainnet": "https://etherscan.io/address/",
  "avalanche-mainnet": "https://snowtrace.io/address/",
};

const TX_EXPLORER: Record<string, string> = {
  "base-mainnet": "https://basescan.org/tx/",
  "eth-mainnet": "https://etherscan.io/tx/",
  "avalanche-mainnet": "https://snowtrace.io/tx/",
};

const FAILURE_COLORS = [
  "hsl(0,84%,60%)", "hsl(38,100%,55%)", "hsl(220,100%,60%)",
  "hsl(142,76%,48%)", "hsl(280,80%,65%)",
];

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background-card border border-border rounded-xl px-3.5 py-2.5 text-xs shadow-card-elevated">
      <p className="text-foreground-muted mb-1 font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="font-semibold" style={{ color: p.color || p.fill }}>
          {p.name}: {typeof p.value === "number" ? p.value.toFixed(2) : p.value}
          {p.name?.includes("Rate") ? "%" : ""}
        </p>
      ))}
    </div>
  );
};

const TABS = ["Overview", "Performance", "Failures", "Transactions"] as const;
type Tab = typeof TABS[number];

const DEBUG_TIPS: Record<string, string> = {
  "Slippage Exceeded": "Increase slippage tolerance (0.5% → 1–3%) or use limit orders. Check liquidity depth before swapping.",
  "Gas Limit Exceeded": "Increase gas limit by 20–30%. Complex DeFi ops need ≥500k gas. Use gasEstimate() before submitting.",
  "Execution Reverted": "Transaction logic failed. Check contract state, token balances, and ERC-20 approval amounts.",
  "Insufficient Balance": "Ensure wallet holds enough tokens + gas. Check for pending txs consuming balance.",
  "Nonce Too Low": "Nonce conflict — wait for pending txs to clear or manually reset nonce in wallet settings.",
  "Deadline Exceeded": "Transaction too slow — increase deadline window (300s → 600s) or boost gas price.",
  "Access Denied": "Caller lacks required role or allowance. Verify permissions and token approvals.",
  "Unknown Revert": "Check contract source code. Use Tenderly to trace the exact revert reason on-chain.",
};

const ETH_ADDR_RE = /^0x[0-9a-fA-F]{40}$/;

export default function AgentProfile() {
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const { apiKey, hasUserKey, chain, metricsMap, trackAgent, untrackAgent, isTracked } = useApp();

  const isValidAddress = !!address && ETH_ADDR_RE.test(address);

  const [txs, setTxs] = useState<CovalentTx[]>([]);
  const [liveMetrics, setLiveMetrics] = useState<AgentMetrics | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [profileChain, setProfileChain] = useState<SupportedChain>(chain);

  const knownAgent = KNOWN_AGENTS.find(a => a.address.toLowerCase() === address?.toLowerCase());
  const agentName = knownAgent?.name ?? `Agent ${shortAddress(address ?? "")}`;
  const tracked = isTracked(address ?? "");

  // Use live metrics if loaded, else fall back to metricsMap (demo) data
  const demoMetrics = address ? metricsMap[address] ?? metricsMap[address.toLowerCase()] : null;
  const metrics = liveMetrics ?? demoMetrics;
  const isShowingDemo = !liveMetrics && !!demoMetrics;

  const loadLiveData = useCallback(async () => {
    if (!address || !isValidAddress || !hasUserKey) return;
    setIsLoadingProfile(true);
    setError(null);
    try {
      const data = await fetchTransactions(profileChain, address, apiKey, 100);
      setTxs(data);
      const info = knownAgent ?? { address, name: agentName, chain: profileChain, framework: "Unknown" as const };
      setLiveMetrics(computeAgentMetrics(info, data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setIsLoadingProfile(false);
    }
  }, [address, profileChain, apiKey, hasUserKey]); // eslint-disable-line

  // Build time series
  const timeSeries = useMemo(() => {
    if (txs.length > 0) return buildDailyTimeSeries(txs, 14);
    if (demoMetrics) return buildDemoTimeSeries(demoMetrics.successRate, 14);
    return buildDemoTimeSeries(90, 14);
  }, [txs, demoMetrics]);

  const failureBreakdown = useMemo(() => buildFailureBreakdown(txs), [txs]);
  const failedTxs = useMemo(() => txs.filter(t => !t.successful), [txs]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isValidAddress) return (
    <div className="p-8 flex flex-col items-center justify-center gap-4 text-center">
      <p className="text-destructive font-semibold text-sm">Invalid agent address format.</p>
      <button onClick={() => navigate("/")} className="text-primary text-xs underline">
        ← Back to Bubble Map
      </button>
    </div>
  );

  const successColorClass = metrics
    ? metrics.successRate >= 90 ? "text-success" : metrics.successRate >= 70 ? "text-warning" : "text-destructive"
    : "text-foreground-muted";

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      {/* Back nav */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-6">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs text-foreground-muted hover:text-foreground transition-colors mb-5 group">
          <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" /> Back
        </button>
      </div>

      {/* ─── Hero Header ─── */}
      <div className="px-4 sm:px-6 pb-6">
        <div className="relative rounded-2xl border border-border overflow-hidden"
          style={{ background: "linear-gradient(135deg, hsl(0 0% 7%) 0%, hsl(0 0% 6%) 100%)" }}>
          <div className="absolute inset-0 bg-hero-glow opacity-60" />
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/4 blur-3xl" />

          <div className="relative z-10 p-5 sm:p-7">
            {/* Demo data notice */}
            {isShowingDemo && (
              <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-warning/8 border border-warning/15 rounded-xl text-xs text-warning">
                <Info size={11} />
                <span>Showing demo data. Add your GoldRush key and click "Load Live Data" for real transactions.</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-start gap-5">
              {/* Avatar */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary/25 to-primary/10 border border-primary/25 flex items-center justify-center flex-shrink-0 shadow-neon-sm">
                <Zap size={28} className="text-primary" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">{agentName}</h1>
                  {knownAgent && (
                    <span className="badge-info text-[10px] px-2.5 py-1 rounded-full font-semibold">
                      {knownAgent.framework}
                    </span>
                  )}
                  {metrics && (
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      metrics.successRate >= 90 ? "badge-success" : metrics.successRate >= 70 ? "badge-warning" : "badge-error"
                    }`}>
                      {metrics.successRate.toFixed(1)}% success
                    </span>
                  )}
                  {isShowingDemo && (
                    <span className="text-[9px] font-medium px-2 py-1 rounded-full bg-warning/10 border border-warning/20 text-warning">
                      DEMO
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-foreground-muted truncate max-w-xs">{address}</span>
                  <button onClick={() => copyToClipboard(address)}
                    className="text-foreground-subtle hover:text-primary transition-colors p-1 rounded-md hover:bg-primary/10">
                    {copied ? <CheckCircle2 size={12} className="text-primary" /> : <Copy size={12} />}
                  </button>
                </div>
                {knownAgent?.description && (
                  <p className="text-xs text-foreground-muted mt-2 max-w-lg">{knownAgent.description}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                {/* Chain selector */}
                <div className="flex gap-1 p-1 bg-background-elevated rounded-xl border border-border">
                  {(["base-mainnet", "eth-mainnet", "avalanche-mainnet"] as SupportedChain[]).map(c => (
                    <button key={c} onClick={() => setProfileChain(c)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                        profileChain === c
                          ? "bg-primary/15 border border-primary/40 text-primary"
                          : "text-foreground-muted hover:text-foreground"
                      }`}>
                      {CHAIN_LABELS[c]}
                    </button>
                  ))}
                </div>

                {/* Track */}
                <Button variant="outline" size="sm"
                  onClick={() => {
                    if (!address) return;
                    tracked
                      ? untrackAgent(address)
                      : trackAgent({ address, name: agentName, chain: profileChain, addedAt: Date.now() });
                  }}
                  className={`gap-2 h-9 text-xs rounded-xl border transition-all ${
                    tracked ? "border-warning/40 text-warning hover:bg-warning/10" : "border-border text-foreground-muted hover:border-primary/40 hover:text-primary"
                  }`}>
                  {tracked ? <StarOff size={12} /> : <Star size={12} />}
                  {tracked ? "Untrack" : "Track Agent"}
                </Button>

                {/* Share */}
                <Button variant="outline" size="sm"
                  onClick={() => copyToClipboard(`${window.location.origin}/agent/${address}`)}
                  className="gap-2 h-9 text-xs border-border text-foreground-muted hover:border-primary/40 rounded-xl">
                  <Share2 size={12} /> Share
                </Button>

                {/* Explorer */}
                {CHAIN_EXPLORER[profileChain] && (
                  <a href={`${CHAIN_EXPLORER[profileChain]}${address}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs border border-border text-foreground-muted hover:border-primary/40 hover:text-primary transition-all">
                    Explorer <ExternalLink size={10} />
                  </a>
                )}

                {/* Load live data button */}
                {hasUserKey ? (
                  <Button variant="ghost" size="sm" onClick={loadLiveData} disabled={isLoadingProfile}
                    className="h-9 px-3 hover:bg-accent/50 rounded-xl gap-1.5 text-xs text-foreground-muted hover:text-foreground">
                    <RefreshCw size={13} className={isLoadingProfile ? "animate-spin text-primary" : ""} />
                    {isLoadingProfile ? "Loading…" : "Load Live"}
                  </Button>
                ) : (
                  <div className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs border border-dashed border-border/50 text-foreground-subtle cursor-default"
                    title="Add GoldRush key in Settings for live data">
                    <KeyRound size={11} className="text-primary/60" /> Live data
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 sm:mx-6 mb-4 flex items-center gap-2 px-4 py-3 bg-destructive/8 border border-destructive/25 rounded-xl text-xs text-destructive">
          <AlertTriangle size={12} /> {error}
        </div>
      )}

      {/* ─── KPI Stats Grid ─── */}
      <div className="px-4 sm:px-6 mb-6">
        {isLoadingProfile ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 card-glass border border-border rounded-2xl animate-shimmer" />
            ))}
          </div>
        ) : metrics ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Txs", value: metrics.txCount.toLocaleString(), icon: <Activity size={14} className="text-primary" />, accent: "text-primary" },
              { label: "Success Rate", value: `${metrics.successRate.toFixed(1)}%`, icon: <Shield size={14} className={successColorClass} />, accent: successColorClass },
              { label: "Avg Gas USD", value: metrics.avgGasUsd > 0 ? `$${metrics.avgGasUsd.toFixed(4)}` : "—", icon: <Zap size={14} className="text-warning" />, accent: "text-warning" },
              { label: "24h Txs", value: metrics.last24hTxCount.toString(), icon: <Clock size={14} className="text-secondary" />, accent: "text-secondary" },
            ].map((s, i) => (
              <motion.div key={s.label}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="card-glass rounded-2xl border border-border p-5 hover:border-border-accent/40 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] uppercase tracking-widest text-foreground-subtle font-semibold">{s.label}</p>
                  <div className="w-8 h-8 rounded-lg bg-background-elevated border border-border flex items-center justify-center">{s.icon}</div>
                </div>
                <p className={`text-2xl sm:text-3xl font-black tracking-tight num-ticker ${s.accent}`}>{s.value}</p>
              </motion.div>
            ))}
          </div>
        ) : null}
      </div>

      {/* ─── Tabs ─── */}
      <div className="px-4 sm:px-6 mb-5">
        <div className="flex gap-1 p-1 bg-background-elevated rounded-xl border border-border w-fit overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap ${
                activeTab === tab
                  ? "bg-background-card text-foreground border border-border shadow-sm"
                  : "text-foreground-muted hover:text-foreground"
              }`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Tab Content ─── */}
      <div className="px-4 sm:px-6 pb-8">
        <AnimatePresence mode="wait">
          {/* Overview tab */}
          {activeTab === "Overview" && (
            <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Success rate chart */}
              <div className="card-glass rounded-2xl border border-border p-5 sm:p-6">
                <h3 className="text-sm font-bold text-foreground mb-1">Success Rate — 14 Day</h3>
                <p className="text-xs text-foreground-muted mb-5">Daily % of successful transactions</p>
                {isLoadingProfile ? <div className="h-48 bg-background-elevated rounded-xl animate-shimmer" /> : (
                  <ResponsiveContainer width="100%" height={190}>
                    <AreaChart data={timeSeries} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id="ag-sg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(142,76%,48%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(142,76%,48%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,12%)" />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(0,0%,45%)" }} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "hsl(0,0%,45%)" }} tickLine={false} axisLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="successRate" name="Success Rate %" stroke="hsl(142,76%,48%)" strokeWidth={2.5} fill="url(#ag-sg)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Failure pie / empty state */}
              {failureBreakdown.length > 0 ? (
                <div className="card-glass rounded-2xl border border-border p-5 sm:p-6">
                  <h3 className="text-sm font-bold text-foreground mb-1">Failure Breakdown</h3>
                  <p className="text-xs text-foreground-muted mb-5">By revert reason (live data only)</p>
                  {isLoadingProfile ? <div className="h-48 bg-background-elevated rounded-xl animate-shimmer" /> : (
                    <div className="flex items-center gap-4">
                      <ResponsiveContainer width={140} height={140}>
                        <PieChart>
                          <Pie data={failureBreakdown} cx="50%" cy="50%" innerRadius={38} outerRadius={58}
                            dataKey="count" paddingAngle={2}>
                            {failureBreakdown.map((_, i) => (
                              <Cell key={i} fill={FAILURE_COLORS[i % FAILURE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v, n) => [v, n]} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex-1 space-y-1.5">
                        {failureBreakdown.slice(0, 5).map((f, i) => (
                          <div key={f.reason} className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: FAILURE_COLORS[i % FAILURE_COLORS.length] }} />
                            <span className="text-[10px] text-foreground-muted flex-1 truncate">{f.reason}</span>
                            <span className="text-[10px] font-bold text-foreground">{f.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="card-glass rounded-2xl border border-border p-5 sm:p-6 flex items-center justify-center min-h-[200px]">
                  <div className="text-center space-y-3">
                    {hasUserKey ? (
                      <>
                        <CheckCircle2 size={28} className="text-success mx-auto" />
                        <p className="text-sm font-semibold text-foreground">No failures detected</p>
                        <p className="text-xs text-foreground-muted">Load live data to see failure analysis</p>
                      </>
                    ) : (
                      <>
                        <KeyRound size={28} className="text-primary/50 mx-auto" />
                        <p className="text-sm font-semibold text-foreground">Add API key for failure analysis</p>
                        <p className="text-xs text-foreground-muted">Live failure breakdown requires a GoldRush key</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Performance tab */}
          {activeTab === "Performance" && (
            <motion.div key="performance" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-4">
              <div className="card-glass rounded-2xl border border-border p-5 sm:p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Transaction Volume — 14 Day</h3>
                    <p className="text-xs text-foreground-muted mt-0.5">Daily tx count</p>
                  </div>
                  {txs.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => exportToCsv(timeSeries as any, "agent_timeseries")}
                      className="text-foreground-muted gap-1.5 h-7 text-xs">
                      <Download size={11} /> CSV
                    </Button>
                  )}
                </div>
                {isLoadingProfile ? <div className="h-52 bg-background-elevated rounded-xl animate-shimmer" /> : (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={timeSeries} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id="ag-vg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(220,100%,60%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(220,100%,60%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,12%)" />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(0,0%,45%)" }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: "hsl(0,0%,45%)" }} tickLine={false} axisLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="txCount" name="Transactions" stroke="hsl(220,100%,60%)" strokeWidth={2} fill="url(#ag-vg)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Gas efficiency */}
              <div className="card-glass rounded-2xl border border-border p-5 sm:p-6">
                <h3 className="text-sm font-bold text-foreground mb-1">Gas Efficiency</h3>
                <p className="text-xs text-foreground-muted mb-5">Average USD per successful transaction</p>
                {isLoadingProfile ? <div className="h-48 bg-background-elevated rounded-xl animate-shimmer" /> : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={timeSeries} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,12%)" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(0,0%,45%)" }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: "hsl(0,0%,45%)" }} tickLine={false} axisLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="gasUsd" name="Avg Gas USD" fill="hsl(38,100%,55%)" radius={[3, 3, 0, 0]} fillOpacity={0.8} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </motion.div>
          )}

          {/* Failures tab */}
          {activeTab === "Failures" && (
            <motion.div key="failures" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-4">
              {failedTxs.length === 0 ? (
                <div className="card-glass rounded-2xl border border-border p-12 text-center space-y-4">
                  {hasUserKey ? (
                    <>
                      <CheckCircle2 size={32} className="text-success mx-auto" />
                      <p className="text-base font-bold text-foreground">No failures in loaded data</p>
                      <p className="text-sm text-foreground-muted">Load live data to analyze failures for this agent.</p>
                    </>
                  ) : (
                    <>
                      <KeyRound size={32} className="text-primary/50 mx-auto" />
                      <p className="text-base font-bold text-foreground">Live data required</p>
                      <p className="text-sm text-foreground-muted max-w-sm mx-auto">
                        Add your GoldRush API key in Settings to load real failure data with revert reasons and debug tips.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <>
                  {/* Debug tips */}
                  {failureBreakdown.length > 0 && (
                    <div className="card-glass rounded-2xl border border-border p-5 sm:p-6">
                      <h3 className="text-sm font-bold text-foreground mb-4">Debug Tips</h3>
                      <div className="space-y-3">
                        {failureBreakdown.slice(0, 4).map((f, i) => (
                          <div key={f.reason} className="flex items-start gap-3 p-3.5 rounded-xl bg-background-elevated border border-border/50">
                            <span className="w-2 h-2 rounded-sm mt-1 flex-shrink-0" style={{ background: FAILURE_COLORS[i % FAILURE_COLORS.length] }} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-semibold text-foreground">{f.reason}</p>
                                <span className="badge-error text-[9px] px-1.5 py-0.5 rounded-md">{f.count} failures</span>
                              </div>
                              <p className="text-[11px] text-foreground-muted leading-relaxed">
                                {DEBUG_TIPS[f.reason] ?? "Check contract source and transaction trace for details."}
                              </p>
                              <p className="text-[10px] text-warning mt-1">Gas wasted: ${f.gasWasted.toFixed(4)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Failed txs list */}
                  <div className="card-glass rounded-2xl border border-border p-5 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-foreground">Failed Transactions ({failedTxs.length})</h3>
                      <Button variant="ghost" size="sm"
                        onClick={() => exportToCsv(failedTxs.map(t => ({
                          hash: t.tx_hash, time: t.block_signed_at,
                          reason: parseFailureReason(t), gas_wasted: t.gas_quote?.toFixed(6)
                        })), "failures")}
                        className="text-foreground-muted gap-1.5 h-7 text-xs">
                        <Download size={11} /> CSV
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs min-w-[480px]">
                        <thead>
                          <tr className="border-b border-border text-foreground-subtle text-[10px] uppercase tracking-wider">
                            <th className="text-left pb-2 font-semibold">Time</th>
                            <th className="text-left pb-2 font-semibold hidden sm:table-cell">Tx Hash</th>
                            <th className="text-left pb-2 font-semibold">Reason</th>
                            <th className="text-right pb-2 font-semibold">Gas Wasted</th>
                            <th className="text-right pb-2 font-semibold">Link</th>
                          </tr>
                        </thead>
                        <tbody>
                          {failedTxs.slice(0, 25).map(tx => (
                            <tr key={tx.tx_hash} className="border-b border-border/40 table-row-hover">
                              <td className="py-2.5 pr-3 text-foreground-muted whitespace-nowrap">
                                {new Date(tx.block_signed_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </td>
                              <td className="py-2.5 pr-3 hidden sm:table-cell font-mono text-foreground-subtle">
                                {shortAddress(tx.tx_hash)}
                              </td>
                              <td className="py-2.5 pr-3">
                                <span className="badge-error text-[9px] px-1.5 py-0.5 rounded-md font-medium">
                                  {parseFailureReason(tx)}
                                </span>
                              </td>
                              <td className="py-2.5 pr-3 text-right text-warning">
                                {tx.gas_quote > 0 ? `$${tx.gas_quote.toFixed(6)}` : `${tx.gas_spent.toLocaleString()} gas`}
                              </td>
                              <td className="py-2.5 text-right">
                                {TX_EXPLORER[profileChain] && (
                                  <a href={`${TX_EXPLORER[profileChain]}${tx.tx_hash}`} target="_blank" rel="noopener noreferrer"
                                    className="text-foreground-subtle hover:text-primary transition-colors">
                                    <ExternalLink size={11} />
                                  </a>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Transactions tab */}
          {activeTab === "Transactions" && (
            <motion.div key="transactions" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="card-glass rounded-2xl border border-border p-5 sm:p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Recent Transactions</h3>
                    <p className="text-xs text-foreground-muted mt-0.5">
                      {txs.length > 0 ? `${txs.length} transactions loaded` : "Load live data to see transactions"}
                    </p>
                  </div>
                  {txs.length > 0 && (
                    <Button variant="ghost" size="sm"
                      onClick={() => exportToCsv(txs.map(t => ({
                        hash: t.tx_hash, time: t.block_signed_at, success: t.successful,
                        gas_usd: t.gas_quote?.toFixed(6), gas_spent: t.gas_spent
                      })), "transactions")}
                      className="text-foreground-muted gap-1.5 h-7 text-xs">
                      <Download size={11} /> CSV
                    </Button>
                  )}
                </div>

                {txs.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    {hasUserKey ? (
                      <>
                        <RefreshCw size={24} className="text-foreground-subtle mx-auto" />
                        <p className="text-sm text-foreground-muted">Click "Load Live" in the header to fetch transactions</p>
                        <Button size="sm" onClick={loadLiveData} disabled={isLoadingProfile}
                          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 rounded-xl shadow-neon-sm">
                          <RefreshCw size={12} className={isLoadingProfile ? "animate-spin" : ""} />
                          Load Transactions
                        </Button>
                      </>
                    ) : (
                      <>
                        <KeyRound size={24} className="text-primary/50 mx-auto" />
                        <p className="text-sm text-foreground-muted">Add your GoldRush API key to load live transactions</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs min-w-[500px]">
                      <thead>
                        <tr className="border-b border-border text-foreground-subtle text-[10px] uppercase tracking-wider">
                          <th className="text-left pb-2 font-semibold">Time</th>
                          <th className="text-left pb-2 font-semibold hidden sm:table-cell">Tx Hash</th>
                          <th className="text-center pb-2 font-semibold">Status</th>
                          <th className="text-right pb-2 font-semibold">Gas USD</th>
                          <th className="text-right pb-2 font-semibold">Gas Spent</th>
                          <th className="text-right pb-2 font-semibold">Link</th>
                        </tr>
                      </thead>
                      <tbody>
                        {txs.slice(0, 30).map(tx => (
                          <tr key={tx.tx_hash} className="border-b border-border/40 table-row-hover">
                            <td className="py-2.5 pr-3 text-foreground-muted whitespace-nowrap">
                              {new Date(tx.block_signed_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </td>
                            <td className="py-2.5 pr-3 font-mono text-foreground-subtle hidden sm:table-cell">
                              {shortAddress(tx.tx_hash)}
                            </td>
                            <td className="py-2.5 pr-3 text-center">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${tx.successful ? "badge-success" : "badge-error"}`}>
                                {tx.successful ? "✓ OK" : "✗ Fail"}
                              </span>
                            </td>
                            <td className="py-2.5 pr-3 text-right text-foreground-muted">
                              {tx.gas_quote > 0 ? `$${tx.gas_quote.toFixed(4)}` : "—"}
                            </td>
                            <td className="py-2.5 pr-3 text-right text-foreground-muted">
                              {tx.gas_spent.toLocaleString()}
                            </td>
                            <td className="py-2.5 text-right">
                              {TX_EXPLORER[profileChain] && (
                                <a href={`${TX_EXPLORER[profileChain]}${tx.tx_hash}`} target="_blank" rel="noopener noreferrer"
                                  className="text-foreground-subtle hover:text-primary transition-colors">
                                  <ExternalLink size={11} />
                                </a>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-48 flex items-center justify-center text-xs text-foreground-subtle border border-border/30 rounded-xl bg-background-elevated/20">
      No transaction data
    </div>
  );
}
