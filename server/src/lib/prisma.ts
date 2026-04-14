// PrismaClient 需要先执行 `npx prisma generate` 才能导入
// 使用 require 避免编译期报错
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaPg } = require('@prisma/adapter-pg');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require('@prisma/client');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Pool } = require('pg');

const adapter = new PrismaPg(
  new Pool({
    connectionString: process.env.DATABASE_URL,
  })
);

export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
}) as any;
