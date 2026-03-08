/**
 * AgentLens — How It Works Page
 * Explains ERC-8004, Covalent, and the data pipeline
 */
import { BookOpen, Layers, Database, Activity, ArrowRight, ExternalLink } from "lucide-react";

const STEPS = [
  {
    icon: Layers,
    title: "ERC-8004 Identity Registry",
    color: "text-primary",
    bg: "bg-primary/10 border-primary/20",
    body: `ERC-8004 is an emerging on-chain standard for AI agent identity. The Identity Registry contract (0x8004A169FB…) maps unique Agent IDs to their wallet addresses, metadata (name, framework, version), and optionally reputation scores. By querying this registry, AgentLens discovers which addresses are registered AI agents rather than regular wallets.`,
    links: [
      { label: "ERC-8004 Registry (Etherscan)", url: "https://etherscan.io/address/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" },
      { label: "8004agents.ai", url: "https://8004agents.ai" },
    ],
  },
  {
    icon: Database,
    title: "Covalent GoldRush API",
    color: "text-secondary",
    bg: "bg-secondary/10 border-secondary/20",
    body: `Covalent's GoldRush (formerly Unified API) provides normalized, multi-chain blockchain data accessible via REST. AgentLens uses the \`transactions_v3\` endpoint to pull the full transaction history for each agent address. Each response includes: tx hash, success/failure status, gas used vs offered, USD-denominated gas costs, and decoded log events — all the signals needed for performance analytics.`,
    links: [
      { label: "Covalent Docs", url: "https://www.covalenthq.com/docs/unified-api/transactions/" },
      { label: "Get Free API Key", url: "https://www.covalenthq.com" },
    ],
  },
  {
    icon: Activity,
    title: "Failure Classification",
    color: "text-warning",
    bg: "bg-warning/10 border-warning/20",
    body: `Every failed transaction is classified into a reason category using pattern matching on Covalent's response fields. The \`successful: false\` flag identifies failures. AgentLens then inspects log events and raw data for known revert strings — "slippage tolerance exceeded", "out of gas", "nonce too low", "deadline passed", etc. — to classify the root cause for each failure.`,
    links: [],
  },
  {
    icon: BookOpen,
    title: "Data Pipeline",
    color: "text-success",
    bg: "bg-success/10 border-success/20",
    body: `All data is fetched client-side directly from the Covalent API — no AgentLens server is involved. Your API key never leaves your browser (stored in localStorage). Requests are rate-limited to 3 concurrent calls with 300ms spacing to respect Covalent's free tier limits. Data auto-refreshes every 60 seconds, and a manual refresh button is available in the header.`,
    links: [],
  },
];

const AGENT_FRAMEWORKS = [
  {
    name: "Virtuals Protocol",
    color: "hsl(182,100%,45%)",
    description: "On-chain AI agent launchpad on Base. Agents hold ERC-20 tokens and interact with DeFi protocols autonomously.",
    url: "https://app.virtuals.io",
  },
  {
    name: "elizaOS",
    color: "hsl(258,90%,66%)",
    description: "Open-source multi-agent simulation framework. Agents can be deployed to interact with smart contracts via plugin architecture.",
    url: "https://elizaos.ai",
  },
  {
    name: "Clanker",
    color: "hsl(38,100%,55%)",
    description: "AI-native token factory on Base. Clanker agents autonomously deploy ERC-20 tokens based on social signals.",
    url: "https://clanker.world",
  },
];

export default function HowItWorks() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 text-xs text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full mb-3">
          <BookOpen size={11} />
          Documentation
        </div>
        <h1 className="text-2xl font-bold text-foreground">How AgentPulse Works</h1>
        <p className="text-sm text-foreground-muted mt-2 max-w-2xl">
          AgentPulse aggregates 100% public on-chain data using the ERC-8004 AI agent
          identity standard and the Covalent GoldRush API. No custody, no login,
          no centralized database.
        </p>
      </div>

      {/* Architecture diagram */}
      <div className="card-glow rounded-xl bg-background-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Architecture Overview</h3>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs">
          {[
            { label: "ERC-8004 Registry", sublabel: "Agent discovery", color: "text-primary" },
            { label: "Covalent API", sublabel: "Transaction data", color: "text-secondary" },
            { label: "AgentLens", sublabel: "Your browser", color: "text-success" },
            { label: "Dashboard", sublabel: "Charts + tables", color: "text-warning" },
          ].map((node, i) => (
            <div key={node.label} className="flex items-center gap-2 sm:gap-4">
              <div className="text-center">
                <div
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border font-medium ${
                    node.color === "text-primary"
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : node.color === "text-secondary"
                      ? "bg-secondary/10 border-secondary/30 text-secondary"
                      : node.color === "text-success"
                      ? "bg-success/10 border-success/30 text-success"
                      : "bg-warning/10 border-warning/30 text-warning"
                  }`}
                >
                  {node.label}
                </div>
                <p className="text-foreground-subtle mt-1">{node.sublabel}</p>
              </div>
              {i < 3 && (
                <ArrowRight size={14} className="text-foreground-subtle flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {STEPS.map((step) => (
          <div
            key={step.title}
            className={`card-glow rounded-xl bg-background-card p-5 border ${step.bg.split(" ")[1]}`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${step.bg}`}>
                <step.icon size={15} className={step.color} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-semibold ${step.color} mb-2`}>{step.title}</h3>
                <p className="text-xs text-foreground-muted leading-relaxed">{step.body}</p>
                {step.links.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {step.links.map((link) => (
                      <a
                        key={link.url}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-primary border border-primary/20 bg-primary/5 px-2 py-1 rounded hover:bg-primary/10 transition-colors"
                      >
                        {link.label} <ExternalLink size={9} />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Agent Frameworks */}
      <div className="card-glow rounded-xl bg-background-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Tracked Agent Frameworks
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {AGENT_FRAMEWORKS.map((fw) => (
            <a
              key={fw.name}
              href={fw.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-lg border border-border hover:border-border-accent transition-all group bg-background-elevated/40"
            >
              <div
                className="text-xs font-semibold mb-1.5 group-hover:underline"
                style={{ color: fw.color }}
              >
                {fw.name} ↗
              </div>
              <p className="text-[11px] text-foreground-muted leading-relaxed">
                {fw.description}
              </p>
            </a>
          ))}
        </div>
      </div>

      {/* Data freshness */}
      <div className="card-glow rounded-xl bg-background-card p-5 border border-success/20">
        <div className="flex items-start gap-3">
          <div className="w-2 h-2 rounded-full bg-success pulse-neon mt-1.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-success mb-1">Live Data</h3>
            <p className="text-xs text-foreground-muted">
              AgentLens refreshes data every 60 seconds automatically, or on demand
              via the refresh button in the header. Transaction data typically has
              1–5 block lag depending on Covalent's indexing speed. Gas USD values
              use the spot price at transaction time as reported by Covalent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
