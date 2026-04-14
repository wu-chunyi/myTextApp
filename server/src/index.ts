import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';

import { config } from './config';
import { authRoutes } from './routes/auth';
import { paymentRoutes } from './routes/payment';

async function main() {
  const app = Fastify({
    logger: {
      level: config.isDev ? 'info' : 'warn',
    },
  });

  // ---- 插件 ----
  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // ---- 全局错误处理 ----
  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    const err = error as { name?: string; statusCode?: number; message?: string };

    if (err.name === 'ZodError') {
      return reply.status(400).send({
        code: 400,
        message: '参数校验失败',
        data: err.message ? JSON.parse(err.message) : null,
      });
    }

    return reply.status(err.statusCode || 500).send({
      code: err.statusCode || 500,
      message: err.message || '服务器内部错误',
      data: null,
    });
  });

  // ---- 路由 ----
  await app.register(authRoutes);
  await app.register(paymentRoutes);

  // ---- 健康检查 ----
  app.get('/health', async () => ({ status: 'ok', time: new Date().toISOString() }));

  // ---- 启动 ----
  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`🚀 Server running at http://localhost:${config.port}`);
    console.log(`📋 Environment: ${config.nodeEnv}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
