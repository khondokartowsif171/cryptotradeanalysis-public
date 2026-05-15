import React, { useRef, useEffect, useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useTickerData } from '@/hooks/useCryptoData';
import { formatPrice, CRYPTO_COLORS } from '@/types/crypto';
import {
  Search, X, Star, BarChart3, Newspaper, Activity, TrendingUp,
  Sun, Moon, Menu, Loader2,
} from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

const Header: React.FC = () => {
  const {
    activeTab, setActiveTab, searchQuery, setSearchQuery,
    showSearch, setShowSearch, setActiveCoin,
  } = useAppContext();
  const { theme, setTheme } = useTheme();
  const searchRef = useRef<HTMLInputElement>(null);
  const { data: tickers, isLoading } = useTickerData();

  useEffect(() => {
    if (showSearch && searchRef.current) searchRef.current.focus();
  }, [showSearch]);

  const filteredResults = useMemo(() => {
    if (!tickers || !searchQuery) return [];
    return tickers
      .filter((t) => {
        const base = t.symbol.replace('USDT', '');
        return (
          base.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.symbol.toLowerCase().includes(searchQuery.toLowerCase())
        );
      })
      .slice(0, 5)
      .map((t) => ({
        id: t.symbol.replace('USDT', '').toLowerCase(),
        name: t.symbol.replace('USDT', ''),
        symbol: t.symbol.replace('USDT', ''),
        price: parseFloat(t.lastPrice),
        color: CRYPTO_COLORS[t.symbol.replace('USDT', '')] || '#6366f1',
      }));
  }, [tickers, searchQuery]);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'markets', label: 'Markets', icon: TrendingUp },
    { id: 'signals', label: 'Signals', icon: Activity },
    { id: 'watchlist', label: 'Watchlist', icon: Star },
    { id: 'news', label: 'News', icon: Newspaper },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#F0B90B] to-[#F8D12F] flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-black" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xl font-bold tracking-tight">CryptoX</span>
              <span className="text-[10px] font-semibold bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">PRO</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === item.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                {showSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
              </button>
              {showSearch && (
                <div className="absolute right-0 top-12 w-80 glass-card p-3 shadow-2xl z-50">
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search coins..."
                    className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  {isLoading && searchQuery && (
                    <div className="mt-2 flex justify-center py-2">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {filteredResults.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {filteredResults.map((coin) => (
                        <button
                          key={coin.id}
                          onClick={() => {
                            setActiveCoin(coin.id);
                            setActiveTab('overview');
                            setShowSearch(false);
                            setSearchQuery('');
                          }}
                          className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-accent transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                              style={{ backgroundColor: coin.color }}
                            >
                              {coin.symbol.charAt(0)}
                            </div>
                            <span className="text-sm font-medium">{coin.name}</span>
                            <span className="text-xs text-muted-foreground">{coin.symbol}</span>
                          </div>
                          <span className="text-sm font-mono">{formatPrice(coin.price)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-[#F0B90B] to-[#F8D12F] text-black px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
              Connect Wallet
            </button>
          </div>
        </div>

        <div className="md:hidden flex items-center gap-1 pb-3 overflow-x-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === item.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};

export default Header;
