import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { X, Mail, Lock, Loader2, LogIn, UserPlus, Wallet, ExternalLink, ShieldCheck } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { BrowserProvider } from 'ethers';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ open, onClose }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [walletLoading, setWalletLoading] = useState(false);
  const { signIn, signUp, signInWithWallet, authLoading } = useAppContext();

  if (!open) return null;

  const hasMetaMask = typeof window !== 'undefined' && Boolean((window as any).ethereum);

  const handleMetaMaskAuth = async () => {
    if (!hasMetaMask) {
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setWalletLoading(true);
    try {
      const provider = new BrowserProvider((window as any).ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      if (!accounts || accounts.length === 0) {
        toast({ title: 'No Account', description: 'Please select an account in MetaMask.', variant: 'destructive' });
        return;
      }
      const signer = await provider.getSigner();
      const err = await signInWithWallet(accounts[0], signer);
      if (!err || err === 'offline') {
        onClose();
      }
    } catch (err: any) {
      console.error('MetaMask sign-in error:', err);
      toast({
        title: 'MetaMask Connection Cancelled',
        description: err?.message || 'User cancelled or failed wallet authentication.',
        variant: 'destructive',
      });
    } finally {
      setWalletLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: 'Required', description: 'Email and password are required.', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Weak Password', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }
    const error = mode === 'login' ? await signIn(email, password) : await signUp(email, password);
    if (!error || error === 'offline') {
      setEmail('');
      setPassword('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md">
      <div
        className="glass-card w-full max-w-md mx-4 p-6 relative animate-fade-in border border-primary/20 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F0B90B] to-[#F8D12F] flex items-center justify-center shadow-lg shadow-amber-500/10">
            <ShieldCheck className="w-5 h-5 text-black" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {mode === 'login' ? 'Sign In to CryptoX' : 'Join Aura CryptoX'}
            </h2>
            <p className="text-xs text-muted-foreground">Decentralized Web3 & Quantitative Trading Desk</p>
          </div>
        </div>

        {/* Web3 MetaMask Primary Auth */}
        <div className="mb-5 space-y-2">
          {hasMetaMask ? (
            <button
              type="button"
              onClick={handleMetaMaskAuth}
              disabled={walletLoading || authLoading}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-[#F0B90B] hover:from-[#e0ac0a] to-[#F8D12F] text-black py-3 rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20 hover:opacity-95 transition active:scale-[0.99] disabled:opacity-50"
            >
              {walletLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin text-black" /> Connecting MetaMask...</>
              ) : (
                <>
                  <Wallet className="w-4 h-4 text-black" />
                  Continue with MetaMask
                </>
              )}
            </button>
          ) : (
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 border border-border text-foreground py-3 rounded-xl text-xs font-semibold transition"
            >
              <ExternalLink className="w-4 h-4 text-primary" />
              MetaMask Not Detected — Install MetaMask Extension
            </a>
          )}
          <p className="text-[11px] text-center text-muted-foreground">
            Zero password needed • Sign cryptographic message with your wallet
          </p>
        </div>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-border/60"></div>
          <span className="flex-shrink mx-4 text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
            or continue with email
          </span>
          <div className="flex-grow border-t border-border/60"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Email</label>
            <div className="flex items-center gap-2 bg-secondary/50 rounded-lg border border-border px-3">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 bg-transparent py-2.5 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Password</label>
            <div className="flex items-center gap-2 bg-secondary/50 rounded-lg border border-border px-3">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="flex-1 bg-transparent py-2.5 text-sm focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={authLoading || walletLoading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {authLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
            ) : mode === 'login' ? (
              <><LogIn className="w-4 h-4" /> Sign In with Email</>
            ) : (
              <><UserPlus className="w-4 h-4" /> Create Account with Email</>
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            {mode === 'login'
              ? "Don't have an email account? Create one"
              : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
