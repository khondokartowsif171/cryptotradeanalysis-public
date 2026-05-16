import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { tradingSignals as mockSignals, formatCurrency } from '@/data/cryptoData';
import { Target, ShieldAlert, TrendingUp, TrendingDown, Minus, Zap, Loader2 } from 'lucide-react';

const TradingSignals: React.FC = () => {
  const [lastUpdated, setLastUpdated] = useState('Just now');
  const [liveSignals, setLiveSignals] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const mins = Math.floor(Math.random() * 3) + 1;
      setLastUpdated(`${mins} min ago`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await api.signals.get();
      if (!res._offline && res.data.signals.length > 0) {
        setLiveSignals(res.data.signals);
        setLastUpdated('Just now');
      }
      setLoading(false);
    })();
  }, []);

  const signals = liveSignals || mockSignals;
  const source = liveSignals ? 'Live — Calculated by n8n RSI engine' : 'Mock data — connect backend for live signals';

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Trading Signals</h2>
          <p className="text-sm text-muted-foreground mt-1">{source}</p>
        </div>
        <div className="flex items-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Zap className="w-4 h-4 text-primary" />}
          <span className="text-xs text-muted-foreground">Updated {lastUpdated}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(signals as any[]).map((signal: any) => {
          const isBuy = signal.type === 'BUY';
          const isSell = signal.type === 'SELL';
          const isHold = signal.type === 'HOLD';
          const typeColor = isBuy ? 'text-emerald-400' : isSell ? 'text-red-400' : 'text-amber-400';
          const typeBg = isBuy ? 'bg-emerald-500/10 border-emerald-500/20' : isSell ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20';
          const TypeIcon = isBuy ? TrendingUp : isSell ? TrendingDown : Minus;
          const entry = parseFloat(signal.entry || signal.price || 0);
          const target = parseFloat(signal.target || entry * 1.1);
          const stopLoss = parseFloat(signal.stopLoss || entry * 0.95);
          const confidence = parseInt(signal.confidence) || 75;
          const profitPercent = isSell
            ? ((entry - target) / entry * 100).toFixed(1)
            : ((target - entry) / entry * 100).toFixed(1);
          const pair = signal.pair || `${signal.symbol || 'BTC'}USDT`;
          const timeframe = signal.timeframe || signal.interval || '1H';
          const indicator = signal.indicator || `RSI(${signal.rsi ? signal.rsi.toFixed(0) : '14'})`;

          return (
            <div key={signal.id || signal._id || pair} className="glass-card-hover p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{pair}</span>
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{timeframe}</span>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${typeBg}`}>
                  <TypeIcon className={`w-3.5 h-3.5 ${typeColor}`} />
                  <span className={`text-xs font-bold ${typeColor}`}>{signal.type}</span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Entry
                  </div>
                  <span className="text-sm font-mono font-medium">{formatCurrency(entry)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Target className="w-3 h-3 text-emerald-400" /> Target
                  </div>
                  <span className="text-sm font-mono font-medium text-emerald-400">{formatCurrency(target)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldAlert className="w-3 h-3 text-red-400" /> Stop Loss
                  </div>
                  <span className="text-sm font-mono font-medium text-red-400">{formatCurrency(stopLoss)}</span>
                </div>
              </div>

              <div className="bg-secondary/50 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Potential {isSell ? 'Short' : 'Profit'}</span>
                  <span className="text-sm font-bold font-mono text-emerald-400">+{profitPercent}%</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Confidence</span>
                  <span className="text-xs font-bold font-mono">{confidence}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${confidence >= 80 ? 'bg-emerald-500' : confidence >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${confidence}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground">{indicator}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default TradingSignals;
