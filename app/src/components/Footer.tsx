import React, { useState } from 'react';
import { BarChart3, Send, Github, Twitter, MessageCircle, Globe } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const Footer: React.FC = () => {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast({ title: 'Invalid Email', description: 'Please enter a valid email address.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Subscribed!', description: 'You will receive our weekly crypto digest.' });
    setEmail('');
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
                className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
              >
                <Send className="w-4 h-4" />
                Subscribe
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
              <span className="text-lg font-bold">CryptoX</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              Professional crypto analytics platform for traders who demand precision and speed.
            </p>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                <Twitter className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                <Github className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                <MessageCircle className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
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
                    <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
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
            &copy; 2026 CryptoX. All rights reserved. Trading involves risk.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <button className="hover:text-foreground transition-colors">Terms</button>
            <button className="hover:text-foreground transition-colors">Privacy</button>
            <button className="hover:text-foreground transition-colors">Cookies</button>
            <button className="hover:text-foreground transition-colors">Sitemap</button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
