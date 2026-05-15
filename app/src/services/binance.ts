/* eslint-disable @typescript-eslint/no-explicit-any */

import type { BinanceTicker, BinanceKline } from '@/types/crypto';
import { STABLECOINS } from '@/types/crypto';

const BASE_URL = 'https://api.binance.com';
const COINGECKO_URL = 'https://api.coingecko.com/api/v3';

class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastRequest = 0;
  private readonly minInterval = 150;

  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
      if (!this.processing) this.process();
    });
  }

  private async process() {
    this.processing = true;
    while (this.queue.length > 0) {
      const now = Date.now();
      const wait = Math.max(0, this.minInterval - (now - this.lastRequest));
      if (wait > 0) await new Promise(r => setTimeout(r, wait));
      const task = this.queue.shift();
      if (task) {
        this.lastRequest = Date.now();
        task().catch(() => {});
      }
    }
    this.processing = false;
  }
}

const rateLimiter = new RateLimiter();

async function fetchWithRetry(url: string, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return res;
    } catch (err) {
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error('Unreachable');
}

export async function get24hrTicker(): Promise<BinanceTicker[]> {
  return rateLimiter.enqueue(async () => {
    const res = await fetchWithRetry(`${BASE_URL}/api/v3/ticker/24hr`);
    return res.json();
  });
}

export async function getTicker(symbol: string): Promise<BinanceTicker> {
  return rateLimiter.enqueue(async () => {
    const res = await fetchWithRetry(`${BASE_URL}/api/v3/ticker/24hr?symbol=${symbol}`);
    return res.json();
  });
}

export async function getKlines(
  symbol: string,
  interval: string = '1d',
  limit: number = 365
): Promise<BinanceKline[]> {
  return rateLimiter.enqueue(async () => {
    const res = await fetchWithRetry(
      `${BASE_URL}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    );
    const raw: unknown[][] = await res.json();
    return raw.map((k) => ({
      openTime: k[0] as number,
      open: k[1] as string,
      high: k[2] as string,
      low: k[3] as string,
      close: k[4] as string,
      volume: k[5] as string,
      closeTime: k[6] as number,
      quoteVolume: k[7] as string,
      count: k[8] as number,
      takerBuyVolume: k[9] as string,
      takerBuyQuoteVolume: k[10] as string,
      ignore: k[11] as string,
    }));
  });
}

export async function getExchangeInfo(): Promise<{
  symbols: Array<{ symbol: string; baseAsset: string; quoteAsset: string; status: string }>;
}> {
  return rateLimiter.enqueue(async () => {
    const res = await fetchWithRetry(`${BASE_URL}/api/v3/exchangeInfo`);
    return res.json();
  });
}

export interface CoinGeckoGlobal {
  data: {
    active_cryptocurrencies: number;
    total_market_cap: Record<string, number>;
    total_volume: Record<string, number>;
    market_cap_percentage: Record<string, number>;
    market_cap_change_percentage_24h_usd: number;
  };
}

export async function getCoinGeckoGlobal(): Promise<CoinGeckoGlobal> {
  return rateLimiter.enqueue(async () => {
    const res = await fetchWithRetry(`${COINGECKO_URL}/global`, 1);
    return res.json();
  });
}

export interface CoinGeckoFearGreed {
  value: number;
  value_classification: string;
}

export async function getFearGreedIndex(): Promise<CoinGeckoFearGreed> {
  const res = await fetchWithRetry(
    'https://api.alternative.me/fng/?limit=1'
  );
  const json = await res.json();
  return {
    value: parseInt(json.data[0].value),
    value_classification: json.data[0].value_classification,
  };
}

export const INTERVAL_MAP: Record<string, string> = {
  '1H': '1h',
  '4H': '4h',
  '1D': '1d',
  '1W': '1w',
  '1M': '1M',
};

export const INTERVAL_LIMIT: Record<string, number> = {
  '1H': 48,
  '4H': 42,
  '1D': 90,
  '1W': 52,
  '1M': 24,
};

export function parseKlines(raw: BinanceKline[]) {
  return raw.map((k) => ({
    time: new Date(k.openTime).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    open: parseFloat(k.open),
    high: parseFloat(k.high),
    low: parseFloat(k.low),
    close: parseFloat(k.close),
    volume: parseFloat(k.volume),
  }));
}

export function tickerToAsset(ticker: BinanceTicker, rank: number) {
  const symbol = ticker.symbol.replace('USDT', '');
  const price = parseFloat(ticker.lastPrice);
  const volume = parseFloat(ticker.quoteVolume);

  return {
    id: symbol.toLowerCase(),
    rank,
    name: symbol,
    symbol,
    price,
    change24h: parseFloat(ticker.priceChangePercent),
    change7d: 0,
    volume24h: volume,
    marketCap: price * parseFloat(ticker.volume) * price,
    sparkline: [],
    color: '#6366f1',
    icon: symbol,
  };
}

export async function fetchAllAssets(): Promise<ReturnType<typeof tickerToAsset>[]> {
  const tickers = await get24hrTicker();
  const usdtPairs = tickers
    .filter((t) => t.symbol.endsWith('USDT'))
    .filter((t) => !t.symbol.includes('UP') && !t.symbol.includes('DOWN'))
    .filter((t) => {
      const base = t.symbol.replace('USDT', '');
      return !STABLECOINS.has(base);
    })
    .filter((t) => parseFloat(t.quoteVolume) > 1000000)
    .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
    .slice(0, 50);

  return usdtPairs.map((t, i) => tickerToAsset(t, i + 1));
}
