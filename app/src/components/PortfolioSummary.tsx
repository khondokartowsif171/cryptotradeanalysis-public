import React, { useState, useMemo, useEffect } from 'react';
import { useBinanceTicker } from '@/hooks/useBinanceWS';
import { useAppContext } from '@/contexts/AppContext';
import { api } from '@/services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Wallet, TrendingUp, ArrowUpRight, Pencil, Check, X, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const defaultHoldings = [
  { symbol: 'BTC', amount: 0.3, name: 'Bitcoin' },
  { symbol: 'ETH', amount: 5.0, name: 'Ethereum' },
  { symbol: 'SOL', amount: 40, name: 'Solana' },
  { symbol: 'BNB', amount: 8, name: 'BNB' },
];

const COLORS: Record<string, string> = {
  BTC: '#F7931A', ETH: '#627EEA', SOL: '#9945FF', BNB: '#F0B90B',
};

const PortfolioSummary: React.FC = () => {
  const { user } = useAppContext();
  const [holdings, setHoldings] = useState(defaultHoldings);
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState(defaultHoldings.map(h => h.amount.toString()));
  const [loading, setLoading] = useState(false);

  const symbols = holdings.map(h => h.symbol);
  const { tickers } = useBinanceTicker(symbols);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const res = await api.portfolio.get();
      if (!res._offline && res.data.portfolio.length > 0) {
        setHoldings(res.data.portfolio);
        setEditValues(res.data.portfolio.map((h: any) => h.amount.toString()));
      }
    })();
  }, [user]);

  const portfolioData = useMemo(() => {
    const priced = holdings.map((h) => {
      const ticker = tickers.get(h.symbol);
      const price = ticker?.price ?? 0;
      return { ...h, usd: price * h.amount, price };
    });
    const total = priced.reduce((s, h) => s + h.usd, 0) || 1;
    const othersUsd = priced.reduce((s, h) => s + h.usd * 0.1 / 0.9, 0);
    const othersPct = total > 0 ? 10 : 0;
    const items = priced.map(h => ({
      name: h.symbol,
      value: Math.round((h.usd / total) * 100),
      color: COLORS[h.symbol] || '#6366f1',
      amount: Math.round(h.usd),
    }));
    items.push({ name: 'Others', value: othersPct, color: '#6366f1', amount: Math.round(othersUsd) });
    return items;
  }, [holdings, tickers]);

  const totalValue = portfolioData.reduce((s, d) => s + d.amount, 0);

  const startEdit = () => {
    setEditValues(holdings.map(h => h.amount.toString()));
    setEditing(true);
  };

  const saveEdit = async () => {
    const parsed = holdings.map((h, i) => ({
      ...h,
      amount: parseFloat(editValues[i]) || 0,
    }));
    if (parsed.every(h => h.amount === 0)) {
      toast({ title: 'Empty Portfolio', description: 'Add at least one holding.', variant: 'destructive' });
      return;
    }
    setHoldings(parsed);
    setEditing(false);
    setLoading(true);
    if (user) {
      const res = await api.portfolio.save(parsed);
      if (res._offline) {
        toast({ title: 'Saved Locally', description: 'Backend offline. Data saved in browser.' });
      } else {
        toast({ title: 'Portfolio Saved', description: 'Your holdings are synced to cloud.' });
      }
    }
    setLoading(false);
  };

  const cancelEdit = () => {
    setEditValues(holdings.map(h => h.amount.toString()));
    setEditing(false);
  };

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary" />
          <h3 className="font-bold">Portfolio</h3>
        </div>
        {user && !editing && (
          <button onClick={startEdit} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      <div className="mb-4">
        <p className="text-xs text-muted-foreground">Total Value</p>
        <p className="text-2xl font-bold font-mono">${totalValue.toLocaleString()}</p>
        <p className="flex items-center gap-1 text-sm text-emerald-400 font-mono">
          <ArrowUpRight className="w-3.5 h-3.5" />
          Live price updated
        </p>
      </div>

      <div className="w-full h-40 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={portfolioData} cx="50%" cy="50%" innerRadius={45} outerRadius={65}
              paddingAngle={3} dataKey="value" stroke="none"
            >
              {portfolioData.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Pie>
            <Tooltip content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return <div className="glass-card p-2 text-xs shadow-xl"><p className="font-medium">{d.name}</p><p className="font-mono">${d.amount.toLocaleString()} ({d.value}%)</p></div>;
            }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-2">
        {holdings.map((h, i) => (
          <div key={h.symbol} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[h.symbol] || '#6366f1' }} />
            <span className="text-xs flex-1">{h.symbol}</span>
            {editing ? (
              <input
                type="number"
                step="any"
                value={editValues[i]}
                onChange={(e) => {
                  const vals = [...editValues];
                  vals[i] = e.target.value;
                  setEditValues(vals);
                }}
                className="w-20 text-right text-xs font-mono bg-secondary/50 border border-border rounded px-1.5 py-0.5 focus:outline-none"
              />
            ) : (
              <span className="text-xs font-mono text-muted-foreground">{h.amount} {h.symbol}</span>
            )}
            <span className="text-xs font-mono font-medium w-20 text-right">
              ${(tickers.get(h.symbol)?.price ?? 0) * h.amount > 0 ? Math.round((tickers.get(h.symbol)?.price ?? 0) * h.amount).toLocaleString() : '0'}
            </span>
          </div>
        ))}
      </div>

      {editing && (
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/30">
          <button onClick={saveEdit} disabled={loading} className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 py-2 rounded-lg text-xs font-semibold hover:bg-emerald-500/20 transition-colors disabled:opacity-50">
            {loading ? <><Loader2 className="w-3 h-3 animate-spin" /> Saving</> : <><Check className="w-3.5 h-3.5" /> Save</>}
          </button>
          <button onClick={cancelEdit} className="flex-1 flex items-center justify-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/20 py-2 rounded-lg text-xs font-semibold hover:bg-red-500/20 transition-colors">
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default PortfolioSummary;
