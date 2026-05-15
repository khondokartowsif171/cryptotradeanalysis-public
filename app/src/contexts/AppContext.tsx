import React, { createContext, useContext, useState, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';

interface AppContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  watchlist: string[];
  toggleWatchlist: (id: string) => void;
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
}

const AppContext = createContext<AppContextType>({} as AppContextType);

export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>(['btc', 'eth', 'sol', 'bnb', 'xrp']);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCoin, setActiveCoin] = useState('btc');
  const [activeTab, setActiveTab] = useState('overview');
  const [sortField, setSortFieldState] = useState('rank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [chartTimeframe, setChartTimeframe] = useState('1D');
  const [showSearch, setShowSearch] = useState(false);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  const toggleWatchlist = useCallback((id: string) => {
    setWatchlist(prev => {
      const isInList = prev.includes(id);
      if (isInList) {
        toast({ title: 'Removed from Watchlist', description: `Coin removed from your watchlist.` });
        return prev.filter(item => item !== id);
      } else {
        toast({ title: 'Added to Watchlist', description: `Coin added to your watchlist.` });
        return [...prev, id];
      }
    });
  }, []);

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
      sidebarOpen, toggleSidebar, watchlist, toggleWatchlist,
      searchQuery, setSearchQuery, activeCoin, setActiveCoin,
      activeTab, setActiveTab, sortField, sortDirection, setSortField,
      chartTimeframe, setChartTimeframe, showSearch, setShowSearch,
    }}>
      {children}
    </AppContext.Provider>
  );
};
