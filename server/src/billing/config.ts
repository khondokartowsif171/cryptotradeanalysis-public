import { getAddress, isAddress, parseUnits } from 'ethers';

export type Tier = 'free' | 'pro' | 'vip';
export type Cycle = 'monthly' | 'yearly';
export function effectiveTier(user: { tier?: string; tier_expires_at?: string | Date | null }, now = Date.now()): Tier {
  return (user.tier === 'pro' || user.tier === 'vip') && new Date(user.tier_expires_at || 0).getTime() > now ? user.tier : 'free';
}
export const PLANS = [
  { id: 'free', name: 'Free Explorer', priceUsd: 0, badge: 'FREE', features: ['Live market tickers and public charts', 'Market movers and crypto news', 'Watchlist: up to 5 coins'] },
  { id: 'pro', name: 'Pro Trader', priceUsd: 19, yearlyPriceUsd: 149, period: 'monthly', badge: 'PRO', features: ['Premium signal feed when published', 'Expanded watchlist (up to 1,000 coins)', 'Account-synced portfolio tracker'], plannedFeatures: ['Staking multiplier and priority webhook streams'] },
  { id: 'vip', name: 'VIP Whale / Quant', priceUsd: 49, yearlyPriceUsd: 399, period: 'monthly', badge: 'VIP', features: ['All Pro features', 'Read-only client API keys', 'API access to your own watchlist, portfolio and premium signals'], plannedFeatures: ['Telegram push alerts, whale radar and strategy desk'] },
] as const;

export type PaymentMethod = {
  id: string; network: string; chainId: number; token: string; tokenAddress: string; decimals: number;
  confirmations: number; explorer: string; rpcUrls: string[]; nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcEnv: string;
};
// Issuer allowlists, verified against Circle and Tether documentation on 2026-10-25.
// https://developers.circle.com/stablecoins/usdc-contract-addresses
// https://tether.to/en/supported-protocols/
export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'polygon-usdc', network: 'Polygon', chainId: 137, token: 'USDC', tokenAddress: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359', decimals: 6, confirmations: 64, explorer: 'https://polygonscan.com', rpcUrls: ['https://polygon-bor-rpc.publicnode.com'], rpcEnv: 'POLYGON_RPC_URL', nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 } },
  { id: 'arbitrum-usdc', network: 'Arbitrum', chainId: 42161, token: 'USDC', tokenAddress: '0xaf88d065e77c8cc2239327c5edb3a432268e5831', decimals: 6, confirmations: 20, explorer: 'https://arbiscan.io', rpcUrls: ['https://arb1.arbitrum.io/rpc', 'https://arbitrum-one-rpc.publicnode.com'], rpcEnv: 'ARBITRUM_RPC_URL', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 } },
  { id: 'base-usdc', network: 'Base', chainId: 8453, token: 'USDC', tokenAddress: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', decimals: 6, confirmations: 20, explorer: 'https://basescan.org', rpcUrls: ['https://mainnet.base.org', 'https://base-rpc.publicnode.com'], rpcEnv: 'BASE_RPC_URL', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 } },
  { id: 'ethereum-usdc', network: 'Ethereum', chainId: 1, token: 'USDC', tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', decimals: 6, confirmations: 12, explorer: 'https://etherscan.io', rpcUrls: ['https://ethereum-rpc.publicnode.com', 'https://eth.llamarpc.com'], rpcEnv: 'ETH_RPC_URL', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 } },
  { id: 'ethereum-usdt', network: 'Ethereum', chainId: 1, token: 'USDT', tokenAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7', decimals: 6, confirmations: 12, explorer: 'https://etherscan.io', rpcUrls: ['https://ethereum-rpc.publicnode.com', 'https://eth.llamarpc.com'], rpcEnv: 'ETH_RPC_URL', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 } },
];
export function treasuryAddress() {
  const value = process.env.TREASURY_EVM_ADDRESS || '0x2C2891f4Fb5000e0E288D16DA3f1d780eE77714e';
  if (!isAddress(value) || /^0x0{40}$/i.test(value)) throw new Error('Treasury address is not configured correctly');
  return getAddress(value.toLowerCase());
}
export function paymentPrice(plan: string, cycle: Cycle, decimals: number) {
  const item = PLANS.find(item => item.id === plan);
  if (!item || item.id === 'free') throw new Error('Choose a paid plan');
  const amount = cycle === 'yearly' ? item.yearlyPriceUsd : item.priceUsd;
  return { amount, units: parseUnits(String(amount), decimals).toString(), days: cycle === 'yearly' ? 365 : 30 };
}
export class BillingError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
