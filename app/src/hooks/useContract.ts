/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { formatEther, parseEther } from 'ethers';
import { toast } from '@/components/ui/use-toast';

export interface UserInfo {
  balance: string;
  staked: string;
  pendingReward: string;
  totalRewards: string;
}

export interface PlatformStats {
  totalStaked: string;
  totalSignals: number;
  totalUsers: number;
  rewardRate: string;
  totalSupply: string;
}

export function useContract() {
  const { account, provider, contract, isConnecting, chainId, connectWallet, disconnectWallet } = useWallet();

  const stake = useCallback(
    async (amount: string) => {
      if (!contract || !account) {
        toast({ title: 'Wallet Required', description: 'Connect your wallet first.', variant: 'destructive' });
        return;
      }
      try {
        const tx = await contract.stake(parseEther(amount));
        toast({ title: 'Staking...', description: 'Transaction submitted.' });
        await tx.wait();
        toast({ title: 'Staked!', description: `Successfully staked ${amount} CRX.` });
      } catch (err: any) {
        toast({ title: 'Staking Failed', description: err?.reason || err?.message, variant: 'destructive' });
      }
    },
    [contract, account]
  );

  const unstake = useCallback(
    async (amount: string) => {
      if (!contract || !account) {
        toast({ title: 'Wallet Required', description: 'Connect your wallet first.', variant: 'destructive' });
        return;
      }
      try {
        const tx = await contract.unstake(parseEther(amount));
        toast({ title: 'Unstaking...', description: 'Transaction submitted.' });
        await tx.wait();
        toast({ title: 'Unstaked!', description: `Successfully unstaked ${amount} CRX.` });
      } catch (err: any) {
        toast({ title: 'Unstaking Failed', description: err?.reason || err?.message, variant: 'destructive' });
      }
    },
    [contract, account]
  );

  const claimRewards = useCallback(async () => {
    if (!contract) return;
    try {
      const tx = await contract.claimRewards();
      toast({ title: 'Claiming...', description: 'Transaction submitted.' });
      await tx.wait();
      toast({ title: 'Rewards Claimed!', description: 'Rewards have been minted to your wallet.' });
    } catch (err: any) {
      toast({ title: 'Claim Failed', description: err?.reason || err?.message, variant: 'destructive' });
    }
  }, [contract]);

  const getUserInfo = useCallback(
    async (address: string): Promise<UserInfo | null> => {
      if (!contract) return null;
      try {
        const info = await contract.getUserInfo(address);
        return {
          balance: formatEther(info[0]),
          staked: formatEther(info[1]),
          pendingReward: formatEther(info[2]),
          totalRewards: formatEther(info[3]),
        };
      } catch {
        return null;
      }
    },
    [contract]
  );

  const getPlatformStats = useCallback(async (): Promise<PlatformStats | null> => {
    if (!contract) return null;
    try {
      const stats = await contract.getPlatformStats();
      return {
        totalStaked: formatEther(stats[0]),
        totalSignals: Number(stats[1]),
        totalUsers: Number(stats[2]),
        rewardRate: formatEther(stats[3]),
        totalSupply: formatEther(stats[4]),
      };
    } catch {
      return null;
    }
  }, [contract]);

  return {
    account,
    provider,
    contract,
    isConnecting,
    chainId,
    connectWallet,
    disconnectWallet,
    stake,
    unstake,
    claimRewards,
    getUserInfo,
    getPlatformStats,
  };
}
