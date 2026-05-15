import React, { useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useTickerData } from '@/hooks/useCryptoData';
import { formatPrice, CRYPTO_COLORS } from '@/types/crypto';
import { Star, TrendingUp, TrendingDown, X, ArrowRight, Loader2 } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const MiniSparkline: React.FC<{ positive: boolean }> = ({ positive }) => {
  const data = useMemo(() => {
    const points: number[] = [];
    let v = 50;
    for (let i = 0; i < 24; i++) {
      v += (Math.random() - 0.5) * 10;
      points.push(v);
    }
    return points.map((v) => ({ v }));
  }, []);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={positive ? '#10b981' : '#ef4444'}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

const WatchlistPanel: React.FC = () => {
  const { watchlist, toggleWatchlist, setActiveCoin, setActiveTab } = useAppContext();
  const { data: tickers, isLoading } = useTickerData();

  const watchlistCoins = useMemo(() => {
    if (!tickers) return [];
    const watchIds = new Set(watchlist);
    return tickers
      .filter((t) => {
        const base = t.symbol.replace('USDT', '').toLowerCase();
        return watchIds.has(base);
      })
      .map((t) => {
        const symbol = t.symbol.replace('USDT', '');
        return {
          id: symbol.toLowerCase(),
          name: symbol,
          symbol,
          price: parseFloat(t.lastPrice),
          change24h: parseFloat(t.priceChangePercent),
          volume24h: parseFloat(t.quoteVolume),
          marketCap: parseFloat(t.lastPrice) * parseFloat(t.volume),
          color: CRYPTO_COLORS[symbol] || '#6366f1',
        };
      });
  }, [tickers, watchlist]);

  if (isLoading) {
    return (
      <section className="w-full">
        <h2 className="text-2xl font-bold mb-6">Your Watchlist</h2>
        <div className="glass-card p-12 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  if (watchlistCoins.length === 0) {
    return (
      <section className="w-full">
        <h2 className="text-2xl font-bold mb-6">Your Watchlist</h2>
        <div className="glass-card p-12 text-center">
          <Star className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No coins in watchlist</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Click the star icon next to any coin to add it to your watchlist
          </p>
          <button
            onClick={() => setActiveTab('markets')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Browse Markets <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Your Watchlist</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {watchlistCoins.length} coins tracked
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {watchlistCoins.map((coin) => (
          <div
            key={coin.id}
            className="glass-card-hover p-5 cursor-pointer group"
            onClick={() => {
              setActiveCoin(coin.id);
              setActiveTab('overview');
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: coin.color }}
                >
                  {coin.symbol.substring(0, 2)}
                </div>
                <div>
                  <p className="font-semibold">{coin.name}</p>
                  <p className="text-xs text-muted-foreground">{coin.symbol}</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWatchlist(coin.id);
                }}
                className="p-1.5 rounded-md hover:bg-accent transition-colors"
                title="Remove from watchlist"
              >
                <X className="w-4 h-4 text-muted-foreground hover:text-red-400" />
              </button>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-xl font-bold font-mono">{formatPrice(coin.price)}</p>
                <p
                  className={`flex items-center gap-1 text-sm font-mono font-medium mt-1 ${
                    coin.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {coin.change24h >= 0 ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  {coin.change24h >= 0 ? '+' : ''}
                  {coin.change24h.toFixed(2)}%
                  <span className="text-muted-foreground text-xs ml-1">24h</span>
                </p>
              </div>
              <div className="w-28 h-12">
                <MiniSparkline positive={coin.change24h >= 0} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border/30">
              <div>
                <p className="text-[10px] text-muted-foreground">Market Cap</p>
                <p className="text-xs font-mono font-medium">
                  {formatPrice(coin.marketCap)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">24h Volume</p>
                <p className="text-xs font-mono font-medium">
                  {formatPrice(coin.volume24h)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WatchlistPanel;
