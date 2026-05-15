import React, { useState } from 'react';
import { newsItems } from '@/data/cryptoData';
import { Clock, ExternalLink, Tag, BookOpen, RefreshCw } from 'lucide-react';

const categories = ['All', 'Market', 'Technology', 'Regulation', 'DeFi', 'NFT', 'CBDC', 'Institutional'];

const NewsFeed: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [expandedNews, setExpandedNews] = useState<string | null>(null);

  const filtered = activeCategory === 'All'
    ? newsItems
    : newsItems.filter(n => n.category === activeCategory);

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Latest News</h2>
          <p className="text-sm text-muted-foreground mt-1">Stay updated with the crypto world</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="w-3 h-3" />
          <span>Auto-refresh</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length > 0 && (
        <div
          className="glass-card-hover overflow-hidden mb-6 cursor-pointer group"
          onClick={() => setExpandedNews(expandedNews === filtered[0].id ? null : filtered[0].id)}
        >
          <div className="md:flex">
            <div className="md:w-2/5 h-48 md:h-auto overflow-hidden">
              <img
                src={filtered[0].image}
                alt={filtered[0].title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-6 md:w-3/5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{filtered[0].category}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {filtered[0].time}
                </span>
              </div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{filtered[0].title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{filtered[0].summary}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{filtered[0].source}</span>
                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.slice(1).map(news => (
          <div
            key={news.id}
            className="glass-card-hover overflow-hidden cursor-pointer group"
            onClick={() => setExpandedNews(expandedNews === news.id ? null : news.id)}
          >
            <div className="h-36 overflow-hidden">
              <img
                src={news.image}
                alt={news.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{news.category}</span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> {news.time}
                </span>
              </div>
              <h4 className="text-sm font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">{news.title}</h4>
              {expandedNews === news.id && (
                <p className="text-xs text-muted-foreground mb-2 animate-fade-in">{news.summary}</p>
              )}
              <span className="text-[10px] text-muted-foreground">{news.source}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default NewsFeed;
