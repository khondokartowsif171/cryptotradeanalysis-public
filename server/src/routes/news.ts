import { Router } from 'express';

const router = Router();

interface CachedNews {
  timestamp: number;
  data: any[];
}

let memoryCache: CachedNews | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

function determineCategory(title: string, desc: string): string {
  const text = (title + ' ' + desc).toLowerCase();
  if (text.includes('sec') || text.includes('regulation') || text.includes('law') || text.includes('court') || text.includes('legal') || text.includes('ban') || text.includes('tax')) {
    return 'Regulation';
  }
  if (text.includes('defi') || text.includes('uniswap') || text.includes('aave') || text.includes('lending') || text.includes('yield') || text.includes('dex')) {
    return 'DeFi';
  }
  if (text.includes('nft') || text.includes('opensea') || text.includes('collectible') || text.includes('metaverse')) {
    return 'NFT';
  }
  if (text.includes('institution') || text.includes('blackrock') || text.includes('fidelity') || text.includes('etf') || text.includes('fed') || text.includes('treasury')) {
    return 'Institutional';
  }
  if (text.includes('ai') || text.includes('tech') || text.includes('code') || text.includes('layer 2') || text.includes('protocol') || text.includes('hashrate') || text.includes('upgrade')) {
    return 'Technology';
  }
  return 'Market';
}

function timeAgo(dateStr: string): string {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return 'recently';
  }
}

async function fetchCointelegraphRSS(): Promise<any[]> {
  const res = await fetch('https://cointelegraph.com/rss', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/rss+xml, text/xml;q=0.9, */*;q=0.8'
    }
  });
  if (!res.ok) throw new Error(`Cointelegraph returned ${res.status}`);
  const xml = await res.text();
  
  const items: any[] = [];
  const itemBlocks = xml.split('<item>').slice(1);

  for (let i = 0; i < itemBlocks.length; i++) {
    const block = itemBlocks[i].split('</item>')[0];
    
    // Extract title
    const titleMatch = block.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/s);
    const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : '';
    if (!title) continue;

    // Extract link
    const linkMatch = block.match(/<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/s);
    const url = linkMatch ? linkMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : '';

    // Extract pubDate
    const pubDateMatch = block.match(/<pubDate>(.*?)<\/pubDate>/);
    const pubDate = pubDateMatch ? pubDateMatch[1].trim() : new Date().toUTCString();

    // Extract image
    const mediaMatch = block.match(/<media:content[^>]+url=["'](.*?)["']/);
    const imgMatch = block.match(/<img[^>]+src=["'](.*?)["']/);
    const imageUrl = mediaMatch ? mediaMatch[1] : (imgMatch ? imgMatch[1] : 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80');

    // Extract description
    const descMatch = block.match(/<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/s);
    let summary = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').replace(/<!\[CDATA\[|\]\]>/g, '').trim() : '';
    if (summary.length > 220) summary = summary.slice(0, 220) + '...';

    items.push({
      id: `ct-${i}-${Date.parse(pubDate) || i}`,
      title,
      summary: summary || title,
      source: 'Cointelegraph',
      url: url || 'https://cointelegraph.com',
      image: imageUrl,
      time: timeAgo(pubDate),
      published_at: pubDate,
      category: determineCategory(title, summary)
    });
  }

  return items;
}

router.get('/', async (req, res) => {
  try {
    if (memoryCache && (Date.now() - memoryCache.timestamp < CACHE_TTL_MS) && memoryCache.data.length > 0) {
      return res.json({ news: memoryCache.data, _cached: true });
    }

    const items = await fetchCointelegraphRSS();
    if (items.length > 0) {
      memoryCache = {
        timestamp: Date.now(),
        data: items
      };
      return res.json({ news: items, _cached: false, count: items.length });
    }

    if (memoryCache && memoryCache.data.length > 0) {
      return res.json({ news: memoryCache.data, _cached: true, _stale: true });
    }

    return res.json({ news: [] });
  } catch (err: any) {
    if (memoryCache && memoryCache.data.length > 0) {
      return res.json({ news: memoryCache.data, _cached: true, _fallback: true });
    }
    res.status(500).json({ error: err.message, news: [] });
  }
});

export default router;
