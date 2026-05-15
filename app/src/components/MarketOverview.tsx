import React from 'react';
import { useMarketOverview } from '@/hooks/useCryptoData';
import {
  TrendingUp, DollarSign, Activity, BarChart2,
  Gauge, Globe, Layers, Zap, Loader2
} from 'lucide-react';

const MarketOverview: React.FC = () => {
  const { globalQuery, fearGreedQuery } = useMarketOverview();
  const globalData = globalQuery.data?.data;
  const fearGreed = fearGreedQuery.data;

  const totalMarketCap = globalData?.total_market_cap?.usd ?? 0;
  const totalVolume = globalData?.total_volume?.usd ?? 0;
  const btcDominance = globalData?.market_cap_percentage?.btc ?? 0;
  const ethDominance = globalData?.market_cap_percentage?.eth ?? 0;
  const activeCryptos = globalData?.active_cryptocurrencies ?? 0;
  const marketCapChange = globalData?.market_cap_change_percentage_24h_usd ?? 0;

  const formatCurrency = (value: number): string => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatNumber = (value: number): string => {
    if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    return value.toLocaleString();
  };

  const fgValue = fearGreed?.value ?? 74;
  const fgLabel = fearGreed?.value_classification ?? 'Greed';

  const getGaugeColor = (value: number): string => {
    if (value < 25) return '#ef4444';
    if (value < 45) return '#f97316';
    if (value < 55) return '#eab308';
    if (value < 75) return '#84cc16';
    return '#22c55e';
  };

  const stats = React.useMemo(
    () => [
      {
        label: 'Total Market Cap',
        value: formatCurrency(totalMarketCap),
        change: `${marketCapChange >= 0 ? '+' : ''}${marketCapChange.toFixed(1)}%`,
        positive: marketCapChange >= 0,
        icon: DollarSign,
        gradient: 'from-blue-500/20 to-cyan-500/20',
        iconColor: 'text-blue-400',
      },
      {
        label: '24h Volume',
        value: formatCurrency(totalVolume),
        change: 'Live',
        positive: true,
        icon: Activity,
        gradient: 'from-emerald-500/20 to-green-500/20',
        iconColor: 'text-emerald-400',
      },
      {
        label: 'BTC Dominance',
        value: `${btcDominance.toFixed(1)}%`,
        change: `${ethDominance.toFixed(1)}% ETH`,
        positive: btcDominance > 50,
        icon: BarChart2,
        gradient: 'from-orange-500/20 to-amber-500/20',
        iconColor: 'text-orange-400',
      },
      {
        label: 'Fear & Greed',
        value: fgValue.toString(),
        change: fgLabel,
        positive: fgValue > 50,
        icon: Gauge,
        gradient: 'from-purple-500/20 to-pink-500/20',
        iconColor: 'text-purple-400',
      },
      {
        label: 'ETH Dominance',
        value: `${ethDominance.toFixed(1)}%`,
        change: 'of market',
        positive: true,
        icon: Layers,
        gradient: 'from-indigo-500/20 to-blue-500/20',
        iconColor: 'text-indigo-400',
      },
      {
        label: 'Active Cryptos',
        value: formatNumber(activeCryptos),
        change: 'currencies',
        positive: true,
        icon: Globe,
        gradient: 'from-teal-500/20 to-cyan-500/20',
        iconColor: 'text-teal-400',
      },
    ],
    [totalMarketCap, totalVolume, btcDominance, ethDominance, activeCryptos, marketCapChange, fgValue, fgLabel]
  );

  if (globalQuery.isLoading) {
    return (
      <section className="w-full">
        <h2 className="text-2xl font-bold mb-6">Market Overview</h2>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Market Overview</h2>
          <p className="text-sm text-muted-foreground mt-1">Real-time global crypto market data</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-emerald-400 pulse-glow" />
          Live Data
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((stat, i) => (
          <div key={i} className="glass-card-hover p-4 group cursor-default">
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
            >
              <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
            </div>
            <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
            <p className="text-lg font-bold font-mono">{stat.value}</p>
            <p
              className={`text-xs font-medium mt-1 ${stat.positive ? 'text-emerald-400' : 'text-red-400'}`}
            >
              {stat.change}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Fear & Greed Index</span>
          <span
            className="text-sm font-mono font-bold"
            style={{ color: getGaugeColor(fgValue) }}
          >
            {fgValue} - {fgLabel}
          </span>
        </div>
        <div className="w-full h-3 rounded-full bg-secondary overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500 relative">
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-background shadow-lg transition-all duration-500"
              style={{ left: `${fgValue}%`, transform: 'translate(-50%, -50%)' }}
            />
          </div>
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
          <span>Extreme Fear</span>
          <span>Fear</span>
          <span>Neutral</span>
          <span>Greed</span>
          <span>Extreme Greed</span>
        </div>
      </div>
    </section>
  );
};

export default MarketOverview;
