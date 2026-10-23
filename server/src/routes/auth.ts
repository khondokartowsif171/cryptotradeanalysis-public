import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { ethers } from 'ethers';
import { query } from '../db/pool.js';
import { generateToken } from '../middleware/auth.js';

const router = Router();

const nonces = new Map<string, { nonce: string; timestamp: number }>();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.get('/wallet/nonce', (req, res) => {
  const address = String(req.query.address || '').toLowerCase();
  if (!address || !address.startsWith('0x')) {
    res.status(400).json({ error: 'Valid wallet address required' });
    return;
  }
  const randomSalt = Math.random().toString(36).substring(2, 10);
  const nonce = `Sign this message to authenticate with Aura CryptoX:\nAddress: ${address}\nNonce: ${randomSalt}\nTimestamp: ${Date.now()}`;
  nonces.set(address, { nonce, timestamp: Date.now() });
  res.json({ nonce });
});

router.post('/wallet/verify', async (req, res) => {
  try {
    const { address, signature, nonce } = req.body;
    if (!address || !signature || !nonce) {
      res.status(400).json({ error: 'Missing address, signature, or nonce' });
      return;
    }

    const lowerAddr = address.toLowerCase();
    
    // Verify cryptographic signature
    const recovered = ethers.verifyMessage(nonce, signature);
    if (recovered.toLowerCase() !== lowerAddr) {
      res.status(401).json({ error: 'Invalid cryptographic signature' });
      return;
    }
    nonces.delete(lowerAddr);

    // Upsert user with wallet_address
    const userResult = await query(
      'SELECT id, email, wallet_address, tier, tier_expires_at, created_at FROM users WHERE wallet_address = $1',
      [lowerAddr]
    );

    let user;
    if (userResult.rows.length === 0) {
      const displayEmail = `${lowerAddr.slice(0, 6)}...${lowerAddr.slice(-4)}@wallet.cryptox`;
      const insertResult = await query(
        'INSERT INTO users (wallet_address, email, tier) VALUES ($1, $2, $3) RETURNING id, email, wallet_address, tier, tier_expires_at, created_at',
        [lowerAddr, displayEmail, 'free']
      );
      user = insertResult.rows[0];
    } else {
      user = userResult.rows[0];
    }

    const token = generateToken({ userId: user.id, email: user.email, wallet: user.wallet_address });
    res.json({ user, token });
  } catch (err: any) {
    console.error('Wallet verify error:', err);
    res.status(500).json({ error: err.message || 'Wallet verification failed' });
  }
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
    const user = result.rows[0];
    const token = generateToken({ userId: user.id, email: user.email });
    res.status(201).json({ user, token });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
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
    const user = result.rows[0];
    if (!user.password_hash) {
      res.status(401).json({ error: 'This account uses Web3 wallet login' });
      return;
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
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
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    console.error('Login error:', err);
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

router.get('/me', async (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.json({ user: null });
    return;
  }
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET || 'cryptox-dev-secret-change-in-production') as any;
    const result = await query(
      'SELECT id, email, wallet_address, tier, tier_expires_at, created_at FROM users WHERE id = $1',
      [payload.userId]
    );
    if (result.rows.length === 0) {
      res.json({ user: null });
      return;
    }
    res.json({ user: result.rows[0] });
  } catch {
    res.json({ user: null });
  }
});

export default router;
