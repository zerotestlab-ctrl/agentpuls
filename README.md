# AgentPuls

**The analytics platform for on-chain AI agents** — Real-time performance analytics, success rates, failure forensics, and gas efficiency benchmarks for autonomous agents across Base, Ethereum, Avalanche and beyond.

Live demo: https://agentpuls.lovable.app/  
GitHub: https://github.com/zerotestlab-ctrl/agentpuls

## Why AgentPuls Matters

2026 is the year of on-chain AI agents (trading swarms, autonomous governance, cross-chain executors).  
Dune shows volume. Virtuals shows its own revenue.  
**Nobody** shows whether agents actually succeed, why they fail, or which frameworks are truly efficient.

Agentpuls is the missing public-good layer: neutral, open, performance-first analytics that every agent builder, protocol, and investor needs daily.

## Core Features

### 🫧 Interactive Bubble Map (Homepage)
- Agents as living bubbles: size = 24h transaction volume, color = success rate (green → red gradient)
- Hover tooltips + time filters (4H / 24H / 7D)
- Click any bubble → full Agent Profile

### 📊 Agent Profile
- Hero header with blockie avatar + name/ID
- Elegant stat grid (Success %, Gas per Success, Failures, Volume)
- Success-rate price-style chart + failure heatmap
- Tabs: Overview • Performance • Failures Explorer • Transaction History
- One-click “Track Agent” → adds to your personal watchlist
- Shareable links (`?agent=0x...`)

### 📈 Performance Analytics & Leaderboards
- Real success/failure classification (revert reasons parsed)
- Gas efficiency benchmarks across frameworks (Virtuals, elizaOS, Clanker, etc.)
- Cross-chain comparison bars
- Sortable leaderboards with min-success-rate filters

### ❤️ My Tracked Agents
Portfolio-style grid of agents you’re watching — live updates on one page.

### 🛠️ Failures Explorer
Detailed failed transactions with debug tips and gas wasted.

## How It Works (100% on-chain, zero trust)

1. Uses public **GoldRush (Covalent)** API for transaction data + **The Graph** ERC-8004 subgraph for agent discovery.
2. First load = beautiful demo data (instant <300ms).
3. Add your free GoldRush key in Settings → unlock live data.
4. Click **Refresh Data** (manual only — no auto-refresh, no loops).
5. All data cached with TanStack Query for speed.

No login. No custody. No data collection. Pure public good.

## Tech Stack

- React + TypeScript + Vite
- Tailwind + shadcn/ui + Framer Motion
- Recharts + TanStack React Query
- GoldRush API + The Graph
- Fully responsive (mobile-first)

## Roadmap (next 30 days – after launch & first grants)
- [ ] Public API for agents to self-query performance
- [ ] Telegram + Discord failure alerts (opt-in)
- [ ] Official embed widget for Virtuals, Clanker, and elizaOS dashboards

## Quick Start (Local)

```bash
git clone https://github.com/zerotestlab-ctrl/agentpuls.git
cd agentpuls
npm install
npm run dev
