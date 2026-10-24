import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { toast } from '@/components/ui/use-toast';
import { parseWeb3Error } from '@/lib/utils';
import { activeTier,openPlans } from '@/lib/subscription';
import { api, setToken, setStoredUser, getStoredUser, clearAuth, type User } from '@/services/api';

interface MessageSigner { signMessage: (message: string) => Promise<string> }
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Request failed';

interface AppContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  watchlist: string[];
  toggleWatchlist: (id: string) => void;
  setWatchlist: (ids: string[]) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeCoin: string;
  setActiveCoin: (id: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  setSortField: (field: string) => void;
  chartTimeframe: string;
  setChartTimeframe: (tf: string) => void;
  showSearch: boolean;
  setShowSearch: (v: boolean) => void;
  user: User | null;
  authLoading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signInWithWallet: (address: string, signer: MessageSigner) => Promise<string | null>;
  refreshUser: () => Promise<void>;
  linkWallet: (address: string, signer: MessageSigner) => Promise<boolean>;
  signOut: () => void;
  syncWatchlist: () => Promise<void>;
  saveWatchlist: () => Promise<void>;
}

const AppContext = createContext<AppContextType>({} as AppContextType);

export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const sessionVersion = useRef(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [watchlist, setWatchlistState] = useState<string[]>(['btc', 'eth', 'sol', 'bnb', 'xrp']);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCoin, setActiveCoin] = useState('btc');
  const [activeTab, setActiveTab] = useState('overview');
  const [sortField, setSortFieldState] = useState('rank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [chartTimeframe, setChartTimeframe] = useState('1D');
  const [showSearch, setShowSearch] = useState(false);
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [authLoading, setAuthLoading] = useState(false);
  const userId = user?.id;

  const refreshUser = useCallback(async () => {
    const version = sessionVersion.current;
    try {
      const res = await api.auth.me();
      if (version !== sessionVersion.current) return;
      if (!res._offline) {
        setUser(res.data.user);
        setStoredUser(res.data.user);
        if (!res.data.user) clearAuth();
      }
    } catch {
      // offline or unauthenticated
    }
  }, []);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
      refreshUser();
    }
  }, [refreshUser]);

  useEffect(() => {
    if (!userId) return;
    const refresh = () => { if (document.visibilityState === 'visible') void refreshUser(); };
    const timer = window.setInterval(refresh,60_000);
    document.addEventListener('visibilitychange',refresh);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange',refresh); };
  },[userId,refreshUser]);

  const linkWallet = useCallback(async (address: string, signer: MessageSigner) => {
    const version = sessionVersion.current;
    try {
      const nonce = await api.auth.walletNonce(address,'link');
      if (nonce._offline) throw new Error('Account server is unavailable. No wallet was linked');
      const signature = await signer.signMessage(nonce.data.nonce);
      const result = await api.auth.walletLink(address,signature,nonce.data.nonce);
      if (version !== sessionVersion.current) return false;
      if (result._offline) throw new Error('Wallet linking could not be confirmed. Retry later');
      sessionVersion.current++;
      setToken(result.data.token); setStoredUser(result.data.user); setUser(result.data.user);
      toast({ title: 'Payment wallet linked',description: 'Your wallet identity was verified. No payment was sent.' });
      return true;
    } catch(error) { const parsed = parseWeb3Error(error); toast({ ...parsed,variant: 'destructive' }); return false; }
  },[]);

  const syncWatchlist = useCallback(async () => {
    if (!user) return;
    const version = sessionVersion.current;
    const res = await api.watchlist.get();
    if (version !== sessionVersion.current) return;
    if (!res._offline) {
      setWatchlistState(res.data.watchlist);
    }
  }, [user]);

  const saveWatchlist = useCallback(async () => {
    if (!user) return;
    await api.watchlist.save(watchlist);
  }, [user, watchlist]);

  useEffect(() => {
    if (user) void syncWatchlist().catch(() => {});
  }, [user, syncWatchlist]);

  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    const version = ++sessionVersion.current;
    setAuthLoading(true);
    try {
      const res = await api.auth.login(email, password);
      if (res._offline) {
        toast({ title: 'Backend Offline', description: 'Login unavailable. Running in offline mode.', variant: 'destructive' });
        return 'offline';
      }
      if (version !== sessionVersion.current) return 'A different sign-in was started';
      setToken(res.data.token);
      setStoredUser(res.data.user);
      setUser(res.data.user);
      toast({ title: 'Welcome Back!', description: `Signed in as ${res.data.user.email}` });
      return null;
    } catch (err) {
      toast({ title: 'Login Failed', description: errorMessage(err), variant: 'destructive' });
      return errorMessage(err);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<string | null> => {
    const version = ++sessionVersion.current;
    setAuthLoading(true);
    try {
      const res = await api.auth.register(email, password);
      if (res._offline) {
        toast({ title: 'Backend Offline', description: 'Registration unavailable.', variant: 'destructive' });
        return 'offline';
      }
      if (version !== sessionVersion.current) return 'A different sign-in was started';
      setToken(res.data.token);
      setStoredUser(res.data.user);
      setUser(res.data.user);
      toast({ title: 'Account Created!', description: `Welcome ${res.data.user.email}` });
      return null;
    } catch (err) {
      toast({ title: 'Registration Failed', description: errorMessage(err), variant: 'destructive' });
      return errorMessage(err);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const signInWithWallet = useCallback(async (address: string, signer: MessageSigner): Promise<string | null> => {
    const version = ++sessionVersion.current;
    setAuthLoading(true);
    try {
      const nonceRes = await api.auth.walletNonce(address);
      if (nonceRes._offline) {
        toast({ title: 'Backend Offline', description: 'Wallet auth temporarily unavailable.', variant: 'destructive' });
        return 'offline';
      }

      toast({ title: 'Sign Message', description: 'Please sign the message in MetaMask to confirm identity.' });
      const signature = await signer.signMessage(nonceRes.data.nonce);

      const verifyRes = await api.auth.walletVerify(address, signature, nonceRes.data.nonce);
      if (verifyRes._offline) {
        toast({ title: 'Verification Failed', description: 'Could not reach server.', variant: 'destructive' });
        return 'offline';
      }

      if (version !== sessionVersion.current) return 'A different sign-in was started';
      setToken(verifyRes.data.token);
      setStoredUser(verifyRes.data.user);
      setUser(verifyRes.data.user);
      toast({
        title: 'MetaMask Connected & Authenticated!',
        description: `Signed in as ${address.slice(0, 6)}...${address.slice(-4)}`
      });
      return null;
    } catch (err) {
      const parsed = parseWeb3Error(err);
      toast({ title: parsed.title, description: parsed.description, variant: 'destructive' });
      return parsed.description;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const signOut = useCallback(() => {
    sessionVersion.current++;
    clearAuth();
    setUser(null);
    setWatchlistState(['btc', 'eth', 'sol', 'bnb', 'xrp']);
    toast({ title: 'Signed Out', description: 'See you later!' });
  }, []);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  const setWatchlist = useCallback((ids: string[]) => setWatchlistState(ids), []);

  const toggleWatchlist = useCallback((id: string) => {
    const remove = watchlist.includes(id);
    if (!remove && activeTier(user) === 'free' && watchlist.length >= 5) {
      toast({ title: 'Free watchlist limit',description: 'Free supports 5 coins. Choose Pro or VIP to add more.' }); openPlans(); return;
    }
    const next = remove ? watchlist.filter(coin => coin !== id) : [...watchlist,id];
    if (!user) { setWatchlistState(next); return; }
    const version = sessionVersion.current;
    void api.watchlist.save(next).then(result => {
      if (version !== sessionVersion.current) return;
      if (result._offline) throw new Error('Watchlist was not saved. Reconnect and retry');
      setWatchlistState(result.data.watchlist);
      toast({ title: remove ? 'Removed from Watchlist' : 'Added to Watchlist' });
    }).catch(error => toast({ title: 'Watchlist not saved',description: error.message,variant: 'destructive' }));
  },[user,watchlist]);

  const setSortField = useCallback((field: string) => {
    setSortFieldState(prev => {
      if (prev === field) {
        setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
        return prev;
      }
      setSortDirection('asc');
      return field;
    });
  }, []);

  return (
    <AppContext.Provider value={{
      sidebarOpen, toggleSidebar, watchlist, toggleWatchlist, setWatchlist,
      searchQuery, setSearchQuery, activeCoin, setActiveCoin,
      activeTab, setActiveTab, sortField, sortDirection, setSortField,
      chartTimeframe, setChartTimeframe, showSearch, setShowSearch,
      user, authLoading, signIn, signUp, signInWithWallet, refreshUser, signOut,
      syncWatchlist, saveWatchlist, linkWallet,
    }}>
      {children}
    </AppContext.Provider>
  );
};
