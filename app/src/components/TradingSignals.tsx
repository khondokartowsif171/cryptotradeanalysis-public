import React, { useState, useEffect } from 'react';
import { api,type PremiumSignal } from '@/services/api';
import { formatCurrency } from '@/data/cryptoData';
import { useAppContext } from '@/contexts/AppContext';
import { activeTier } from '@/lib/subscription';
import PlanAccess from '@/components/PlanAccess';
import { Target, ShieldAlert, TrendingUp, TrendingDown, Minus, Zap, Loader2 } from 'lucide-react';

const TradingSignals: React.FC = () => {
  const { user,refreshUser } = useAppContext();
  const allowed = activeTier(user) !== 'free';
  const [lastUpdated,setLastUpdated] = useState('');
  const [liveSignals,setLiveSignals] = useState<PremiumSignal[]>([]);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState('');
  useEffect(() => {
    setLiveSignals([]); setLastUpdated(''); setError('');
    if (!allowed) return;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const result = await api.signals.get();
        if (!mounted) return;
        if (result._offline) throw new Error('The premium feed is unavailable. Reconnect to retry');
        setLiveSignals(result.data.signals); setLastUpdated(new Date().toLocaleTimeString()); setError('');
      } catch(error) { if (mounted) { setError((error as Error).message); if ((error as {status?:number}).status === 403) void refreshUser(); } }
      finally { if (mounted) setLoading(false); }
    };
    void load();
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void load(); },60000);
    return () => { mounted = false; window.clearInterval(timer); };
  },[allowed,user?.id,refreshUser]);
  if (!allowed) return <PlanAccess title="Premium trading signals" />;
  const signals = liveSignals;
  const source = 'Premium signals published by the signal service';

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Trading Signals</h2>
          <p className="text-sm text-muted-foreground mt-1">{source}</p>
        </div>
        <div className="flex items-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Zap className="w-4 h-4 text-primary" />}
          <span className="text-xs text-muted-foreground">{lastUpdated ? `Last feed response ${lastUpdated}` : 'Waiting for feed'}</span>
        </div>
      </div>

      {error && <p role="status" className="mb-4 text-sm text-amber-500">{error}</p>}
      {!loading && !signals.length && !error && <p className="glass-card p-5 text-sm text-muted-foreground">No premium signals have been published yet. This feed does not substitute example trades.</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {signals.map(signal => {
          const isBuy = signal.type === 'BUY';
          const isSell = signal.type === 'SELL';
          const isHold = signal.type === 'HOLD';
          const typeColor = isBuy ? 'text-emerald-400' : isSell ? 'text-red-400' : 'text-amber-400';
          const typeBg = isBuy ? 'bg-emerald-500/10 border-emerald-500/20' : isSell ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20';
          const TypeIcon = isBuy ? TrendingUp : isSell ? TrendingDown : Minus;
          const entry = Number(signal.entry || signal.price || 0);
          const target = Number(signal.target || signal.takeProfit || 0);
          const stopLoss = Number(signal.stopLoss || signal.stop_loss || 0);
          const confidence = Math.max(0,Math.min(100,parseInt(String(signal.confidence)) || 0));
          const profitPercent = entry > 0 && target > 0 ? (isSell ? (entry-target)/entry*100 : (target-entry)/entry*100).toFixed(1) : null;
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
                  <span className="text-sm font-mono font-medium">{entry > 0 ? formatCurrency(entry) : 'Not provided'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Target className="w-3 h-3 text-emerald-400" /> Target
                  </div>
                  <span className="text-sm font-mono font-medium text-emerald-400">{target > 0 ? formatCurrency(target) : 'Not provided'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldAlert className="w-3 h-3 text-red-400" /> Stop Loss
                  </div>
                  <span className="text-sm font-mono font-medium text-red-400">{stopLoss > 0 ? formatCurrency(stopLoss) : 'Not provided'}</span>
                </div>
              </div>

              <div className="bg-secondary/50 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Potential {isSell ? 'Short' : 'Profit'}</span>
                  <span className="text-sm font-bold font-mono text-emerald-400">{profitPercent === null ? 'Not provided' : `${Number(profitPercent)>0 ? '+' : ''}${profitPercent}%`}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Confidence</span>
                  <span className="text-xs font-bold font-mono">{signal.confidence == null ? 'Not provided' : `${confidence}%`}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${confidence >= 80 ? 'bg-emerald-500' : confidence >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${signal.confidence == null ? 'Not provided' : `${confidence}%`}` }} />
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
