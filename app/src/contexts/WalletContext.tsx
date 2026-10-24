import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { BrowserProvider, Contract, JsonRpcSigner, type Eip1193Provider } from 'ethers';
import { CONTRACTS, CRX_TOKEN_ABI } from '@/data/contracts';
import { toast } from '@/components/ui/use-toast';
import { parseWeb3Error } from '@/lib/utils';

type InjectedProvider = Eip1193Provider & {
  isMetaMask?: boolean;
  providers?: InjectedProvider[];
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
};
declare global { interface Window { ethereum?: InjectedProvider; } }
type Connection = { account: string; provider: BrowserProvider; contract: Contract; chainId: number; signer: JsonRpcSigner };
type WalletState = Connection | null;
type WalletValue = { account: string | null; provider: BrowserProvider | null; contract: Contract | null; chainId: number | null; isConnecting: boolean; connectWallet: () => Promise<Connection | null>; disconnectWallet: () => void };
const WalletContext = createContext<WalletValue | null>(null);
export function getInjectedProvider(): InjectedProvider | undefined {
  const injected = window.ethereum;
  return injected?.providers?.find(candidate => candidate.isMetaMask) || injected;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [connection, setConnection] = useState<WalletState>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const pending = useRef<Promise<Connection | null> | null>(null);
  const generation = useRef(0);
  const suspended = useRef(false);
  const refresh = useCallback(async (injected: InjectedProvider, requestAccess = false) => {
    const revision = ++generation.current;
    const accounts = await injected.request({ method: requestAccess ? 'eth_requestAccounts' : 'eth_accounts' }) as string[];
    if (revision !== generation.current) return null;
    setConnection(null);
    if (!accounts?.length) return null;
    const chain = await injected.request({ method: 'eth_chainId' }) as string;
    const provider = new BrowserProvider(injected, 'any');
    // Constructing a signer does not request permissions or sign anything.
    const signer = new JsonRpcSigner(provider, accounts[0]);
    const next = { account: accounts[0], provider, signer, chainId: Number(BigInt(chain)), contract: new Contract(CONTRACTS.CryptoXToken.address, CRX_TOKEN_ABI, signer) };
    if (revision !== generation.current) return null;
    setConnection(next);
    return next;
  }, []);

  const connectWallet = useCallback((): Promise<Connection | null> => {
    if (pending.current) return pending.current;
    const injected = getInjectedProvider();
    if (!injected) {
      toast({ title: 'Open MetaMask', description: 'On mobile, open this site inside the MetaMask browser. On desktop, install or enable the MetaMask extension.' });
      return Promise.resolve(null);
    }
    suspended.current = false;
    setIsConnecting(true);
    const task = (async () => {
      try {
        // Explicit user action is the only place that may request access.
        const result = await refresh(injected, true);
        if (result) toast({ title: 'Wallet Connected', description: `${result.account.slice(0, 6)}…${result.account.slice(-4)}` });
        return result;
      } catch (error) {
        const parsed = parseWeb3Error(error);
        toast({ ...parsed, variant: parsed.title === 'Connection Cancelled' ? 'default' : 'destructive' });
        return null;
      } finally { setIsConnecting(false); pending.current = null; }
    })();
    pending.current = task;
    return task;
  }, [refresh]);

  const disconnectWallet = useCallback(() => {
    suspended.current = true;
    generation.current++;
    setConnection(null);
  }, []);

  useEffect(() => {
    let injected: InjectedProvider | undefined;
    const restore = () => {
      if (suspended.current || pending.current || !injected) return;
      void refresh(injected).catch(() => { setConnection(null); });
    };
    const attach = () => {
      const available = getInjectedProvider();
      if (!available || available === injected) return;
      injected?.removeListener?.('accountsChanged', restore);
      injected?.removeListener?.('chainChanged', restore);
      injected = available;
      injected.on?.('accountsChanged', restore);
      injected.on?.('chainChanged', restore);
      restore();
    };
    attach();
    window.addEventListener('ethereum#initialized', attach);
    return () => {
      generation.current++;
      window.removeEventListener('ethereum#initialized', attach);
      injected?.removeListener?.('accountsChanged', restore);
      injected?.removeListener?.('chainChanged', restore);
    };
  }, [refresh]);

  return <WalletContext.Provider value={{ account: connection?.account || null, provider: connection?.provider || null, contract: connection?.contract || null, chainId: connection?.chainId || null, isConnecting, connectWallet, disconnectWallet }}>{children}</WalletContext.Provider>;
}
export function useWallet() {
  const wallet = useContext(WalletContext);
  if (!wallet) throw new Error('useWallet requires WalletProvider');
  return wallet;
}
