import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Download, Share2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { consumeInstallPrompt, getInstallSnapshot, installPlatform, installSteps, subscribeInstall } from '@/lib/pwa';

const InstallContext = createContext<{ installed: boolean; open: () => void } | null>(null);
const DISMISS_KEY = 'auracryptox-install-dismissed';
const WEEK = 7 * 24 * 60 * 60 * 1000;
function recentlyDismissed() {
  try { return Date.now() - Number(localStorage.getItem(DISMISS_KEY) || 0) < WEEK; }
  catch { return false; }
}

export function InstallAppProvider({ children }: { children: ReactNode }) {
  const { prompt, installed } = useSyncExternalStore(subscribeInstall, getInstallSnapshot);
  const [dialog, setDialog] = useState(false);
  const [promotion, setPromotion] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const platform = installPlatform(navigator.userAgent, navigator.platform, navigator.maxTouchPoints);
  const steps = installSteps(platform);

  useEffect(() => {
    if (installed || recentlyDismissed()) return;
    const timer = window.setTimeout(() => setPromotion(true), 4500);
    return () => window.clearTimeout(timer);
  }, [installed]);

  const dismiss = () => {
    setPromotion(false);
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* Storage can be blocked in private browsing. */ }
  };
  const open = () => { setMessage(''); setDialog(true); };
  const install = async () => {
    const deferred = consumeInstallPrompt();
    if (!deferred) { open(); return; }
    setBusy(true);
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === 'accepted') {
        setPromotion(false);
        setDialog(false);
      } else {
        dismiss();
        setMessage('Installation was dismissed. You can try again from your browser menu.');
      }
    } catch {
      setMessage('The browser could not open its install dialog. Follow the steps below instead.');
      setDialog(true);
    } finally { setBusy(false); }
  };

  return (
    <InstallContext.Provider value={{ installed, open }}>
      {children}
      {promotion && !installed && !dialog && (
        <aside aria-label="Install Aura Crypto X" className="fixed bottom-4 left-4 right-4 z-40 flex items-center gap-3 rounded-2xl border border-cyan-400/25 bg-background/95 p-4 shadow-2xl backdrop-blur-xl sm:right-auto sm:w-[390px]" style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <img src="/icons/app-192.png" width="52" height="52" alt="" className="shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">Aura Crypto X, one tap away</p>
            <p className="mt-1 text-xs text-muted-foreground">Keep it on your Home Screen or desktop.</p>
            <button type="button" onClick={prompt ? () => void install() : open} disabled={busy} className="mt-2 rounded-lg bg-cyan-400 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-50">
              {platform === 'ios' ? 'Add to Home Screen' : 'Install App'}
            </button>
          </div>
          <button type="button" onClick={dismiss} aria-label="Dismiss install invitation" className="self-start rounded-lg p-1.5 text-muted-foreground hover:bg-accent"><X size={16} /></button>
        </aside>
      )}
      <Dialog open={dialog && !installed} onOpenChange={setDialog}>
        <DialogContent className="max-w-[min(92vw,440px)] rounded-2xl border-cyan-400/20">
          <DialogHeader>
            <img src="/icons/app-192.png" width="76" height="76" alt="Aura Crypto X app icon" className="mb-3 rounded-2xl" />
            <DialogTitle>Install Aura Crypto X</DialogTitle>
            <DialogDescription>Launch directly from your Home Screen, Dock or desktop. Your browser handles the installation.</DialogDescription>
          </DialogHeader>
          {prompt && <button type="button" onClick={() => void install()} disabled={busy} className="flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"><Download size={18} />{busy ? 'Opening installer…' : 'Install App'}</button>}
          <ol className="space-y-3 text-sm">
            {steps.map((step, index) => <li key={step} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-xs font-bold text-cyan-500">{index + 1}</span><span className="pt-0.5">{step}</span></li>)}
          </ol>
          {platform === 'ios' && <p className="flex items-center gap-2 rounded-lg bg-accent p-3 text-xs text-muted-foreground"><Share2 size={16} className="shrink-0" />Safari uses its Share menu; a native automatic install popup is not available.</p>}
          <p role="status" className="text-xs text-muted-foreground">{message || 'If Install is not offered, use the browser menu. Availability depends on your browser and device.'}</p>
        </DialogContent>
      </Dialog>
    </InstallContext.Provider>
  );
}

export function InstallAppButton() {
  const context = useContext(InstallContext);
  if (!context || context.installed) return null;
  return <button type="button" onClick={context.open} aria-label="Install Aura Crypto X" title="Install Aura Crypto X" className="flex shrink-0 items-center gap-1.5 rounded-lg border border-cyan-400/30 bg-cyan-400/10 p-2 text-cyan-600 transition hover:bg-cyan-400/20 dark:text-cyan-300 lg:px-3"><Download size={17} /><span className="hidden lg:inline text-xs font-semibold">Install App</span></button>;
}
