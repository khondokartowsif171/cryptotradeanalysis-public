import { useEffect, useMemo, useRef, useState } from 'react';
import { useBinanceTicker } from '@/hooks/useBinanceWS';
import { useAppContext } from '@/contexts/AppContext';
import { api } from '@/services/api';
import { activeTier } from '@/lib/subscription';
import PlanAccess from '@/components/PlanAccess';
import { PieChart,Pie,Cell,ResponsiveContainer,Tooltip } from 'recharts';
import { toast } from '@/components/ui/use-toast';
import { Wallet,Pencil } from 'lucide-react';
type Holding = { symbol: string; amount: number; name?: string };
const palette = ['#f7931a','#627eea','#9945ff','#00bba7','#00c8df','#e9bd32'];
export default function PortfolioSummary() {
  const { user,refreshUser } = useAppContext();
  const currentUser=useRef(user?.id); currentUser.current=user?.id;
  const userId = user?.id;
  const allowed = activeTier(user) !== 'free';
  const [holdings,setHoldings] = useState<Holding[]>([]);
  const [draft,setDraft] = useState<Holding[]>([]);
  const [editing,setEditing] = useState(false);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState('');
  const { tickers } = useBinanceTicker(allowed ? holdings.map(holding => holding.symbol) : []);
  useEffect(() => {
    setHoldings([]); setDraft([]); setEditing(false); setError('');
    if (!userId || !allowed) return;
    let mounted = true;
    setLoading(true);
    void api.portfolio.get().then(result => {
      if (!mounted) return;
      if (result._offline) throw new Error('Portfolio is unavailable. Your saved holdings have not changed');
      setHoldings(result.data.portfolio);
    }).catch(error => { if (mounted) { setError(error.message); if (error.status === 403) void refreshUser(); } }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  },[userId,allowed,refreshUser]);
  const priced = useMemo(() => holdings.map(holding => ({...holding,name:holding.symbol,value:(tickers.get(holding.symbol)?.price || 0)*holding.amount})),[holdings,tickers]);
  const total = priced.reduce((sum,holding) => sum+holding.value,0);
  const missingPrices = holdings.some(holding => holding.amount > 0 && !tickers.has(holding.symbol));
  if (!allowed) return <PlanAccess title="Portfolio tracker" />;
  const edit = () => { setDraft(holdings.length ? holdings.map(holding => ({...holding})) : [{symbol:'BTC',amount:0}]); setEditing(true); };
  const save = async () => {
    const values = draft.map(holding => ({symbol:holding.symbol.trim().toUpperCase(),amount:Number(holding.amount)}));
    if (values.some(holding => !/^[A-Z0-9]{1,20}$/.test(holding.symbol) || !Number.isFinite(holding.amount) || holding.amount < 0) || new Set(values.map(holding => holding.symbol)).size !== values.length) {
      setError('Use unique ticker symbols and non-negative quantities'); return;
    }
    const userId=user?.id;
    setLoading(true); setError('');
    try { const result = await api.portfolio.save(values); if(currentUser.current !== userId) return; if (result._offline) throw new Error('Portfolio was not saved. Reconnect and retry'); setHoldings(result.data.portfolio); setEditing(false); toast({title:'Portfolio saved'}); }
    catch(error) { setError((error as Error).message); }
    finally { setLoading(false); }
  };
  return <section className="glass-card space-y-4 p-5">
    <div className="flex items-center justify-between"><h3 className="flex items-center gap-2 font-semibold"><Wallet className="h-4 w-4 text-primary" />Portfolio</h3><button type="button" aria-label="Edit portfolio" onClick={edit} disabled={loading}><Pencil className="h-4 w-4" /></button></div>
    <div><p className="text-xs text-muted-foreground">Tracked holdings · estimated value</p><p className="font-mono text-2xl font-bold">${total.toLocaleString(undefined,{maximumFractionDigits:2})}</p><p className="text-xs text-muted-foreground">{missingPrices ? 'Some prices are unavailable; this total is incomplete.' : 'Based on your entered holdings and available market prices.'}</p></div>
    {loading && <p role="status" className="text-xs">Loading…</p>}
    {error && <p role="status" className="text-xs text-amber-500">{error}</p>}
    {!editing && !holdings.length && <p className="text-sm text-muted-foreground">Add your holdings to start tracking. This tracker does not read your wallet balances.</p>}
    {!editing && total > 0 && <div className="h-36"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={priced} dataKey="value" nameKey="symbol" innerRadius={40} outerRadius={60}>{priced.map((holding,index) => <Cell key={holding.symbol} fill={palette[index%palette.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>}
    {editing ? <div className="space-y-2">{draft.map((holding,index) => <div key={index} className="flex gap-2"><input aria-label={`Holding ${index+1} ticker`} value={holding.symbol} onChange={event => setDraft(previous => previous.map((item,i) => i===index ? {...item,symbol:event.target.value} : item))} className="min-w-0 w-20 rounded border bg-secondary p-1 text-xs" /><input aria-label={`Holding ${index+1} quantity`} type="number" min="0" step="any" value={holding.amount} onChange={event => setDraft(previous => previous.map((item,i) => i===index ? {...item,amount:Number(event.target.value)} : item))} className="min-w-0 flex-1 rounded border bg-secondary p-1 text-xs" /><button type="button" aria-label={`Remove holding ${index+1}`} onClick={() => setDraft(previous => previous.filter((_,i) => i!==index))} className="text-xs text-red-400">Remove</button></div>)}<div className="flex flex-wrap gap-2 text-xs"><button type="button" disabled={draft.length>=1000} onClick={() => setDraft(previous => [...previous,{symbol:'',amount:0}])} className="rounded border p-2">Add holding</button><button type="button" disabled={loading} onClick={() => void save()} className="rounded bg-primary p-2 text-primary-foreground">Save holdings</button><button type="button" onClick={() => setEditing(false)} className="rounded border p-2">Cancel</button></div></div> : <ul className="space-y-2 text-xs">{priced.map(holding => <li key={holding.symbol} className="flex justify-between"><span>{holding.symbol} · {holding.amount}</span><span>{tickers.has(holding.symbol) ? '$'+holding.value.toLocaleString(undefined,{maximumFractionDigits:2}) : 'Price unavailable'}</span></li>)}</ul>}
  </section>;
}
