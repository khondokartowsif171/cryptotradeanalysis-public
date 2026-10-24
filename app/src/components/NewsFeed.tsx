import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/services/api';
import { Clock, ExternalLink, RefreshCw, Loader2, Newspaper, Sparkles } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const categories = ['All', 'Market', 'Technology', 'Regulation', 'DeFi', 'NFT', 'Institutional'];

const NewsFeed: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [liveNews, setLiveNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stale, setStale] = useState(false);
  const [checkedAt, setCheckedAt] = useState<number | null>(null);
  const inFlight = useRef(false);

  const fetchNews = useCallback(async (showToast: boolean = false) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    try {
      const res = await api.news.get();
      if (!res._offline && Array.isArray(res.data?.news)) {
        setCheckedAt(Date.now());
        setStale(Boolean(res.data._stale || res.data._fallback));
        setLiveNews(res.data.news);
        if (showToast) {
          toast({ title: 'News Refreshed', description: `Loaded ${res.data.news.length} articles from the latest feed response.` });
        }
      } else { setStale(true); }
    } catch (err: any) {
      setStale(true);
      console.error('Failed to load live news:', err);
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNews(false);
    const refreshVisible = () => { if (document.visibilityState === 'visible') void fetchNews(false); };
    const timer = window.setInterval(refreshVisible, 5 * 60 * 1000);
    document.addEventListener('visibilitychange', refreshVisible);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', refreshVisible); };
  }, [fetchNews]);

  const handleOpenArticle = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const filtered = activeCategory === 'All'
    ? liveNews
    : liveNews.filter((n: any) => n.category === activeCategory);

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-primary" />
            Latest Crypto News
          </h2>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${stale ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            {stale ? 'Feed refresh unavailable • previous articles may be outdated' : 'Cointelegraph RSS • checks every 5 minutes'}
          </p>
          {checkedAt && <p className="mt-1 text-xs text-muted-foreground">Last feed response: {new Date(checkedAt).toLocaleTimeString()}</p>}
        </div>
        <button
          onClick={() => fetchNews(true)}
          disabled={loading}
          className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors border border-border/30 disabled:opacity-50"
          title="Refresh news feed"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> : <RefreshCw className="w-3.5 h-3.5" />}
          <span>{loading ? 'Refreshing...' : 'Refresh Feed'}</span>
        </button>
      </div>

      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20'
                : 'bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading && liveNews.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 glass-card">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Aggregating live global crypto news...</p>
        </div>
      ) : filtered.length > 0 ? (
        <>
          {/* Hero Featured Article */}
          <div
            className="glass-card-hover overflow-hidden mb-6 cursor-pointer group border border-primary/20 hover:border-primary/40 transition-all rounded-2xl"
            onClick={(e) => handleOpenArticle(e, filtered[0].url)}
          >
            <div className="md:flex">
              <div className="md:w-2/5 h-56 md:h-auto overflow-hidden bg-secondary/50 relative">
                <img
                  src={filtered[0].image}
                  alt={filtered[0].title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e: any) => {
                    e.target.src = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80';
                  }}
                />
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground shadow">
                  FEATURED
                </span>
              </div>
              <div className="p-6 md:w-3/5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full border border-primary/20">
                      {filtered[0].category}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" /> {filtered[0].time}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors leading-snug">
                    {filtered[0].title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {filtered[0].summary}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/30">
                  <span className="text-xs font-semibold text-primary/90 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    {filtered[0].source}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground flex items-center gap-1 transition-colors">
                    Read Full Story <ExternalLink className="w-3.5 h-3.5 text-primary" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Grid Articles */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.slice(1).map((news: any) => (
              <div
                key={news.id}
                className="glass-card-hover overflow-hidden cursor-pointer group flex flex-col justify-between border border-border/40 hover:border-primary/30 transition-all rounded-xl"
                onClick={(e) => handleOpenArticle(e, news.url)}
              >
                <div>
                  <div className="h-40 overflow-hidden bg-secondary/50 relative">
                    <img
                      src={news.image}
                      alt={news.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e: any) => {
                        e.target.src = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80';
                      }}
                    />
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-black/75 text-primary backdrop-blur-sm">
                      {news.category}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                        <Clock className="w-2.5 h-2.5" /> {news.time}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                      {news.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {news.summary}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/20 mt-2">
                  <span className="font-medium text-foreground/80">{news.source}</span>
                  <ExternalLink className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="glass-card p-12 text-center text-muted-foreground">
          No news articles found in category "{activeCategory}".
        </div>
      )}
    </section>
  );
};

export default NewsFeed;
