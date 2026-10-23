import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAppContext } from '@/contexts/AppContext';
import { api, setToken, setStoredUser } from '@/services/api';
import { X, Mail, Lock, Loader2, LogIn, UserPlus, Wallet, ExternalLink, ShieldCheck, KeyRound, ArrowLeft } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { BrowserProvider } from 'ethers';
import { parseWeb3Error } from '@/lib/utils';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ open, onClose }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [walletLoading, setWalletLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp, signInWithWallet, authLoading } = useAppContext();

  if (!open) return null;
  if (typeof document === 'undefined') return null;

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
      const parsed = parseWeb3Error(err);
      toast({
        title: parsed.title,
        description: parsed.description,
        variant: 'destructive',
      });
    } finally {
      setWalletLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login' || mode === 'register') {
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
    } else if (mode === 'forgot') {
      if (!email) {
        toast({ title: 'Email Required', description: 'Please enter your registered email address.', variant: 'destructive' });
        return;
      }
      setSubmitting(true);
      try {
        const res = await api.auth.forgotPassword(email);
        if (!res._offline && res.data.success) {
          toast({ title: 'Reset Code Sent!', description: res.data.message });
          setMode('reset');
        } else {
          toast({ title: 'Request Sent', description: 'Please check your email for the 6-digit code.' });
          setMode('reset');
        }
      } catch (err: any) {
        toast({ title: 'Error', description: err?.message || 'Failed to send reset email.', variant: 'destructive' });
      } finally {
        setSubmitting(false);
      }
    } else if (mode === 'reset') {
      if (!email || !resetCode || !newPassword) {
        toast({ title: 'Required', description: 'Email, 6-digit code, and new password are required.', variant: 'destructive' });
        return;
      }
      if (newPassword.length < 6) {
        toast({ title: 'Weak Password', description: 'New password must be at least 6 characters.', variant: 'destructive' });
        return;
      }
      setSubmitting(true);
      try {
        const res = await api.auth.resetPassword(email, resetCode, newPassword);
        if (!res._offline && res.data.success) {
          toast({ title: 'Password Reset Successful!', description: 'You are now signed in with your new password.' });
          setToken(res.data.token);
          setStoredUser(res.data.user);
          window.location.reload();
          onClose();
        }
      } catch (err: any) {
        toast({ title: 'Reset Failed', description: err?.message || 'Invalid code or request failed.', variant: 'destructive' });
      } finally {
        setSubmitting(false);
      }
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div
        className="glass-card w-full max-w-md mx-auto p-6 md:p-8 relative animate-fade-in border border-primary/30 shadow-2xl bg-[#0d111c] rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F0B90B] to-[#F8D12F] flex items-center justify-center shadow-lg shadow-amber-500/10">
            {mode === 'forgot' || mode === 'reset' ? (
              <KeyRound className="w-5 h-5 text-black" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-black" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {mode === 'login' && 'Sign In to CryptoX'}
              {mode === 'register' && 'Join Aura CryptoX'}
              {mode === 'forgot' && 'Reset Password'}
              {mode === 'reset' && 'Enter 6-Digit Code'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {mode === 'forgot' || mode === 'reset'
                ? 'Instant OTP sent to your registered email'
                : 'Decentralized Web3 & Quantitative Trading Desk'}
            </p>
          </div>
        </div>

        {/* Web3 MetaMask (only in login/register) */}
        {(mode === 'login' || mode === 'register') && (
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
                MetaMask Not Detected — Install Extension
              </a>
            )}
            <p className="text-[11px] text-center text-muted-foreground">
              Zero password needed • Sign cryptographic message with your wallet
            </p>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-border/60"></div>
              <span className="flex-shrink mx-4 text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                or with email password
              </span>
              <div className="flex-grow border-t border-border/60"></div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleFormSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Email Address</label>
            <div className="flex items-center gap-2 bg-secondary/50 rounded-lg border border-border px-3">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="flex-1 bg-transparent py-2.5 text-sm focus:outline-none"
              />
            </div>
          </div>

          {(mode === 'login' || mode === 'register') && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-muted-foreground">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 bg-secondary/50 rounded-lg border border-border px-3">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                  className="flex-1 bg-transparent py-2.5 text-sm focus:outline-none"
                />
              </div>
            </div>
          )}

          {mode === 'reset' && (
            <>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">6-Digit Code (Sent to Email)</label>
                <div className="flex items-center gap-2 bg-secondary/50 rounded-lg border border-border px-3">
                  <KeyRound className="w-4 h-4 text-primary" />
                  <input
                    type="text"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="123456"
                    required
                    maxLength={6}
                    className="flex-1 bg-transparent py-2.5 text-sm font-mono tracking-widest focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">New Password</label>
                <div className="flex items-center gap-2 bg-secondary/50 rounded-lg border border-border px-3">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                    className="flex-1 bg-transparent py-2.5 text-sm focus:outline-none"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={authLoading || walletLoading || submitting}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 mt-4"
          >
            {authLoading || submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
            ) : mode === 'login' ? (
              <><LogIn className="w-4 h-4" /> Sign In</>
            ) : mode === 'register' ? (
              <><UserPlus className="w-4 h-4" /> Create Account</>
            ) : mode === 'forgot' ? (
              <><KeyRound className="w-4 h-4" /> Send 6-Digit Code</>
            ) : (
              <><Check className="w-4 h-4" /> Set New Password & Sign In</>
            )}
          </button>
        </form>

        {/* Footers / Switchers */}
        <div className="mt-5 text-center space-y-2">
          {mode === 'login' && (
            <button
              onClick={() => setMode('register')}
              className="text-xs text-muted-foreground hover:text-primary transition-colors block mx-auto"
            >
              Don't have an email account? <span className="font-semibold text-primary">Create one</span>
            </button>
          )}

          {mode === 'register' && (
            <button
              onClick={() => setMode('login')}
              className="text-xs text-muted-foreground hover:text-primary transition-colors block mx-auto"
            >
              Already have an account? <span className="font-semibold text-primary">Sign in</span>
            </button>
          )}

          {(mode === 'forgot' || mode === 'reset') && (
            <button
              onClick={() => setMode('login')}
              className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AuthModal;
