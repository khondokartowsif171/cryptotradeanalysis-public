import React, { useMemo, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useKlineData } from '@/hooks/useCryptoData';
import { useActiveCoinTicker } from '@/hooks/useBinanceWS';
import { formatPrice } from '@/types/crypto';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area,
} from 'recharts';
import { TrendingUp, TrendingDown, Layers, Loader2 } from 'lucide-react';

const timeframes = ['1H', '4H', '1D', '1W', '1M'];
const indicators = ['MA', 'EMA', 'VOL'];

const PriceChart: React.FC = () => {
  const { activeCoin, chartTimeframe, setChartTimeframe } = useAppContext();
  const [activeIndicators, setActiveIndicators] = useState<string[]>(['VOL']);
  const [showIndicatorMenu, setShowIndicatorMenu] = useState(false);

  const symbol = activeCoin.toUpperCase() + 'USDT';
  const { data: candles, isLoading } = useKlineData(symbol, chartTimeframe);
  const {
    price: livePrice,
    change24h,
    color,
    symbol: coinSymbol,
  } = useActiveCoinTicker(activeCoin);

  const data = useMemo(() => {
    if (!candles) return [];
    return candles.map((c, i, arr) => {
      const ma20 =
        i >= 19
          ? arr.slice(i - 19, i + 1).reduce((sum, x) => sum + x.close, 0) / 20
          : null;
      const ema12 =
        i >= 11
          ? arr.slice(i - 11, i + 1).reduce((sum, x) => sum + x.close, 0) / 12
          : null;
      return { ...c, ma20, ema12 };
    });
  }, [candles]);

  const latestPrice = livePrice || data[data.length - 1]?.close || 0;
  const prevPrice = data[data.length - 2]?.close || latestPrice;
  const priceChange = prevPrice ? ((latestPrice - prevPrice) / prevPrice) * 100 : 0;

  const toggleIndicator = (ind: string) => {
    setActiveIndicators((prev) =>
      prev.includes(ind) ? prev.filter((i) => i !== ind) : [...prev, ind]
    );
  };

  const CustomTooltip = ({ active, payload }: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;
    return (
      <div className="glass-card p-3 text-xs space-y-1 shadow-xl">
        <p className="font-medium text-foreground">{d.time}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono">
          <span className="text-muted-foreground">Open:</span>
          <span>${d.open?.toLocaleString()}</span>
          <span className="text-muted-foreground">High:</span>
          <span className="text-emerald-400">${d.high?.toLocaleString()}</span>
          <span className="text-muted-foreground">Low:</span>
          <span className="text-red-400">${d.low?.toLocaleString()}</span>
          <span className="text-muted-foreground">Close:</span>
          <span className="font-bold">${d.close?.toLocaleString()}</span>
          <span className="text-muted-foreground">Vol:</span>
          <span>${(d.volume / 1e9).toFixed(2)}B</span>
        </div>
      </div>
    );
  };

  return (
    <section className="glass-card p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {coinSymbol.substring(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold">{activeCoin}</h3>
              <span className="text-sm text-muted-foreground">{coinSymbol}/USDT</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold font-mono">
                {formatPrice(latestPrice)}
              </span>
              <span
                className={`flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full ${
                  priceChange >= 0 ? 'bg-gain' : 'bg-loss'
                }`}
              >
                {priceChange >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                {priceChange >= 0 ? '+' : ''}
                {priceChange.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-secondary/50 rounded-lg p-0.5">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => setChartTimeframe(tf)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  chartTimeframe === tf
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowIndicatorMenu(!showIndicatorMenu)}
              className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Layers className="w-4 h-4" />
            </button>
            {showIndicatorMenu && (
              <div className="absolute right-0 top-10 glass-card p-2 shadow-xl z-10 min-w-[120px]">
                {indicators.map((ind) => (
                  <button
                    key={ind}
                    onClick={() => toggleIndicator(ind)}
                    className={`flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      activeIndicators.includes(ind)
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${activeIndicators.includes(ind) ? 'bg-primary' : 'bg-muted'}`}
                    />
                    {ind}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full h-[350px] lg:h-[420px]">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(225, 18%, 15%)"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)' }}
                axisLine={{ stroke: 'hsl(225, 18%, 15%)' }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)' }}
                axisLine={false}
                tickLine={false}
                domain={['auto', 'auto']}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(2))}
                width={60}
              />
              {activeIndicators.includes('VOL') && (
                <YAxis
                  yAxisId="volume"
                  orientation="right"
                  tick={false}
                  axisLine={false}
                  tickLine={false}
                />
              )}
              <Tooltip content={<CustomTooltip />} />

              {activeIndicators.includes('VOL') && (
                <Bar
                  yAxisId="volume"
                  dataKey="volume"
                  fill="url(#volumeGradient)"
                  opacity={0.4}
                  radius={[2, 2, 0, 0]}
                />
              )}

              <Area
                type="monotone"
                dataKey="close"
                stroke={color}
                strokeWidth={2}
                fill="url(#areaGradient)"
                dot={false}
                activeDot={{ r: 4, fill: color, stroke: '#fff', strokeWidth: 2 }}
              />

              {activeIndicators.includes('MA') && (
                <Line
                  type="monotone"
                  dataKey="ma20"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  dot={false}
                  strokeDasharray="5 5"
                />
              )}
              {activeIndicators.includes('EMA') && (
                <Line
                  type="monotone"
                  dataKey="ema12"
                  stroke="#ec4899"
                  strokeWidth={1.5}
                  dot={false}
                  strokeDasharray="3 3"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: color }} />
          <span>Price</span>
        </div>
        {activeIndicators.includes('MA') && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded-full bg-amber-500" />
            <span>MA(20)</span>
          </div>
        )}
        {activeIndicators.includes('EMA') && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded-full bg-pink-500" />
            <span>EMA(12)</span>
          </div>
        )}
        {activeIndicators.includes('VOL') && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-2 rounded-sm bg-indigo-500/50" />
            <span>Volume</span>
          </div>
        )}
      </div>
    </section>
  );
};

export default PriceChart;
