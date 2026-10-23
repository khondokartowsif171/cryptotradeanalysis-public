import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppContext } from '@/contexts/AppContext';
import { api, type Plan, type TreasuryConfig } from '@/services/api';
import { X, Check, Zap, Crown, Shield, Copy, ExternalLink, Loader2, Wallet, ArrowRight } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { BrowserProvider, parseUnits } from 'ethers';
import { parseWeb3Error } from '@/lib/utils';

interface PricingModalProps {
  open: boolean;
  onClose: () => void;
}

const PricingModal: React.FC<PricingModalProps> = ({ open, onClose }) => {
  const { user, refreshUser } = useAppContext();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [treasury, setTreasury] = useState<TreasuryConfig | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('pro');
  const [selectedNetwork, setSelectedNetwork] = useState<string>('Polygon');
  const [selectedToken, setSelectedToken] = useState<string>('USDT');
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (!open) return;
    api.billing.getPlans().then(res => {
      if (!res._offline && res.data) {
        setPlans(res.data.plans);
        setTreasury(res.data.treasury);
      }
    });
  }, [open]);

  if (!open) return null;
  if (typeof document === 'undefined') return null;

  const currentTreasuryAddress = treasury?.EVM || '0x2C2891f4Fb5000e0E288D16DA3f1d780eE77714e';
  const planObj = plans.find(p => p.id === selectedPlan) || plans[1];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to Clipboard!', description: text });
  };

  const handleOneClickMetaMaskPay = async () => {
    if (!user) {
      toast({ title: 'Please Sign In First', description: 'Log in or connect wallet before subscribing.', variant: 'destructive' });
      return;
    }

    if (typeof window === 'undefined' || !(window as any).ethereum) {
      toast({ title: 'MetaMask Required', description: 'Please install MetaMask to pay with 1-click.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const provider = new BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();

      toast({ title: 'Confirm in MetaMask', description: `Sending $${planObj?.priceUsd || 19} payment to treasury...` });
      
      const tx = await signer.sendTransaction({
        to: currentTreasuryAddress,
        value: parseUnits('0.001', 18),
      });

      toast({ title: 'Transaction Submitted!', description: `Tx Hash: ${tx.hash.slice(0, 10)}... Submitting for instant activation.` });
      
      const submitRes = await api.billing.submitTx({
        plan: selectedPlan,
        txHash: tx.hash,
        token: selectedToken,
        network: selectedNetwork,
      });

      if (!submitRes._offline && submitRes.data.success) {
        toast({ title: 'Plan Activated!', description: `You are now on ${planObj?.name || 'Pro'} tier!` });
        await refreshUser();
        onClose();
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      const parsed = parseWeb3Error(err);
      toast({ title: parsed.title, description: parsed.description, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleManualTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: 'Please Sign In First', description: 'Sign in to link subscription to your account.', variant: 'destructive' });
      return;
    }
    if (!txHash.trim() || txHash.trim().length < 10) {
      toast({ title: 'Invalid TxHash', description: 'Please enter a valid blockchain transaction hash.', variant: 'destructive' });
      return;
    }

    setIsVerifying(true);
    try {
      const res = await api.billing.submitTx({
        plan: selectedPlan,
        txHash: txHash.trim(),
        token: selectedToken,
        network: selectedNetwork,
      });

      if (!res._offline && res.data.success) {
        toast({ title: 'Verification Successful!', description: `Upgraded to ${planObj?.name}!` });
        await refreshUser();
        onClose();
      } else {
        toast({ title: 'Verification Queued', description: 'Transaction recorded. Activating subscription...' });
        onClose();
      }
    } catch (err: any) {
      toast({ title: 'Submission Error', description: err?.message || 'Failed to verify transaction.', variant: 'destructive' });
    } finally {
      setIsVerifying(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div
        className="glass-card w-full max-w-3xl my-auto p-6 md:p-8 relative animate-fade-in border border-primary/30 shadow-2xl bg-[#0d111c] rounded-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-3">
            <Zap className="w-3.5 h-3.5" /> Institutional SaaS & Quant Intelligence
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Choose Your Trading Plan
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-lg mx-auto">
            Decentralized crypto payments with zero middlemen. 100% funds settle into self-custodial treasury.
          </p>
        </div>

        {/* 3 Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {plans.map((p) => {
            const isSelected = selectedPlan === p.id;
            const isCurrent = user?.tier === p.id || (!user?.tier && p.id === 'free');
            return (
              <div
                key={p.id}
                onClick={() => setSelectedPlan(p.id)}
                className={`relative rounded-2xl p-5 border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10 ring-1 ring-primary'
                    : 'border-border/60 bg-secondary/20 hover:border-border'
                }`}
              >
                {p.id === 'pro' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-400 text-black text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow">
                    Most Popular
                  </div>
                )}
                {p.id === 'vip' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow">
                    Institutional
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-base text-white">{p.name}</span>
                    {isCurrent && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md font-mono">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="my-3">
                    <span className="text-3xl font-extrabold font-mono text-white">
                      ${p.priceUsd}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      {p.priceUsd === 0 ? '/ forever' : '/ month'}
                    </span>
                  </div>

                  <ul className="space-y-2 mt-4 text-xs text-muted-foreground">
                    {p.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="leading-tight text-gray-300">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-3 border-t border-border/40">
                  <div className={`w-full py-2 rounded-xl text-xs font-bold text-center transition ${
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
                  }`}>
                    {isSelected ? 'Selected' : 'Select'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Payment Checkout Box for Pro / VIP */}
        {selectedPlan !== 'free' && (
          <div className="bg-[#111622] rounded-2xl border border-primary/20 p-5 md:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2 text-white">
                  <Wallet className="w-4 h-4 text-primary" />
                  Decentralized Crypto Checkout
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Subscribing to <span className="font-bold text-foreground">{planObj?.name}</span> for <span className="text-primary font-mono font-bold">${planObj?.priceUsd}/month</span>
                </p>
              </div>

              {/* 1-Click Pay */}
              <button
                type="button"
                onClick={handleOneClickMetaMaskPay}
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#F0B90B] to-[#F8D12F] text-black px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-amber-500/10 hover:opacity-90 active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Wallet className="w-4 h-4 text-black" />}
                1-Click MetaMask Pay
              </button>
            </div>

            {/* Treasury Address & Network */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                  Official Treasury Wallet Address (EVM)
                </label>
                <div className="flex items-center gap-2 bg-secondary/40 border border-border rounded-xl p-2.5 font-mono text-xs text-gray-200">
                  <span className="flex-1 truncate select-all">{currentTreasuryAddress}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(currentTreasuryAddress)}
                    className="p-1 hover:text-primary transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Supported: Polygon, Arbitrum, BSC, Ethereum, Base (USDT / USDC)
                </p>
              </div>

              {/* Manual TxHash Submission */}
              <form onSubmit={handleManualTxSubmit} className="space-y-2">
                <label className="text-[11px] font-semibold text-muted-foreground block">
                  Paid via Binance / Bybit / Trust Wallet? Submit TxHash:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    placeholder="Enter 0x... Tx Hash"
                    className="flex-1 bg-secondary/40 border border-border rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition disabled:opacity-50 flex items-center gap-1"
                  >
                    {isVerifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Activate'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default PricingModal;
