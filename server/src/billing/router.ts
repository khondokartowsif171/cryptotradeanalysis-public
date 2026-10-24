import { Router, type RequestHandler } from 'express';
import { z } from 'zod';
import { BillingError, PAYMENT_METHODS, PLANS, treasuryAddress } from './config.js';
import { BillingStore, type Database } from './store.js';
import { verifyOnChain, type PaymentIntent, type Verification } from './verify.js';
import { authMiddleware } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
const createSchema = z.object({ plan: z.enum(['pro','vip']), cycle: z.enum(['monthly','yearly']).default('monthly'), method: z.string().max(50) }).strict();
const verifySchema = z.object({ intentId: z.string().uuid(), txHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/) }).strict();
export function billingFailure(error: unknown, res: any) {
  if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid payment request', code: 'INVALID_REQUEST' });
  if (error instanceof BillingError) return res.status(error.status).json({ error: error.message, code: error.code });
  console.error('Billing operation failed:', (error as any)?.code || 'unknown');
  return res.status(503).json({ error: 'Billing is temporarily unavailable. No plan was activated. Retry with the same invoice', code: 'BILLING_UNAVAILABLE' });
}
export function createBillingRouter(db: Database, verify: (intent: PaymentIntent, hash: string) => Promise<Verification> = verifyOnChain, authenticate: RequestHandler = authMiddleware) {
  const router = Router();
  const store = new BillingStore(db);
  router.use((_req,res,next) => { res.setHeader('Cache-Control','no-store'); next(); });
  router.get('/plans', (_req,res) => {
    try {
      res.json({ version: 2, plans: PLANS, treasury: { EVM: treasuryAddress(), paymentMethods: PAYMENT_METHODS.map(({ rpcEnv, ...method }) => method) }, paymentPolicy: 'Pay from your linked wallet. Exchange withdrawals and unsupported tokens are not automatically verified. Same-plan renewals extend the existing term; other plans start at confirmation without automatic proration.' });
    } catch (error) { billingFailure(error,res); }
  });
  router.use(authenticate);
  router.use(rateLimit(30,60_000,req => req.user!.userId));
  router.post('/intents', async (req,res) => {
    try { const input = createSchema.parse(req.body); res.status(201).json({ intent: await store.create(req.user!.userId,input.plan,input.cycle,input.method) }); }
    catch (error) { billingFailure(error,res); }
  });
  router.get('/intents', async (req,res) => {
    try { res.json({ intents: await store.list(req.user!.userId) }); }
    catch (error) { billingFailure(error,res); }
  });
  router.post('/submit-tx', async (req,res) => {
    try {
      const input = verifySchema.parse(req.body);
      const hash = input.txHash.toLowerCase();
      const intent = await store.get(req.user!.userId,input.intentId);
      if (!intent) throw new BillingError(404,'INVOICE_NOT_FOUND','Invoice not found');
      // Idempotent retries cannot extend a subscription again.
      if (intent.status === 'confirmed') {
        if (intent.tx_hash !== hash) throw new BillingError(409,'INVOICE_ALREADY_PAID','This invoice already has a payment');
        return void res.json({ success: true, status: 'confirmed', intent });
      }
      const result = await verify(intent,hash);
      if (result.pending === true) {
        if (!result.confirmations && Date.now() > new Date(intent.expires_at).getTime()) throw new BillingError(410,'INVOICE_EXPIRED','This invoice expired and no mined payment was found. Do not pay it. If you already sent funds, keep the hash and contact support');
        await store.notePending(req.user!.userId,intent.id,hash);
        return void res.status(202).json({ success: false, status: 'pending', confirmations: result.confirmations, required: result.required, message: 'Waiting for blockchain confirmations. Do not send another payment' });
      }
      const saved = await store.confirm(req.user!.userId,intent.id,hash,result.payment);
      res.json({ success: true, status: 'confirmed', intent: saved.intent, tier: saved.user!.tier, user: saved.user });
    } catch (error) { billingFailure(error,res); }
  });
  router.get('/orders', async (req,res) => {
    try { const result = await db.query(`SELECT id,plan,cycle,amount_usd,token,method,tx_hash,status,created_at,confirmed_at FROM billing_intents WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50`, [req.user!.userId]); res.json({ orders: result.rows }); }
    catch (error) { billingFailure(error,res); }
  });
  return router;
}
