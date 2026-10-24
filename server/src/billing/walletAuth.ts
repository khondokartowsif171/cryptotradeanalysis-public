import { randomBytes } from 'node:crypto';
import { getAddress, isAddress, verifyMessage } from 'ethers';
import { BillingError } from './config.js';
import { loadClientUser, type Database, type Query } from './store.js';
export class WalletAuth {
  constructor(private db: Database) {}
  async issue(address: string, purpose: 'login' | 'link' = 'login', userId: string | null = null) {
    if (!isAddress(address) || /^0x0{40}$/i.test(address)) throw new BillingError(400, 'INVALID_WALLET', 'A valid EVM wallet address is required');
    if (purpose === 'link' && !userId) throw new BillingError(401, 'SIGN_IN_REQUIRED', 'Sign in before linking a wallet');
    const expiry = new Date(Date.now() + 5 * 60_000);
    const message = `Aura Crypto X wallet verification\nOrigin: https://crypto.auraajenticai.cloud\nPurpose: ${purpose === 'link' ? 'Link wallet to account ' + userId : 'Sign in'}\nWallet: ${getAddress(address.toLowerCase())}\nNonce: ${randomBytes(32).toString('hex')}\nExpires: ${expiry.toISOString()}\n\nThis proves wallet ownership. It does not authorize a transaction or token spending.`;
    await this.db.query('DELETE FROM wallet_challenges WHERE expires_at<NOW()');
    await this.db.query('INSERT INTO wallet_challenges(address,purpose,user_id,message,expires_at) VALUES($1,$2,$3,$4,$5)', [address.toLowerCase(), purpose, userId, message, expiry]);
    return { nonce: message, expiresAt: expiry.toISOString() };
  }
  async verify(address: string, signature: string, message: string, purpose: 'login' | 'link' = 'login', userId: string | null = null) {
    if (!isAddress(address) || typeof signature !== 'string' || typeof message !== 'string' || message.length > 1500 || signature.length > 300) throw new BillingError(400, 'INVALID_SIGNATURE', 'Invalid wallet verification request');
    let recovered: string;
    try { recovered = verifyMessage(message, signature).toLowerCase(); }
    catch { throw new BillingError(401, 'INVALID_SIGNATURE', 'The wallet signature could not be verified'); }
    const wallet = address.toLowerCase();
    if (recovered !== wallet) throw new BillingError(401, 'INVALID_SIGNATURE', 'The signature does not match this wallet');
    return this.db.transaction(async query => {
      const consumed = await query(`DELETE FROM wallet_challenges WHERE address=$1 AND purpose=$2 AND message=$3 AND user_id IS NOT DISTINCT FROM $4::uuid AND expires_at>NOW() RETURNING id`, [wallet, purpose, message, userId]);
      if (!consumed.rows.length) throw new BillingError(401, 'CHALLENGE_EXPIRED', 'This sign-in challenge expired or was already used. Request a new message');
      if (purpose === 'link') {
        if (!userId) throw new BillingError(401, 'SIGN_IN_REQUIRED', 'Sign in before linking a wallet');
        const owner = (await query('SELECT id FROM users WHERE lower(wallet_address)=$1', [wallet])).rows[0];
        if (owner && owner.id !== userId) throw new BillingError(409, 'WALLET_ALREADY_LINKED', 'This wallet belongs to another account. Sign in with that wallet instead');
        const updated = await query('UPDATE users SET wallet_address=$2,updated_at=NOW() WHERE id=$1 RETURNING id', [userId, wallet]);
        if (!updated.rows.length) throw new BillingError(401, 'ACCOUNT_NOT_FOUND', 'Account not found');
        return loadClientUser(query, userId);
      }
      let user = (await query('SELECT id FROM users WHERE lower(wallet_address)=$1', [wallet])).rows[0];
      if (!user) user = (await query(`INSERT INTO users(wallet_address,email,tier) VALUES($1,$2,'free')
        ON CONFLICT (lower(wallet_address)) WHERE wallet_address IS NOT NULL DO UPDATE SET wallet_address=EXCLUDED.wallet_address RETURNING id`, [wallet, wallet + '@wallet.cryptox'])).rows[0];
      return loadClientUser(query, user.id);
    });
  }
}
