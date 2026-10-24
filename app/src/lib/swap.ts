import type { CoinMetadata } from '@/data/coinMetadata';

// Only route explicitly configured assets; never guess a token address or chain.
export function swapLink(metadata: CoinMetadata, mode: 'buy' | 'sell', amount: string): string | null {
  if (!metadata.uniswapAddress || !/^0x[0-9a-f]{40}$/i.test(metadata.uniswapAddress)) return null;
  if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) return null;
  const network = metadata.network;
  const chain = /Arbitrum/.test(network) ? 'arbitrum' : /BNB Smart Chain/.test(network) ? 'bnb' : /Avalanche/.test(network) ? 'avalanche' : /Ethereum|WBTC on EVM/.test(network) ? 'ethereum' : null;
  if (!chain) return null;
  const params = new URLSearchParams({ chain, [mode === 'buy' ? 'outputCurrency' : 'inputCurrency']: metadata.uniswapAddress, field: mode === 'buy' ? 'output' : 'input', value: amount });
  return `https://app.uniswap.org/swap?${params}`;
}
