import React, { useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useAssets } from '@/hooks/useCryptoData';
import { formatPrice, CRYPTO_COLORS, STABLECOINS } from '@/types/crypto';
import { Star, ArrowUpDown, TrendingUp, TrendingDown, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const MiniSparkline: React.FC<{ positive: boolean }> = ({ positive }) => {
  const data = useMemo(() => {
    const points: number[] = [];
    let v = 50;
    for (let i = 0; i < 24; i++) {
      v += (Math.random() - 0.5) * 10;
      points.push(v);
    }
    return points.map((v) => ({ v }));
  }, []);

  return (
    <div className="w-24 h-8">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={positive ? '#10b981' : '#ef4444'}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const CryptoTable: React.FC = () => {
  const {
    watchlist, toggleWatchlist, sortField, sortDirection,
    setSortField, setActiveCoin, setActiveTab, searchQuery,
  } = useAppContext();

  const { data: assets, isLoading } = useAssets();

  const filteredAndSorted = useMemo(() => {
    if (!assets) return [];

    let items = [...assets].filter((c) => !STABLECOINS.has(c.symbol));

    if (searchQuery) {
      items = items.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    items.sort((a, b) => {
      let aVal: number | string = 0, bVal: number | string = 0;
      switch (sortField) {
        case 'rank':
          aVal = a.rank;
          bVal = b.rank;
          break;
        case 'name':
          aVal = a.name;
          bVal = b.name;
          break;
        case 'price':
          aVal = a.price;
          bVal = b.price;
          break;
        case 'change24h':
          aVal = a.change24h;
          bVal = b.change24h;
          break;
        case 'volume':
          aVal = a.volume24h;
          bVal = b.volume24h;
          break;
        case 'marketCap':
          aVal = a.marketCap;
          bVal = b.marketCap;
          break;
        default:
          aVal = a.rank;
          bVal = b.rank;
      }
      if (typeof aVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return items.slice(0, 50);
  }, [assets, sortField, sortDirection, searchQuery]);

  const SortHeader: React.FC<{ field: string; label: string; align?: string }> = ({
    field,
    label,
    align,
  }) => (
    <th
      className={`px-3 py-3 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none ${align === 'right' ? 'text-right' : 'text-left'}`}
      onClick={() => setSortField(field)}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
        {label}
        {sortField === field ? (
          sortDirection === 'asc' ? (
            <ChevronUp className="w-3 h-3 text-primary" />
          ) : (
            <ChevronDown className="w-3 h-3 text-primary" />
          )
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-30" />
        )}
      </div>
    </th>
  );

  if (isLoading) {
    return (
      <section className="w-full">
        <h2 className="text-2xl font-bold mb-4">Cryptocurrency Prices</h2>
        <div className="glass-card p-12 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">Cryptocurrency Prices</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Top {filteredAndSorted.length} by Volume
          </p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="px-3 py-3 text-xs font-medium text-muted-foreground text-center w-10" />
                <SortHeader field="rank" label="#" />
                <SortHeader field="name" label="Name" />
                <SortHeader field="price" label="Price" align="right" />
                <SortHeader field="change24h" label="24h %" align="right" />
                <SortHeader field="volume" label="24h Volume" align="right" />
                <SortHeader field="marketCap" label="Market Cap" align="right" />
                <th className="px-3 py-3 text-xs font-medium text-muted-foreground text-right">
                  Last 24h
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.map((coin) => (
                <tr
                  key={coin.id}
                  className="border-b border-border/30 hover:bg-accent/50 transition-colors cursor-pointer group"
                  onClick={() => {
                    setActiveCoin(coin.id);
                    setActiveTab('overview');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWatchlist(coin.id);
                      }}
                      className="p-1 rounded-md hover:bg-accent transition-colors"
                    >
                      <Star
                        className={`w-4 h-4 transition-colors ${
                          watchlist.includes(coin.id)
                            ? 'fill-[#F0B90B] text-[#F0B90B]'
                            : 'text-muted-foreground/30 group-hover:text-muted-foreground'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-3 py-3 text-sm font-mono text-muted-foreground">
                    {coin.rank}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ backgroundColor: coin.color }}
                      >
                        {coin.symbol.substring(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{coin.name}</p>
                        <p className="text-xs text-muted-foreground">{coin.symbol}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="text-sm font-mono font-semibold">
                      {formatPrice(coin.price)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span
                      className={`inline-flex items-center gap-1 text-sm font-mono font-medium ${
                        coin.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {coin.change24h >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {coin.change24h >= 0 ? '+' : ''}
                      {coin.change24h.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="text-sm font-mono text-muted-foreground">
                      {formatPrice(coin.volume24h)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="text-sm font-mono text-muted-foreground">
                      {formatPrice(coin.marketCap)}
                    </span>
                  </td>
                  <td className="px-3 py-3 flex justify-end">
                    <MiniSparkline positive={coin.change24h >= 0} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default CryptoTable;
