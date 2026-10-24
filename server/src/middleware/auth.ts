import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'cryptox-dev-secret-change-in-production')) throw new Error('Configure JWT_SECRET before starting production');

const JWT_SECRET = process.env.JWT_SECRET || 'cryptox-dev-secret-change-in-production';

export interface AuthPayload {
  userId: string;
  email: string;
  wallet?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }
  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as AuthPayload;
    if (!payload || typeof payload.userId !== 'string' || !/^[0-9a-f-]{36}$/i.test(payload.userId)) throw new Error('Invalid session');
    req.user = payload;
    res.setHeader('Cache-Control','no-store');
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export const authenticate = authMiddleware;
