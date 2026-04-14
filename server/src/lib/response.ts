import type { FastifyReply } from 'fastify';

/**
 * 统一响应格式
 */
export function success<T>(reply: FastifyReply, data: T, message = 'success') {
  return reply.send({ code: 200, message, data });
}

export function fail(reply: FastifyReply, message: string, code = 400) {
  return reply.status(code).send({ code, message, data: null });
}

export function serverError(reply: FastifyReply, message = '服务器内部错误') {
  return reply.status(500).send({ code: 500, message, data: null });
}
