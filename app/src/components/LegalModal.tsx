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
            <strong className="text-foreground">3. Pro & VIP Subscriptions:</strong> Paid plans are prepaid for 30 or 365 days, as shown at checkout. There is no automatic recurring debit. Pay an invoice from your linked wallet using a supported token and network; access activates after the server verifies the transfer and required blockchain confirmations. Network gas is additional. Same-plan renewals extend the paid term. Different plans start after verification without automatic proration, and remaining paid Pro access is preserved separately. Keep your invoice and transaction hash if verification is delayed, and contact support before sending another payment.
          </p>
          <p>
            <strong className="text-foreground">4. Prohibited Uses:</strong> Users agree not to conduct market manipulation, unauthorized reverse-engineering of trading algorithms, or access the service from sanctioned jurisdictions.
          </p>
        </div>
      ),
    },
    privacy: {
      title: 'Privacy Policy',
      subtitle: 'Account Data & Wallet Security',
      icon: Lock,
      body: (
        <div className="space-y-4 text-xs md:text-sm text-muted-foreground leading-relaxed">
          <p>
            <strong className="text-foreground">1. Account & Payment Data:</strong> We store registered email addresses, password hashes for password accounts, linked public wallet addresses, saved watchlists and portfolios, invoices, public payment hashes and subscription records. Wallet ownership challenges expire after five minutes. We never request or store wallet private keys or seed phrases.
          </p>
          <p>
            <strong className="text-foreground">2. Wallet Login & API Keys:</strong> Wallet login verifies a signed, single-use ownership challenge and does not authorize spending. A wallet-only account does not require a password. VIP client API keys are shown once and stored as hashes, with expiry, revocation and usage metadata. Those keys grant read-only access to the account's supported data while VIP access remains active.
          </p>
          <p>
            <strong className="text-foreground">3. External Data Providers:</strong> Market, chart and blockchain providers receive the requests needed to display data or verify public payments. Blockchain wallet addresses and transactions are publicly visible. Review a provider's own privacy information when following an external link or connecting to its service.
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
            <strong className="text-foreground">2. Signal & Data Limits:</strong> Signals and indicators depend on available market data and may be delayed, incomplete or unavailable. An indicator or paper trade calculation does not guarantee a result or place a real order. Past performance does not guarantee future market results.
          </p>
          <p>
            <strong className="text-foreground">3. Smart Contract & Blockchain Risks:</strong> Interactions with decentralized liquidity pools (Uniswap, 1inch) involve smart contract risks, gas volatility, and slippage. Users assume full responsibility for private transaction execution.
          </p>
        </div>
      ),
    },
    compliance: {
      title: 'Regulatory Compliance',
      subtitle: 'Platform Scope & Regional Availability',
      icon: Scale,
      body: (
        <div className="space-y-4 text-xs md:text-sm text-muted-foreground leading-relaxed">
          <p>
            <strong className="text-foreground">1. Platform Scope:</strong> Aura CryptoX provides market analytics and wallet-connected software. A subscription buys access to the features listed in the current plan; it is not an investment product or a promise of returns.
          </p>
          <p>
            <strong className="text-foreground">2. Regional Availability:</strong> Permitted use depends on the rules applicable to you and to the external services you choose. This page does not establish a regulatory approval, licence or exemption. Contact the operator at ceo@auraajenticai.cloud with questions about service availability.
          </p>
        </div>
      ),
    },
    aml: {
      title: 'Anti-Money Laundering (AML) Policy',
      subtitle: 'Acceptable Payments & Verification Limits',
      icon: ShieldCheck,
      body: (
        <div className="space-y-4 text-xs md:text-sm text-muted-foreground leading-relaxed">
          <p>
            <strong className="text-foreground">1. Prohibited Activity:</strong> Do not use the platform or subscription payments for money laundering, fraud, sanctions evasion or other unlawful activity. Direct payment-related concerns to ceo@auraajenticai.cloud and include the relevant public transaction hash.
          </p>
          <p>
            <strong className="text-foreground">2. Verification Limits:</strong> No automatic sanctions-screening or blockchain-intelligence service is currently integrated. Receipt verification checks payment details and confirmations; it does not establish a customer's identity or the source of funds.
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
            <strong className="text-foreground">1. Essential Local Storage:</strong> Browser storage maintains your account session, display preferences, watchlist and install preferences. An unresolved invoice ID and public transaction hash may also be saved for payment recovery, scoped to your account. The app does not persist wallet private keys or client API key values in browser storage.
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
