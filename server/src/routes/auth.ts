import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import nodemailer from 'nodemailer';
import { query } from '../db/pool.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';
import { randomInt } from 'node:crypto';
import { WalletAuth } from '../billing/walletAuth.js';
import { database } from '../billing/database.js';
import { loadClientUser } from '../billing/store.js';
import { billingFailure } from '../billing/router.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = Router();
router.use((_req,res,next) => { res.setHeader('Cache-Control','no-store'); next(); });

const walletAuth = new WalletAuth(database);
const walletLimit = rateLimit(15,60_000,req => (req.user?.userId || String(req.body?.address || req.query.address || req.body?.email || req.ip || 'unknown')).toLowerCase().slice(0,200));
const recoveryLimit = rateLimit(6,15*60_000,req => String(req.body?.email || req.ip || 'unknown').toLowerCase().slice(0,200));

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Configure Mailer with Hostinger SSL
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: true,
  auth: {
    user: process.env.SMTP_USER || 'ceo@auraajenticai.cloud',
    pass: process.env.SMTP_PASS,
  },
});

router.get('/wallet/nonce', walletLimit, async (req,res) => {
  try {
    const purpose = req.query.purpose === 'link' ? 'link' : 'login';
    if (purpose === 'link') {
      let authenticated = false;
      authMiddleware(req,res,() => { authenticated = true; });
      if (!authenticated) return;
    }
    res.json(await walletAuth.issue(String(req.query.address || ''),purpose,purpose === 'link' ? req.user!.userId : null));
  } catch (error) { billingFailure(error,res); }
});
router.post('/wallet/verify', walletLimit, async (req,res) => {
  try {
    const { address,signature,nonce } = req.body;
    const user = await walletAuth.verify(address,signature,nonce);
    res.json({ user,token: generateToken({ userId: user!.id,email: user!.email,wallet: user!.wallet_address || undefined }) });
  } catch (error) { billingFailure(error,res); }
});
router.post('/wallet/link', authMiddleware, walletLimit, async (req,res) => {
  try {
    const { address,signature,nonce } = req.body;
    const user = await walletAuth.verify(address,signature,nonce,'link',req.user!.userId);
    res.json({ user,token: generateToken({ userId: user!.id,email: user!.email,wallet: user!.wallet_address || undefined }) });
  } catch (error) { billingFailure(error,res); }
});

router.post('/register', async (req, res) => {
  try {
    const { email, password } = registerSchema.parse(req.body);
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }
    const password_hash = await bcrypt.hash(password, 12);
    const result = await query(
      'INSERT INTO users (email, password_hash, tier) VALUES ($1, $2, $3) RETURNING id, email, wallet_address, tier, tier_expires_at, created_at',
      [email, password_hash, 'free']
    );
    const user = await loadClientUser(database.query,result.rows[0].id);
    const token = generateToken({ userId: user.id, email: user.email });
    res.status(201).json({ user, token });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0].message });
      return;
    }
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

router.post('/login', rateLimit(10,60_000,req => String(req.body?.email || req.ip || 'unknown').toLowerCase().slice(0,200)), async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const result = await query(
      'SELECT id, email, password_hash, wallet_address, tier, tier_expires_at FROM users WHERE email = $1',
      [email]
    );
    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    const account = result.rows[0];
    if (!account.password_hash) {
      res.status(401).json({ error: 'This account uses Web3 MetaMask wallet login. Please connect your wallet.' });
      return;
    }
    const valid = await bcrypt.compare(password, account.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    const user = await loadClientUser(database.query,account.id);
    const token = generateToken({ userId: user.id, email: user.email });
    res.json({
      user: {
        id: user.id,
        email: user.email,
        wallet_address: user.wallet_address,
        tier: user.tier || 'free',
        tier_expires_at: user.tier_expires_at
      },
      token
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0].message });
      return;
    }
    console.error('Login error:', err);
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// Password Recovery: Send OTP to email
router.post('/forgot-password', recoveryLimit, async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const userRes = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      res.status(404).json({ error: 'No account registered with this email address' });
      return;
    }

    // Generate 6-digit random code
    const code = randomInt(100000,1000000).toString();

    await query(
      `INSERT INTO password_resets (email, code, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '15 minutes')`,
      [email, code]
    );

    // Send email via Hostinger SMTP
    try {
      await transporter.sendMail({
        from: '"Aura CryptoX Security" <ceo@auraajenticai.cloud>',
        to: email,
        subject: 'Your Password Reset Code — Aura CryptoX',
        html: `
          <div style="font-family: sans-serif; background: #0d111c; color: #fff; padding: 24px; border-radius: 12px; max-width: 500px; margin: auto;">
            <h2 style="color: #F0B90B; margin-bottom: 8px;">Aura CryptoX Security</h2>
            <p style="color: #9ca3af; font-size: 14px;">You requested a password reset for your CryptoX account.</p>
            <div style="background: #1e293b; padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #F8D12F;">${code}</span>
            </div>
            <p style="color: #9ca3af; font-size: 12px;">This code will expire in 15 minutes. If you did not make this request, please ignore this email.</p>
          </div>
        `,
      });
      res.json({ success: true, message: `Reset code sent to ${email}. Please check your inbox or spam folder.` });
    } catch (mailErr: any) {
      console.error('Mail delivery note:', mailErr.message);
      res.status(503).json({ success: false,error: 'Email delivery is temporarily unavailable. No password was changed. Please try again later' });
    }
  } catch (err: any) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: err.message || 'Password reset request failed' });
  }
});

// Password Recovery: Verify OTP and set new password
router.post('/reset-password', recoveryLimit, async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      res.status(400).json({ error: 'Email, 6-digit code, and new password are required' });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanCode = String(code).trim();

    const resetRes = await query(
      `SELECT id FROM password_resets 
       WHERE email = $1 AND code = $2 AND used = false AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [cleanEmail, cleanCode]
    );

    if (resetRes.rows.length === 0) {
      res.status(400).json({ error: 'Invalid or expired 6-digit reset code' });
      return;
    }

    // Mark reset as used
    await query('UPDATE password_resets SET used = true WHERE id = $1', [resetRes.rows[0].id]);

    // Update user password
    const newHash = await bcrypt.hash(newPassword, 12);
    const updateRes = await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2 RETURNING id, email, wallet_address, tier, tier_expires_at',
      [newHash, cleanEmail]
    );

    const user = await loadClientUser(database.query,updateRes.rows[0].id);
    const token = generateToken({ userId: user.id, email: user.email });

    res.json({
      success: true,
      message: 'Password successfully updated! You are now logged in.',
      user,
      token,
    });
  } catch (err: any) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: err.message || 'Password update failed' });
  }
});

router.get('/me', async (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.json({ user: null });
    return;
  }
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET || 'cryptox-dev-secret-change-in-production', { algorithms: ['HS256'] }) as any;
    const result = await query(
      'SELECT id, email, wallet_address, tier, tier_expires_at, created_at FROM users WHERE id = $1',
      [payload.userId]
    );
    if (result.rows.length === 0) {
      res.json({ user: null });
      return;
    }
    res.json({ user: await loadClientUser(database.query,payload.userId) });
  } catch {
    res.json({ user: null });
  }
});

export default router;
