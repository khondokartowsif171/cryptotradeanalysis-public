import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { X, ShieldAlert, FileText, Lock, ShieldCheck, Scale } from 'lucide-react';

export type LegalDocType = 'terms' | 'privacy' | 'cookies' | 'risk' | 'compliance' | 'aml';

interface LegalModalProps {
  open: boolean;
  onClose: () => void;
  docType: LegalDocType;
}

const LegalModal: React.FC<LegalModalProps> = ({ open, onClose, docType }) => {
  if (!open) return null;
  if (typeof document === 'undefined') return null;

  const contentMap: Record<LegalDocType, { title: string; subtitle: string; icon: any; body: React.ReactNode }> = {
    terms: {
      title: 'Terms of Service',
      subtitle: 'Aura CryptoX Platform Agreement & Non-Custodial Protocol Usage',
      icon: FileText,
      body: (
        <div className="space-y-4 text-xs md:text-sm text-muted-foreground leading-relaxed">
          <p>
            <strong className="text-foreground">1. Acceptance of Terms:</strong> By accessing or using Aura CryptoX (the "Platform"), you agree to be bound by these Terms. The Platform provides market analytics, quantitative signals, and self-custodial software interfaces for decentralized protocols.
          </p>
          <p>
            <strong className="text-foreground">2. Non-Custodial Architecture:</strong> Aura CryptoX does not take custody of user funds, private keys, or wallet seed phrases. All subscription payments and DEX interactions settle directly on public EVM blockchains into our designated treasury or decentralized smart contracts.
          </p>
          <p>
            <strong className="text-foreground">3. Pro & VIP Subscriptions:</strong> Subscriptions are billed on a recurring 30-day basis or via blockchain transaction hash submission. Access to premium quantitative signals and API endpoints remains active during the paid billing cycle.
          </p>
          <p>
            <strong className="text-foreground">4. Prohibited Uses:</strong> Users agree not to conduct market manipulation, unauthorized reverse-engineering of trading algorithms, or access the service from sanctioned jurisdictions.
          </p>
        </div>
      ),
    },
    privacy: {
      title: 'Privacy Policy',
      subtitle: 'Zero-Knowledge Data Ethics & Wallet Security Standards',
      icon: Lock,
      body: (
        <div className="space-y-4 text-xs md:text-sm text-muted-foreground leading-relaxed">
          <p>
            <strong className="text-foreground">1. Information We Collect:</strong> We collect only necessary identifiers: public blockchain wallet addresses (via a signed ownership challenge) and registered email addresses for account recovery. We never collect or store private keys.
          </p>
          <p>
            <strong className="text-foreground">2. Cryptographic Nonce Authentication:</strong> Web3 authentication verifies ownership using elliptic curve digital signatures (ECDSA). No password is required or stored for Web3 logins.
          </p>
          <p>
            <strong className="text-foreground">3. Third-Party Analytics:</strong> Real-time price feeds are ingested directly from public exchange APIs (Binance, TwelveData). No personal telemetry is sold to third parties or advertisers.
          </p>
        </div>
      ),
    },
    risk: {
      title: 'Risk Disclosure & Disclaimer',
      subtitle: 'Important Information Concerning Cryptocurrency Trading & Market Volatility',
      icon: ShieldAlert,
      body: (
        <div className="space-y-4 text-xs md:text-sm text-muted-foreground leading-relaxed">
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-semibold text-xs">
            WARNING: Trading digital assets involves significant financial risk. Asset values can fluctuate violently within seconds. You may lose all invested capital.
          </div>
          <p>
            <strong className="text-foreground">1. No Financial Advice:</strong> All quantitative signals, technical indicators, candlestick charts, and market overviews provided on Aura CryptoX are for educational and analytical purposes only. They do not constitute financial, investment, legal, or tax advice.
          </p>
          <p>
            <strong className="text-foreground">2. Algorithmic Uncertainty:</strong> Quantitative trading signals rely on historical price confluence, volume moving averages, and on-chain metrics. Past performance does not guarantee future market results.
          </p>
          <p>
            <strong className="text-foreground">3. Smart Contract & Blockchain Risks:</strong> Interactions with decentralized liquidity pools (Uniswap, 1inch) involve smart contract risks, gas volatility, and slippage. Users assume full responsibility for private transaction execution.
          </p>
        </div>
      ),
    },
    compliance: {
      title: 'Regulatory Compliance',
      subtitle: 'Institutional Standards & Decentralized Protocol Governance',
      icon: Scale,
      body: (
        <div className="space-y-4 text-xs md:text-sm text-muted-foreground leading-relaxed">
          <p>
            <strong className="text-foreground">1. Global Compliance Framework:</strong> Aura Agentic AI operates in accordance with emerging international standards for software developers providing decentralized financial analytical interfaces.
          </p>
          <p>
            <strong className="text-foreground">2. Developer Safe Harbor:</strong> The Platform functions strictly as a non-custodial software provider and does not operate as a broker-dealer, custodian, or exchange under securities law.
          </p>
        </div>
      ),
    },
    aml: {
      title: 'Anti-Money Laundering (AML) Policy',
      subtitle: 'Sanctions Screening & Financial Crime Prevention Protocols',
      icon: ShieldCheck,
      body: (
        <div className="space-y-4 text-xs md:text-sm text-muted-foreground leading-relaxed">
          <p>
            <strong className="text-foreground">1. Sanctions Screening:</strong> Aura CryptoX prohibits transactions originating from OFAC-sanctioned wallet addresses, mixing protocols (e.g., Tornado Cash), or jurisdictions under FATF high-risk watchlists.
          </p>
          <p>
            <strong className="text-foreground">2. On-Chain Monitoring:</strong> Platform subscriptions and treasury receipts are evaluated against known blockchain intelligence databases to prevent illicit financing or ransomware transactions.
          </p>
        </div>
      ),
    },
    cookies: {
      title: 'Cookie Policy',
      subtitle: 'Essential Session State & Storage Protocols',
      icon: FileText,
      body: (
        <div className="space-y-4 text-xs md:text-sm text-muted-foreground leading-relaxed">
          <p>
            <strong className="text-foreground">1. Essential Local Storage:</strong> We use browser localStorage to maintain your authentication JWT token, selected dark theme preferences, and active watchlist coins.
          </p>
          <p>
            <strong className="text-foreground">2. Zero Tracking Cookies:</strong> We do not deploy third-party advertising or cross-site tracking cookies.
          </p>
        </div>
      ),
    },
  };

  const currentDoc = contentMap[docType] || contentMap.terms;
  const IconComponent = currentDoc.icon;

  return (
    <Dialog open={open} onOpenChange={value => { if (!value) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-6 md:p-8">

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
            <IconComponent className="w-6 h-6" />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold">{currentDoc.title}</DialogTitle>
            <DialogDescription className="text-xs">{currentDoc.subtitle}</DialogDescription>
          </div>
        </div>

        <div className="border-t border-border/40 pt-4 mb-6">
          {currentDoc.body}
        </div>

        <div className="flex justify-end pt-4 border-t border-border/30">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity"
          >
            Close document
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LegalModal;
