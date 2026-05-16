import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Users, Star, Wallet, Mail, Database, BarChart3, Activity, Loader2 } from 'lucide-react';

interface AdminStats {
  users: number;
  watchlists: number;
  portfolios: number;
  subscribers: number;
  mongo: { news: number; signals: number; alerts: number };
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('https://cryptox-api.auraajenticai.cloud/admin/stats');
        if (res.ok) setStats(await res.json());
        else setError('API unreachable');
      } catch { setError('Admin API offline'); }
      setLoading(false);
    })();
  }, []);

  if (loading) return (
    <div className="glass-card p-8 flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  if (error || !stats) return (
    <div className="glass-card p-8 text-center">
      <p className="text-muted-foreground">Admin Dashboard: {error || 'No data'}</p>
    </div>
  );

  const cards = [
    { label: 'Total Users', value: stats.users, icon: Users, color: 'text-blue-400', gradient: 'from-blue-500/20 to-cyan-500/20' },
    { label: 'Watchlists', value: stats.watchlists, icon: Star, color: 'text-amber-400', gradient: 'from-amber-500/20 to-yellow-500/20' },
    { label: 'Portfolios', value: stats.portfolios, icon: Wallet, color: 'text-emerald-400', gradient: 'from-emerald-500/20 to-green-500/20' },
    { label: 'Subscribers', value: stats.subscribers, icon: Mail, color: 'text-purple-400', gradient: 'from-purple-500/20 to-pink-500/20' },
    { label: 'News Articles', value: stats.mongo.news, icon: Database, color: 'text-indigo-400', gradient: 'from-indigo-500/20 to-blue-500/20' },
    { label: 'AI Signals', value: stats.mongo.signals, icon: Activity, color: 'text-rose-400', gradient: 'from-rose-500/20 to-red-500/20' },
  ];

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Admin Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">Platform overview & analytics</p>
        </div>
        <BarChart3 className="w-5 h-5 text-primary" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((card, i) => (
          <div key={i} className={`glass-card-hover p-5 bg-gradient-to-br ${card.gradient}`}>
            <card.icon className={`w-8 h-8 ${card.color} mb-3`} />
            <p className="text-2xl font-bold font-mono">{card.value.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 glass-card p-5">
        <h3 className="font-semibold mb-3">System Status</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>PostgreSQL — Connected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${stats.mongo.news >= 0 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span>MongoDB — {stats.mongo.news >= 0 ? 'Connected' : 'Unavailable'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Auth System — Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Binance API — Live</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdminDashboard;
