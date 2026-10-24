import { openPlans,openSignIn } from '@/lib/subscription';
import { useAppContext } from '@/contexts/AppContext';
import { LockKeyhole } from 'lucide-react';
export default function PlanAccess({ title }: { title: string }) {
  const { user } = useAppContext();
  return <section className="glass-card space-y-3 p-5"><h3 className="flex items-center gap-2 font-semibold"><LockKeyhole className="h-4 w-4 text-primary" />{title}</h3><p className="text-sm text-muted-foreground">Available with an active Pro or VIP plan. Access is verified by the server for your account.</p><div className="flex flex-wrap gap-2"><button type="button" onClick={openPlans} className="rounded-lg border px-3 py-2 text-xs">View plans</button>{!user && <button type="button" onClick={openSignIn} className="rounded-lg bg-primary px-3 py-2 text-xs text-primary-foreground">Sign in</button>}</div></section>;
}
