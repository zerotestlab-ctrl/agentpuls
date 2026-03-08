/**
 * AgentLens — localStorage helpers
 */

import type { SupportedChain } from "./agents";

const KEYS = {
  API_KEY: "agentlens_covalent_api_key",
  CHAIN: "agentlens_chain",
};

export function getApiKey(): string {
  return localStorage.getItem(KEYS.API_KEY) ?? "";
}

export function setApiKey(key: string): void {
  localStorage.setItem(KEYS.API_KEY, key.trim());
}

export function getSelectedChain(): SupportedChain {
  return (localStorage.getItem(KEYS.CHAIN) as SupportedChain) ?? "base-mainnet";
}

export function setSelectedChain(chain: SupportedChain): void {
  localStorage.setItem(KEYS.CHAIN, chain);
}
