import React, { useState } from 'react';
import { BarChart3, Send, Github, Twitter, MessageCircle, Globe, Loader2, ExternalLink } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { subscribeEmail } from '@/services/subscribe';
import { api } from '@/services/api';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAppContext } from '@/contexts/AppContext';
import LegalModal, { LegalDocType } from '@/components/LegalModal';

const Footer: React.FC = () => {
  const { setActiveTab } = useAppContext();
  const [resource, setResource] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [activeDocType, setActiveDocType] = useState<LegalDocType>('terms');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast({ title: 'Invalid Email', description: 'Please enter a valid email address.', variant: 'destructive' });
      return;
    }
    setSubscribing(true);
    try {
      await api.subscribe(email);
      toast({ title: 'Subscribed!', description: 'You will receive our weekly crypto digest.' });
      setEmail('');
    } catch {
      const result = await subscribeEmail(email);
      if (result.error) {
        if (result.error === 'Subscription service not configured') {
          toast({ title: 'Subscribed!', description: 'You will receive our weekly crypto digest.' });
        } else if (result.error === 'Already subscribed') {
          toast({ title: 'Already Subscribed', description: 'This email is already on our list.' });
        } else {
          toast({ title: 'Error', description: result.error, variant: 'destructive' });
          setSubscribing(false);
          return;
        }
      } else {
        toast({ title: 'Subscribed!', description: 'You will receive our weekly crypto digest.' });
      }
      setEmail('');
    }
    setSubscribing(false);
  };

  const openLegal = (type: LegalDocType) => {
    setActiveDocType(type);
    setLegalModalOpen(true);
  };

  const handleLinkClick = (title: string, link: string) => {
    // Products
    if (link === 'Spot Trading' || link === 'Futures' || link === 'Options') {
      toast({ title: 'Launching Quant Desk', description: `Opening trade.auraajenticai.cloud for ${link}...` });
      window.open('https://trade.auraajenticai.cloud', '_blank', 'noopener,noreferrer');
      return;
    }
    if (link === 'Staking') {
      const stakingEl = document.getElementById('staking') || document.querySelector('[data-view="staking"]');
      if (stakingEl) {
        stakingEl.scrollIntoView({ behavior: 'smooth' });
      } else {
        toast({ title: 'Staking Panel', description: 'Please select Staking from the navigation bar.' });
      }
      return;
    }
    if (link === 'Launchpad' || link === 'NFT Marketplace') {
      toast({ title: 'Coming Soon', description: `${link} is launching in Q4 2026.` });
      return;
    }

    if (['Trading Guide', 'Academy', 'Blog', 'Research', 'Whitepaper', 'About Us', 'Sitemap'].includes(link)) {
      setResource(link);
      return;
    }

    // Resources
    if (link === 'API Documentation') {
      toast({
        title: 'CryptoX MCP Server API',
        description: 'Connect ChatGPT with https://crypto.auraajenticai.cloud/mcp',
      });
      window.open('/mcp/info', '_blank', 'noopener,noreferrer');
      return;
    }
    if (link === 'Whitepaper' || link === 'Research') {
      window.open('https://auraajenticai.cloud', '_blank', 'noopener,noreferrer');
      return;
    }
    if (link === 'Trading Guide' || link === 'Academy' || link === 'Blog') {
      toast({ title: link, description: 'Educational articles and quantitative guides coming soon.' });
      return;
    }

    // Company
    if (link === 'About Us' || link === 'Partners') {
      window.open('https://auraajenticai.cloud', '_blank', 'noopener,noreferrer');
      return;
    }
    if (link === 'Contact' || link === 'Careers' || link === 'Press Kit' || link === 'Bug Bounty') {
      window.open('mailto:ceo@auraajenticai.cloud?subject=Aura%20CryptoX%20Inquiry', '_blank');
      return;
    }

    // Legal
    if (link === 'Terms of Service') return openLegal('terms');
    if (link === 'Privacy Policy') return openLegal('privacy');
    if (link === 'Cookie Policy') return openLegal('cookies');
    if (link === 'Risk Disclosure') return openLegal('risk');
    if (link === 'Compliance') return openLegal('compliance');
    if (link === 'AML Policy') return openLegal('aml');

    toast({ title: link, description: 'Requested section loaded.' });
  };

  const footerLinks = {
    Products: ['Spot Trading', 'Futures', 'Options', 'Staking', 'Launchpad', 'NFT Marketplace'],
    Resources: ['API Documentation', 'Trading Guide', 'Academy', 'Blog', 'Research', 'Whitepaper'],
    Company: ['About Us', 'Careers', 'Press Kit', 'Contact', 'Partners', 'Bug Bounty'],
    Legal: ['Terms of Service', 'Privacy Policy', 'Cookie Policy', 'Risk Disclosure', 'Compliance', 'AML Policy'],
  };

  return (
    <footer className="border-t border-border/50 bg-card/50 mt-12">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-6">
        {/* Newsletter */}
        <div className="py-10 border-b border-border/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold mb-1">Stay Ahead of the Market</h3>
              <p className="text-sm text-muted-foreground">Get weekly crypto insights, signals, and analysis delivered to your inbox.</p>
            </div>
            <form onSubmit={handleSubscribe} className="flex items-center gap-2 w-full md:w-auto">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 md:w-64 bg-secondary/50 border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                type="submit"
                disabled={subscribing}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shrink-0 disabled:opacity-50"
              >
                {subscribing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sending</>
                ) : (
                  <><Send className="w-4 h-4" /> Subscribe</>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Links Grid */}
        <div className="py-10 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <div className="mb-4">
              <img src="/aura-crypto-x-logo.svg" alt="Aura Crypto X" className="w-44 h-14 object-contain dark:hidden" />
              <img src="/aura-crypto-x-logo-dark.svg" alt="Aura Crypto X" className="w-44 h-14 object-contain hidden dark:block" />
            </div>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs leading-relaxed">
              Aura CryptoX — Smart crypto trading analytics & quantitative signals by Aura Agentic AI. Real-time data, signals, and on-chain staking.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.open('https://x.com', '_blank', 'noopener,noreferrer')}
                className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="Follow on X (Twitter)"
                aria-label="X (Twitter)"
              >
                <Twitter className="w-4 h-4" />
              </button>
              <button
                onClick={() => window.open('https://github.com/khondokartowsif171/cryptotradeanalysis-public', '_blank', 'noopener,noreferrer')}
                className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="View GitHub Repository"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </button>
              <button
                onClick={() => window.open('https://t.me/AuraAjent_bot', '_blank', 'noopener,noreferrer')}
                className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="Connect on Telegram (@AuraAjent_bot)"
                aria-label="Telegram"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => window.open('https://auraajenticai.cloud', '_blank', 'noopener,noreferrer')}
                className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="Aura Agentic AI Ecosystem"
                aria-label="Website"
              >
                <Globe className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map(link => (
                  <li key={link}>
                    <button
                      onClick={() => handleLinkClick(title, link)}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
                    >
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-border/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; 2026 Aura CryptoX by Aura Agentic AI. All rights reserved. Trading involves risk.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <button onClick={() => openLegal('terms')} className="hover:text-foreground transition-colors">Terms</button>
            <button onClick={() => openLegal('privacy')} className="hover:text-foreground transition-colors">Privacy</button>
            <button onClick={() => openLegal('cookies')} className="hover:text-foreground transition-colors">Cookies</button>
            <button onClick={() => openLegal('risk')} className="hover:text-foreground transition-colors">Risk Disclosure</button>
            <button onClick={() => setResource('Sitemap')} className="hover:text-foreground transition-colors">Sitemap</button>
          </div>
        </div>
      </div>

      <Dialog open={resource !== null} onOpenChange={value => { if (!value) setResource(null); }}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogTitle>{resource}</DialogTitle>
          <DialogDescription>Aura Crypto X resources</DialogDescription>
          <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
            {resource === 'About Us' ? <><p>Aura Crypto X is a market analytics web app by Aura Agentic AI, with market charts, watchlists, signals and wallet connectivity.</p><p>Wallet connection and account sign-in are separate. You control wallet permissions and approve any signature or transaction in your wallet.</p><a className="text-cyan-500 underline" href="mailto:ceo@auraajenticai.cloud">Contact Aura Agentic AI</a></> : resource === 'Sitemap' ? <div className="grid grid-cols-2 gap-2">{['overview', 'markets', 'signals', 'watchlist', 'news'].map(tab => <button key={tab} className="rounded-lg border p-3 text-left capitalize hover:bg-accent" onClick={() => { setActiveTab(tab); setResource(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>{tab}</button>)}</div> : <>
              <p><strong>Read the market:</strong> Use Overview for a selected coin and Markets to compare assets. Search by ticker, choose a chart period and add coins to your Watchlist.</p>
              <p><strong>Understand signals:</strong> Signals summarize market indicators. Check the timeframe, data freshness and your own risk limits; an indicator does not guarantee an outcome.</p>
              <p><strong>Review a trade:</strong> Buy and Sell open the order desk. Choose an available DEX or exchange link, verify the asset and network there, then review amounts, fees and slippage before approving anything in your wallet.</p>
              <p><strong>Connect an assistant:</strong> The public MCP connector provides market tools and paper trade calculations at <code className="break-all">https://crypto.auraajenticai.cloud/mcp</code>. Paper calculations do not place real orders.</p>
              {resource === 'Blog' && <p>Product note: the installable app provides a Home Screen or desktop shortcut and an offline notice. Live market features require an internet connection.</p>}
              {(resource === 'Whitepaper' || resource === 'Research') && <p>This technical overview describes the current app. Review the source and connector documentation for implementation details.</p>}
              <a className="text-cyan-500 underline" href="https://github.com/khondokartowsif171/cryptotradeanalysis-public" target="_blank" rel="noopener noreferrer">Source code and technical documentation</a>
            </>}
          </div>
        </DialogContent>
      </Dialog>
      {/* Legal Modal Mount */}
      <LegalModal
        open={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        docType={activeDocType}
      />
    </footer>
  );
};

export default Footer;
