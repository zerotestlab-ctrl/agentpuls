/**
 * AgentPulse — Failures Explorer Page
 * Detailed list of failed transactions with reasons + gas wasted
 */
import { useMemo, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { parseFailureReason, type CovalentTx } from "@/lib/covalent";
import { shortAddress } from "@/lib/agents";
import { exportToCsv } from "@/lib/exportCsv";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Search, AlertTriangle, ExternalLink } from "lucide-react";

const REASON_OPTIONS = [
  "All",
  "Execution Reverted",
  "Slippage Exceeded",
  "Gas Limit Exceeded",
  "Insufficient Balance",
  "Nonce Too Low",
  "Deadline Exceeded",
  "Access Denied",
  "Unknown Revert",
];

interface FailureRow {
  txHash: string;
  agentName: string;
  agentAddress: string;
  chain: string;
  timestamp: string;
  reason: string;
  gasWastedUsd: number;
  gasSpent: number;
  blockUrl: string;
}

export default function FailuresExplorer() {
  const { metricsMap, isLoading, chain } = useApp();
  const [search, setSearch] = useState("");
  const [reasonFilter, setReasonFilter] = useState("All");

  const CHAIN_EXPLORER: Record<string, string> = {
    "base-mainnet": "https://basescan.org/tx/",
    "eth-mainnet": "https://etherscan.io/tx/",
    "avalanche-mainnet": "https://snowtrace.io/tx/",
  };

  const failures = useMemo((): FailureRow[] => {
    const rows: FailureRow[] = [];
    for (const m of Object.values(metricsMap)) {
      const failedTxs = m.recentTxs.filter((tx) => !tx.successful);
      for (const tx of failedTxs) {
        rows.push({
          txHash: tx.tx_hash,
          agentName: m.name,
          agentAddress: m.address,
          chain: m.chain,
          timestamp: tx.block_signed_at,
          reason: parseFailureReason(tx),
          gasWastedUsd: tx.gas_quote ?? 0,
          gasSpent: tx.gas_spent,
          blockUrl: `${CHAIN_EXPLORER[m.chain] ?? ""}${tx.tx_hash}`,
        });
      }
    }
    // Sort by newest first
    return rows.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [metricsMap]);

  const filtered = useMemo(() => {
    let data = failures;
    if (reasonFilter !== "All") data = data.filter((f) => f.reason === reasonFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (f) =>
          f.txHash.toLowerCase().includes(q) ||
          f.agentName.toLowerCase().includes(q) ||
          f.agentAddress.toLowerCase().includes(q),
      );
    }
    return data;
  }, [failures, reasonFilter, search]);

  const totalGasWasted = useMemo(
    () => filtered.reduce((a, f) => a + f.gasWastedUsd, 0),
    [filtered],
  );

  const handleExport = () => {
    exportToCsv(
      filtered.map((f) => ({
        tx_hash: f.txHash,
        agent_name: f.agentName,
        agent_address: f.agentAddress,
        chain: f.chain,
        timestamp: f.timestamp,
        failure_reason: f.reason,
        gas_wasted_usd: f.gasWastedUsd.toFixed(6),
        gas_spent: f.gasSpent,
      })),
      "failures_explorer",
    );
  };

  const REASON_COLOR: Record<string, string> = {
    "Execution Reverted": "badge-error",
    "Slippage Exceeded": "badge-warning",
    "Gas Limit Exceeded": "badge-warning",
    "Insufficient Balance": "badge-error",
    "Nonce Too Low": "badge-info",
    "Deadline Exceeded": "badge-warning",
    "Access Denied": "badge-error",
    "Unknown Revert": "badge-error",
  };

  const formatTs = (ts: string) => {
    try {
      return new Date(ts).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return ts;
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-foreground">Failures Explorer</h1>
        <p className="text-sm text-foreground-muted mt-1">
          Detailed view of failed transactions — reasons, gas wasted, and timestamps.
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="card-glow rounded-xl bg-background-card p-4">
          <p className="text-xs text-foreground-muted mb-1">Total Failures</p>
          <p className="text-2xl font-bold text-destructive">
            {isLoading ? "…" : failures.length.toLocaleString()}
          </p>
        </div>
        <div className="card-glow rounded-xl bg-background-card p-4">
          <p className="text-xs text-foreground-muted mb-1">Gas Wasted (filtered)</p>
          <p className="text-2xl font-bold text-warning">
            {isLoading ? "…" : `$${totalGasWasted.toFixed(4)}`}
          </p>
        </div>
        <div className="card-glow rounded-xl bg-background-card p-4 col-span-2 sm:col-span-1">
          <p className="text-xs text-foreground-muted mb-1">Showing</p>
          <p className="text-2xl font-bold text-foreground">
            {isLoading ? "…" : filtered.length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card-glow rounded-xl bg-background-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tx hash / agent / address"
              className="pl-7 bg-background-input border-border text-xs h-8 font-mono"
            />
          </div>
          <Select value={reasonFilter} onValueChange={setReasonFilter}>
            <SelectTrigger className="bg-background-input border-border text-xs h-8">
              <SelectValue placeholder="Filter by reason" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border text-xs">
              {REASON_OPTIONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Failures table */}
      <div className="card-glow rounded-xl bg-background-card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-foreground-muted">
            {filtered.length} failures
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
          <div className="text-center py-12 space-y-2">
            <AlertTriangle size={24} className="text-foreground-subtle mx-auto" />
            <p className="text-sm text-foreground-muted">
              {failures.length === 0
                ? "No failures detected — either no data yet, or all txs succeeded!"
                : "No results match your filters."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-foreground-muted">
                  <th className="text-left pb-2 font-medium">Time</th>
                  <th className="text-left pb-2 font-medium">Agent</th>
                  <th className="text-left pb-2 font-medium hidden sm:table-cell">Tx Hash</th>
                  <th className="text-left pb-2 font-medium">Reason</th>
                  <th className="text-right pb-2 font-medium">Gas Wasted</th>
                  <th className="text-right pb-2 font-medium">Links</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => (
                  <tr
                    key={f.txHash}
                    className="border-b border-border/40 table-row-hover"
                  >
                    <td className="py-3 pr-3 text-foreground-muted whitespace-nowrap">
                      {formatTs(f.timestamp)}
                    </td>
                    <td className="py-3 pr-3 min-w-[120px]">
                      <div>
                        <p className="font-medium text-foreground">{f.agentName}</p>
                        <p className="text-foreground-subtle font-mono text-[10px]">
                          {shortAddress(f.agentAddress)}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 pr-3 hidden sm:table-cell">
                      <span className="font-mono text-foreground-subtle">
                        {shortAddress(f.txHash)}
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          REASON_COLOR[f.reason] ?? "badge-error"
                        }`}
                      >
                        {f.reason}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-right text-warning">
                      {f.gasWastedUsd > 0
                        ? `$${f.gasWastedUsd.toFixed(6)}`
                        : `${f.gasSpent.toLocaleString()} gas`}
                    </td>
                    <td className="py-3 text-right">
                      {f.blockUrl && (
                        <a
                          href={f.blockUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-foreground-subtle hover:text-primary transition-colors"
                          title="View on block explorer"
                        >
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
    </div>
  );
}
