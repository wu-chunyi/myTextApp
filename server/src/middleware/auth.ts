import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken } from '../lib/jwt';

declare module 'fastify' {
  interface FastifyRequest {
    userId?: number;
    isGuest?: boolean;
    guestUserId?: string;
  }
}

/**
 * 鉴权中间件 — 必须登录
 */
export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ code: 401, message: '未授权', data: null });
  }
  try {
    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);
    request.userId = payload.userId;
  } catch {
    return reply.status(401).send({ code: 401, message: 'Token 无效或已过期', data: null });
  }
}

/**
 * 可选鉴权 — 支持访客模式
 * 有 token 就解析，没有就标记为访客
 */
export async function optionalAuth(request: FastifyRequest, _reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  const guestMode = request.headers['x-guest-mode'];
  const guestUserId = request.headers['x-guest-user-id'] as string | undefined;

  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7);
      const payload = verifyAccessToken(token);
      request.userId = payload.userId;
      request.isGuest = false;
      return;
    } catch {
      // token 无效，降级为访客
    }
  }

  request.isGuest = true;
  request.guestUserId = guestUserId;
}
