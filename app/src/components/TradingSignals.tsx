import React, { useState, useEffect } from 'react';
import { tradingSignals, formatCurrency } from '@/data/cryptoData';
import { Target, ShieldAlert, TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';

const TradingSignals: React.FC = () => {
  const [lastUpdated, setLastUpdated] = useState('Just now');

  useEffect(() => {
    const updateTime = () => {
      const mins = Math.floor(Math.random() * 3) + 1;
      setLastUpdated(`${mins} min ago`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Trading Signals</h2>
          <p className="text-sm text-muted-foreground mt-1">AI-powered technical analysis recommendations</p>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground">Updated {lastUpdated}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tradingSignals.map((signal) => {
          const isBuy = signal.type === 'BUY';
          const isSell = signal.type === 'SELL';
          const isHold = signal.type === 'HOLD';

          const typeColor = isBuy ? 'text-emerald-400' : isSell ? 'text-red-400' : 'text-amber-400';
          const typeBg = isBuy
            ? 'bg-emerald-500/10 border-emerald-500/20'
            : isSell
            ? 'bg-red-500/10 border-red-500/20'
            : 'bg-amber-500/10 border-amber-500/20';
          const TypeIcon = isBuy ? TrendingUp : isSell ? TrendingDown : Minus;

          const profitPercent = isSell
            ? ((signal.entry - signal.target) / signal.entry * 100).toFixed(1)
            : ((signal.target - signal.entry) / signal.entry * 100).toFixed(1);

          return (
            <div key={signal.id} className="glass-card-hover p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{signal.pair}</span>
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                    {signal.timeframe}
                  </span>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${typeBg}`}>
                  <TypeIcon className={`w-3.5 h-3.5 ${typeColor}`} />
                  <span className={`text-xs font-bold ${typeColor}`}>{signal.type}</span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    Entry
                  </div>
                  <span className="text-sm font-mono font-medium">{formatCurrency(signal.entry)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Target className="w-3 h-3 text-emerald-400" />
                    Target
                  </div>
                  <span className="text-sm font-mono font-medium text-emerald-400">
                    {formatCurrency(signal.target)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldAlert className="w-3 h-3 text-red-400" />
                    Stop Loss
                  </div>
                  <span className="text-sm font-mono font-medium text-red-400">
                    {formatCurrency(signal.stopLoss)}
                  </span>
                </div>
              </div>

              <div className="bg-secondary/50 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Potential {isSell ? 'Short' : 'Profit'}</span>
                  <span className={`text-sm font-bold font-mono text-emerald-400`}>
                    +{profitPercent}%
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Confidence</span>
                  <span className="text-xs font-bold font-mono">{signal.confidence}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      signal.confidence >= 80
                        ? 'bg-emerald-500'
                        : signal.confidence >= 60
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${signal.confidence}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">{signal.indicator}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default TradingSignals;
