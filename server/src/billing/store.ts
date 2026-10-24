import { BillingError, PAYMENT_METHODS, paymentPrice, treasuryAddress, type Cycle } from './config.js';
import type { PaymentIntent, VerifiedPayment } from './verify.js';
export type Query = (text: string, params?: any[]) => Promise<{ rows: any[]; rowCount?: number }>;
export interface Database { query: Query; transaction: <T>(work: (query: Query) => Promise<T>) => Promise<T>; }
export interface ClientUser { id: string; email: string; wallet_address: string | null; tier: 'free' | 'pro' | 'vip'; tier_expires_at: string | Date | null; created_at?: string; }
const userSql = `SELECT u.id,u.email,u.wallet_address,u.created_at,COALESCE(g.tier,'free') AS tier,g.expires AS tier_expires_at
FROM users u LEFT JOIN LATERAL (
 SELECT tier,MAX(ends_at) AS expires FROM subscription_grants
 WHERE user_id=u.id AND starts_at<=NOW() AND ends_at>NOW()
 GROUP BY tier ORDER BY CASE tier WHEN 'vip' THEN 2 ELSE 1 END DESC LIMIT 1
) g ON true WHERE u.id=$1`;
export async function loadClientUser(query: Query, userId: string): Promise<ClientUser | null> {
  return (await query(userSql, [userId])).rows[0] || null;
}
export class BillingStore {
  constructor(public db: Database) {}
  async create(userId: string, plan: 'pro' | 'vip', cycle: Cycle, methodId: string) {
    const method = PAYMENT_METHODS.find(method => method.id === methodId);
    if (!method) throw new BillingError(400, 'UNSUPPORTED_METHOD', 'Choose a supported token and network');
    const treasury = treasuryAddress();
    const price = paymentPrice(plan, cycle, method.decimals);
    return this.db.transaction(async query => {
      await query('SELECT id FROM users WHERE id=$1 FOR UPDATE', [userId]);
      const user = await loadClientUser(query, userId);
      if (!user) throw new BillingError(401, 'ACCOUNT_NOT_FOUND', 'Sign in again');
      if (!user.wallet_address) throw new BillingError(409, 'LINK_WALLET', 'Link and verify your payment wallet before creating an invoice');
      if (user.tier === 'vip' && plan === 'pro') throw new BillingError(409, 'ACTIVE_VIP', 'Your active VIP plan already includes Pro. Choose Pro after VIP expires');
      const existing = (await query(`SELECT * FROM billing_intents WHERE user_id=$1 AND plan=$2 AND cycle=$3 AND method=$4 AND status='pending' AND tx_hash IS NULL AND expires_at>NOW() AND payer_address=$5 AND treasury_address=$6 ORDER BY created_at DESC LIMIT 1`, [userId, plan, cycle, methodId, user.wallet_address.toLowerCase(), treasury.toLowerCase()])).rows[0];
      if (existing) return existing as PaymentIntent;
      const pending = Number((await query("SELECT COUNT(*) AS count FROM billing_intents WHERE user_id=$1 AND status='pending' AND expires_at>NOW()", [userId])).rows[0].count);
      if (pending >= 10) throw new BillingError(429, 'INVOICE_LIMIT', 'You have several open invoices. Use an existing one or wait for it to expire');
      const result = await query(`INSERT INTO billing_intents(user_id,plan,cycle,method,chain_id,token,token_address,token_decimals,payer_address,treasury_address,amount_usd,amount_units,duration_days,required_confirmations)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`, [userId, plan, cycle, methodId, method.chainId, method.token, method.tokenAddress.toLowerCase(), method.decimals, user.wallet_address.toLowerCase(), treasury.toLowerCase(), price.amount, price.units, price.days, method.confirmations]);
      return result.rows[0] as PaymentIntent;
    });
  }
  async get(userId: string, intentId: string) { return (await this.db.query('SELECT * FROM billing_intents WHERE id=$1 AND user_id=$2', [intentId, userId])).rows[0] as PaymentIntent | undefined; }
  async list(userId: string) { return (await this.db.query('SELECT * FROM billing_intents WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20', [userId])).rows as PaymentIntent[]; }
  async notePending(userId: string, intentId: string, txHash: string) {
    await this.db.query("UPDATE billing_intents SET tx_hash=$3 WHERE id=$1 AND user_id=$2 AND status='pending'", [intentId, userId, txHash]);
  }
  async confirm(userId: string, intentId: string, txHash: string, proof: VerifiedPayment) {
    return this.db.transaction(async query => {
      const intent = (await query('SELECT * FROM billing_intents WHERE id=$1 AND user_id=$2 FOR UPDATE', [intentId, userId])).rows[0] as PaymentIntent | undefined;
      if (!intent) throw new BillingError(404, 'INVOICE_NOT_FOUND', 'Invoice not found');
      if (intent.status === 'confirmed') {
        if (intent.tx_hash !== txHash) throw new BillingError(409, 'INVOICE_ALREADY_PAID', 'This invoice was already paid with a different transaction');
        return { intent, user: await loadClientUser(query, userId) };
      }
      // This lock serializes renewals even when different invoices are verified concurrently.
      await query('SELECT id FROM users WHERE id=$1 FOR UPDATE', [userId]);
      if ((await query('SELECT 1 FROM crypto_orders WHERE lower(tx_hash)=$1 LIMIT 1', [txHash])).rows.length) throw new BillingError(409, 'TRANSACTION_ALREADY_USED', 'This transaction is already in the payment history');
      const inserted = await query(`INSERT INTO verified_payments(chain_id,tx_hash,intent_id,user_id,amount_units,block_number,block_hash) VALUES($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT DO NOTHING RETURNING intent_id`, [intent.chain_id, txHash, intent.id, userId, proof.amountUnits, proof.blockNumber, proof.blockHash]);
      if (!inserted.rows.length) throw new BillingError(409, 'TRANSACTION_ALREADY_USED', 'This transaction was already used for another invoice');
      // Keep separate grants: an upgrade cannot erase a previously paid annual Pro term.
      await query(`INSERT INTO subscription_grants(source_id,user_id,tier,starts_at,ends_at)
        SELECT $1,$2,$3,NOW(),GREATEST(NOW(),COALESCE(MAX(ends_at),NOW())) + $4 * INTERVAL '1 day'
        FROM subscription_grants WHERE user_id=$2 AND tier=$3 AND starts_at<=NOW()`, ['payment:' + intent.id, userId, intent.plan, intent.duration_days]);
      const confirmed = (await query("UPDATE billing_intents SET status='confirmed',tx_hash=$3,confirmed_at=NOW() WHERE id=$1 AND user_id=$2 RETURNING *", [intentId, userId, txHash])).rows[0] as PaymentIntent;
      const user = await loadClientUser(query, userId);
      await query('UPDATE users SET tier=$2,tier_expires_at=$3,updated_at=NOW() WHERE id=$1', [userId, user!.tier, user!.tier_expires_at]);
      return { intent: confirmed, user };
    });
  }
}
