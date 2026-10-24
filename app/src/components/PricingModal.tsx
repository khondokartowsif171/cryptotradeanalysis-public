import { useCallback, useEffect, useRef, useState } from 'react';
import { formatUnits } from 'ethers';
import { useAppContext } from '@/contexts/AppContext';
import { useWallet } from '@/contexts/WalletContext';
import { api, type PaymentIntent, type Plan, type TreasuryConfig } from '@/services/api';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { activeTier,openSignIn } from '@/lib/subscription';
import { paymentTransaction } from '@/lib/payment';
import { parseWeb3Error } from '@/lib/utils';
import ClientApiKeys from '@/components/ClientApiKeys';
import { Check, Loader2, ShieldCheck, Wallet } from 'lucide-react';

type Props = { open: boolean; onClose: () => void };
const pendingKey = (userId: string) => `cryptox:payment:${userId}`;
function savePending(userId: string, intentId: string, txHash: string) {
  try { localStorage.setItem(pendingKey(userId),JSON.stringify({intentId,txHash})); } catch { /* The server also stores pending payment hashes. */ }
}
function readPending(userId: string): { intentId: string; txHash: string } | null {
  try { return JSON.parse(localStorage.getItem(pendingKey(userId)) || 'null'); } catch { return null; }
}
export default function PricingModal({ open,onClose }: Props) {
  const { user,refreshUser,linkWallet } = useAppContext();
  const { connectWallet } = useWallet();
  const userId = user?.id;
  const [plans,setPlans] = useState<Plan[]>([]);
  const [treasury,setTreasury] = useState<TreasuryConfig | null>(null);
  const [selectedPlan,setSelectedPlan] = useState<'pro' | 'vip'>('pro');
  const [cycle,setCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [methodId,setMethodId] = useState('polygon-usdc');
  const [invoice,setInvoice] = useState<PaymentIntent | null>(null);
  const [txHash,setTxHash] = useState('');
  const [busy,setBusy] = useState(false);
  const [fetching,setFetching] = useState(false);
  const [message,setMessage] = useState('');
  const [error,setError] = useState('');
  const [pending,setPending] = useState(false);
  const verifying = useRef(false);
  const currentUser = useRef(user?.id);
  currentUser.current = user?.id;

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    setFetching(true); setError('');
    void api.billing.getPlans().then(result => {
      if (!mounted) return;
      if (result._offline) throw new Error('Plans are temporarily unavailable. Please retry');
      setPlans(result.data.plans);
      if (result.data.version !== 2 || !Array.isArray(result.data.treasury?.paymentMethods)) { setTreasury(null); throw new Error('Secure checkout is being updated. Payments are unavailable until the server update is complete'); }
      setTreasury(result.data.treasury);
    }).catch(error => { if (mounted) setError(error.message); }).finally(() => { if (mounted) setFetching(false); });
    return () => { mounted = false; };
  },[open]);

  useEffect(() => {
    setInvoice(null); setTxHash(''); setPending(false); setMessage('');
    if (!open || !userId) return;
    let mounted = true;
    void api.billing.intents().then(result => {
      if (!mounted || result._offline) return;
      const saved = readPending(userId);
      const recent = result.data.intents.find(item => item.id === saved?.intentId && item.status === 'pending') || result.data.intents.find(item => item.status === 'pending' && item.tx_hash);
      if (recent) {
        const hash = recent.tx_hash || saved?.txHash || '';
        setInvoice({...recent,tx_hash:hash || null}); setTxHash(hash); setSelectedPlan(recent.plan); setCycle(recent.cycle); setMethodId(recent.method); setPending(Boolean(hash));
        setMessage('Saved payment found. Verify it before sending another payment.');
      }
    }).catch(() => { if (mounted) setError('Saved invoices could not be loaded. Do not repeat an earlier payment; retry later'); });
    return () => { mounted = false; };
  },[open,userId]);

  const verifyPayment = useCallback(async (intent: PaymentIntent,hash: string) => {
    if (verifying.current || !userId) return;
    verifying.current = true; setError('');
    try {
      const result = await api.billing.submitTx({ intentId: intent.id,txHash: hash });
      if (currentUser.current !== userId) return;
      if (result._offline) throw new Error('Verification is unavailable. Your payment hash is saved; do not send another payment');
      if (result.data.status === 'confirmed') {
        setInvoice(result.data.intent || {...intent,status:'confirmed',tx_hash:hash}); setPending(false);
        setMessage('Payment recorded and verified. Your current plan is shown above.');
        try { localStorage.removeItem(pendingKey(userId)); } catch { /* Storage can be unavailable. */ }
        await refreshUser();
      } else {
        setInvoice({...intent,tx_hash:hash}); setPending(true);
        setMessage(`Waiting for confirmations: ${result.data.confirmations || 0} / ${result.data.required || intent.required_confirmations}. Do not pay again.`);
      }
    } catch(error) { if (currentUser.current === userId) { setPending(!(error as {status?:number}).status || (error as {status?:number}).status >= 500); setError((error as Error).message); } }
    finally { verifying.current = false; }
  },[userId,refreshUser]);

  useEffect(() => {
    if (!open || !pending || !invoice?.tx_hash || invoice.status === 'confirmed') return;
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void verifyPayment(invoice,invoice.tx_hash!); },15000);
    return () => window.clearInterval(timer);
  },[open,pending,invoice,verifyPayment]);

  const linkPaymentWallet = async () => {
    setBusy(true); setError('');
    try { const connection = await connectWallet(); if (connection) await linkWallet(connection.account,connection.signer); }
    catch(error) { setError(parseWeb3Error(error).description); }
    finally { setBusy(false); }
  };
  const createInvoice = async () => {
    const userId = user?.id;
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await api.billing.createIntent({plan:selectedPlan,cycle,method:methodId});
      if (currentUser.current !== userId) return;
      if (result._offline) throw new Error('Invoice creation could not be confirmed. No payment was requested');
      setInvoice(result.data.intent); setTxHash(result.data.intent.tx_hash || ''); setPending(false);
    } catch(error) { setError((error as Error).message); }
    finally { setBusy(false); }
  };
  const pay = async () => {
    if (!invoice || !user) return;
    setBusy(true); setError('');
    try {
      if (invoice.tx_hash || readPending(user.id)?.intentId === invoice.id) throw new Error('A payment hash already exists for this invoice. Verify it instead of paying again');
      const method = treasury?.paymentMethods.find(item => item.id === invoice.method);
      if (!method) throw new Error('This payment method is unavailable. Do not send funds');
      if (method.tokenAddress.toLowerCase() !== invoice.token_address.toLowerCase() || method.chainId !== invoice.chain_id) throw new Error('Invoice network or token mismatch');
      const connection = await connectWallet();
      if (!connection || currentUser.current !== user.id) return;
      if (connection.account.toLowerCase() !== invoice.payer_address.toLowerCase()) throw new Error('Select the wallet linked to this invoice in MetaMask');
      const chainHex = '0x' + invoice.chain_id.toString(16);
      if (Number(BigInt(await connection.provider.send('eth_chainId',[]))) !== invoice.chain_id) {
        try { await connection.provider.send('wallet_switchEthereumChain',[{chainId:chainHex}]); }
        catch(error) {
          const code = (error as {info?:{error?:{code?:number}}})?.info?.error?.code ?? (error as {code?:number})?.code;
          if (code !== 4902) throw error;
          await connection.provider.send('wallet_addEthereumChain',[{chainId:chainHex,chainName:method.network,rpcUrls:method.rpcUrls,nativeCurrency:method.nativeCurrency,blockExplorerUrls:[method.explorer]}]);
          await connection.provider.send('wallet_switchEthereumChain',[{chainId:chainHex}]);
        }
      }
      const chain = Number(BigInt(await connection.provider.send('eth_chainId',[])));
      const signer = await connection.provider.getSigner(invoice.payer_address);
      if (currentUser.current !== user.id) return;
      const transaction = paymentTransaction(invoice,await signer.getAddress(),chain);
      const sent = await signer.sendTransaction(transaction);
      savePending(user.id,invoice.id,sent.hash);
      if (currentUser.current !== user.id) return;
      const saved = {...invoice,tx_hash:sent.hash};
      setInvoice(saved); setTxHash(sent.hash); setMessage('Transaction submitted. Waiting for server verification; do not pay again.');
      await verifyPayment(saved,sent.hash);
    } catch(error) { setError(parseWeb3Error(error).description); }
    finally { setBusy(false); }
  };
  const method = treasury?.paymentMethods.find(item => item.id === (invoice?.method || methodId));
  const selected = plans.find(plan => plan.id === selectedPlan);
  const tier = activeTier(user);
  return <Dialog open={open} onOpenChange={value => { if (!value && !busy) onClose(); }}>
    <DialogContent className="max-w-4xl max-h-[90dvh] overflow-y-auto rounded-2xl">
      <DialogTitle className="text-2xl">Choose Your Trading Plan</DialogTitle>
      <DialogDescription>Your own account and verified wallet. Paid access activates after server-side blockchain verification.</DialogDescription>
      {user && <p className="text-xs text-muted-foreground">Current plan: <strong className="uppercase">{tier}</strong>{tier !== 'free' && user.tier_expires_at ? ` · Expires ${new Date(user.tier_expires_at).toLocaleDateString()}` : ''}</p>}
      <fieldset disabled={busy || Boolean(invoice)} className="flex gap-3 text-sm disabled:opacity-60"><legend className="sr-only">Billing period</legend>{(['monthly','yearly'] as const).map(value => <label key={value} className="flex items-center gap-2"><input type="radio" name="billing-cycle" value={value} checked={cycle === value} onChange={() => setCycle(value)} />{value === 'monthly' ? 'Monthly · 30 days' : 'Yearly · 365 days'}</label>)}</fieldset>
      {fetching && <p role="status" className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" />Loading plans…</p>}
      <div className="grid gap-3 md:grid-cols-3">{plans.map(plan => <div key={plan.id} className={`flex flex-col rounded-xl border p-4 ${selectedPlan === plan.id ? 'border-primary bg-primary/5' : 'border-border'}`}>
        <h3 className="font-semibold">{plan.name}{tier === plan.id && <span className="ml-2 text-xs text-emerald-400">Active</span>}</h3>
        <p className="my-3"><strong className="text-3xl">${plan.id === 'free' || cycle === 'monthly' ? plan.priceUsd : plan.yearlyPriceUsd}</strong><span className="text-xs text-muted-foreground"> / {plan.id === 'free' ? 'forever' : cycle === 'monthly' ? '30 days' : '365 days'}</span></p>
        <ul className="flex-1 space-y-2 text-xs text-muted-foreground">{plan.features.map(feature => <li key={feature} className="flex gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />{feature}</li>)}</ul>
        {Boolean(plan.plannedFeatures?.length) && <p className="mt-4 text-[11px] text-muted-foreground">Planned, not currently included: {plan.plannedFeatures!.join('; ')}</p>}
        <button type="button" disabled={plan.id === 'free' || busy || Boolean(invoice)} onClick={() => setSelectedPlan(plan.id as 'pro' | 'vip')} aria-pressed={selectedPlan === plan.id} className="mt-4 rounded-lg bg-secondary px-3 py-2 text-sm disabled:opacity-60">{plan.id === 'free' ? 'Free access' : selectedPlan === plan.id ? 'Selected' : `Select ${plan.name}`}</button>
      </div>)}</div>
      {!fetching && plans.length > 0 && <section className="space-y-3 rounded-xl border p-4">
        <h3 className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4 text-emerald-400" />Verified crypto checkout</h3>
        {!user ? <button type="button" onClick={() => { onClose(); openSignIn(); }} className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">Sign in to subscribe</button> : !user.wallet_address ? <><p className="text-sm text-muted-foreground">Link a payment wallet to this account. You will sign an ownership message; this does not send funds.</p><button type="button" disabled={busy} onClick={() => void linkPaymentWallet()} className="rounded-lg border px-4 py-2 text-sm"><Wallet className="mr-2 inline h-4 w-4" />Link payment wallet</button></> : !invoice ? <>
          <label className="block text-sm" htmlFor="payment-method">Token and network</label><select id="payment-method" value={methodId} onChange={event => setMethodId(event.target.value)} disabled={busy} className="w-full rounded-lg border bg-secondary p-2 text-sm">{treasury?.paymentMethods.map(method => <option key={method.id} value={method.id}>{method.token} · {method.network}</option>)}</select>
          <p className="text-xs text-muted-foreground">Pay with your linked wallet: <span className="break-all font-mono">{user.wallet_address}</span>. Network gas is additional. Exchange withdrawals and other tokens are not automatically verified.</p>
          <button type="button" disabled={busy || !selected || !method} onClick={() => void createInvoice()} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy ? 'Creating invoice…' : 'Create invoice to review'}</button>
        </> : <div className="space-y-3">
          <p className="font-semibold">{formatUnits(invoice.amount_units,invoice.token_decimals)} {invoice.token} · {method?.network} · {invoice.duration_days} days of {invoice.plan.toUpperCase()}</p>
          <p className="break-all text-xs text-muted-foreground">Recipient: <code>{invoice.treasury_address}</code><br />Token contract: <code>{invoice.token_address}</code><br />Payment window ends: {new Date(invoice.expires_at).toLocaleString()}</p>
          {invoice.status === 'confirmed' ? <p className="text-sm font-semibold text-emerald-400">Payment verified</p> : <>
            <button type="button" disabled={busy || Boolean(invoice.tx_hash) || new Date(invoice.expires_at).getTime() <= Date.now()} onClick={() => void pay()} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy ? 'Waiting for wallet…' : `Review ${invoice.token} payment in MetaMask`}</button>
            <p className="text-xs text-muted-foreground">MetaMask asks you to confirm the transfer. There is no automatic recurring debit or token allowance. Plan activation needs {invoice.required_confirmations} block confirmations.</p>
            <form onSubmit={event => { event.preventDefault(); void verifyPayment(invoice,txHash); }} className="space-y-2"><label htmlFor="payment-hash" className="block text-xs">Already paid from the linked wallet? Verify the transaction here.</label><div className="flex gap-2"><input id="payment-hash" placeholder="0x… transaction hash" value={txHash} onChange={event => setTxHash(event.target.value)} className="min-w-0 flex-1 rounded-lg border bg-secondary p-2 font-mono text-xs" /><button type="submit" disabled={busy || !/^0x[0-9a-f]{64}$/i.test(txHash)} className="rounded-lg border px-3 text-sm disabled:opacity-50">Verify payment</button></div></form>
          </>}
          <button type="button" disabled={busy || pending} onClick={() => { setInvoice(null); setTxHash(''); setMessage(''); setError(''); }} className="text-xs text-muted-foreground underline">Choose another plan or invoice</button>
        </div>}
        <p className="text-xs text-muted-foreground">Same-plan renewals extend the paid term. Different plans start after verification without automatic proration; any remaining paid Pro access is preserved separately.</p>
      </section>}
      {(message || error) && <div role="status" className={`rounded-xl border p-3 text-sm ${error ? 'border-amber-500/30 text-amber-500' : 'border-emerald-500/30 text-emerald-400'}`}>{error || message}</div>}
      {treasury && <ClientApiKeys />}
    </DialogContent>
  </Dialog>;
}
