/**
 * AgentPulse — Agent Profile Page (CoinGecko-style)
 * Shows detailed analytics for any agent by address.
 * Accessible via /agent/:address or the global search bar.
 */
import { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useApp } from "@/contexts/AppContext";
import {
  fetchTransactions,
  computeAgentMetrics,
  buildDailyTimeSeries,
  buildFailureBreakdown,
  parseFailureReason,
  type AgentMetrics,
  type CovalentTx,
} from "@/lib/covalent";
import { KNOWN_AGENTS, shortAddress, CHAIN_LABELS, type SupportedChain } from "@/lib/agents";
import { exportToCsv } from "@/lib/exportCsv";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Star,
  StarOff,
  ExternalLink,
  Copy,
  CheckCircle2,
  Share2,
  Download,
  RefreshCw,
  Zap,
  Activity,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

const CHAIN_EXPLORER: Record<string, string> = {
  "base-mainnet": "https://basescan.org/address/",
  "eth-mainnet": "https://etherscan.io/address/",
  "avalanche-mainnet": "https://snowtrace.io/address/",
};

const FAILURE_COLORS = [
  "hsl(0,84%,60%)",
  "hsl(38,100%,55%)",
  "hsl(258,90%,66%)",
  "hsl(182,100%,45%)",
  "hsl(142,76%,48%)",
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background-elevated border border-border rounded-lg px-3 py-2 text-xs shadow-card-elevated">
      <p className="text-foreground-muted mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color || p.fill }}>
          {p.name}: {typeof p.value === "number" ? p.value.toFixed(2) : p.value}
          {p.name?.includes("Rate") || p.name?.includes("%") ? "%" : ""}
        </p>
      ))}
    </div>
  );
};

export default function AgentProfile() {
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const { apiKey, chain, trackAgent, untrackAgent, isTracked } = useApp();

  const [txs, setTxs] = useState<CovalentTx[]>([]);
  const [metrics, setMetrics] = useState<AgentMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [profileChain, setProfileChain] = useState<SupportedChain>(chain);

  // Look up known agent info
  const knownAgent = KNOWN_AGENTS.find(
    (a) => a.address.toLowerCase() === address?.toLowerCase(),
  );

  const agentName = knownAgent?.name ?? `Agent ${shortAddress(address ?? "")}`;
  const tracked = isTracked(address ?? "");

  // Fetch txs when address or chain changes
  useEffect(() => {
    if (!address) return;
    setIsLoading(true);
    setError(null);
    fetchTransactions(profileChain, address, apiKey, 100)
      .then((data) => {
        setTxs(data);
        const agentInfo = knownAgent ?? {
          address,
          name: agentName,
          chain: profileChain,
          framework: "Unknown" as const,
        };
        setMetrics(computeAgentMetrics(agentInfo, data));
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [address, profileChain, apiKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const timeSeries = useMemo(() => buildDailyTimeSeries(txs, 14), [txs]);
  const failureBreakdown = useMemo(() => buildFailureBreakdown(txs), [txs]);

  const failedTxs = useMemo(
    () => txs.filter((t) => !t.successful).slice(0, 20),
    [txs],
  );

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/agent/${address}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTrack = () => {
    if (!address) return;
    if (tracked) {
      untrackAgent(address);
    } else {
      trackAgent({
        address,
        name: agentName,
        chain: profileChain,
        addedAt: Date.now(),
      });
    }
  };

  const handleExport = () => {
    exportToCsv(
      txs.map((t) => ({
        tx_hash: t.tx_hash,
        block_signed_at: t.block_signed_at,
        successful: t.successful,
        gas_spent: t.gas_spent,
        gas_quote_usd: t.gas_quote,
        failure_reason: t.successful ? "" : parseFailureReason(t),
      })),
      `agent_${address?.slice(0, 8)}`,
    );
  };

  if (!address) {
    return (
      <div className="p-6 text-center text-foreground-muted">
        No agent address provided.
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-foreground-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft size={13} /> Back
      </button>

      {/* Agent header */}
      <div className="card-glow rounded-xl bg-background-card p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20 flex items-center justify-center flex-shrink-0 shadow-neon-sm">
            <Zap size={22} className="text-primary" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-foreground">{agentName}</h1>
              {knownAgent && (
                <span className="badge-info text-[10px] px-2 py-0.5 rounded-full">
                  {knownAgent.framework}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-foreground-muted">{address}</span>
              <button onClick={handleCopyAddress} className="text-foreground-subtle hover:text-primary transition-colors">
                {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
              </button>
            </div>
            {knownAgent?.description && (
              <p className="text-xs text-foreground-muted mt-1.5">{knownAgent.description}</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            {/* Chain selector */}
            <div className="flex gap-1">
              {(["base-mainnet", "eth-mainnet", "avalanche-mainnet"] as SupportedChain[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setProfileChain(c)}
                  className={`px-2 py-1 rounded text-[10px] border transition-all ${
                    profileChain === c
                      ? "bg-primary/10 border-primary/50 text-primary"
                      : "border-border text-foreground-muted hover:border-border-accent"
                  }`}
                >
                  {CHAIN_LABELS[c]}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleTrack}
              className={`gap-1.5 h-8 text-xs border transition-all ${
                tracked
                  ? "border-warning/40 text-warning hover:bg-warning/10"
                  : "border-border text-foreground-muted hover:border-primary/40 hover:text-primary"
              }`}
            >
              {tracked ? <StarOff size={12} /> : <Star size={12} />}
              {tracked ? "Untrack" : "Track Agent"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="gap-1.5 h-8 text-xs border-border text-foreground-muted hover:border-primary/40"
            >
              <Share2 size={12} />
              Share
            </Button>

            {CHAIN_EXPLORER[profileChain] && (
              <a
                href={`${CHAIN_EXPLORER[profileChain]}${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 h-8 px-3 rounded-md text-xs border border-border text-foreground-muted hover:border-primary/40 hover:text-primary transition-all"
              >
                Explorer <ExternalLink size={10} />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-destructive-dim border border-destructive/30 rounded-xl text-xs text-destructive">
          <AlertTriangle size={12} />
          {error}
        </div>
      )}

      {/* KPI row */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-background-card rounded-xl animate-shimmer bg-[length:200%_100%] card-glow" />
          ))}
        </div>
      ) : metrics ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Total Txs"
            value={metrics.txCount.toLocaleString()}
            icon={<Activity size={13} className="text-primary" />}
            accent="primary"
          />
          <StatCard
            label="Success Rate"
            value={`${metrics.successRate.toFixed(1)}%`}
            icon={<CheckCircle2 size={13} className="text-success" />}
            accent={metrics.successRate >= 90 ? "success" : metrics.successRate >= 70 ? "warning" : "destructive"}
          />
          <StatCard
            label="Avg Gas (USD)"
            value={metrics.avgGasUsd > 0 ? `$${metrics.avgGasUsd.toFixed(4)}` : "—"}
            icon={<Zap size={13} className="text-warning" />}
            accent="warning"
          />
          <StatCard
            label="24h Txs"
            value={metrics.last24hTxCount.toString()}
            icon={<TrendingUp size={13} className="text-secondary" />}
            accent="secondary"
          />
        </div>
      ) : null}

      {/* Charts row */}
      {!isLoading && txs.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Success rate over time */}
          <div className="card-glow rounded-xl bg-background-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Success Rate — 14 Day Trend
            </h3>
            <p className="text-xs text-foreground-muted mb-4">Daily % of successful transactions</p>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={timeSeries} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="ag-successGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(182,100%,45%)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(182,100%,45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(224,24%,14%)" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(215,20%,50%)" }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "hsl(215,20%,50%)" }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="successRate" name="Success Rate %" stroke="hsl(182,100%,45%)" strokeWidth={2} fill="url(#ag-successGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Failure breakdown */}
          {failureBreakdown.length > 0 ? (
            <div className="card-glow rounded-xl bg-background-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-1">Failure Breakdown</h3>
              <p className="text-xs text-foreground-muted mb-4">Failures by revert reason</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={failureBreakdown} layout="vertical" margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(224,24%,14%)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 9, fill: "hsl(215,20%,50%)" }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="reason" tick={{ fontSize: 8, fill: "hsl(215,20%,55%)" }} tickLine={false} axisLine={false} width={100} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Count" radius={[0, 4, 4, 0]}>
                    {failureBreakdown.map((_, i) => (
                      <Cell key={i} fill={FAILURE_COLORS[i % FAILURE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="card-glow rounded-xl bg-background-card p-5 flex items-center justify-center">
              <div className="text-center">
                <CheckCircle2 size={28} className="text-success mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">No failures detected</p>
                <p className="text-xs text-foreground-muted mt-1">All recent transactions succeeded</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent transactions */}
      {!isLoading && txs.length > 0 && (
        <div className="card-glow rounded-xl bg-background-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Recent Transactions</h3>
              <p className="text-xs text-foreground-muted mt-0.5">Last {txs.slice(0, 20).length} transactions</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExport}
              className="text-foreground-muted gap-1.5 h-7 text-xs"
            >
              <Download size={11} /> Export CSV
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-foreground-muted">
                  <th className="text-left pb-2 font-medium">Time</th>
                  <th className="text-left pb-2 font-medium hidden sm:table-cell">Tx Hash</th>
                  <th className="text-center pb-2 font-medium">Status</th>
                  <th className="text-right pb-2 font-medium">Gas USD</th>
                  <th className="text-left pb-2 font-medium">Reason</th>
                  <th className="text-right pb-2 font-medium">View</th>
                </tr>
              </thead>
              <tbody>
                {txs.slice(0, 20).map((tx) => {
                  const explorerUrl = `${CHAIN_EXPLORER[profileChain] ?? ""}${tx.tx_hash}`;
                  return (
                    <tr key={tx.tx_hash} className="border-b border-border/40 table-row-hover">
                      <td className="py-2.5 pr-3 text-foreground-muted whitespace-nowrap">
                        {new Date(tx.block_signed_at).toLocaleString(undefined, {
                          month: "short", day: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </td>
                      <td className="py-2.5 pr-3 hidden sm:table-cell">
                        <span className="font-mono text-foreground-subtle">{shortAddress(tx.tx_hash)}</span>
                      </td>
                      <td className="py-2.5 pr-3 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${tx.successful ? "badge-success" : "badge-error"}`}>
                          {tx.successful ? "✓" : "✗"}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-right text-foreground-muted">
                        {tx.gas_quote > 0 ? `$${tx.gas_quote.toFixed(4)}` : "—"}
                      </td>
                      <td className="py-2.5 pr-3">
                        {!tx.successful && (
                          <span className="badge-error px-1.5 py-0.5 rounded text-[10px]">
                            {parseFailureReason(tx)}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        <a
                          href={explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-foreground-subtle hover:text-primary transition-colors"
                        >
                          <ExternalLink size={11} />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isLoading && txs.length === 0 && !error && (
        <div className="card-glow rounded-xl bg-background-card p-12 text-center">
          <Activity size={32} className="text-foreground-subtle mx-auto mb-3" />
          <p className="text-sm text-foreground-muted">No transactions found for this agent on {CHAIN_LABELS[profileChain]}</p>
          <p className="text-xs text-foreground-subtle mt-1">Try switching chains above</p>
        </div>
      )}

      {isLoading && (
        <div className="card-glow rounded-xl bg-background-card p-12 text-center">
          <RefreshCw size={24} className="text-primary mx-auto mb-3 animate-spin" />
          <p className="text-sm text-foreground-muted">Loading agent data…</p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: "primary" | "success" | "warning" | "destructive" | "secondary";
}) {
  const accentClass = {
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
    secondary: "text-secondary",
  }[accent];

  return (
    <div className="card-glow rounded-xl bg-background-card p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] uppercase tracking-wider text-foreground-muted font-medium">{label}</p>
        {icon}
      </div>
      <p className={`text-2xl font-bold ${accentClass}`}>{value}</p>
    </div>
  );
}
