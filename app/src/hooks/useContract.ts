/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider, Contract, formatEther, parseEther } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
  }
}
import { CONTRACTS, CRX_TOKEN_ABI } from '@/data/contracts';
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
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      toast({
        title: 'MetaMask Required',
        description: 'Please install MetaMask to connect your wallet.',
        variant: 'destructive',
      });
      return;
    }

    setIsConnecting(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const network = await provider.getNetwork();
      const signer = await provider.getSigner();

      const tokenContract = new Contract(
        CONTRACTS.CryptoXToken.address,
        CRX_TOKEN_ABI,
        signer
      );

      setProvider(provider);
      setAccount(accounts[0]);
      setContract(tokenContract);
      setChainId(Number(network.chainId));

      toast({
        title: 'Wallet Connected',
        description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
      });
    } catch (err: any) {
      toast({
        title: 'Connection Failed',
        description: err?.message || 'Failed to connect wallet.',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setContract(null);
    setChainId(null);
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setAccount(accounts[0]);
        connectWallet();
      }
    };

    const handleChainChanged = () => {
      connectWallet();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [connectWallet, disconnectWallet]);

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
