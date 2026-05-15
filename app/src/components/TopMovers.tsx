import React, { useState, useMemo } from 'react';
import { useTickerData } from '@/hooks/useCryptoData';
import { useAppContext } from '@/contexts/AppContext';
import { formatPrice, CRYPTO_COLORS, STABLECOINS } from '@/types/crypto';
import { TrendingUp, TrendingDown, Flame, Loader2 } from 'lucide-react';

const TopMovers: React.FC = () => {
  const [showGainers, setShowGainers] = useState(true);
  const { setActiveCoin, setActiveTab } = useAppContext();
  const { data: tickers, isLoading } = useTickerData();

  const topMovers = useMemo(() => {
    if (!tickers) return [];
    const coins = tickers
      .filter((t) => {
        const base = t.symbol.replace('USDT', '');
        return !STABLECOINS.has(base) && base.length <= 6;
      })
      .sort((a, b) =>
        showGainers
          ? parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent)
          : parseFloat(a.priceChangePercent) - parseFloat(b.priceChangePercent)
      )
      .slice(0, 5);

    return coins.map((t) => {
      const symbol = t.symbol.replace('USDT', '');
      return {
        id: symbol.toLowerCase(),
        name: symbol,
        symbol,
        price: parseFloat(t.lastPrice),
        change24h: parseFloat(t.priceChangePercent),
        color: CRYPTO_COLORS[symbol] || '#6366f1',
      };
    });
  }, [tickers, showGainers]);

  if (isLoading) {
    return (
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-primary" />
          <h3 className="font-bold">Top Movers</h3>
        </div>
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-primary" />
          <h3 className="font-bold">Top Movers</h3>
        </div>
        <div className="flex items-center bg-secondary/50 rounded-lg p-0.5">
          <button
            onClick={() => setShowGainers(true)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              showGainers ? 'bg-emerald-500/20 text-emerald-400' : 'text-muted-foreground'
            }`}
          >
            Gainers
          </button>
          <button
            onClick={() => setShowGainers(false)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              !showGainers ? 'bg-red-500/20 text-red-400' : 'text-muted-foreground'
            }`}
          >
            Losers
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {topMovers.map((coin, i) => (
          <div
            key={coin.id}
            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
            onClick={() => {
              setActiveCoin(coin.id);
              setActiveTab('overview');
            }}
          >
            <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}</span>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
              style={{ backgroundColor: coin.color }}
            >
              {coin.symbol.substring(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{coin.name}</p>
              <p className="text-xs text-muted-foreground">{coin.symbol}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-mono font-medium">{formatPrice(coin.price)}</p>
              <p
                className={`flex items-center justify-end gap-0.5 text-xs font-mono ${
                  coin.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {coin.change24h >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {coin.change24h >= 0 ? '+' : ''}
                {coin.change24h.toFixed(2)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopMovers;
