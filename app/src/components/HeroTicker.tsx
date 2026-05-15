import React from 'react';
import { useTickerData, filterTopCoins } from '@/hooks/useCryptoData';
import { useBinanceTicker } from '@/hooks/useBinanceWS';
import { CRYPTO_COLORS, formatPrice, TOP_COINS } from '@/types/crypto';
import { TrendingUp, TrendingDown, Wifi, WifiOff } from 'lucide-react';

const HeroTicker: React.FC = () => {
  const { data: tickers, isLoading } = useTickerData();
  const coins = React.useMemo(() => {
    if (!tickers) return [];
    return filterTopCoins(tickers).slice(0, 16);
  }, [tickers]);

  const symbols = coins.map((c) => c.symbol.replace('USDT', ''));
  const { isConnected } = useBinanceTicker(symbols);

  if (isLoading) {
    return (
      <div className="w-full bg-secondary/30 border-b border-border/30 overflow-hidden">
        <div className="flex items-center gap-8 py-2 px-4">
          {TOP_COINS.slice(0, 8).map((s) => (
            <div key={s} className="h-5 w-32 bg-secondary animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  const display = [...coins, ...coins];

  return (
    <div className="w-full bg-secondary/30 border-b border-border/30 overflow-hidden">
      <div className="flex items-center gap-3 px-3 py-1.5 border-b border-border/20">
        <div className="flex items-center gap-1.5">
          {isConnected ? (
            <Wifi className="w-3 h-3 text-emerald-400" />
          ) : (
            <WifiOff className="w-3 h-3 text-amber-400" />
          )}
          <span className="text-[10px] text-muted-foreground font-mono">
            {isConnected ? 'LIVE' : 'CONNECTING'}
          </span>
        </div>
      </div>
      <div
        className="ticker-animate flex items-center gap-8 py-2 whitespace-nowrap"
        style={{ width: 'max-content' }}
      >
        {display.map((coin, i) => {
          const symbol = coin.symbol.replace('USDT', '');
          const color = CRYPTO_COLORS[symbol] || '#6366f1';
          const change = parseFloat(coin.priceChangePercent);
          const price = parseFloat(coin.lastPrice);
          return (
            <div key={`${coin.symbol}-${i}`} className="flex items-center gap-2 text-sm">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
                style={{ backgroundColor: color }}
              >
                {symbol.charAt(0)}
              </div>
              <span className="font-medium text-foreground">{symbol}</span>
              <span className="font-mono text-foreground/80">
                {formatPrice(price)}
              </span>
              <span
                className={`flex items-center gap-0.5 font-mono text-xs ${
                  change >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {change >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {change >= 0 ? '+' : ''}
                {change.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HeroTicker;
