import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useTickerData } from '@/hooks/useCryptoData';
import { formatPrice, CRYPTO_COLORS } from '@/types/crypto';
import {
  Search, X, Star, BarChart3, Newspaper, Activity, TrendingUp,
  Sun, Moon, Menu, Loader2, Wallet, LogOut, User, Zap, Crown,
} from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { useContract } from '@/hooks/useContract';
import { InstallAppButton } from '@/components/InstallApp';
import { activeTier } from '@/lib/subscription';
import AuthModal from '@/components/AuthModal';
import PricingModal from '@/components/PricingModal';

const Header: React.FC = () => {
  const {
    activeTab, setActiveTab, searchQuery, setSearchQuery,
    showSearch, setShowSearch, setActiveCoin, user, signOut,
  } = useAppContext();
  const { theme, setTheme } = useTheme();
  const { account, isConnecting, connectWallet } = useContract();
  const searchRef = useRef<HTMLInputElement>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const { data: tickers, isLoading } = useTickerData();

  useEffect(() => {
    const pricing = () => setShowPricing(true);
    const signin = () => setShowAuth(true);
    window.addEventListener('cryptox:pricing',pricing); window.addEventListener('cryptox:signin',signin);
    return () => { window.removeEventListener('cryptox:pricing',pricing); window.removeEventListener('cryptox:signin',signin); };
  },[]);

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
          <button type="button" onClick={() => setActiveTab('overview')} aria-label="Aura Crypto X home" className="shrink-0">
            <img src="/aura-crypto-x-logo.svg" alt="Aura Crypto X" className="w-[122px] sm:w-[164px] h-12 object-contain dark:hidden" />
            <img src="/aura-crypto-x-logo-dark.svg" alt="Aura Crypto X" className="w-[122px] sm:w-[164px] h-12 object-contain hidden dark:block" />
          </button>

          <nav className="hidden 2xl:flex items-center gap-1">
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
            <InstallAppButton />
            {/* Search Button */}
            <div className="relative">
              <button
                aria-label="Search coins" onClick={() => setShowSearch(!showSearch)}
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

            {/* Theme Toggle */}
            <button
              aria-label="Toggle theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Upgrade / Pricing Button */}
            <button
              type="button"
              onClick={() => setShowPricing(true)}
              className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-amber-600/10 hover:from-amber-500/30 hover:to-amber-600/20 text-amber-400 border border-amber-500/30 px-3 py-2 rounded-lg text-xs font-bold transition shadow-sm active:scale-95"
            >
              {activeTier(user) === 'vip' ? (
                <><Crown className="w-3.5 h-3.5 text-purple-400" /> VIP MEMBER</>
              ) : activeTier(user) === 'pro' ? (
                <><Zap className="w-3.5 h-3.5 text-amber-400" /> PRO TRADER</>
              ) : (
                <><Zap className="w-3.5 h-3.5 text-amber-400" /> UPGRADE</>
              )}
            </button>

            {/* Auth / User */}
            {user ? (
              <div className="hidden sm:flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-3 py-2 rounded-lg cursor-pointer group relative">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-sm font-mono font-medium">
                  {user.wallet_address
                    ? `${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}`
                    : `${user.email.slice(0, 10)}..`}
                </span>
                <div className="absolute right-0 top-full mt-1 w-44 glass-card p-2 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <div className="px-2 py-1.5 text-[10px] text-muted-foreground border-b border-border/40 mb-1">
                    Tier: <span className="font-bold text-primary uppercase">{activeTier(user)}</span>
                  </div>
                  <button
                    onClick={() => setShowPricing(true)}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-foreground hover:bg-accent transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> Subscription Plans
                  </button>
                  <button
                    onClick={signOut}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-accent transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="hidden sm:flex items-center gap-2 bg-secondary/50 text-foreground border border-border px-3 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-colors"
              >
                <User className="w-4 h-4" /> Sign In
              </button>
            )}

            {/* Wallet Connect Status */}
            {account ? (
              <div title={account} aria-label={`Connected wallet ${account}`} className="flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-2 sm:px-3 py-2 rounded-lg">
                <Wallet className="w-4 h-4 sm:hidden" />
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="hidden sm:inline text-sm font-mono font-medium">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </span>
              </div>
            ) : (
              <button
                onClick={() => void connectWallet()}
                aria-label="Connect MetaMask wallet" disabled={isConnecting}
                className="flex items-center gap-2 bg-gradient-to-r from-[#F0B90B] to-[#F8D12F] text-black px-2 sm:px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isConnecting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Connecting</>
                ) : (
                  <><Wallet className="w-4 h-4" /><span className="hidden sm:inline">Connect Wallet</span></>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="2xl:hidden flex items-center justify-between pb-3 overflow-x-auto gap-2">
          <div className="flex items-center gap-1">
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

          {!user && <button aria-label="Sign in" onClick={() => setShowAuth(true)} className="sm:hidden shrink-0 rounded-lg px-2 py-1 text-xs">Sign In</button>}
          <button
            onClick={() => setShowPricing(true)}
            className="flex items-center gap-1 text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-md whitespace-nowrap"
          >
            <Zap className="w-3 h-3" /> Upgrade
          </button>
        </div>
      </div>
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
      <PricingModal open={showPricing} onClose={() => setShowPricing(false)} />
    </header>
  );
};

export default Header;
