import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { api, setToken, setStoredUser, getStoredUser, clearAuth } from '@/services/api';

interface User {
  id: string;
  email: string;
}

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
  signOut: () => void;
  syncWatchlist: () => Promise<void>;
  saveWatchlist: () => Promise<void>;
}

const AppContext = createContext<AppContextType>({} as AppContextType);

export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) setUser(stored);
  }, []);

  const syncWatchlist = useCallback(async () => {
    if (!user) return;
    const res = await api.watchlist.get();
    if (!res._offline && res.data.watchlist.length > 0) {
      setWatchlistState(res.data.watchlist);
    }
  }, [user]);

  const saveWatchlist = useCallback(async () => {
    if (!user) return;
    await api.watchlist.save(watchlist);
  }, [user, watchlist]);

  useEffect(() => {
    if (user) syncWatchlist();
  }, [user, syncWatchlist]);

  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    setAuthLoading(true);
    try {
      const res = await api.auth.login(email, password);
      if (res._offline) {
        toast({ title: 'Backend Offline', description: 'Login unavailable. Running in offline mode.', variant: 'destructive' });
        return 'offline';
      }
      setToken(res.data.token);
      setStoredUser(res.data.user);
      setUser(res.data.user);
      toast({ title: 'Welcome Back!', description: `Signed in as ${res.data.user.email}` });
      return null;
    } catch (err: any) {
      toast({ title: 'Login Failed', description: err.message, variant: 'destructive' });
      return err.message;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<string | null> => {
    setAuthLoading(true);
    try {
      const res = await api.auth.register(email, password);
      if (res._offline) {
        toast({ title: 'Backend Offline', description: 'Registration unavailable.', variant: 'destructive' });
        return 'offline';
      }
      setToken(res.data.token);
      setStoredUser(res.data.user);
      setUser(res.data.user);
      toast({ title: 'Account Created!', description: `Welcome ${res.data.user.email}` });
      return null;
    } catch (err: any) {
      toast({ title: 'Registration Failed', description: err.message, variant: 'destructive' });
      return err.message;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const signOut = useCallback(() => {
    clearAuth();
    setUser(null);
    setWatchlistState(['btc', 'eth', 'sol', 'bnb', 'xrp']);
    toast({ title: 'Signed Out', description: 'See you later!' });
  }, []);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  const setWatchlist = useCallback((ids: string[]) => setWatchlistState(ids), []);

  const toggleWatchlist = useCallback((id: string) => {
    setWatchlistState(prev => {
      const isInList = prev.includes(id);
      if (isInList) {
        toast({ title: 'Removed from Watchlist', description: `Coin removed from your watchlist.` });
        const next = prev.filter(item => item !== id);
        if (user) api.watchlist.save(next);
        return next;
      } else {
        toast({ title: 'Added to Watchlist', description: `Coin added to your watchlist.` });
        const next = [...prev, id];
        if (user) api.watchlist.save(next);
        return next;
      }
    });
  }, [user]);

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
      user, authLoading, signIn, signUp, signOut,
      syncWatchlist, saveWatchlist,
    }}>
      {children}
    </AppContext.Provider>
  );
};
