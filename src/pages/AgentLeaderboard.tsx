/**
 * AgentPulse — Agent Leaderboard Page
 * Sortable, filterable table. Click any row → Agent Profile.
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { CHAIN_LABELS, FRAMEWORKS, shortAddress, type SupportedChain } from "@/lib/agents";
import { exportToCsv } from "@/lib/exportCsv";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  ExternalLink,
  Search,
  SlidersHorizontal,
  Star,
  StarOff,
  Share2,
  ChevronRight,
} from "lucide-react";

type SortKey =
  | "name"
  | "txCount"
  | "successRate"
  | "avgGasUsd"
  | "failCount"
  | "last24hTxCount";
type SortDir = "asc" | "desc";

const CHAINS_FILTER = ["all", "base-mainnet", "eth-mainnet", "avalanche-mainnet"] as const;

export default function AgentLeaderboard() {
  const { metricsMap, isLoading, chain, isTracked, trackAgent, untrackAgent } = useApp();
  const navigate = useNavigate();
  const metrics = Object.values(metricsMap);

  const [sortKey, setSortKey] = useState<SortKey>("txCount");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [chainFilter, setChainFilter] = useState<string>("all");
  const [frameworkFilter, setFrameworkFilter] = useState<string>("all");
  const [minSuccessRate, setMinSuccessRate] = useState(0);
  const [search, setSearch] = useState("");
  const [copiedShare, setCopiedShare] = useState<string | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const filtered = useMemo(() => {
    let data = [...metrics];
    if (chainFilter !== "all") data = data.filter((m) => m.chain === chainFilter);
    if (frameworkFilter !== "all") data = data.filter((m) => m.framework === frameworkFilter);
    if (minSuccessRate > 0) data = data.filter((m) => m.successRate >= minSuccessRate);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (m) => m.name.toLowerCase().includes(q) || m.address.toLowerCase().includes(q),
      );
    }
    data.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp =
        typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return data;
  }, [metrics, chainFilter, frameworkFilter, minSuccessRate, search, sortKey, sortDir]);

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey !== col ? (
      <ArrowUpDown size={10} className="ml-1 opacity-40" />
    ) : sortDir === "desc" ? (
      <ArrowDown size={10} className="ml-1 text-primary" />
    ) : (
      <ArrowUp size={10} className="ml-1 text-primary" />
    );

  const handleShare = (address: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/agent/${address}`;
    navigator.clipboard.writeText(url);
    setCopiedShare(address);
    setTimeout(() => setCopiedShare(null), 2000);
  };

  const handleTrackToggle = (m: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTracked(m.address)) {
      untrackAgent(m.address);
    } else {
      trackAgent({ address: m.address, name: m.name, chain: m.chain, addedAt: Date.now() });
    }
  };

  const handleExport = () => {
    exportToCsv(
      filtered.map((m) => ({
        name: m.name,
        address: m.address,
        chain: m.chain,
        framework: m.framework,
        tx_count: m.txCount,
        success_count: m.successCount,
        fail_count: m.failCount,
        success_rate_pct: m.successRate.toFixed(2),
        avg_gas_usd: m.avgGasUsd.toFixed(4),
        total_gas_usd: m.totalGasUsd.toFixed(4),
        last_24h_txs: m.last24hTxCount,
        last_24h_success_pct: m.last24hSuccessRate.toFixed(2),
      })),
      "agent_leaderboard",
    );
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-foreground">Agent Leaderboard</h1>
        <p className="text-sm text-foreground-muted mt-1">
          {filtered.length} agents · Click any row to view full profile
        </p>
      </div>

      {/* Filters */}
      <div className="card-glow rounded-xl bg-background-card p-4 space-y-4">
        <div className="flex items-center gap-2 text-xs text-foreground-muted font-medium">
          <SlidersHorizontal size={12} /> Filters
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search agent / address"
              className="pl-7 bg-background-input border-border text-xs h-8"
            />
          </div>
          <Select value={chainFilter} onValueChange={setChainFilter}>
            <SelectTrigger className="bg-background-input border-border text-xs h-8">
              <SelectValue placeholder="Chain" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border text-xs">
              <SelectItem value="all">All Chains</SelectItem>
              {CHAINS_FILTER.slice(1).map((c) => (
                <SelectItem key={c} value={c}>{CHAIN_LABELS[c as SupportedChain]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={frameworkFilter} onValueChange={setFrameworkFilter}>
            <SelectTrigger className="bg-background-input border-border text-xs h-8">
              <SelectValue placeholder="Framework" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border text-xs">
              <SelectItem value="all">All Frameworks</SelectItem>
              {FRAMEWORKS.map((f) => (
                <SelectItem key={f} value={f}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="space-y-1">
            <p className="text-[10px] text-foreground-muted">Min Success Rate: {minSuccessRate}%</p>
            <Slider
              value={[minSuccessRate]}
              min={0}
              max={100}
              step={5}
              onValueChange={([v]) => setMinSuccessRate(v)}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card-glow rounded-xl bg-background-card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-foreground-muted">{filtered.length} agents</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExport}
            className="text-foreground-muted gap-1.5 h-7 text-xs"
          >
            <Download size={11} /> Export CSV
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-background-elevated rounded animate-shimmer bg-[length:200%_100%]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-sm text-foreground-muted">
            No agents match your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-foreground-muted">
                  <th className="text-left pb-2 font-medium w-6">#</th>
                  <th
                    className="text-left pb-2 font-medium cursor-pointer select-none hover:text-foreground transition-colors"
                    onClick={() => handleSort("name")}
                  >
                    <span className="inline-flex items-center">Agent <SortIcon col="name" /></span>
                  </th>
                  <th className="text-left pb-2 font-medium hidden md:table-cell">Chain</th>
                  <th className="text-left pb-2 font-medium hidden lg:table-cell">Framework</th>
                  <th
                    className="text-right pb-2 font-medium cursor-pointer select-none hover:text-foreground transition-colors"
                    onClick={() => handleSort("txCount")}
                  >
                    <span className="inline-flex items-center justify-end">Txs <SortIcon col="txCount" /></span>
                  </th>
                  <th
                    className="text-right pb-2 font-medium cursor-pointer select-none hover:text-foreground transition-colors"
                    onClick={() => handleSort("successRate")}
                  >
                    <span className="inline-flex items-center justify-end">Success % <SortIcon col="successRate" /></span>
                  </th>
                  <th
                    className="text-right pb-2 font-medium cursor-pointer select-none hover:text-foreground transition-colors hidden sm:table-cell"
                    onClick={() => handleSort("avgGasUsd")}
                  >
                    <span className="inline-flex items-center justify-end">Avg Gas $ <SortIcon col="avgGasUsd" /></span>
                  </th>
                  <th
                    className="text-right pb-2 font-medium cursor-pointer select-none hover:text-foreground transition-colors hidden sm:table-cell"
                    onClick={() => handleSort("failCount")}
                  >
                    <span className="inline-flex items-center justify-end">Fails <SortIcon col="failCount" /></span>
                  </th>
                  <th className="text-right pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((agent, idx) => {
                  const tracked = isTracked(agent.address);
                  return (
                    <tr
                      key={agent.address}
                      className="border-b border-border/40 table-row-hover cursor-pointer group"
                      onClick={() => navigate(`/agent/${agent.address}`)}
                    >
                      <td className="py-3 pr-2 text-foreground-subtle">{idx + 1}</td>
                      <td className="py-3 pr-4 min-w-[140px]">
                        <div>
                          <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {agent.name}
                          </p>
                          <p className="text-foreground-subtle font-mono text-[10px]">
                            {shortAddress(agent.address)}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 pr-3 hidden md:table-cell">
                        <span className="badge-info px-1.5 py-0.5 rounded text-[10px]">
                          {CHAIN_LABELS[agent.chain as SupportedChain]}
                        </span>
                      </td>
                      <td className="py-3 pr-3 hidden lg:table-cell">
                        <span className="text-foreground-muted text-[10px]">{agent.framework}</span>
                      </td>
                      <td className="py-3 pr-3 text-right text-foreground font-medium">
                        {agent.txCount.toLocaleString()}
                      </td>
                      <td className="py-3 pr-3 text-right">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          agent.successRate >= 90 ? "badge-success" : agent.successRate >= 70 ? "badge-warning" : "badge-error"
                        }`}>
                          {agent.successRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-right text-foreground-muted hidden sm:table-cell">
                        {agent.avgGasUsd > 0 ? `$${agent.avgGasUsd.toFixed(4)}` : "—"}
                      </td>
                      <td className="py-3 pr-3 text-right text-destructive hidden sm:table-cell">
                        {agent.failCount}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleTrackToggle(agent, e)}
                            className={`p-1.5 rounded hover:bg-accent transition-colors ${tracked ? "text-warning" : "text-foreground-subtle hover:text-warning"}`}
                            title={tracked ? "Remove from watchlist" : "Add to watchlist"}
                          >
                            {tracked ? <StarOff size={12} /> : <Star size={12} />}
                          </button>
                          <button
                            onClick={(e) => handleShare(agent.address, e)}
                            className="p-1.5 rounded hover:bg-accent transition-colors text-foreground-subtle hover:text-primary"
                            title="Copy share link"
                          >
                            {copiedShare === agent.address ? (
                              <span className="text-[9px] text-success">✓</span>
                            ) : (
                              <Share2 size={12} />
                            )}
                          </button>
                          <a
                            href={`https://8004agents.ai/agent/${agent.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded hover:bg-accent transition-colors text-foreground-subtle hover:text-primary"
                            title="View on 8004agents.ai"
                          >
                            <ExternalLink size={12} />
                          </a>
                          <ChevronRight size={12} className="text-foreground-subtle group-hover:text-primary transition-colors" />
                        </div>
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
