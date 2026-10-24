import { useEffect, useRef, useState } from 'react';
import { api, type ClientApiKey } from '@/services/api';
import { useAppContext } from '@/contexts/AppContext';
import { activeTier } from '@/lib/subscription';
import { toast } from '@/components/ui/use-toast';
export default function ClientApiKeys() {
  const { user } = useAppContext();
  const userId = user?.id;
  const currentUser = useRef(user?.id); currentUser.current = user?.id;
  const [keys,setKeys] = useState<ClientApiKey[]>([]);
  const [name,setName] = useState('Trading bot');
  const [secret,setSecret] = useState('');
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  useEffect(() => {
    setKeys([]); setSecret(''); setError('');
    if (!userId) return;
    let mounted = true;
    void api.billing.keys().then(result => { if (mounted && !result._offline) setKeys(result.data.keys); }).catch(() => { if (mounted) setError('API keys could not be loaded'); });
    return () => { mounted = false; };
  },[userId]);
  if (!user) return null;
  const generate = async () => {
    const userId = user?.id;
    setBusy(true); setError(''); setSecret('');
    try {
      const result = await api.billing.createKey(name);
      if (currentUser.current !== userId) return;
      if (result._offline) throw new Error('API key creation could not be confirmed. Refresh the list before retrying');
      setSecret(result.data.key); setKeys(previous => [result.data.details,...previous]);
    } catch(error) { setError((error as Error).message); }
    finally { setBusy(false); }
  };
  const revoke = async (id: string) => {
    setBusy(true);
    try { const result = await api.billing.revokeKey(id); if (result._offline) throw new Error('Revocation could not be confirmed'); setKeys(previous => previous.filter(key => key.id !== id)); setSecret(''); }
    catch(error) { toast({ title: 'Key not revoked',description: (error as Error).message,variant: 'destructive' }); }
    finally { setBusy(false); }
  };
  return <section className="space-y-3 rounded-xl border border-border p-4" aria-label="Client API keys">
    <h3 className="font-semibold">Read-only client API · VIP</h3>
    <p className="text-xs text-muted-foreground">Access your own portfolio, watchlist and premium signals. Keys expire after 90 days; an active VIP plan is required on every request.</p>
    {activeTier(user) === 'vip' && <div className="flex gap-2"><input aria-label="API key name" value={name} onChange={event => setName(event.target.value)} maxLength={60} className="min-w-0 flex-1 rounded-lg border bg-secondary p-2 text-sm" /><button type="button" disabled={busy || !name.trim()} onClick={() => void generate()} className="rounded-lg bg-primary px-3 text-sm text-primary-foreground disabled:opacity-50">Generate key</button></div>}
    {secret && <div className="space-y-2 rounded-lg border border-amber-500/30 p-3"><p className="text-xs">Copy this key now. It is shown once; keep it private.</p><input aria-label="New API key" readOnly value={secret} className="w-full rounded border bg-secondary p-2 font-mono text-xs" /><button type="button" onClick={() => { void navigator.clipboard.writeText(secret).then(() => toast({ title: 'Key copied' })).catch(() => setError('Clipboard access unavailable. Select and copy the key manually')); }} className="text-sm text-cyan-400">Copy key</button></div>}
    {error && <p role="status" className="text-xs text-amber-500">{error}</p>}
    <ul className="space-y-2">{keys.filter(key => !key.revoked_at).map(key => <li key={key.id} className="flex items-center justify-between gap-2 text-xs"><span>{key.name} · …{key.suffix}</span><button type="button" disabled={busy} onClick={() => void revoke(key.id)} className="rounded border px-2 py-1 text-red-400">Revoke {key.name}</button></li>)}</ul>
    <p className="break-all font-mono text-[10px] text-muted-foreground">GET https://crypto.auraajenticai.cloud/api/client-api/portfolio<br />Authorization: Bearer YOUR_KEY</p>
  </section>;
}
