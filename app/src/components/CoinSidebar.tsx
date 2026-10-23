import React, { useMemo, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useActiveCoinTicker } from '@/hooks/useBinanceWS';
import { useKlineData } from '@/hooks/useCryptoData';
import { getCoinMetadata } from '@/data/coinMetadata';
import TradeModal from '@/components/TradeModal';
import { formatPrice, formatNumber, CRYPTO_COLORS } from '@/types/crypto';
import { Star, TrendingUp, TrendingDown, ExternalLink, Copy, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const CoinSidebar: React.FC = () => {
  const { activeCoin, watchlist, toggleWatchlist } = useAppContext();
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [tradeMode, setTradeMode] = useState<'buy' | 'sell'>('buy');

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
  const metadata = getCoinMetadata(activeCoin, symbol);

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
    navigator.clipboard.writeText(metadata.contractAddress);
    toast({
      title: 'Contract Address Copied!',
      description: `${metadata.name} (${metadata.network}): ${metadata.contractAddress}`,
    });
  };

  const handleOpenBuy = () => {
    setTradeMode('buy');
    setTradeModalOpen(true);
  };

  const handleOpenSell = () => {
    setTradeMode('sell');
    setTradeModalOpen(true);
  };

  const handleOpenWebsite = () => {
    if (metadata.website) {
      window.open(metadata.website, '_blank', 'noopener,noreferrer');
    }
  };

  const handleOpenExplorer = () => {
    if (metadata.explorer) {
      window.open(metadata.explorer, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="glass-card p-5 space-y-5">
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-md"
          style={{ backgroundColor: color }}
        >
          {symbol.substring(0, 2)}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold flex items-center gap-2">
            {metadata.name}
            <span className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground font-mono">
              #{stats.findIndex(s => s.label === 'Market Cap') + 1 || symbol}
            </span>
          </h3>
          <p className="text-xs text-muted-foreground font-mono">{symbol}/USDT • {metadata.network}</p>
        </div>
        <button
          onClick={() => toggleWatchlist(activeCoin)}
          className={`p-2 rounded-lg transition-colors ${
            isWatched
              ? 'bg-primary/10 text-primary'
              : 'bg-secondary text-muted-foreground hover:text-foreground'
          }`}
          title={isWatched ? 'Remove from Watchlist' : 'Add to Watchlist'}
        >
          <Star className={`w-5 h-5 ${isWatched ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div>
        <p className="text-3xl font-bold font-mono tracking-tight">{formatPrice(price)}</p>
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
          <span className="text-xs text-muted-foreground">24h Change</span>
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

      {/* Authentic Contract / Network Address Box */}
      <div className="bg-secondary/50 rounded-lg p-3 border border-border/30">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-muted-foreground font-medium">Contract / Network Address</p>
          <span className="text-[10px] text-primary font-mono">{metadata.symbol}</span>
        </div>
        <div className="flex items-center gap-2">
          <code className="text-xs font-mono text-foreground/90 truncate flex-1 select-all">
            {metadata.contractAddress}
          </code>
          <button
            onClick={handleCopyAddress}
            className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Copy address"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Buy & Sell Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleOpenBuy}
          type="button"
          className="flex items-center justify-center gap-2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-emerald-500/25 active:scale-[0.98] transition-all shadow-sm"
        >
          <TrendingUp className="w-4 h-4" />
          Buy
        </button>
        <button
          onClick={handleOpenSell}
          type="button"
          className="flex items-center justify-center gap-2 bg-red-500/15 text-red-400 border border-red-500/30 px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-red-500/25 active:scale-[0.98] transition-all shadow-sm"
        >
          <TrendingDown className="w-4 h-4" />
          Sell
        </button>
      </div>

      {/* Website & Explorer Authentic Link Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleOpenWebsite}
          type="button"
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary px-3 py-2 rounded-lg transition-colors border border-border/30"
          title={`Open ${metadata.name} Website`}
        >
          <ExternalLink className="w-3 h-3" />
          Website
        </button>
        <button
          onClick={handleOpenExplorer}
          type="button"
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary px-3 py-2 rounded-lg transition-colors border border-border/30"
          title={`Open ${metadata.name} Block Explorer`}
        >
          <ExternalLink className="w-3 h-3" />
          Explorer
        </button>
      </div>

      {/* Trade Modal Mount */}
      <TradeModal
        open={tradeModalOpen}
        onClose={() => setTradeModalOpen(false)}
        coinId={activeCoin}
        symbol={symbol}
        currentPrice={price}
        initialMode={tradeMode}
      />
    </div>
  );
};

export default CoinSidebar;
