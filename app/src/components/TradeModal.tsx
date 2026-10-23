import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppContext } from '@/contexts/AppContext';
import { getCoinMetadata } from '@/data/coinMetadata';
import { formatPrice } from '@/types/crypto';
import { X, TrendingUp, TrendingDown, Wallet, ExternalLink, Zap, ArrowRight, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface TradeModalProps {
  open: boolean;
  onClose: () => void;
  coinId: string;
  symbol: string;
  currentPrice: number;
  initialMode?: 'buy' | 'sell';
}

const TradeModal: React.FC<TradeModalProps> = ({
  open,
  onClose,
  coinId,
  symbol,
  currentPrice,
  initialMode = 'buy',
}) => {
  const { user } = useAppContext();
  const [mode, setMode] = useState<'buy' | 'sell'>(initialMode);
  const [amount, setAmount] = useState<string>('');
  const [slippage, setSlippage] = useState<string>('0.5');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  useEffect(() => {
    setMode(initialMode);
    setAmount('');
  }, [initialMode, open]);

  if (!open) return null;
  if (typeof document === 'undefined') return null;

  const metadata = getCoinMetadata(coinId, symbol);
  const numAmount = parseFloat(amount) || 0;
  const estimatedTotal = numAmount * currentPrice;

  // Check if wallet is connected (via user or window.ethereum)
  const walletAddress = user?.wallet_address || 
    (typeof window !== 'undefined' && (window as any).ethereum?.selectedAddress);

  const handlePercentagePill = (pct: number) => {
    // Quick default presets based on coin price
    const baseUnit = currentPrice > 1000 ? 0.05 : currentPrice > 10 ? 5 : 50;
    const calculated = (baseUnit * (pct / 100)).toFixed(4);
    setAmount(calculated);
  };

  const handleWeb3Swap = async () => {
    if (!walletAddress) {
      toast({
        title: 'MetaMask Required',
        description: 'Please connect your MetaMask wallet from the top right first.',
        variant: 'destructive',
      });
      return;
    }

    if (numAmount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: `Please enter a valid amount of ${symbol} to ${mode}.`,
        variant: 'destructive',
      });
      return;
    }

    setIsExecuting(true);
    try {
      // Direct Uniswap / DEX deep-link for instant swap execution
      const targetToken = metadata.uniswapAddress || metadata.contractAddress;
      const uniswapUrl = mode === 'buy'
        ? `https://app.uniswap.org/swap?chain=mainnet&outputCurrency=${targetToken}`
        : `https://app.uniswap.org/swap?chain=mainnet&inputCurrency=${targetToken}`;

      toast({
        title: `Redirecting to DEX Swap...`,
        description: `Opening decentralized pool for ${symbol} with your connected wallet.`,
      });

      window.open(uniswapUrl, '_blank', 'noopener,noreferrer');
      onClose();
    } catch (err: any) {
      toast({
        title: 'Execution Error',
        description: err?.message || 'Failed to trigger swap.',
        variant: 'destructive',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleOpenAuraTrade = () => {
    toast({
      title: 'Opening Aura Quant Terminal',
      description: `Launching trade.auraajenticai.cloud with ${symbol}/USDT pair.`,
    });
    window.open('https://trade.auraajenticai.cloud', '_blank', 'noopener,noreferrer');
    onClose();
  };

  const handleOpenBinanceSpot = () => {
    const pair = metadata.binancePair || `${symbol}USDT`;
    window.open(`https://www.binance.com/en/trade/${pair}?type=spot`, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div
        className="glass-card w-full max-w-lg my-auto p-6 md:p-8 relative animate-fade-in border border-primary/30 shadow-2xl bg-[#0d111c] rounded-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              Instant Order Desk
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 uppercase tracking-wider">
                {symbol}
              </span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Institutional Trade Execution & Decentralized Web3 Routing
            </p>
          </div>
        </div>

        {/* Mode Switcher (Buy / Sell) */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-secondary/40 rounded-xl mb-5 border border-border/40">
          <button
            type="button"
            onClick={() => setMode('buy')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              mode === 'buy'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Buy {symbol}
          </button>
          <button
            type="button"
            onClick={() => setMode('sell')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              mode === 'sell'
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            Sell {symbol}
          </button>
        </div>

        {/* Live Market Price Card */}
        <div className="p-4 rounded-xl bg-secondary/30 border border-border/40 mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Market Price (Live Binance)</p>
            <p className="text-2xl font-bold font-mono mt-0.5">{formatPrice(currentPrice)}</p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Live Feed
            </span>
            <p className="text-[11px] text-muted-foreground mt-1">{metadata.network}</p>
          </div>
        </div>

        {/* Amount Input */}
        <div className="space-y-3 mb-5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">
              {mode === 'buy' ? 'Order Amount' : 'Sell Amount'} ({symbol})
            </label>
            {walletAddress && (
              <span className="text-xs font-mono text-primary flex items-center gap-1">
                <Wallet className="w-3 h-3" />
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
            )}
          </div>

          <div className="relative">
            <input
              type="number"
              step="any"
              placeholder={`0.00 ${symbol}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-secondary/50 border border-border/60 rounded-xl px-4 py-3 text-lg font-mono font-semibold focus:outline-none focus:border-primary transition-colors pr-20"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
              {symbol}
            </span>
          </div>

          {/* Quick Percentage Buttons */}
          <div className="flex gap-2">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => handlePercentagePill(pct)}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors border border-border/30"
              >
                {pct === 100 ? 'MAX' : `${pct}%`}
              </button>
            ))}
          </div>
        </div>

        {/* Execution Summary */}
        <div className="p-3.5 rounded-xl bg-secondary/20 border border-border/30 space-y-2 mb-6 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Estimated {mode === 'buy' ? 'Cost' : 'Return'}</span>
            <span className="font-mono font-semibold text-foreground">
              {estimatedTotal > 0 ? `$${estimatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT` : '$0.00 USDT'}
            </span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Slippage Tolerance</span>
            <div className="flex gap-1">
              {['0.1', '0.5', '1.0'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSlippage(s)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    slippage === s ? 'bg-primary text-black font-bold' : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {s}%
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Routing Engine</span>
            <span className="text-emerald-400 font-medium">Uniswap v3 + Binance Smart API</span>
          </div>
        </div>

        {/* Multi-Rail Action Buttons */}
        <div className="space-y-2.5">
          {/* Primary Action Button (Web3 DEX Swap with connected wallet) */}
          <button
            type="button"
            onClick={handleWeb3Swap}
            disabled={isExecuting}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              mode === 'buy'
                ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/20'
            }`}
          >
            <Wallet className="w-4 h-4" />
            {mode === 'buy' ? `1-Click MetaMask Swap (${symbol})` : `1-Click MetaMask Sell (${symbol})`}
          </button>

          {/* Institutional Quant Terminal Button */}
          <button
            type="button"
            onClick={handleOpenAuraTrade}
            className="w-full py-3 px-4 rounded-xl text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 flex items-center justify-center gap-2 transition-colors"
          >
            <Zap className="w-4 h-4" />
            Trade on Aura Quant Terminal (trade.auraajenticai.cloud)
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          {/* Binance Spot Direct Button */}
          <button
            type="button"
            onClick={handleOpenBinanceSpot}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground bg-secondary/40 hover:bg-secondary/60 flex items-center justify-center gap-2 transition-colors"
          >
            Execute on Binance Spot ({metadata.binancePair})
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TradeModal;
