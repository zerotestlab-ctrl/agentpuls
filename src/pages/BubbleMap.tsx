/**
 * AgentPulse — Interactive Bubble Map (new main discovery page)
 * Birdeye-style: agents as bubbles sized by tx volume, colored by success rate
 * Time filters, hover tooltips, click-to-profile
 */
import { useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/contexts/AppContext";
import { CHAIN_LABELS, shortAddress } from "@/lib/agents";
import { Button } from "@/components/ui/button";
import { RefreshCw, Zap, TrendingUp, AlertCircle, Clock } from "lucide-react";

const TIME_FILTERS = ["4H", "8H", "24H", "7D"] as const;
type TimeFilter = typeof TIME_FILTERS[number];

// Map success rate 0–100 to a neon green–red gradient
function successColor(rate: number): string {
  if (rate >= 90) return "hsl(142,76%,48%)";
  if (rate >= 75) return "hsl(160,70%,45%)";
  if (rate >= 60) return "hsl(38,100%,55%)";
  if (rate >= 40) return "hsl(20,90%,55%)";
  return "hsl(0,84%,60%)";
}

function successGlow(rate: number): string {
  if (rate >= 90) return "0 0 20px hsl(142 76% 48% / 0.5)";
  if (rate >= 75) return "0 0 20px hsl(160 70% 45% / 0.5)";
  if (rate >= 60) return "0 0 20px hsl(38 100% 55% / 0.4)";
  return "0 0 20px hsl(0 84% 60% / 0.4)";
}

interface BubbleData {
  address: string;
  name: string;
  framework: string;
  chain: string;
  txCount: number;
  successRate: number;
  avgGasUsd: number;
  failCount: number;
  last24hTxCount: number;
  size: number; // 32–96
  x: number;
  y: number;
}

export default function BubbleMap() {
  const { metricsMap, isLoading, hasLoaded, refresh, chain } = useApp();
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("24H");
  const [hoveredBubble, setHoveredBubble] = useState<BubbleData | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const metrics = Object.values(metricsMap);

  // Build positioned bubbles with deterministic layout
  const bubbles = useMemo((): BubbleData[] => {
    if (metrics.length === 0) return [];

    const maxTx = Math.max(...metrics.map(m =>
      timeFilter === "24H" || timeFilter === "4H" || timeFilter === "8H"
        ? m.last24hTxCount : m.txCount
    ), 1);

    // Use a simple packed-circle layout via golden angle distribution
    return metrics.map((m, i) => {
      const txVal = timeFilter === "7D" ? m.txCount : m.last24hTxCount;
      const ratio = txVal / maxTx;
      const size = Math.max(40, Math.min(100, 40 + ratio * 60));

      // Golden angle spiral positioning
      const goldenAngle = 2.39996;
      const r = 18 * Math.sqrt(i + 1);
      const theta = i * goldenAngle;
      // Keep within 5–95%
      const x = 50 + (r * Math.cos(theta)) / 2.5;
      const y = 50 + (r * Math.sin(theta)) / 3;
      const clampedX = Math.max(8, Math.min(90, x));
      const clampedY = Math.max(8, Math.min(90, y));

      return {
        address: m.address,
        name: m.name,
        framework: m.framework,
        chain: m.chain,
        txCount: m.txCount,
        successRate: m.successRate,
        avgGasUsd: m.avgGasUsd,
        failCount: m.failCount,
        last24hTxCount: m.last24hTxCount,
        size,
        x: clampedX,
        y: clampedY,
      };
    });
  }, [metrics, timeFilter]);

  const handleMouseMove = (e: React.MouseEvent<SVGCircleElement>, bubble: BubbleData) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setHoveredBubble(bubble);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bubble Map</h1>
          <p className="text-sm text-foreground-muted mt-1">
            Agent discovery — bubble size = tx volume, color = success rate
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Time filters */}
          <div className="flex items-center gap-1 p-1 bg-background-elevated rounded-xl border border-border">
            {TIME_FILTERS.map(f => (
              <button key={f} onClick={() => setTimeFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  timeFilter === f
                    ? "bg-primary text-primary-foreground shadow-neon-sm"
                    : "text-foreground-muted hover:text-foreground hover:bg-accent/50"
                }`}>
                {f}
              </button>
            ))}
          </div>
          <Button onClick={refresh} disabled={isLoading}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-9 font-semibold shadow-neon-sm">
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
            {isLoading ? "Loading…" : hasLoaded ? "Refresh" : "Load Data"}
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-foreground-muted">
        <span className="font-medium text-foreground-subtle uppercase tracking-wider text-[10px]">Success Rate:</span>
        {[
          { label: "≥90%", color: "hsl(142,76%,48%)" },
          { label: "75–90%", color: "hsl(160,70%,45%)" },
          { label: "60–75%", color: "hsl(38,100%,55%)" },
          { label: "<60%", color: "hsl(0,84%,60%)" },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            <span>{label}</span>
          </div>
        ))}
        <span className="ml-4 text-foreground-subtle">· Bubble size = {timeFilter} tx volume</span>
      </div>

      {/* No data state */}
      {!hasLoaded && !isLoading && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="card-glass rounded-2xl p-16 text-center space-y-5 border border-border">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
            <Zap size={26} className="text-primary" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">No agent data yet</p>
            <p className="text-sm text-foreground-muted mt-2 max-w-sm mx-auto">
              Click "Load Data" to fetch live on-chain metrics. Agents will appear as interactive bubbles.
            </p>
          </div>
          <Button onClick={refresh} disabled={isLoading}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shadow-neon">
            <RefreshCw size={13} /> Load Data
          </Button>
        </motion.div>
      )}

      {/* Bubble canvas */}
      {(hasLoaded || isLoading) && (
        <div ref={containerRef}
          className="card-glass rounded-2xl border border-border relative overflow-hidden"
          style={{ height: "520px", background: "radial-gradient(ellipse 100% 70% at 50% 50%, hsl(142 76% 48% / 0.03) 0%, transparent 70%)" }}>

          {/* Grid lines */}
          <div className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
              backgroundSize: "60px 60px"
            }} />

          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                <p className="text-sm text-foreground-muted">Fetching agent data…</p>
              </div>
            </div>
          ) : bubbles.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-foreground-muted">No agent data for this chain</p>
            </div>
          ) : (
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
              <defs>
                {bubbles.map(b => (
                  <radialGradient key={`g-${b.address}`} id={`grad-${b.address.slice(2, 8)}`} cx="35%" cy="35%" r="65%">
                    <stop offset="0%" stopColor={successColor(b.successRate)} stopOpacity="0.95" />
                    <stop offset="100%" stopColor={successColor(b.successRate)} stopOpacity="0.55" />
                  </radialGradient>
                ))}
              </defs>
              {bubbles.map((bubble, i) => (
                <motion.g key={bubble.address}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.04, duration: 0.4, type: "spring", stiffness: 200 }}>
                  {/* Outer glow ring */}
                  <circle
                    cx={bubble.x}
                    cy={bubble.y}
                    r={bubble.size / 100 * 5.5 + 0.8}
                    fill="none"
                    stroke={successColor(bubble.successRate)}
                    strokeWidth="0.2"
                    opacity="0.4"
                  />
                  {/* Main bubble */}
                  <circle
                    cx={bubble.x}
                    cy={bubble.y}
                    r={bubble.size / 100 * 5.5}
                    fill={`url(#grad-${bubble.address.slice(2, 8)})`}
                    stroke={successColor(bubble.successRate)}
                    strokeWidth="0.15"
                    strokeOpacity="0.6"
                    className="cursor-pointer transition-all duration-200"
                    style={{
                      filter: hoveredBubble?.address === bubble.address
                        ? `drop-shadow(0 0 3px ${successColor(bubble.successRate)})`
                        : undefined
                    }}
                    onMouseMove={e => handleMouseMove(e, bubble)}
                    onMouseLeave={() => setHoveredBubble(null)}
                    onClick={() => navigate(`/agent/${bubble.address}`)}
                  />
                  {/* Label inside bubble if large enough */}
                  {bubble.size >= 60 && (
                    <text
                      x={bubble.x}
                      y={bubble.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="1.1"
                      fill="white"
                      fillOpacity="0.9"
                      fontWeight="600"
                      pointerEvents="none"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      {bubble.name.split(" ")[0].slice(0, 8)}
                    </text>
                  )}
                  {bubble.size >= 60 && (
                    <text
                      x={bubble.x}
                      y={bubble.y + 1.8}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="0.9"
                      fill="white"
                      fillOpacity="0.7"
                      pointerEvents="none"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      {bubble.successRate.toFixed(0)}%
                    </text>
                  )}
                </motion.g>
              ))}
            </svg>
          )}

          {/* Tooltip */}
          <AnimatePresence>
            {hoveredBubble && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                className="absolute z-50 pointer-events-none"
                style={{
                  left: Math.min(tooltipPos.x + 12, (containerRef.current?.offsetWidth ?? 400) - 200),
                  top: Math.max(tooltipPos.y - 120, 8),
                }}
              >
                <div className="bg-background-card border border-border rounded-xl p-3.5 shadow-card-elevated w-48">
                  <div className="flex items-start gap-2 mb-2.5">
                    <div className="w-2.5 h-2.5 rounded-full mt-0.5 flex-shrink-0"
                      style={{ background: successColor(hoveredBubble.successRate), boxShadow: successGlow(hoveredBubble.successRate) }} />
                    <div>
                      <p className="text-xs font-semibold text-foreground leading-tight">{hoveredBubble.name}</p>
                      <p className="text-[9px] text-foreground-muted font-mono">{shortAddress(hoveredBubble.address)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    <div>
                      <p className="text-foreground-subtle">Success</p>
                      <p className="font-bold" style={{ color: successColor(hoveredBubble.successRate) }}>
                        {hoveredBubble.successRate.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-foreground-subtle">24h Txs</p>
                      <p className="font-bold text-foreground">{hoveredBubble.last24hTxCount}</p>
                    </div>
                    <div>
                      <p className="text-foreground-subtle">Failures</p>
                      <p className="font-bold text-destructive">{hoveredBubble.failCount}</p>
                    </div>
                    <div>
                      <p className="text-foreground-subtle">Avg Gas</p>
                      <p className="font-bold text-foreground">
                        {hoveredBubble.avgGasUsd > 0 ? `$${hoveredBubble.avgGasUsd.toFixed(4)}` : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-border flex items-center justify-between">
                    <span className="badge-info text-[8px] px-1.5 py-0.5 rounded-md">{hoveredBubble.framework}</span>
                    <span className="text-[9px] text-foreground-subtle">Click to open →</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats overlay */}
          {!isLoading && bubbles.length > 0 && (
            <div className="absolute bottom-4 left-4 flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-background-card/80 backdrop-blur-sm border border-border rounded-lg px-3 py-1.5 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-primary pulse-neon" />
                <span className="text-foreground-muted">{bubbles.length} agents · {CHAIN_LABELS[chain]}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-background-card/80 backdrop-blur-sm border border-border rounded-lg px-3 py-1.5 text-xs">
                <Clock size={10} className="text-foreground-subtle" />
                <span className="text-foreground-muted">{timeFilter} window</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Agent grid below bubble map */}
      {hasLoaded && bubbles.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">All Agents</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {bubbles.map((b, i) => (
              <motion.div key={b.address}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => navigate(`/agent/${b.address}`)}
                className="card-glass card-glass-hover rounded-xl p-3 cursor-pointer group">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: successColor(b.successRate) }} />
                  <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {b.name}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <div>
                    <p className="text-foreground-subtle">Success</p>
                    <p className="font-bold" style={{ color: successColor(b.successRate) }}>{b.successRate.toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-foreground-subtle">Txs</p>
                    <p className="font-bold text-foreground">{b.txCount}</p>
                  </div>
                </div>
                <span className="badge-info text-[8px] px-1.5 py-0.5 rounded-md mt-2 inline-block">{b.framework}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
