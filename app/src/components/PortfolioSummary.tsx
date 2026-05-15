import React, { useMemo } from 'react';
import { useBinanceTicker } from '@/hooks/useBinanceWS';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Wallet, TrendingUp, ArrowUpRight, Loader2 } from 'lucide-react';

const portfolioHoldings = [
  { id: 'bitcoin', name: 'BTC', symbol: 'BTC', targetAlloc: 45, amount: 0.3 },
  { id: 'ethereum', name: 'ETH', symbol: 'ETH', targetAlloc: 25, amount: 5.0 },
  { id: 'solana', name: 'SOL', symbol: 'SOL', targetAlloc: 12, amount: 40 },
  { id: 'bnb', name: 'BNB', symbol: 'BNB', targetAlloc: 8, amount: 8 },
  { id: 'Others', symbol: 'OTHERS', targetAlloc: 10, amount: 0 },
];

const PortfolioSummary: React.FC = () => {
  const symbols = portfolioHoldings.filter(h => h.symbol !== 'OTHERS').map(h => h.symbol);
  const { tickers } = useBinanceTicker(symbols);

  const portfolioData = useMemo(() => {
    const items = portfolioHoldings.map((h) => {
      if (h.symbol === 'OTHERS') {
        const othersValue = portfolioHoldings
          .filter(p => p.symbol !== 'OTHERS')
          .reduce((sum, p) => {
            const ticker = tickers.get(p.symbol);
            return sum + (ticker?.price ?? 0) * p.amount;
          }, 0) * 0.1 / 0.9;
        return { name: 'Others', value: 10, color: '#6366f1', amount: Math.round(othersValue) };
      }
      const ticker = tickers.get(h.symbol);
      const price = ticker?.price ?? 0;
      const amount = price * h.amount;
      return {
        name: h.name,
        value: h.targetAlloc,
        color: h.symbol === 'BTC' ? '#F7931A'
          : h.symbol === 'ETH' ? '#627EEA'
          : h.symbol === 'SOL' ? '#9945FF'
          : h.symbol === 'BNB' ? '#F0B90B'
          : '#6366f1',
        amount: Math.round(amount),
      };
    });

    return items;
  }, [tickers]);

  const totalValue = portfolioData.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="w-5 h-5 text-primary" />
        <h3 className="font-bold">Portfolio</h3>
      </div>

      <div className="mb-4">
        <p className="text-xs text-muted-foreground">Total Value</p>
        <p className="text-2xl font-bold font-mono">
          ${totalValue.toLocaleString()}
        </p>
        <p className="flex items-center gap-1 text-sm text-emerald-400 font-mono">
          <ArrowUpRight className="w-3.5 h-3.5" />
          Live price updated
        </p>
      </div>

      <div className="w-full h-40 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={portfolioData}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={65}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {portfolioData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="glass-card p-2 text-xs shadow-xl">
                    <p className="font-medium">{d.name}</p>
                    <p className="font-mono">${d.amount.toLocaleString()} ({d.value}%)</p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-2">
        {portfolioData.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-xs flex-1">{item.name}</span>
            <span className="text-xs font-mono text-muted-foreground">{item.value}%</span>
            <span className="text-xs font-mono font-medium">${item.amount.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PortfolioSummary;
