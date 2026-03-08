/**
 * AgentLens — Agent Leaderboard Page
 * Sortable, filterable table of all tracked agents
 */
import { useMemo, useState } from "react";
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
const TIME_RANGES = ["All Time", "24h", "7d"] as const;

export default function AgentLeaderboard() {
  const { metricsMap, isLoading, chain } = useApp();
  const metrics = Object.values(metricsMap);

  const [sortKey, setSortKey] = useState<SortKey>("txCount");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [chainFilter, setChainFilter] = useState<string>("all");
  const [frameworkFilter, setFrameworkFilter] = useState<string>("all");
  const [minSuccessRate, setMinSuccessRate] = useState(0);
  const [search, setSearch] = useState("");

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
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.address.toLowerCase().includes(q),
      );
    }

    data.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp =
        typeof av === "string"
          ? av.localeCompare(bv as string)
          : (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return data;
  }, [metrics, chainFilter, frameworkFilter, minSuccessRate, search, sortKey, sortDir]);

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey !== col ? (
      <ArrowUpDown size={11} className="ml-1 opacity-40" />
    ) : sortDir === "desc" ? (
      <ArrowDown size={11} className="ml-1 text-primary" />
    ) : (
      <ArrowUp size={11} className="ml-1 text-primary" />
    );

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
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-foreground">Agent Leaderboard</h1>
        <p className="text-sm text-foreground-muted mt-1">
          {filtered.length} agents sorted by {sortKey} · {CHAIN_LABELS[chain as SupportedChain] ?? "All Chains"}
        </p>
      </div>

      {/* Filters */}
      <div className="card-glow rounded-xl bg-background-card p-4 space-y-4">
        <div className="flex items-center gap-2 text-xs text-foreground-muted font-medium">
          <SlidersHorizontal size={12} /> Filters
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search agent / address"
              className="pl-7 bg-background-input border-border text-xs h-8"
            />
          </div>

          {/* Chain filter */}
          <Select value={chainFilter} onValueChange={setChainFilter}>
            <SelectTrigger className="bg-background-input border-border text-xs h-8">
              <SelectValue placeholder="Chain" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border text-xs">
              <SelectItem value="all">All Chains</SelectItem>
              {CHAINS_FILTER.slice(1).map((c) => (
                <SelectItem key={c} value={c}>
                  {CHAIN_LABELS[c as SupportedChain]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Framework filter */}
          <Select value={frameworkFilter} onValueChange={setFrameworkFilter}>
            <SelectTrigger className="bg-background-input border-border text-xs h-8">
              <SelectValue placeholder="Framework" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border text-xs">
              <SelectItem value="all">All Frameworks</SelectItem>
              {FRAMEWORKS.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Min success rate */}
          <div className="space-y-1">
            <p className="text-[10px] text-foreground-muted">
              Min Success Rate: {minSuccessRate}%
            </p>
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
          <p className="text-xs text-foreground-muted">
            {filtered.length} agents
          </p>
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
            No agents match your filters — try adjusting them or add an API key.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-foreground-muted">
                  <th className="text-left pb-2 font-medium">#</th>
                  <SortHeader label="Agent" col="name" sortKey={sortKey} onClick={() => handleSort("name")}>
                    <SortIcon col="name" />
                  </SortHeader>
                  <SortHeader label="Chain" col={null} sortKey={sortKey} onClick={() => {}}>
                    <></>
                  </SortHeader>
                  <SortHeader label="Framework" col={null} sortKey={sortKey} onClick={() => {}}>
                    <></>
                  </SortHeader>
                  <SortHeader label="Tx Count" col="txCount" sortKey={sortKey} onClick={() => handleSort("txCount")}>
                    <SortIcon col="txCount" />
                  </SortHeader>
                  <SortHeader label="Success %" col="successRate" sortKey={sortKey} onClick={() => handleSort("successRate")}>
                    <SortIcon col="successRate" />
                  </SortHeader>
                  <SortHeader label="Avg Gas $" col="avgGasUsd" sortKey={sortKey} onClick={() => handleSort("avgGasUsd")}>
                    <SortIcon col="avgGasUsd" />
                  </SortHeader>
                  <SortHeader label="Failures" col="failCount" sortKey={sortKey} onClick={() => handleSort("failCount")}>
                    <SortIcon col="failCount" />
                  </SortHeader>
                  <SortHeader label="24h Txs" col="last24hTxCount" sortKey={sortKey} onClick={() => handleSort("last24hTxCount")}>
                    <SortIcon col="last24hTxCount" />
                  </SortHeader>
                  <th className="text-right pb-2 font-medium">Links</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((agent, idx) => {
                  const agentInfo = useApp;
                  return (
                    <tr key={agent.address} className="border-b border-border/40 table-row-hover">
                      <td className="py-3 pr-2 text-foreground-subtle">{idx + 1}</td>
                      <td className="py-3 pr-4 min-w-[160px]">
                        <div>
                          <p className="font-semibold text-foreground">{agent.name}</p>
                          <p className="text-foreground-subtle font-mono text-[10px]">
                            {shortAddress(agent.address)}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 pr-3">
                        <span className="badge-info px-1.5 py-0.5 rounded text-[10px]">
                          {CHAIN_LABELS[agent.chain as SupportedChain]}
                        </span>
                      </td>
                      <td className="py-3 pr-3">
                        <span className="text-foreground-muted">{agent.framework}</span>
                      </td>
                      <td className="py-3 pr-3 text-right text-foreground font-medium">
                        {agent.txCount.toLocaleString()}
                      </td>
                      <td className="py-3 pr-3 text-right">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            agent.successRate >= 90
                              ? "badge-success"
                              : agent.successRate >= 70
                              ? "badge-warning"
                              : "badge-error"
                          }`}
                        >
                          {agent.successRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-right text-foreground-muted">
                        {agent.avgGasUsd > 0 ? `$${agent.avgGasUsd.toFixed(4)}` : "—"}
                      </td>
                      <td className="py-3 pr-3 text-right text-destructive">
                        {agent.failCount}
                      </td>
                      <td className="py-3 pr-3 text-right text-foreground-muted">
                        {agent.last24hTxCount}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`https://8004agents.ai/agent/${agent.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="8004agents.ai"
                            className="text-foreground-subtle hover:text-primary transition-colors"
                          >
                            <ExternalLink size={11} />
                          </a>
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

function SortHeader({
  label,
  col,
  sortKey,
  onClick,
  children,
}: {
  label: string;
  col: SortKey | null;
  sortKey: SortKey;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <th
      className={`pb-2 font-medium text-right ${col ? "cursor-pointer select-none hover:text-foreground transition-colors" : ""}`}
      onClick={onClick}
    >
      <span className="inline-flex items-center justify-end">
        {label}
        {children}
      </span>
    </th>
  );
}
