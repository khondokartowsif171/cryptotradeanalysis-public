import React, { useState, useEffect } from 'react';
import { CONTRACTS } from '@/data/contracts';
import { useContract, type PlatformStats } from '@/hooks/useContract';
import { Coins, Lock, Unlock, Gift, TrendingUp, Users, Signal, Database, ExternalLink, Copy, Wallet, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const StakingPanel: React.FC = () => {
  const [stakeAmount, setStakeAmount] = useState('');
  const [activeStakeTab, setActiveStakeTab] = useState<'stake' | 'unstake'>('stake');
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);

  const {
    account,
    isConnecting,
    connectWallet,
    stake,
    unstake,
    getPlatformStats,
  } = useContract();

  useEffect(() => {
    getPlatformStats().then(setPlatformStats);
    const interval = setInterval(() => {
      getPlatformStats().then(setPlatformStats);
    }, 15000);
    return () => clearInterval(interval);
  }, [getPlatformStats]);

  const handleAction = () => {
    if (!account) {
      connectWallet();
      return;
    }
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      toast({ title: 'Invalid Amount', description: 'Please enter a valid amount.', variant: 'destructive' });
      return;
    }
    if (activeStakeTab === 'stake') {
      stake(stakeAmount);
    } else {
      unstake(stakeAmount);
    }
    setStakeAmount('');
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(CONTRACTS.CryptoXToken.address);
    toast({ title: 'Copied!', description: 'Token contract address copied to clipboard.' });
  };

  const stats = [
    {
      label: 'Total Staked',
      value: platformStats ? `${parseFloat(platformStats.totalStaked).toFixed(1)}M CRX` : '24.5M CRX',
      icon: Lock,
      color: 'text-purple-400',
    },
    {
      label: 'Total Signals',
      value: platformStats ? platformStats.totalSignals.toLocaleString() : '12,847',
      icon: Signal,
      color: 'text-blue-400',
    },
    {
      label: 'Platform Users',
      value: platformStats ? platformStats.totalUsers.toLocaleString() : '89,234',
      icon: Users,
      color: 'text-emerald-400',
    },
    {
      label: 'APY',
      value: '12.8%',
      icon: TrendingUp,
      color: 'text-amber-400',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F0B90B] to-[#F8D12F] flex items-center justify-center">
            <Coins className="w-5 h-5 text-black" />
          </div>
          <div>
            <h3 className="font-bold">{CONTRACTS.CryptoXToken.name}</h3>
            <p className="text-xs text-muted-foreground">{CONTRACTS.CryptoXToken.symbol} Token</p>
          </div>
        </div>

        <div className="bg-secondary/50 rounded-lg p-3 mb-4">
          <p className="text-[10px] text-muted-foreground mb-1">Contract Address</p>
          <div className="flex items-center gap-2">
            <code className="text-xs font-mono text-foreground/80 truncate flex-1">
              {CONTRACTS.CryptoXToken.address}
            </code>
            <button onClick={handleCopyAddress} className="p-1 rounded hover:bg-accent transition-colors shrink-0">
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <a
              href={`https://etherscan.io/address/${CONTRACTS.CryptoXToken.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded hover:bg-accent transition-colors shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, i) => (
            <div key={i} className="bg-secondary/30 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                <span className="text-[10px] text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-sm font-bold font-mono">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-5">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          Stake CRX
        </h3>

        <div className="flex items-center bg-secondary/50 rounded-lg p-0.5 mb-4">
          <button
            onClick={() => setActiveStakeTab('stake')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
              activeStakeTab === 'stake'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-muted-foreground'
            }`}
          >
            <Lock className="w-3.5 h-3.5" /> Stake
          </button>
          <button
            onClick={() => setActiveStakeTab('unstake')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
              activeStakeTab === 'unstake'
                ? 'bg-amber-500/20 text-amber-400'
                : 'text-muted-foreground'
            }`}
          >
            <Unlock className="w-3.5 h-3.5" /> Unstake
          </button>
        </div>

        <div className="mb-4">
          <label className="text-xs text-muted-foreground mb-1 block">Amount</label>
          <div className="flex items-center bg-secondary/50 rounded-lg border border-border">
            <input
              type="number"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-transparent px-3 py-2.5 text-sm font-mono focus:outline-none"
            />
            <span className="text-xs font-medium text-muted-foreground px-3">CRX</span>
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-muted-foreground">
              {account ? 'Connected' : 'Connect wallet to see balance'}
            </span>
            <div className="flex gap-1">
              {['25%', '50%', '75%', 'MAX'].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setStakeAmount('0')}
                  className="text-[10px] px-2 py-0.5 rounded bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                >
                  {pct}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-4 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Estimated APY</span>
            <span className="font-mono text-emerald-400">12.8%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Lock Period</span>
            <span className="font-mono">Flexible</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Reward Token</span>
            <span className="font-mono">CRX</span>
          </div>
        </div>

        <button
          onClick={handleAction}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
            !account
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90'
              : activeStakeTab === 'stake'
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:opacity-90'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:opacity-90'
          }`}
        >
          {isConnecting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
          ) : !account ? (
            <><Wallet className="w-4 h-4" /> Connect Wallet</>
          ) : activeStakeTab === 'stake' ? (
            <><Lock className="w-4 h-4" /> Stake CRX</>
          ) : (
            <><Unlock className="w-4 h-4" /> Unstake CRX</>
          )}
        </button>

        <div className="mt-4 bg-primary/5 border border-primary/10 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium">Pending Rewards</span>
            </div>
            <span className="text-sm font-bold font-mono text-primary">
              {account ? '--' : '0.00'} CRX
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StakingPanel;
