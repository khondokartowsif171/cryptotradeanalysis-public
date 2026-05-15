export interface CryptoAsset {
  id: string;
  rank: number;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  change7d: number;
  volume24h: number;
  marketCap: number;
  sparkline: number[];
  color: string;
  icon: string;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  category: string;
  image: string;
  summary: string;
}

export interface TradingSignal {
  id: string;
  pair: string;
  type: 'BUY' | 'SELL' | 'HOLD';
  entry: number;
  target: number;
  stopLoss: number;
  confidence: number;
  timeframe: string;
  indicator: string;
}

export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const generateSparkline = (base: number, volatility: number, trend: number): number[] => {
  const points: number[] = [];
  let current = base;
  for (let i = 0; i < 24; i++) {
    current += (Math.random() - 0.5 + trend * 0.02) * volatility;
    points.push(Math.max(current, base * 0.85));
  }
  return points;
};

export const cryptoAssets: CryptoAsset[] = [
  {
    id: 'bitcoin', rank: 1, name: 'Bitcoin', symbol: 'BTC',
    price: 97842.50, change24h: 2.34, change7d: 5.12,
    volume24h: 48200000000, marketCap: 1920000000000,
    sparkline: generateSparkline(97842, 800, 1), color: '#F7931A', icon: 'BTC'
  },
  {
    id: 'ethereum', rank: 2, name: 'Ethereum', symbol: 'ETH',
    price: 3456.78, change24h: -1.23, change7d: 3.45,
    volume24h: 21500000000, marketCap: 415000000000,
    sparkline: generateSparkline(3456, 50, -0.5), color: '#627EEA', icon: 'ETH'
  },
  {
    id: 'bnb', rank: 3, name: 'BNB', symbol: 'BNB',
    price: 698.45, change24h: 0.87, change7d: -2.15,
    volume24h: 2100000000, marketCap: 104000000000,
    sparkline: generateSparkline(698, 10, 0.3), color: '#F0B90B', icon: 'BNB'
  },
  {
    id: 'solana', rank: 4, name: 'Solana', symbol: 'SOL',
    price: 198.32, change24h: 5.67, change7d: 12.34,
    volume24h: 8900000000, marketCap: 89000000000,
    sparkline: generateSparkline(198, 5, 2), color: '#9945FF', icon: 'SOL'
  },
  {
    id: 'xrp', rank: 5, name: 'XRP', symbol: 'XRP',
    price: 2.45, change24h: -0.56, change7d: 1.23,
    volume24h: 5600000000, marketCap: 78000000000,
    sparkline: generateSparkline(2.45, 0.05, -0.2), color: '#00AAE4', icon: 'XRP'
  },
  {
    id: 'cardano', rank: 6, name: 'Cardano', symbol: 'ADA',
    price: 1.12, change24h: 3.45, change7d: 8.90,
    volume24h: 3200000000, marketCap: 39000000000,
    sparkline: generateSparkline(1.12, 0.03, 1.5), color: '#0033AD', icon: 'ADA'
  },
  {
    id: 'avalanche', rank: 7, name: 'Avalanche', symbol: 'AVAX',
    price: 42.67, change24h: -2.89, change7d: -5.34,
    volume24h: 1800000000, marketCap: 16000000000,
    sparkline: generateSparkline(42.67, 1.2, -1), color: '#E84142', icon: 'AVAX'
  },
  {
    id: 'dogecoin', rank: 8, name: 'Dogecoin', symbol: 'DOGE',
    price: 0.3845, change24h: 8.12, change7d: 15.67,
    volume24h: 4500000000, marketCap: 56000000000,
    sparkline: generateSparkline(0.38, 0.01, 3), color: '#C2A633', icon: 'DOGE'
  },
  {
    id: 'polkadot', rank: 9, name: 'Polkadot', symbol: 'DOT',
    price: 8.92, change24h: 1.23, change7d: -1.45,
    volume24h: 890000000, marketCap: 12500000000,
    sparkline: generateSparkline(8.92, 0.2, 0.5), color: '#E6007A', icon: 'DOT'
  },
  {
    id: 'chainlink', rank: 10, name: 'Chainlink', symbol: 'LINK',
    price: 18.45, change24h: -3.21, change7d: 2.78,
    volume24h: 1200000000, marketCap: 11000000000,
    sparkline: generateSparkline(18.45, 0.5, -1.2), color: '#2A5ADA', icon: 'LINK'
  },
  {
    id: 'polygon', rank: 11, name: 'Polygon', symbol: 'MATIC',
    price: 1.34, change24h: 4.56, change7d: 9.12,
    volume24h: 1500000000, marketCap: 13000000000,
    sparkline: generateSparkline(1.34, 0.04, 1.8), color: '#8247E5', icon: 'MATIC'
  },
  {
    id: 'uniswap', rank: 12, name: 'Uniswap', symbol: 'UNI',
    price: 12.78, change24h: -1.89, change7d: 4.56,
    volume24h: 780000000, marketCap: 9600000000,
    sparkline: generateSparkline(12.78, 0.3, -0.8), color: '#FF007A', icon: 'UNI'
  },
  {
    id: 'litecoin', rank: 13, name: 'Litecoin', symbol: 'LTC',
    price: 108.34, change24h: 0.45, change7d: -3.21,
    volume24h: 920000000, marketCap: 8100000000,
    sparkline: generateSparkline(108.34, 2, 0.2), color: '#BFBBBB', icon: 'LTC'
  },
  {
    id: 'near', rank: 14, name: 'NEAR Protocol', symbol: 'NEAR',
    price: 7.23, change24h: 6.78, change7d: 14.56,
    volume24h: 650000000, marketCap: 7800000000,
    sparkline: generateSparkline(7.23, 0.2, 2.5), color: '#00C08B', icon: 'NEAR'
  },
  {
    id: 'cosmos', rank: 15, name: 'Cosmos', symbol: 'ATOM',
    price: 11.56, change24h: -0.34, change7d: 1.89,
    volume24h: 540000000, marketCap: 4300000000,
    sparkline: generateSparkline(11.56, 0.3, -0.1), color: '#2E3148', icon: 'ATOM'
  },
  {
    id: 'arbitrum', rank: 16, name: 'Arbitrum', symbol: 'ARB',
    price: 1.89, change24h: 2.12, change7d: 7.34,
    volume24h: 890000000, marketCap: 3200000000,
    sparkline: generateSparkline(1.89, 0.05, 0.8), color: '#28A0F0', icon: 'ARB'
  },
];

export const newsItems: NewsItem[] = [
  {
    id: '1', title: 'Bitcoin Surges Past $97K as Institutional Demand Hits Record',
    source: 'CoinDesk', time: '2h ago', category: 'Market',
    image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&h=250&fit=crop',
    summary: 'Bitcoin reached new heights as major institutions increased their BTC holdings significantly.'
  },
  {
    id: '2', title: 'Ethereum 2.0 Staking Rewards Increase After Latest Upgrade',
    source: 'The Block', time: '4h ago', category: 'Technology',
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=250&fit=crop',
    summary: 'The latest Ethereum upgrade has boosted staking rewards, attracting more validators to the network.'
  },
  {
    id: '3', title: 'SEC Approves New Crypto ETF Applications from Major Firms',
    source: 'Bloomberg', time: '6h ago', category: 'Regulation',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=250&fit=crop',
    summary: 'The SEC has given the green light to several new cryptocurrency ETF applications.'
  },
  {
    id: '4', title: 'Solana DeFi TVL Reaches All-Time High of $15 Billion',
    source: 'DeFi Pulse', time: '8h ago', category: 'DeFi',
    image: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=400&h=250&fit=crop',
    summary: 'Solana ecosystem continues to grow as total value locked in DeFi protocols hits record levels.'
  },
  {
    id: '5', title: 'Central Banks Explore CBDC Integration with Blockchain Networks',
    source: 'Reuters', time: '10h ago', category: 'CBDC',
    image: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&h=250&fit=crop',
    summary: 'Multiple central banks are testing interoperability between CBDCs and existing blockchain networks.'
  },
  {
    id: '6', title: 'NFT Market Rebounds with $2.8B in Monthly Trading Volume',
    source: 'CryptoSlate', time: '12h ago', category: 'NFT',
    image: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=400&h=250&fit=crop',
    summary: 'The NFT market shows strong signs of recovery with increasing trading volumes across major platforms.'
  },
  {
    id: '7', title: 'Layer 2 Solutions Process Record 15M Daily Transactions',
    source: 'L2Beat', time: '14h ago', category: 'Technology',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop',
    summary: 'Ethereum Layer 2 networks achieve milestone in daily transaction processing capacity.'
  },
  {
    id: '8', title: 'Major Bank Launches Crypto Custody Service for Institutional Clients',
    source: 'Financial Times', time: '16h ago', category: 'Institutional',
    image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&h=250&fit=crop',
    summary: 'A leading global bank has announced crypto custody services targeting institutional investors.'
  },
];

export const tradingSignals: TradingSignal[] = [
  {
    id: '1', pair: 'BTC/USDT', type: 'BUY', entry: 97500, target: 105000,
    stopLoss: 94000, confidence: 87, timeframe: '4H', indicator: 'RSI + MACD Convergence'
  },
  {
    id: '2', pair: 'ETH/USDT', type: 'HOLD', entry: 3400, target: 3800,
    stopLoss: 3200, confidence: 72, timeframe: '1D', indicator: 'Bollinger Band Squeeze'
  },
  {
    id: '3', pair: 'SOL/USDT', type: 'BUY', entry: 195, target: 230,
    stopLoss: 180, confidence: 91, timeframe: '4H', indicator: 'Golden Cross + Volume'
  },
  {
    id: '4', pair: 'AVAX/USDT', type: 'SELL', entry: 43, target: 36,
    stopLoss: 46, confidence: 68, timeframe: '1D', indicator: 'Death Cross Pattern'
  },
  {
    id: '5', pair: 'DOGE/USDT', type: 'BUY', entry: 0.38, target: 0.52,
    stopLoss: 0.32, confidence: 78, timeframe: '1W', indicator: 'Breakout + Social Sentiment'
  },
  {
    id: '6', pair: 'LINK/USDT', type: 'SELL', entry: 18.5, target: 15.2,
    stopLoss: 20.0, confidence: 65, timeframe: '4H', indicator: 'Bearish Divergence RSI'
  },
];

export const generateCandleData = (basePrice: number, days: number): CandleData[] => {
  const data: CandleData[] = [];
  let price = basePrice * 0.85;
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const volatility = basePrice * 0.025;
    const open = price;
    const close = open + (Math.random() - 0.45) * volatility;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    const volume = Math.random() * 5000000000 + 1000000000;

    data.push({
      time: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: Math.round(volume),
    });
    price = close;
  }
  return data;
};

export const marketStats = {
  totalMarketCap: 3420000000000,
  totalVolume24h: 142000000000,
  btcDominance: 56.2,
  ethDominance: 12.1,
  fearGreedIndex: 74,
  fearGreedLabel: 'Greed',
  activeCryptos: 13245,
  totalExchanges: 742,
};

export const formatCurrency = (value: number): string => {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1) return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${value.toFixed(4)}`;
};

export const formatNumber = (value: number): string => {
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  return value.toLocaleString();
};
