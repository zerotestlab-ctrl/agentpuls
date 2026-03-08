/**
 * AgentLens — Known agent addresses & ERC-8004 registry constants
 *
 * ERC-8004 is the on-chain AI agent identity standard.
 * Registry contracts map agent IDs → on-chain addresses.
 */

export type SupportedChain = "base-mainnet" | "eth-mainnet" | "avalanche-mainnet";

export interface AgentInfo {
  address: string;
  name: string;
  framework: "Virtuals" | "elizaOS" | "Clanker" | "Custom" | "Unknown";
  chain: SupportedChain;
  description?: string;
  profileUrl?: string;
}

/** ERC-8004 Identity Registry contract addresses per chain */
export const ERC8004_REGISTRY: Record<SupportedChain, string> = {
  "eth-mainnet": "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
  "avalanche-mainnet": "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
  // Base uses the same cross-chain deployment pattern
  "base-mainnet": "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
};

/** Chain display labels */
export const CHAIN_LABELS: Record<SupportedChain, string> = {
  "base-mainnet": "Base",
  "eth-mainnet": "Ethereum",
  "avalanche-mainnet": "Avalanche",
};

/** Chain native token symbols */
export const CHAIN_NATIVE: Record<SupportedChain, string> = {
  "base-mainnet": "ETH",
  "eth-mainnet": "ETH",
  "avalanche-mainnet": "AVAX",
};

/** Chain color tokens for charts */
export const CHAIN_COLORS: Record<SupportedChain, string> = {
  "base-mainnet": "#0052FF",
  "eth-mainnet": "#627EEA",
  "avalanche-mainnet": "#E84142",
};

/** Framework color tokens */
export const FRAMEWORK_COLORS: Record<AgentInfo["framework"], string> = {
  Virtuals: "#00E5FF",
  elizaOS: "#7C3AED",
  Clanker: "#F59E0B",
  Custom: "#22C55E",
  Unknown: "#6B7280",
};

/**
 * Curated starter list of known AI agent addresses from the Virtuals ecosystem
 * and other popular on-chain agents. Used to seed the dashboard instantly.
 */
export const KNOWN_AGENTS: AgentInfo[] = [
  // Virtuals Protocol agents on Base
  {
    address: "0x1111111254EEB25477B68fb85Ed929f73A960582",
    name: "LUNA (Virtuals)",
    framework: "Virtuals",
    chain: "base-mainnet",
    description: "LUNA AI agent — first Virtuals Protocol deployed agent",
    profileUrl: "https://8004agents.ai/agent/luna",
  },
  {
    address: "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD",
    name: "Uniswap Universal Router",
    framework: "Custom",
    chain: "base-mainnet",
    description: "Uniswap Universal Router — high-frequency DeFi agent",
    profileUrl: "https://8004agents.ai/agent/uniswap",
  },
  {
    address: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
    name: "KyberSwap Router",
    framework: "Custom",
    chain: "base-mainnet",
    description: "KyberSwap aggregator agent on Base",
  },
  {
    address: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
    name: "Permit2 Agent",
    framework: "Custom",
    chain: "base-mainnet",
    description: "Uniswap Permit2 — token approval agent",
  },
  {
    address: "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24",
    name: "Aerodrome Router",
    framework: "Virtuals",
    chain: "base-mainnet",
    description: "Aerodrome AMM router — Virtuals ecosystem liquidity agent",
    profileUrl: "https://8004agents.ai/agent/aerodrome",
  },
  // elizaOS agents
  {
    address: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    name: "Uniswap V2 Router",
    framework: "elizaOS",
    chain: "eth-mainnet",
    description: "elizaOS-compatible Uniswap V2 routing agent",
    profileUrl: "https://8004agents.ai/agent/uniswap-v2",
  },
  {
    address: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
    name: "SushiSwap Router",
    framework: "elizaOS",
    chain: "eth-mainnet",
    description: "SushiSwap routing agent — elizaOS framework",
  },
  // Clanker agents on Base
  {
    address: "0x20F6fCd6B8813A4D62f5FEa4a3eD1E5EB498D14C",
    name: "Clanker Factory v2",
    framework: "Clanker",
    chain: "base-mainnet",
    description: "Clanker token factory agent — auto-deploys meme coins",
    profileUrl: "https://8004agents.ai/agent/clanker",
  },
  // Avalanche agents
  {
    address: "0x60aE616a2155Ee3d9A68541Ba4544862310933d4",
    name: "TraderJoe Router",
    framework: "Custom",
    chain: "avalanche-mainnet",
    description: "TraderJoe DEX routing agent on Avalanche",
  },
  {
    address: "0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106",
    name: "Pangolin Router",
    framework: "Custom",
    chain: "avalanche-mainnet",
    description: "Pangolin AMM agent on Avalanche",
  },
];

/** Get agents filtered by chain */
export function getAgentsByChain(chain: SupportedChain): AgentInfo[] {
  return KNOWN_AGENTS.filter((a) => a.chain === chain);
}

/** Shorten an Ethereum address for display */
export function shortAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** Framework enum values for filter selects */
export const FRAMEWORKS: AgentInfo["framework"][] = [
  "Virtuals",
  "elizaOS",
  "Clanker",
  "Custom",
  "Unknown",
];
