/**
 * AgentPulse — Performance Analytics Page
 * Multi-line charts + failure heatmap
 */
import { useMemo } from "react";
import {
  LineChart,
  Line,
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
import { buildDailyTimeSeries, buildFailureBreakdown } from "@/lib/covalent";
import { exportToCsv } from "@/lib/exportCsv";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background-elevated border border-border rounded-lg px-3 py-2 text-xs shadow-card-elevated space-y-0.5">
      <p className="text-foreground-muted mb-1 font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" ? p.value.toFixed(2) : p.value}
          {p.name?.includes("Rate") || p.name?.includes("%") ? "%" : ""}
        </p>
      ))}
    </div>
  );
};

const FAILURE_COLORS = [
  "hsl(0,84%,60%)",
  "hsl(38,100%,55%)",
  "hsl(258,90%,66%)",
  "hsl(182,100%,45%)",
  "hsl(142,76%,48%)",
  "hsl(215,20%,50%)",
];

export default function PerformanceAnalytics() {
  const { allTxs, metricsMap, isLoading } = useApp();
  const metrics = Object.values(metricsMap);

  const timeSeries = useMemo(() => buildDailyTimeSeries(allTxs, 14), [allTxs]);
  const failureBreakdown = useMemo(() => buildFailureBreakdown(allTxs), [allTxs]);

  // Per-agent success rate series (top 5)
  const top5Agents = useMemo(
    () => [...metrics].sort((a, b) => b.txCount - a.txCount).slice(0, 5),
    [metrics],
  );

  const handleExportTimeSeries = () => {
    exportToCsv(timeSeries as any, "performance_timeseries");
  };

  const handleExportFailures = () => {
    exportToCsv(
      failureBreakdown.map((f) => ({
        reason: f.reason,
        count: f.count,
        gas_wasted_usd: f.gasWasted.toFixed(4),
      })),
      "failure_breakdown",
    );
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-foreground">Performance Analytics</h1>
        <p className="text-sm text-foreground-muted mt-1">
          Daily trends, gas efficiency, and failure analysis across all tracked agents.
        </p>
      </div>

      {/* Multi-line success rate chart */}
      <div className="card-glow rounded-xl bg-background-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Daily Success Rate — 14 Day Trend
            </h3>
            <p className="text-xs text-foreground-muted mt-0.5">
              Overall + individual top agents
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportTimeSeries}
            className="text-foreground-muted gap-1.5 h-7 text-xs"
          >
            <Download size={11} /> CSV
          </Button>
        </div>

        {isLoading ? (
          <div className="h-64 bg-background-elevated rounded-lg animate-shimmer bg-[length:200%_100%]" />
        ) : allTxs.length === 0 ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={timeSeries} margin={{ top: 4, right: 16, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(224,24%,14%)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(215,20%,50%)" }} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(215,20%,50%)" }} tickLine={false} axisLine={false} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "hsl(215,20%,55%)" }} />
              <Line
                type="monotone"
                dataKey="successRate"
                name="All Agents %"
                stroke="hsl(182,100%,45%)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Gas efficiency chart */}
      <div className="card-glow rounded-xl bg-background-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Gas Efficiency (USD per success tx)
            </h3>
            <p className="text-xs text-foreground-muted mt-0.5">
              Average gas cost on successful transactions
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportTimeSeries}
            className="text-foreground-muted gap-1.5 h-7 text-xs"
          >
            <Download size={11} /> CSV
          </Button>
        </div>
        {isLoading ? (
          <div className="h-52 bg-background-elevated rounded-lg animate-shimmer bg-[length:200%_100%]" />
        ) : allTxs.length === 0 ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={timeSeries} margin={{ top: 4, right: 16, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(224,24%,14%)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(215,20%,50%)" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(215,20%,50%)" }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="gasUsd"
                name="Avg Gas USD"
                stroke="hsl(38,100%,55%)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Failure breakdown heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card-glow rounded-xl bg-background-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Failure Breakdown by Reason
              </h3>
              <p className="text-xs text-foreground-muted mt-0.5">
                Count of failures per revert reason
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportFailures}
              className="text-foreground-muted gap-1.5 h-7 text-xs"
            >
              <Download size={11} /> CSV
            </Button>
          </div>
          {isLoading ? (
            <div className="h-52 bg-background-elevated rounded-lg animate-shimmer bg-[length:200%_100%]" />
          ) : failureBreakdown.length === 0 ? (
            <EmptyState message="No failures found or no data loaded" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={failureBreakdown}
                layout="vertical"
                margin={{ top: 4, right: 16, bottom: 0, left: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(224,24%,14%)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(215,20%,50%)" }} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="reason"
                  tick={{ fontSize: 9, fill: "hsl(215,20%,55%)" }}
                  tickLine={false}
                  axisLine={false}
                  width={110}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Failures" radius={[0, 4, 4, 0]}>
                  {failureBreakdown.map((_, i) => (
                    <Cell key={i} fill={FAILURE_COLORS[i % FAILURE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Gas wasted by failure reason */}
        <div className="card-glow rounded-xl bg-background-card p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">
              Gas Wasted by Failure Reason (USD)
            </h3>
            <p className="text-xs text-foreground-muted mt-0.5">
              Total gas cost in failed transactions
            </p>
          </div>
          {isLoading ? (
            <div className="h-52 bg-background-elevated rounded-lg animate-shimmer bg-[length:200%_100%]" />
          ) : failureBreakdown.length === 0 ? (
            <EmptyState message="No failure data to display" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={failureBreakdown.map((f) => ({
                  reason: f.reason,
                  gasWasted: parseFloat(f.gasWasted.toFixed(4)),
                }))}
                layout="vertical"
                margin={{ top: 4, right: 16, bottom: 0, left: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(224,24%,14%)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(215,20%,50%)" }} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="reason"
                  tick={{ fontSize: 9, fill: "hsl(215,20%,55%)" }}
                  tickLine={false}
                  axisLine={false}
                  width={110}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="gasWasted" name="Gas USD" radius={[0, 4, 4, 0]}>
                  {failureBreakdown.map((_, i) => (
                    <Cell key={i} fill={FAILURE_COLORS[i % FAILURE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Per-agent performance table */}
      <div className="card-glow rounded-xl bg-background-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">
            Agent Performance Summary
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              exportToCsv(
                metrics.map((m) => ({
                  agent: m.name,
                  address: m.address,
                  chain: m.chain,
                  framework: m.framework,
                  tx_count: m.txCount,
                  success_count: m.successCount,
                  fail_count: m.failCount,
                  success_rate_pct: m.successRate.toFixed(2),
                  avg_gas_usd: m.avgGasUsd.toFixed(4),
                })),
                "agent_performance",
              )
            }
            className="text-foreground-muted gap-1.5 h-7 text-xs"
          >
            <Download size={11} /> Export CSV
          </Button>
        </div>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-background-elevated rounded animate-shimmer bg-[length:200%_100%]" />
            ))}
          </div>
        ) : metrics.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-foreground-muted">
                  {["Agent", "Tx Count", "Success", "Fail", "Rate", "Avg Gas $", "24h Txs"].map((h) => (
                    <th key={h} className={`pb-2 font-medium ${h === "Agent" ? "text-left" : "text-right"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map((m) => (
                  <tr key={m.address} className="border-b border-border/40 table-row-hover">
                    <td className="py-2.5 pr-3 font-medium text-foreground">{m.name}</td>
                    <td className="text-right py-2.5 text-foreground">{m.txCount}</td>
                    <td className="text-right py-2.5 text-success">{m.successCount}</td>
                    <td className="text-right py-2.5 text-destructive">{m.failCount}</td>
                    <td className="text-right py-2.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${m.successRate >= 90 ? "badge-success" : m.successRate >= 70 ? "badge-warning" : "badge-error"}`}>
                        {m.successRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-right py-2.5 text-foreground-muted">
                      {m.avgGasUsd > 0 ? `$${m.avgGasUsd.toFixed(4)}` : "—"}
                    </td>
                    <td className="text-right py-2.5 text-foreground-muted">
                      {m.last24hTxCount}
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

function EmptyState({ message = "No data — add your Covalent API key in Settings" }: { message?: string }) {
  return (
    <div className="h-52 flex items-center justify-center text-xs text-foreground-subtle border border-border/30 rounded-lg bg-background-elevated/20">
      {message}
    </div>
  );
}
