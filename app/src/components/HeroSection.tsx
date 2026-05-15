import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useTickerData, useMarketOverview } from '@/hooks/useCryptoData';
import { formatPrice, CRYPTO_COLORS } from '@/types/crypto';
import { BarChart3, TrendingUp, Shield, Zap, ArrowRight, Globe } from 'lucide-react';

const Signal: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20h.01" /><path d="M7 20v-4" /><path d="M12 20v-8" /><path d="M17 20V8" /><path d="M22 4v16" />
  </svg>
);

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  gradient: string;
}> = ({ icon, label, value, gradient }) => (
  <div className={`bg-gradient-to-br ${gradient} border border-white/5 rounded-xl p-4 backdrop-blur-sm`}>
    <div className="mb-2">{icon}</div>
    <p className="text-[10px] text-white/50 uppercase tracking-wider mb-1">{label}</p>
    <p className="text-lg font-bold text-white font-mono">{value}</p>
  </div>
);

const HeroSection: React.FC = () => {
  const { setActiveTab } = useAppContext();
  const { globalQuery } = useMarketOverview();
  const { data: tickers } = useTickerData();

  const globalData = globalQuery.data?.data;
  const totalMarketCap = globalData?.total_market_cap?.usd ?? 3420000000000;
  const totalVolume = globalData?.total_volume?.usd ?? 142000000000;
  const btcDominance = globalData?.market_cap_percentage?.btc ?? 56.2;
  const activeCryptos = globalData?.active_cryptocurrencies ?? 13245;

  const formatCurrency = (value: number): string => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const topCoins = React.useMemo(() => {
    if (!tickers) return [];
    const priority = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA'];
    return tickers
      .filter((t) => priority.includes(t.symbol.replace('USDT', '')))
      .sort((a, b) => {
        const aIdx = priority.indexOf(a.symbol.replace('USDT', ''));
        const bIdx = priority.indexOf(b.symbol.replace('USDT', ''));
        return aIdx - bIdx;
      })
      .slice(0, 6);
  }, [tickers]);

  return (
    <section className="relative overflow-hidden rounded-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B0E11] via-[#1a1f2e] to-[#0d1117]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(240,185,11,0.12),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.08),transparent_60%)]" />

      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      <div className="relative px-6 py-12 lg:px-12 lg:py-16">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="lg:max-w-xl">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6">
              <div className="w-2 h-2 rounded-full bg-emerald-400 pulse-glow" />
              <span className="text-xs text-white/70">Live Market Data</span>
              <span className="text-xs text-primary font-mono font-bold">24/7</span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight mb-4">
              <span className="text-white/60 text-2xl lg:text-3xl font-medium">Aura</span>
              <br />
              <span className="bg-gradient-to-r from-[#F0B90B] via-[#F8D12F] to-[#F0B90B] bg-clip-text text-transparent">
                CryptoX
              </span>
            </h1>

            <p className="text-base text-white/60 mb-8 max-w-md leading-relaxed">
              Smart crypto trading analytics by Aura Agentic AI. Real-time market data, AI signals, portfolio tracking, and on-chain staking.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('markets')}
                className="flex items-center gap-2 bg-gradient-to-r from-[#F0B90B] to-[#F8D12F] text-black px-6 py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
              >
                Explore Markets <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveTab('signals')}
                className="flex items-center gap-2 bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors"
              >
                <Signal className="w-4 h-4" />
                View Signals
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:w-[380px]">
            <StatCard
              icon={<Globe className="w-5 h-5 text-blue-400" />}
              label="Total Market Cap"
              value={formatCurrency(totalMarketCap)}
              gradient="from-blue-500/10 to-cyan-500/10"
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
              label="24h Volume"
              value={formatCurrency(totalVolume)}
              gradient="from-emerald-500/10 to-green-500/10"
            />
            <StatCard
              icon={<BarChart3 className="w-5 h-5 text-orange-400" />}
              label="BTC Dominance"
              value={`${btcDominance.toFixed(1)}%`}
              gradient="from-orange-500/10 to-amber-500/10"
            />
            <StatCard
              icon={<Shield className="w-5 h-5 text-purple-400" />}
              label="Active Cryptos"
              value={activeCryptos.toLocaleString()}
              gradient="from-purple-500/10 to-pink-500/10"
            />
          </div>
        </div>

        {topCoins.length > 0 && (
          <div className="mt-10 pt-6 border-t border-white/5">
            <div className="flex items-center gap-6 overflow-hidden">
              {topCoins.map((coin) => {
                const symbol = coin.symbol.replace('USDT', '');
                const color = CRYPTO_COLORS[symbol] || '#6366f1';
                const change = parseFloat(coin.priceChangePercent);
                const price = parseFloat(coin.lastPrice);
                return (
                  <div key={coin.symbol} className="flex items-center gap-2 shrink-0">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                      style={{ backgroundColor: color }}
                    >
                      {symbol.charAt(0)}
                    </div>
                    <span className="text-sm text-white/80 font-medium">{symbol}</span>
                    <span className="text-sm text-white/50 font-mono">
                      {formatPrice(price)}
                    </span>
                    <span
                      className={`text-xs font-mono ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                    >
                      {change >= 0 ? '+' : ''}
                      {change.toFixed(2)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroSection;
