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

export interface MarketStats {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  ethDominance: number;
  fearGreedIndex: number;
  fearGreedLabel: string;
  activeCryptos: number;
  totalExchanges: number;
}

export interface BinanceTicker {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

export interface BinanceKline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteVolume: string;
  count: number;
  takerBuyVolume: string;
  takerBuyQuoteVolume: string;
  ignore: string;
}

export interface WSTickerData {
  stream: string;
  data: {
    e: string;
    E: number;
    s: string;
    p: string;
    P: string;
    w: string;
    x: string;
    c: string;
    Q: string;
    b: string;
    B: string;
    a: string;
    A: string;
    o: string;
    h: string;
    l: string;
    v: string;
    q: string;
    O: number;
    C: number;
    F: number;
    L: number;
    n: number;
  };
}

export const CRYPTO_COLORS: Record<string, string> = {
  BTC: '#F7931A',
  ETH: '#627EEA',
  BNB: '#F0B90B',
  SOL: '#9945FF',
  XRP: '#00AAE4',
  ADA: '#0033AD',
  AVAX: '#E84142',
  DOGE: '#C2A633',
  DOT: '#E6007A',
  LINK: '#2A5ADA',
  MATIC: '#8247E5',
  UNI: '#FF007A',
  LTC: '#BFBBBB',
  NEAR: '#00C08B',
  ATOM: '#2E3148',
  ARB: '#28A0F0',
};

export const STABLECOINS = new Set([
  'USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'FDUSD', 'PAX', 'GUSD', 'HUSD', 'USDN', 'USDP', 'USTC',
]);

export const TOP_COINS = [
  'BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'AVAX', 'DOGE', 'DOT', 'LINK',
  'MATIC', 'UNI', 'LTC', 'NEAR', 'ATOM', 'ARB',
];

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

export const formatPrice = (price: string | number): string => {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (num >= 1) return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (num >= 0.01) return num.toFixed(4);
  return num.toFixed(8);
};

export const symbolToId = (symbol: string): string =>
  symbol.replace('USDT', '').toLowerCase();

export const idToSymbol = (id: string): string =>
  id.toUpperCase();
