/**
 * AgentLens — Covalent API Service
 *
 * Wraps Covalent GoldRush API v1 (https://www.covalenthq.com/docs/unified-api/)
 * All requests use client-side fetch with the user-provided API key.
 *
 * Key endpoints:
 *  - transactions_v3: full transaction history per address
 *  - token_balances_v2: ERC-20/721 token balances
 */

import type { SupportedChain } from "./agents";

const COVALENT_BASE = "https://api.covalenthq.com/v1";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CovalentTx {
  block_signed_at: string;
  tx_hash: string;
  from_address: string;
  to_address: string;
  value: string;
  gas_offered: number;
  gas_spent: number;
  gas_price: number;
  gas_quote: number;       // USD value of gas
  gas_quote_rate: number;  // USD/gas token price
  fees_paid: string;
  successful: boolean;
  log_events?: CovalentLogEvent[];
}

export interface CovalentLogEvent {
  sender_address: string;
  sender_name?: string;
  decoded?: {
    name: string;
    params: Array<{ name: string; value: string; type: string }>;
  };
  raw_log_topics?: string[];
  raw_log_data?: string;
}

export interface CovalentResponse<T> {
  data: T | null;
  error: boolean;
  error_message: string | null;
  error_code: number | null;
}

export interface TransactionListData {
  address: string;
  chain_id: number;
  chain_name: string;
  items: CovalentTx[];
  pagination?: {
    has_more: boolean;
    page_number: number;
    page_size: number;
    total_count: number | null;
  };
}

// ─── Failure reason parser ────────────────────────────────────────────────────

export type FailureReason =
  | "Slippage Exceeded"
  | "Gas Limit Exceeded"
  | "Execution Reverted"
  | "Insufficient Balance"
  | "Nonce Too Low"
  | "Deadline Exceeded"
  | "Access Denied"
  | "Unknown Revert";

const REVERT_PATTERNS: [RegExp, FailureReason][] = [
  [/slippage/i, "Slippage Exceeded"],
  [/gas.*limit|out of gas/i, "Gas Limit Exceeded"],
  [/insufficient.*balance|insufficient funds/i, "Insufficient Balance"],
  [/nonce.*too low|nonce.*mismatch/i, "Nonce Too Low"],
  [/deadline|expired/i, "Deadline Exceeded"],
  [/access.*denied|not authorized|caller is not/i, "Access Denied"],
  [/execution reverted/i, "Execution Reverted"],
];

export function parseFailureReason(tx: CovalentTx): FailureReason {
  // Check log events for revert strings
  if (tx.log_events) {
    for (const evt of tx.log_events) {
      const str = JSON.stringify(evt).toLowerCase();
      for (const [pattern, reason] of REVERT_PATTERNS) {
        if (pattern.test(str)) return reason;
      }
    }
  }
  // Default
  if (!tx.successful) {
    // Gas heuristic: if gas_spent ≈ gas_offered, likely gas limit issue
    if (tx.gas_offered > 0 && tx.gas_spent / tx.gas_offered > 0.95) {
      return "Gas Limit Exceeded";
    }
    return "Execution Reverted";
  }
  return "Execution Reverted";
}

// ─── API functions ────────────────────────────────────────────────────────────

/**
 * Fetch recent transactions for an address on a given chain.
 * @param chain   - Covalent chain name (e.g. "base-mainnet")
 * @param address - Wallet/contract address
 * @param apiKey  - Covalent API key
 * @param pageSize - Max items (default 50)
 */
export async function fetchTransactions(
  chain: SupportedChain,
  address: string,
  apiKey: string,
  pageSize = 50,
): Promise<CovalentTx[]> {
  const url = `${COVALENT_BASE}/${chain}/address/${address}/transactions_v3/?page-size=${pageSize}&no-logs=false&key=${apiKey}`;

  const res = await fetch(url);

  if (res.status === 401 || res.status === 403) {
    throw new Error("Invalid or expired Covalent API key. Please check your settings.");
  }
  if (res.status === 429) {
    throw new Error("Rate limited by Covalent API. Please wait before refreshing.");
  }
  if (!res.ok) {
    throw new Error(`Covalent API error: ${res.status} ${res.statusText}`);
  }

  const json: CovalentResponse<TransactionListData> = await res.json();

  if (json.error) {
    throw new Error(json.error_message ?? "Unknown Covalent error");
  }

  return json.data?.items ?? [];
}

/**
 * Fetch transactions for multiple agents in parallel (with concurrency limit).
 */
export async function fetchAllAgentTransactions(
  agents: Array<{ address: string; name: string; chain: SupportedChain; framework: string }>,
  apiKey: string,
  onProgress?: (done: number, total: number) => void,
): Promise<Record<string, CovalentTx[]>> {
  const CONCURRENCY = 3;
  const results: Record<string, CovalentTx[]> = {};
  let done = 0;

  // Split into batches
  for (let i = 0; i < agents.length; i += CONCURRENCY) {
    const batch = agents.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (agent) => {
        try {
          const txs = await fetchTransactions(agent.chain, agent.address, apiKey, 50);
          results[agent.address] = txs;
        } catch (err) {
          console.warn(`Failed to fetch txs for ${agent.name}:`, err);
          results[agent.address] = [];
        } finally {
          done++;
          onProgress?.(done, agents.length);
        }
      }),
    );
    // Small delay to respect rate limits
    if (i + CONCURRENCY < agents.length) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  return results;
}

// ─── Analytics computations ───────────────────────────────────────────────────

export interface AgentMetrics {
  address: string;
  name: string;
  chain: SupportedChain;
  framework: string;
  txCount: number;
  successCount: number;
  failCount: number;
  successRate: number;
  avgGasUsd: number;
  totalGasUsd: number;
  last24hTxCount: number;
  last24hSuccessRate: number;
  recentTxs: CovalentTx[];
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function computeAgentMetrics(
  agent: { address: string; name: string; chain: SupportedChain; framework: string },
  txs: CovalentTx[],
): AgentMetrics {
  const now = Date.now();
  const txs24h = txs.filter(
    (tx) => now - new Date(tx.block_signed_at).getTime() < ONE_DAY_MS,
  );

  const successTxs = txs.filter((t) => t.successful);
  const failTxs = txs.filter((t) => !t.successful);
  const successGas = successTxs.map((t) => t.gas_quote ?? 0);
  const avgGasUsd =
    successGas.length > 0
      ? successGas.reduce((a, b) => a + b, 0) / successGas.length
      : 0;

  const success24h = txs24h.filter((t) => t.successful);

  return {
    address: agent.address,
    name: agent.name,
    chain: agent.chain,
    framework: agent.framework,
    txCount: txs.length,
    successCount: successTxs.length,
    failCount: failTxs.length,
    successRate: txs.length > 0 ? (successTxs.length / txs.length) * 100 : 0,
    avgGasUsd,
    totalGasUsd: successGas.reduce((a, b) => a + b, 0),
    last24hTxCount: txs24h.length,
    last24hSuccessRate:
      txs24h.length > 0 ? (success24h.length / txs24h.length) * 100 : 0,
    recentTxs: txs.slice(0, 20),
  };
}

/**
 * Generate daily time-series data from a list of txs (last 14 days).
 */
export interface DailyDataPoint {
  date: string; // "MM/DD"
  successRate: number;
  txCount: number;
  gasUsd: number;
  failCount: number;
}

export function buildDailyTimeSeries(txs: CovalentTx[], days = 14): DailyDataPoint[] {
  const buckets: Record<string, { success: number; fail: number; gasUsd: number }> = {};

  // Initialise all days
  for (let d = days - 1; d >= 0; d--) {
    const date = new Date(Date.now() - d * ONE_DAY_MS);
    const key = `${date.getMonth() + 1}/${date.getDate()}`;
    buckets[key] = { success: 0, fail: 0, gasUsd: 0 };
  }

  for (const tx of txs) {
    const date = new Date(tx.block_signed_at);
    const key = `${date.getMonth() + 1}/${date.getDate()}`;
    if (buckets[key]) {
      if (tx.successful) {
        buckets[key].success++;
        buckets[key].gasUsd += tx.gas_quote ?? 0;
      } else {
        buckets[key].fail++;
      }
    }
  }

  return Object.entries(buckets).map(([date, v]) => {
    const total = v.success + v.fail;
    return {
      date,
      successRate: total > 0 ? Math.round((v.success / total) * 100) : 0,
      txCount: total,
      gasUsd: v.success > 0 ? parseFloat((v.gasUsd / v.success).toFixed(4)) : 0,
      failCount: v.fail,
    };
  });
}

/**
 * Build failure heatmap data: reason → count
 */
export function buildFailureBreakdown(
  txs: CovalentTx[],
): Array<{ reason: string; count: number; gasWasted: number }> {
  const map: Record<string, { count: number; gasWasted: number }> = {};
  const failed = txs.filter((t) => !t.successful);

  for (const tx of failed) {
    const reason = parseFailureReason(tx);
    if (!map[reason]) map[reason] = { count: 0, gasWasted: 0 };
    map[reason].count++;
    map[reason].gasWasted += tx.gas_quote ?? 0;
  }

  return Object.entries(map)
    .map(([reason, v]) => ({ reason, ...v }))
    .sort((a, b) => b.count - a.count);
}
