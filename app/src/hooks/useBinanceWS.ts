import { useEffect, useRef, useState, useCallback } from 'react';
import { binanceWS } from '@/services/websocket';
import { CRYPTO_COLORS } from '@/types/crypto';

export interface LiveTicker {
  symbol: string;
  price: number;
  change24h: number;
  high: number;
  low: number;
  volume: number;
  quoteVolume: number;
}

export function useBinanceTicker(symbols: string[]) {
  const [tickers, setTickers] = useState<Map<string, LiveTicker>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const tickersRef = useRef(tickers);
  tickersRef.current = tickers;
  const symbolsKey = symbols.join(',');

  useEffect(() => {
    const streams = symbols.map((s) => `${s.toLowerCase()}usdt@ticker`);
    const cleanups: (() => void)[] = [];

    streams.forEach((stream) => {
      const unsub = binanceWS.subscribe(stream, (data: Record<string, unknown>) => {
        if (!data || !data.s) return;
        const rawSymbol = (data.s as string).replace('USDT', '');
        setTickers((prev) => {
          const next = new Map(prev);
          next.set(rawSymbol, {
            symbol: rawSymbol,
            price: parseFloat(data.c as string),
            change24h: parseFloat(data.P as string),
            high: parseFloat(data.h as string),
            low: parseFloat(data.l as string),
            volume: parseFloat(data.v as string),
            quoteVolume: parseFloat(data.q as string),
          });
          return next;
        });
      });
      cleanups.push(unsub);
    });

    const checkConnection = setInterval(() => {
      setIsConnected(binanceWS['ws']?.readyState === WebSocket.OPEN);
    }, 2000);

    return () => {
      cleanups.forEach((fn) => fn());
      clearInterval(checkConnection);
    };
  }, [symbolsKey]);

  const getTicker = useCallback(
    (symbol: string) => tickers.get(symbol.toUpperCase()) ?? null,
    [tickers]
  );

  return { tickers, getTicker, isConnected };
}

export function useActiveCoinTicker(activeCoinId: string) {
  const symbol = activeCoinId.toUpperCase();
  const { getTicker, isConnected } = useBinanceTicker([symbol]);
  const ticker = getTicker(symbol);

  const color = CRYPTO_COLORS[symbol] || '#6366f1';

  return {
    price: ticker?.price ?? 0,
    change24h: ticker?.change24h ?? 0,
    high: ticker?.high ?? 0,
    low: ticker?.low ?? 0,
    volume: ticker?.volume ?? 0,
    quoteVolume: ticker?.quoteVolume ?? 0,
    color,
    isConnected,
    symbol,
  };
}
