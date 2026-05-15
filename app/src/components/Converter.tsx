import React, { useState, useMemo } from 'react';
import { useTickerData } from '@/hooks/useCryptoData';
import { CRYPTO_COLORS, STABLECOINS, formatPrice } from '@/types/crypto';
import { ArrowDownUp, RefreshCw, Loader2 } from 'lucide-react';

const Converter: React.FC = () => {
  const { data: tickers, isLoading } = useTickerData();
  const [fromSymbol, setFromSymbol] = useState('BTC');
  const [toSymbol, setToSymbol] = useState('ETH');
  const [amount, setAmount] = useState('1');

  const coinList = useMemo(() => {
    if (!tickers) return [];
    return tickers
      .filter((t) => t.symbol.endsWith('USDT'))
      .filter((t) => {
        const base = t.symbol.replace('USDT', '');
        return !STABLECOINS.has(base) && base.length <= 6;
      })
      .map((t) => ({
        symbol: t.symbol.replace('USDT', ''),
        price: parseFloat(t.lastPrice),
        color: CRYPTO_COLORS[t.symbol.replace('USDT', '')] || '#6366f1',
      }))
      .slice(0, 50);
  }, [tickers]);

  const fromAsset = coinList.find((c) => c.symbol === fromSymbol);
  const toAsset = coinList.find((c) => c.symbol === toSymbol);

  const convertedAmount = useMemo(() => {
    if (!fromAsset || !toAsset) return 0;
    const num = parseFloat(amount) || 0;
    return (num * fromAsset.price) / toAsset.price;
  }, [amount, fromAsset, toAsset]);

  const usdValue = useMemo(() => {
    if (!fromAsset) return 0;
    const num = parseFloat(amount) || 0;
    return num * fromAsset.price;
  }, [amount, fromAsset]);

  const handleSwap = () => {
    setFromSymbol(toSymbol);
    setToSymbol(fromSymbol);
  };

  if (isLoading) {
    return (
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <RefreshCw className="w-5 h-5 text-primary" />
          <h3 className="font-bold">Converter</h3>
        </div>
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <RefreshCw className="w-5 h-5 text-primary" />
        <h3 className="font-bold">Converter</h3>
      </div>

      <div className="space-y-2 mb-3">
        <label className="text-xs text-muted-foreground">From</label>
        <div className="flex items-center gap-2 bg-secondary/50 rounded-lg p-2">
          <select
            value={fromSymbol}
            onChange={(e) => setFromSymbol(e.target.value)}
            className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer flex-shrink-0"
          >
            {coinList.map((c) => (
              <option key={c.symbol} value={c.symbol} className="bg-card">
                {c.symbol}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-transparent text-right text-sm font-mono font-medium focus:outline-none flex-1 min-w-0"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="flex justify-center my-2">
        <button
          onClick={handleSwap}
          className="p-2 rounded-full bg-secondary hover:bg-accent transition-colors"
        >
          <ArrowDownUp className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="space-y-2 mb-4">
        <label className="text-xs text-muted-foreground">To</label>
        <div className="flex items-center gap-2 bg-secondary/50 rounded-lg p-2">
          <select
            value={toSymbol}
            onChange={(e) => setToSymbol(e.target.value)}
            className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer flex-shrink-0"
          >
            {coinList.map((c) => (
              <option key={c.symbol} value={c.symbol} className="bg-card">
                {c.symbol}
              </option>
            ))}
          </select>
          <span className="text-right text-sm font-mono font-medium flex-1">
            {convertedAmount.toFixed(6)}
          </span>
        </div>
      </div>

      <div className="text-center text-xs text-muted-foreground bg-secondary/30 rounded-lg py-2">
        ≈ ${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
      </div>

      {fromAsset && toAsset && (
        <div className="mt-3 text-center text-[10px] text-muted-foreground">
          1 {fromAsset.symbol} = {(fromAsset.price / toAsset.price).toFixed(6)} {toAsset.symbol}
        </div>
      )}
    </div>
  );
};

export default Converter;
