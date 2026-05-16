import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { X, Mail, Lock, Loader2, LogIn, UserPlus } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ open, onClose }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, signUp, authLoading } = useAppContext();

  if (!open) return null;

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="glass-card w-full max-w-md mx-4 p-6 relative animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F0B90B] to-[#F8D12F] flex items-center justify-center">
            <LogIn className="w-4 h-4 text-black" />
          </div>
          <h2 className="text-xl font-bold">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            disabled={authLoading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {authLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
            ) : mode === 'login' ? (
              <><LogIn className="w-4 h-4" /> Sign In</>
            ) : (
              <><UserPlus className="w-4 h-4" /> Create Account</>
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            {mode === 'login'
              ? "Don't have an account? Create one"
              : 'Already have an account? Sign in'}
          </button>
        </div>

        {mode === 'login' && (
          <p className="mt-3 text-[10px] text-center text-muted-foreground">
            Offline? The app works without login. Watchlist saves locally.
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
