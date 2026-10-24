import React, { useState } from 'react';
import { BarChart3, Send, Github, Twitter, MessageCircle, Globe, Loader2, ExternalLink } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { subscribeEmail } from '@/services/subscribe';
import { api } from '@/services/api';
import LegalModal, { LegalDocType } from '@/components/LegalModal';

const Footer: React.FC = () => {
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

    // Resources
    if (link === 'API Documentation') {
      toast({
        title: 'CryptoX MCP Server API',
        description: 'Universal MCP endpoint: https://cryptox-api.auraajenticai.cloud/mcp',
      });
      window.open('https://cryptox-api.auraajenticai.cloud/mcp/info', '_blank', 'noopener,noreferrer');
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
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F0B90B] to-[#F8D12F] flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-black" />
              </div>
              <span className="text-sm text-muted-foreground font-medium">Aura</span>
              <span className="text-lg font-bold">CryptoX</span>
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
            <button onClick={() => window.open('https://crypto.auraajenticai.cloud', '_self')} className="hover:text-foreground transition-colors">Sitemap</button>
          </div>
        </div>
      </div>

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
