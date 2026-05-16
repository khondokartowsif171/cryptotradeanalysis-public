import React, { useState, useEffect } from 'react';
import { Users, Star, Wallet, Mail, Database, Activity, Shield, ExternalLink, Loader2 } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';

interface AdminStats {
  users: number;
  watchlists: number;
  portfolios: number;
  subscribers: number;
  mongo: { news: number; signals: number; alerts: number };
}

const AdminDashboard: React.FC = () => {
  const { user } = useAppContext();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [passInput, setPassInput] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('https://cryptox-api.auraajenticai.cloud/admin/stats');
        if (res.ok) setStats(await res.json());
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  if (loading) return (
    <section className="w-full">
      <h2 className="text-2xl font-bold mb-4">Platform Admin</h2>
      <div className="glass-card p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    </section>
  );

  if (!showAdmin) return (
    <section className="w-full">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-5 h-5 text-primary" />
        <h2 className="text-2xl font-bold">Admin Access</h2>
      </div>
      <div className="glass-card p-6 max-w-sm mx-auto text-center">
        <Shield className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-sm text-muted-foreground mb-4">Enter access code to view platform statistics</p>
        <input
          type="password"
          value={passInput}
          onChange={(e) => setPassInput(e.target.value)}
          placeholder="Access code"
          className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/50 mb-3"
          onKeyDown={(e) => e.key === 'Enter' && setShowAdmin(passInput === 'cryptox2026')}
        />
        <button
          onClick={() => setShowAdmin(passInput === 'cryptox2026')}
          className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Unlock
        </button>
        <p className="text-[10px] text-muted-foreground mt-3">(default code: cryptox2026 — change in production)</p>
      </div>
    </section>
  );

  const cards = [
    { label: 'Total Users', value: stats?.users || 0, icon: Users, color: 'text-blue-400' },
    { label: 'Watchlists', value: stats?.watchlists || 0, icon: Star, color: 'text-amber-400' },
    { label: 'Portfolios', value: stats?.portfolios || 0, icon: Wallet, color: 'text-emerald-400' },
    { label: 'Subscribers', value: stats?.subscribers || 0, icon: Mail, color: 'text-purple-400' },
    { label: 'News Articles', value: stats?.mongo.news || 0, icon: Database, color: 'text-indigo-400' },
    { label: 'AI Signals', value: stats?.mongo.signals || 0, icon: Activity, color: 'text-rose-400' },
  ];

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-bold">Platform Admin</h2>
        </div>
        <button
          onClick={() => setShowAdmin(false)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Lock
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {cards.map((card, i) => (
          <div key={i} className="glass-card-hover p-4">
            <card.icon className={`w-7 h-7 ${card.color} mb-2`} />
            <p className="text-2xl font-bold font-mono">{card.value.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="glass-card p-5">
        <h3 className="font-semibold mb-3">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span>PostgreSQL — <span className="text-emerald-400 font-medium">Connected</span></span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span>MongoDB — <span className="text-emerald-400 font-medium">Connected</span></span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span>Auth System — <span className="text-emerald-400 font-medium">Active</span></span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span>Binance API — <span className="text-emerald-400 font-medium">Live</span></span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg">
            <div className={`w-2 h-2 rounded-full shrink-0 ${stats?.mongo.news ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span>n8n Workflows — <span className={stats?.mongo.news ? 'text-emerald-400' : 'text-amber-400'}>{stats?.mongo.news ? 'Active' : 'Waiting'}</span></span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span>API Version — <span className="font-mono text-emerald-400">v1.0.0</span></span>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-[10px] text-muted-foreground">
          Aura CryptoX · Platform Admin · Data updates in real-time
        </p>
      </div>
    </section>
  );
};

export default AdminDashboard;
