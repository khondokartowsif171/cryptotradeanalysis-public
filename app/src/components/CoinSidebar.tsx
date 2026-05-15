import React, { useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useActiveCoinTicker } from '@/hooks/useBinanceWS';
import { useKlineData } from '@/hooks/useCryptoData';
import { formatPrice, formatNumber, CRYPTO_COLORS } from '@/types/crypto';
import { Star, TrendingUp, TrendingDown, ExternalLink, Copy, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const CoinSidebar: React.FC = () => {
  const { activeCoin, watchlist, toggleWatchlist } = useAppContext();
  const {
    price,
    change24h,
    high,
    low,
    volume,
    quoteVolume,
    color,
    symbol,
  } = useActiveCoinTicker(activeCoin);

  const { data: klines } = useKlineData(`${symbol}USDT`, '1D');

  const ath = useMemo(() => {
    if (!klines) return price * 1.35;
    return Math.max(...klines.map((k) => k.high));
  }, [klines, price]);

  const atl = useMemo(() => {
    if (!klines) return price * 0.12;
    return Math.min(...klines.map((k) => k.low));
  }, [klines, price]);

  const marketCap = price * volume;
  const isWatched = watchlist.includes(activeCoin);

  const stats = [
    { label: 'Market Cap', value: formatPrice(marketCap) },
    { label: '24h Volume', value: formatPrice(quoteVolume) },
    { label: '24h High', value: formatPrice(high) },
    { label: '24h Low', value: formatPrice(low) },
    { label: 'All-Time High', value: formatPrice(ath) },
    { label: 'All-Time Low', value: formatPrice(atl) },
  ];

  const handleCopyAddress = () => {
    navigator.clipboard.writeText('0x' + activeCoin.slice(0, 6) + '...abc123');
    toast({ title: 'Copied!', description: 'Contract address copied to clipboard.' });
  };

  return (
    <div className="glass-card p-5 space-y-5">
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {symbol.substring(0, 2)}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold">{activeCoin.toUpperCase()}</h3>
          <p className="text-sm text-muted-foreground">{symbol}</p>
        </div>
        <button
          onClick={() => toggleWatchlist(activeCoin)}
          className={`p-2 rounded-lg transition-colors ${
            isWatched
              ? 'bg-primary/10 text-primary'
              : 'bg-secondary text-muted-foreground hover:text-foreground'
          }`}
        >
          <Star className={`w-5 h-5 ${isWatched ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div>
        <p className="text-3xl font-bold font-mono">{formatPrice(price)}</p>
        <div className="flex items-center gap-3 mt-1">
          <span
            className={`flex items-center gap-1 text-sm font-mono font-medium ${
              change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {change24h >= 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {change24h >= 0 ? '+' : ''}
            {change24h.toFixed(2)}%
          </span>
          <span className="text-xs text-muted-foreground">24h</span>
        </div>
      </div>

      <div className="space-y-3">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
          >
            <span className="text-xs text-muted-foreground">{stat.label}</span>
            <span className="text-sm font-mono font-medium">{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="bg-secondary/50 rounded-lg p-3">
        <p className="text-xs text-muted-foreground mb-1">Contract Address</p>
        <div className="flex items-center gap-2">
          <code className="text-xs font-mono text-foreground/80 truncate flex-1">
            0x{activeCoin.slice(0, 6)}...abc123
          </code>
          <button
            onClick={handleCopyAddress}
            className="p-1 rounded hover:bg-accent transition-colors"
          >
            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button className="flex items-center justify-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-500/20 transition-colors">
          <TrendingUp className="w-4 h-4" />
          Buy
        </button>
        <button className="flex items-center justify-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-500/20 transition-colors">
          <TrendingDown className="w-4 h-4" />
          Sell
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button className="flex-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-secondary/50 px-3 py-2 rounded-lg transition-colors">
          <ExternalLink className="w-3 h-3" />
          Website
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-secondary/50 px-3 py-2 rounded-lg transition-colors">
          <ExternalLink className="w-3 h-3" />
          Explorer
        </button>
      </div>
    </div>
  );
};

export default CoinSidebar;
