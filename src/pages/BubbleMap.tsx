/**
 * Agentpuls — Interactive Bubble Map (Birdeye-style discovery page)
 * Agents shown as colored bubbles (size = tx volume, color = success rate).
 * Works with demo data instantly, live data after refresh.
 */
import { useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/contexts/AppContext";
import { CHAIN_LABELS, KNOWN_AGENTS, shortAddress } from "@/lib/agents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Clock, KeyRound, Search, X, Activity } from "lucide-react";

const TIME_FILTERS = ["4H", "8H", "24H", "7D"] as const;
type TimeFilter = typeof TIME_FILTERS[number];

const ETH_ADDR = /^0x[0-9a-fA-F]{40}$/;

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
  size: number;
  x: number;
  y: number;
}

export default function BubbleMap() {
  const { metricsMap, isLoading, isLiveMode, hasUserKey, refresh, chain } = useApp();
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("24H");
  const [hoveredBubble, setHoveredBubble] = useState<BubbleData | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const metrics = Object.values(metricsMap);

  // Search logic
  const searchResults = searchQuery.trim().length > 1
    ? KNOWN_AGENTS.filter(a =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.address.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 6)
    : [];

  const handleSearchSubmit = (address?: string) => {
    const addr = address ?? searchQuery.trim();
    if (ETH_ADDR.test(addr)) {
      navigate(`/agent/${addr}`);
      setSearchQuery("");
    } else if (addr) {
      const found = KNOWN_AGENTS.find(a => a.name.toLowerCase().includes(addr.toLowerCase()));
      if (found) {
        navigate(`/agent/${found.address}`);
        setSearchQuery("");
      }
    }
  };

  const bubbles = useMemo((): BubbleData[] => {
    if (metrics.length === 0) return [];
    const maxTx = Math.max(...metrics.map(m =>
      timeFilter === "7D" ? m.txCount : m.last24hTxCount
    ), 1);

    return metrics.map((m, i) => {
      const txVal = timeFilter === "7D" ? m.txCount : m.last24hTxCount;
      const ratio = txVal / maxTx;
      const size = Math.max(40, Math.min(100, 40 + ratio * 60));

      // Golden angle spiral positioning
      const goldenAngle = 2.39996;
      const r = 18 * Math.sqrt(i + 1);
      const theta = i * goldenAngle;
      const x = 50 + (r * Math.cos(theta)) / 2.5;
      const y = 50 + (r * Math.sin(theta)) / 3;

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
        x: Math.max(8, Math.min(90, x)),
        y: Math.max(8, Math.min(90, y)),
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
    <div className="p-4 sm:p-6 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bubble Map</h1>
          <p className="text-sm text-foreground-muted mt-1">
            Agent discovery — bubble size = tx volume · color = success rate
            {!isLiveMode && <span className="ml-2 text-warning text-[11px]">· Demo data</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          {hasUserKey ? (
            <Button onClick={refresh} disabled={isLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-9 font-semibold shadow-neon-sm rounded-xl">
              <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
              {isLoading ? "Loading…" : "Refresh"}
            </Button>
          ) : (
            <Button variant="outline" size="sm"
              className="gap-2 h-9 border-border text-foreground-muted rounded-xl text-xs"
              onClick={() => document.dispatchEvent(new CustomEvent("open-settings"))}>
              <KeyRound size={12} className="text-primary" /> Add Key for Live
            </Button>
          )}
        </div>
      </div>

      {/* ── Sticky search bar ── */}
      <div className="sticky top-[56px] z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2.5 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="relative max-w-2xl">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-subtle pointer-events-none z-10" />
          <Input
            ref={searchRef}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
            onKeyDown={e => {
              if (e.key === "Enter") handleSearchSubmit();
              if (e.key === "Escape") { setSearchQuery(""); searchRef.current?.blur(); }
            }}
            placeholder="Search any agent address or ERC-8004 ID…"
            className="pl-9 pr-10 h-10 bg-background-elevated border-border text-sm focus:border-primary/50 rounded-xl placeholder:text-foreground-subtle transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-subtle hover:text-foreground transition-colors"
            >
              <X size={12} />
            </button>
          )}

          {/* Search dropdown */}
          <AnimatePresence>
            {searchFocused && (searchResults.length > 0 || (searchQuery.length > 1 && ETH_ADDR.test(searchQuery))) && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full mt-1.5 left-0 right-0 bg-background-card border border-border rounded-xl shadow-card-elevated z-50 overflow-hidden"
              >
                {ETH_ADDR.test(searchQuery) && (
                  <button onMouseDown={() => handleSearchSubmit(searchQuery)}
                    className="w-full px-3.5 py-3 flex items-center gap-3 hover:bg-accent/50 text-left transition-colors border-b border-border/50">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Search size={11} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Open agent profile</p>
                      <p className="text-[10px] text-foreground-muted font-mono">{shortAddress(searchQuery)}</p>
                    </div>
                  </button>
                )}
                {searchResults.map(agent => (
                  <button key={agent.address} onMouseDown={() => handleSearchSubmit(agent.address)}
                    className="w-full px-3.5 py-3 flex items-center gap-3 hover:bg-accent/50 text-left transition-colors last:rounded-b-xl">
                    <div className="w-7 h-7 rounded-lg bg-primary/8 border border-primary/15 flex items-center justify-center flex-shrink-0">
                      <Activity size={11} className="text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">{agent.name}</p>
                      <p className="text-[10px] text-foreground-muted font-mono">{shortAddress(agent.address)}</p>
                    </div>
                    <span className="badge-info text-[9px] px-1.5 py-0.5 rounded-md flex-shrink-0">{agent.framework}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-foreground-muted">
        <span className="font-semibold text-foreground-subtle uppercase tracking-wider text-[10px]">Success Rate:</span>
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
        <span className="ml-2 text-foreground-subtle">· Bubble size = {timeFilter} tx volume</span>
      </div>

      {/* Bubble canvas */}
      <div
        ref={containerRef}
        className="card-glass rounded-2xl border border-border relative overflow-hidden"
        style={{
          height: "520px",
          background: "radial-gradient(ellipse 100% 70% at 50% 50%, hsl(142 76% 48% / 0.025) 0%, transparent 70%)"
        }}
      >
        {/* Grid background */}
        <div className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
            backgroundSize: "60px 60px"
          }}
        />

        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              <p className="text-sm text-foreground-muted">Fetching live agent data…</p>
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
                  <stop offset="100%" stopColor={successColor(b.successRate)} stopOpacity="0.5" />
                </radialGradient>
              ))}
            </defs>
            {bubbles.map((bubble, i) => (
              <motion.g key={bubble.address}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.04, duration: 0.4, type: "spring", stiffness: 200 }}>
                {/* Glow ring */}
                <circle
                  cx={bubble.x} cy={bubble.y}
                  r={bubble.size / 100 * 5.5 + 0.8}
                  fill="none"
                  stroke={successColor(bubble.successRate)}
                  strokeWidth="0.2"
                  opacity="0.35"
                />
                {/* Main bubble — clickable → Agent Profile */}
                <circle
                  cx={bubble.x} cy={bubble.y}
                  r={bubble.size / 100 * 5.5}
                  fill={`url(#grad-${bubble.address.slice(2, 8)})`}
                  stroke={successColor(bubble.successRate)}
                  strokeWidth="0.12"
                  strokeOpacity="0.5"
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
                {/* Label inside large bubbles */}
                {bubble.size >= 60 && (
                  <>
                    <text x={bubble.x} y={bubble.y - 0.6} textAnchor="middle" dominantBaseline="middle"
                      fontSize="1.1" fill="white" fillOpacity="0.9" fontWeight="600"
                      pointerEvents="none" style={{ fontFamily: "Inter, sans-serif" }}>
                      {bubble.name.split(" ")[0].slice(0, 8)}
                    </text>
                    <text x={bubble.x} y={bubble.y + 1.6} textAnchor="middle" dominantBaseline="middle"
                      fontSize="0.9" fill="white" fillOpacity="0.7"
                      pointerEvents="none" style={{ fontFamily: "Inter, sans-serif" }}>
                      {bubble.successRate.toFixed(0)}%
                    </text>
                  </>
                )}
              </motion.g>
            ))}
          </svg>
        )}

        {/* Hover tooltip */}
        <AnimatePresence>
          {hoveredBubble && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.1 }}
              className="absolute z-50 pointer-events-none"
              style={{
                left: Math.min(tooltipPos.x + 14, (containerRef.current?.offsetWidth ?? 400) - 210),
                top: Math.max(tooltipPos.y - 130, 8),
              }}
            >
              <div className="bg-background-card border border-border rounded-xl p-3.5 shadow-card-elevated w-52">
                <div className="flex items-start gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0"
                    style={{ background: successColor(hoveredBubble.successRate), boxShadow: successGlow(hoveredBubble.successRate) }} />
                  <div>
                    <p className="text-xs font-bold text-foreground leading-tight">{hoveredBubble.name}</p>
                    <p className="text-[9px] text-foreground-muted font-mono mt-0.5">{shortAddress(hoveredBubble.address)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-background-elevated rounded-lg p-2">
                    <p className="text-foreground-subtle mb-0.5">Success</p>
                    <p className="font-bold" style={{ color: successColor(hoveredBubble.successRate) }}>
                      {hoveredBubble.successRate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-background-elevated rounded-lg p-2">
                    <p className="text-foreground-subtle mb-0.5">24h Txs</p>
                    <p className="font-bold text-foreground">{hoveredBubble.last24hTxCount.toLocaleString()}</p>
                  </div>
                  <div className="bg-background-elevated rounded-lg p-2">
                    <p className="text-foreground-subtle mb-0.5">Failures</p>
                    <p className="font-bold text-destructive">{hoveredBubble.failCount}</p>
                  </div>
                  <div className="bg-background-elevated rounded-lg p-2">
                    <p className="text-foreground-subtle mb-0.5">Avg Gas</p>
                    <p className="font-bold text-foreground">
                      {hoveredBubble.avgGasUsd > 0 ? `$${hoveredBubble.avgGasUsd.toFixed(4)}` : "—"}
                    </p>
                  </div>
                </div>
                <div className="mt-2.5 pt-2.5 border-t border-border flex items-center justify-between">
                  <span className="badge-info text-[8px] px-1.5 py-0.5 rounded-md font-medium">{hoveredBubble.framework}</span>
                  <span className="text-[9px] text-foreground-subtle">Click to open →</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom status */}
        {bubbles.length > 0 && !isLoading && (
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-background-card/80 backdrop-blur-sm border border-border rounded-lg px-3 py-1.5 text-xs">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isLiveMode ? "bg-primary pulse-neon" : "bg-warning animate-pulse"}`} />
              <span className="text-foreground-muted">{bubbles.length} agents · {CHAIN_LABELS[chain]}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-background-card/80 backdrop-blur-sm border border-border rounded-lg px-3 py-1.5 text-xs">
              <Clock size={10} className="text-foreground-subtle" />
              <span className="text-foreground-muted">{timeFilter} window</span>
            </div>
          </div>
        )}
      </div>

      {/* Agent grid below map */}
      {bubbles.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">All Agents</h3>
            <span className="text-xs text-foreground-subtle">{bubbles.length} total</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {bubbles.map((b, i) => (
              <motion.div
                key={b.address}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => navigate(`/agent/${b.address}`)}
                className="card-glass card-glass-hover rounded-xl p-3 cursor-pointer group"
              >
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
                    <p className="font-bold text-foreground">{b.txCount.toLocaleString()}</p>
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
