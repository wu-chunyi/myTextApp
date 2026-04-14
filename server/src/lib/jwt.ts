import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface JwtPayload {
  userId: number;
  type: 'access' | 'refresh';
}

/**
 * 生成 access + refresh token 对
 */
export function generateTokens(userId: number) {
  const signToken = (payload: object, secret: string, expiresInSec: number) =>
    jwt.sign(payload, secret, { expiresIn: expiresInSec });

  const accessToken = signToken(
    { userId, type: 'access' },
    config.jwt.secret,
    15 * 60 // 15 min
  );

  const refreshToken = signToken(
    { userId, type: 'refresh' },
    config.jwt.refreshSecret,
    7 * 24 * 60 * 60 // 7 days
  );

  return { accessToken, refreshToken };
}

/**
 * 验证 access token
 */
export function verifyAccessToken(token: string): JwtPayload {
  const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
  if (payload.type !== 'access') {
    throw new Error('Invalid token type');
  }
  return payload;
}

/**
 * 验证 refresh token
 */
export function verifyRefreshToken(token: string): JwtPayload {
  const payload = jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
  if (payload.type !== 'refresh') {
    throw new Error('Invalid token type');
  }
  return payload;
}
