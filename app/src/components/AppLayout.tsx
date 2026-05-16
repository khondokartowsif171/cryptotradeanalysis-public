import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import Header from '@/components/Header';
import HeroTicker from '@/components/HeroTicker';
import HeroSection from '@/components/HeroSection';
import MarketOverview from '@/components/MarketOverview';
import PriceChart from '@/components/PriceChart';
import CryptoTable from '@/components/CryptoTable';
import TradingSignals from '@/components/TradingSignals';
import WatchlistPanel from '@/components/WatchlistPanel';
import NewsFeed from '@/components/NewsFeed';
import CoinSidebar from '@/components/CoinSidebar';
import TopMovers from '@/components/TopMovers';
import PortfolioSummary from '@/components/PortfolioSummary';
import Converter from '@/components/Converter';
import StakingPanel from '@/components/StakingPanel';
import Footer from '@/components/Footer';

const AppLayout: React.FC = () => {
  const { activeTab } = useAppContext();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <HeroTicker />

      <main className="max-w-[1440px] mx-auto px-4 lg:px-6 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            <HeroSection />
            <MarketOverview />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <PriceChart />
              </div>
              <div className="space-y-6">
                <CoinSidebar />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <TopMovers />
              <PortfolioSummary />
              <Converter />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <CryptoTable />
              </div>
              <div>
                <StakingPanel />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'markets' && (
          <div className="space-y-8 animate-fade-in">
            <MarketOverview />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <PriceChart />
              </div>
              <div className="space-y-6">
                <CoinSidebar />
                <Converter />
              </div>
            </div>
            <CryptoTable />
          </div>
        )}

        {activeTab === 'signals' && (
          <div className="space-y-8 animate-fade-in">
            <TradingSignals />
          </div>
        )}

        {activeTab === 'watchlist' && (
          <div className="space-y-8 animate-fade-in">
            <WatchlistPanel />
          </div>
        )}

        {activeTab === 'news' && (
          <div className="space-y-8 animate-fade-in">
            <NewsFeed />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default AppLayout;
