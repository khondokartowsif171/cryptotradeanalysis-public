import { useQuery } from '@tanstack/react-query';
import {
  get24hrTicker,
  getKlines,
  getCoinGeckoGlobal,
  getFearGreedIndex,
  fetchAllAssets,
  parseKlines,
  INTERVAL_MAP,
  INTERVAL_LIMIT,
} from '@/services/binance';
import { CRYPTO_COLORS, TOP_COINS, STABLECOINS, symbolToId } from '@/types/crypto';
import type { BinanceTicker } from '@/types/crypto';

export function useTickerData() {
  return useQuery({
    queryKey: ['binance', 'ticker'],
    queryFn: get24hrTicker,
    refetchInterval: 30000,
    staleTime: 15000,
    retry: 2,
  });
}

export function useKlineData(symbol: string, timeframe: string) {
  const interval = INTERVAL_MAP[timeframe] || '1d';
  const limit = INTERVAL_LIMIT[timeframe] || 90;

  return useQuery({
    queryKey: ['binance', 'klines', symbol, interval],
    queryFn: async () => {
      const raw = await getKlines(symbol, interval, limit);
      return parseKlines(raw);
    },
    refetchInterval: timeframe === '1H' ? 15000 : 60000,
    staleTime: timeframe === '1H' ? 10000 : 30000,
    enabled: !!symbol,
  });
}

export function useMarketOverview() {
  const globalQuery = useQuery({
    queryKey: ['coingecko', 'global'],
    queryFn: getCoinGeckoGlobal,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const fearGreedQuery = useQuery({
    queryKey: ['alternative', 'fng'],
    queryFn: getFearGreedIndex,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  return { globalQuery, fearGreedQuery };
}

export function useAssets() {
  return useQuery({
    queryKey: ['binance', 'assets'],
    queryFn: fetchAllAssets,
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

export function filterTopCoins(tickers: BinanceTicker[]) {
  return tickers
    .filter((t) => {
      const base = t.symbol.replace('USDT', '');
      return TOP_COINS.includes(base);
    })
    .sort((a, b) => {
      const aIdx = TOP_COINS.indexOf(a.symbol.replace('USDT', ''));
      const bIdx = TOP_COINS.indexOf(b.symbol.replace('USDT', ''));
      return aIdx - bIdx;
    });
}

export function tickerToAssetMap(ticker: BinanceTicker, rank: number) {
  const symbol = ticker.symbol.replace('USDT', '');
  const price = parseFloat(ticker.lastPrice);
  const quoteVolume = parseFloat(ticker.quoteVolume);
  const volume = parseFloat(ticker.volume);

  return {
    id: symbolToId(symbol),
    rank,
    name: symbol,
    symbol,
    price,
    change24h: parseFloat(ticker.priceChangePercent),
    change7d: 0,
    volume24h: quoteVolume,
    marketCap: price * volume,
    sparkline: [] as number[],
    color: CRYPTO_COLORS[symbol] || '#6366f1',
    icon: symbol,
  };
}
