/**
 * AgentPulse — Cross-Chain Benchmarks Page
 * Bar charts comparing metrics across chains and frameworks
 */
import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useApp } from "@/contexts/AppContext";
import { CHAIN_LABELS, CHAIN_COLORS, FRAMEWORK_COLORS, type SupportedChain } from "@/lib/agents";
import { exportToCsv } from "@/lib/exportCsv";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background-elevated border border-border rounded-lg px-3 py-2 text-xs shadow-card-elevated space-y-0.5">
      <p className="text-foreground-muted mb-1 font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.fill || p.color }}>
          {p.name}: {typeof p.value === "number" ? p.value.toFixed(2) : p.value}
          {p.name?.includes("Rate") ? "%" : p.name?.includes("Gas") ? " USD" : ""}
        </p>
      ))}
    </div>
  );
};

export default function CrossChainBenchmarks() {
  const { metricsMap, isLoading } = useApp();
  const metrics = Object.values(metricsMap);

  // Aggregate by chain
  const chainData = useMemo(() => {
    const chains = ["base-mainnet", "eth-mainnet", "avalanche-mainnet"] as SupportedChain[];
    return chains.map((c) => {
      const chainMetrics = metrics.filter((m) => m.chain === c);
      const totalTx = chainMetrics.reduce((a, m) => a + m.txCount, 0);
      const totalSuccess = chainMetrics.reduce((a, m) => a + m.successCount, 0);
      const gasValues = chainMetrics.filter((m) => m.avgGasUsd > 0).map((m) => m.avgGasUsd);
      const avgGas =
        gasValues.length > 0
          ? gasValues.reduce((a, b) => a + b, 0) / gasValues.length
          : 0;
      return {
        chain: CHAIN_LABELS[c],
        chainId: c,
        agentCount: chainMetrics.length,
        txCount: totalTx,
        successRate: totalTx > 0 ? parseFloat(((totalSuccess / totalTx) * 100).toFixed(1)) : 0,
        avgGasUsd: parseFloat(avgGas.toFixed(4)),
      };
    });
  }, [metrics]);

  // Aggregate by framework
  const frameworkData = useMemo(() => {
    const frameworks = ["Virtuals", "elizaOS", "Clanker", "Custom", "Unknown"] as const;
    return frameworks
      .map((f) => {
        const fMetrics = metrics.filter((m) => m.framework === f);
        if (fMetrics.length === 0) return null;
        const totalTx = fMetrics.reduce((a, m) => a + m.txCount, 0);
        const totalSuccess = fMetrics.reduce((a, m) => a + m.successCount, 0);
        const gasValues = fMetrics.filter((m) => m.avgGasUsd > 0).map((m) => m.avgGasUsd);
        const avgGas =
          gasValues.length > 0
            ? gasValues.reduce((a, b) => a + b, 0) / gasValues.length
            : 0;
        return {
          framework: f,
          agentCount: fMetrics.length,
          txCount: totalTx,
          successRate: totalTx > 0 ? parseFloat(((totalSuccess / totalTx) * 100).toFixed(1)) : 0,
          avgGasUsd: parseFloat(avgGas.toFixed(4)),
        };
      })
      .filter(Boolean) as Array<{
        framework: string;
        agentCount: number;
        txCount: number;
        successRate: number;
        avgGasUsd: number;
      }>;
  }, [metrics]);

  // Chain tx volume comparison
  const volumeData = useMemo(
    () =>
      chainData.map((c) => ({
        name: c.chain,
        "Total Txs": c.txCount,
        "Agent Count": c.agentCount,
      })),
    [chainData],
  );

  const CHAIN_COLOR_LIST = [
    CHAIN_COLORS["base-mainnet"],
    CHAIN_COLORS["eth-mainnet"],
    CHAIN_COLORS["avalanche-mainnet"],
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-foreground">Cross-Chain Benchmarks</h1>
        <p className="text-sm text-foreground-muted mt-1">
          Compare agent performance across chains and frameworks
        </p>
      </div>

      {/* Chain comparison row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Success rate by chain */}
        <div className="card-glow rounded-xl bg-background-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Success Rate by Chain
              </h3>
              <p className="text-xs text-foreground-muted mt-0.5">% successful transactions</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => exportToCsv(chainData as any, "chain_benchmarks")}
              className="text-foreground-muted gap-1.5 h-7 text-xs"
            >
              <Download size={11} /> CSV
            </Button>
          </div>
          {isLoading ? (
            <Skeleton />
          ) : metrics.length === 0 ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chainData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(224,24%,14%)" vertical={false} />
                <XAxis dataKey="chain" tick={{ fontSize: 11, fill: "hsl(215,20%,55%)" }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(215,20%,50%)" }} tickLine={false} axisLine={false} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="successRate" name="Success Rate" radius={[4, 4, 0, 0]}>
                  {chainData.map((_, i) => (
                    <Cell key={i} fill={CHAIN_COLOR_LIST[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Avg gas by chain */}
        <div className="card-glow rounded-xl bg-background-card p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">
              Avg Gas Cost by Chain (USD)
            </h3>
            <p className="text-xs text-foreground-muted mt-0.5">
              Average gas USD per successful transaction
            </p>
          </div>
          {isLoading ? (
            <Skeleton />
          ) : metrics.length === 0 ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chainData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(224,24%,14%)" vertical={false} />
                <XAxis dataKey="chain" tick={{ fontSize: 11, fill: "hsl(215,20%,55%)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(215,20%,50%)" }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="avgGasUsd" name="Avg Gas USD" radius={[4, 4, 0, 0]}>
                  {chainData.map((_, i) => (
                    <Cell key={i} fill={CHAIN_COLOR_LIST[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Framework comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card-glow rounded-xl bg-background-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Success Rate by Framework
              </h3>
              <p className="text-xs text-foreground-muted mt-0.5">
                Virtuals, elizaOS, Clanker, Custom
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => exportToCsv(frameworkData as any, "framework_benchmarks")}
              className="text-foreground-muted gap-1.5 h-7 text-xs"
            >
              <Download size={11} /> CSV
            </Button>
          </div>
          {isLoading ? (
            <Skeleton />
          ) : frameworkData.length === 0 ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={frameworkData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(224,24%,14%)" vertical={false} />
                <XAxis dataKey="framework" tick={{ fontSize: 11, fill: "hsl(215,20%,55%)" }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(215,20%,50%)" }} tickLine={false} axisLine={false} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="successRate" name="Success Rate" radius={[4, 4, 0, 0]}>
                  {frameworkData.map((f) => (
                    <Cell key={f.framework} fill={FRAMEWORK_COLORS[f.framework as keyof typeof FRAMEWORK_COLORS] ?? "#6B7280"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tx volume by framework */}
        <div className="card-glow rounded-xl bg-background-card p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">
              Transaction Volume by Framework
            </h3>
            <p className="text-xs text-foreground-muted mt-0.5">
              Total txs across agents per framework
            </p>
          </div>
          {isLoading ? (
            <Skeleton />
          ) : frameworkData.length === 0 ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={frameworkData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(224,24%,14%)" vertical={false} />
                <XAxis dataKey="framework" tick={{ fontSize: 11, fill: "hsl(215,20%,55%)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(215,20%,50%)" }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="txCount" name="Total Txs" radius={[4, 4, 0, 0]}>
                  {frameworkData.map((f) => (
                    <Cell key={f.framework} fill={FRAMEWORK_COLORS[f.framework as keyof typeof FRAMEWORK_COLORS] ?? "#6B7280"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Chain summary table */}
      <div className="card-glow rounded-xl bg-background-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Chain Summary Table
        </h3>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-background-elevated rounded animate-shimmer bg-[length:200%_100%]" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-foreground-muted">
                  {["Chain", "Agents", "Total Txs", "Success Rate", "Avg Gas USD"].map((h) => (
                    <th key={h} className={`pb-2 font-medium ${h === "Chain" ? "text-left" : "text-right"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chainData.map((row, i) => (
                  <tr key={row.chainId} className="border-b border-border/40 table-row-hover">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ background: CHAIN_COLOR_LIST[i] }}
                        />
                        <span className="font-medium text-foreground">{row.chain}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 text-foreground-muted">{row.agentCount}</td>
                    <td className="text-right py-3 text-foreground">{row.txCount.toLocaleString()}</td>
                    <td className="text-right py-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          row.successRate >= 90
                            ? "badge-success"
                            : row.successRate >= 70
                            ? "badge-warning"
                            : row.successRate > 0
                            ? "badge-error"
                            : "text-foreground-subtle"
                        }`}
                      >
                        {row.successRate > 0 ? `${row.successRate}%` : "—"}
                      </span>
                    </td>
                    <td className="text-right py-3 text-foreground-muted">
                      {row.avgGasUsd > 0 ? `$${row.avgGasUsd}` : "—"}
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

function Skeleton() {
  return (
    <div className="h-52 bg-background-elevated rounded-lg animate-shimmer bg-[length:200%_100%]" />
  );
}

function EmptyState() {
  return (
    <div className="h-52 flex items-center justify-center text-xs text-foreground-subtle border border-border/30 rounded-lg bg-background-elevated/20">
      No data — add your Covalent API key in Settings
    </div>
  );
}
