import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import dayjs from 'dayjs';

import { prisma } from '../lib/prisma';
import { generateTokens, verifyRefreshToken } from '../lib/jwt';
import { generateCode, sendSms, sendEmail } from '../lib/sms';
import { success, fail } from '../lib/response';
import {
  getWechatUserByCode,
  getQQUser,
  verifyAppleToken,
  verifyGoogleToken,
  type ThirdPartyUserInfo,
} from '../services/thirdParty';
import { requireAuth } from '../middleware/auth';

const CODE_EXPIRE_MINUTES = 5;

// ---- 验证码 Schema ----
const sendSmsSchema = z.object({ phone: z.string().min(8), businessType: z.number().default(0) });
const sendEmailSchema = z.object({ email: z.string().email(), businessType: z.number().default(0) });

// ---- 统一登录 Schema ----
const unifiedLoginSchema = z.object({
  loginType: z.number(), // 0=SMS 1=EMAIL 2=PASSWORD 3=THIRDPARTY 4=UNIFIED
  phone: z.string().optional(),
  email: z.string().optional(),
  code: z.string().optional(),
  password: z.string().optional(),
  flowStatus: z.number().optional(),
  businessType: z.number().default(0),
});

// ---- SDK 登录 Schema ----
const sdkLoginSchema = z.object({
  sdkType: z.enum(['apple', 'google', 'wechat', 'qq']),
  idToken: z.string().nullish(),
  authorizationCode: z.string().nullish(),
  wechatCode: z.string().optional(),
  qqAccessToken: z.string().optional(),
  qqOpenId: z.string().optional(),
});

/**
 * 通过第三方信息查找或创建用户
 */
async function findOrCreateByThirdParty(
  platform: string,
  info: ThirdPartyUserInfo
) {
  // 先查绑定记录
  const binding = await prisma.thirdPartyBinding.findUnique({
    where: { platform_platformUserId: { platform, platformUserId: info.platformUserId } },
    include: { user: true },
  });
  if (binding) {
    return { user: binding.user, isRegistration: false };
  }

  // 如果有 unionId，尝试用 unionId 匹配（微信跨应用场景）
  if (info.unionId) {
    const byUnion = await prisma.thirdPartyBinding.findFirst({
      where: { platform, unionId: info.unionId },
      include: { user: true },
    });
    if (byUnion) {
      // 补建绑定记录
      await prisma.thirdPartyBinding.create({
        data: { userId: byUnion.userId, platform, platformUserId: info.platformUserId, unionId: info.unionId },
      });
      return { user: byUnion.user, isRegistration: false };
    }
  }

  // 创建新用户 + 绑定
  const user = await prisma.user.create({
    data: {
      nickname: info.nickname || '',
      avatar: info.avatar,
      email: info.email,
      thirdPartyBindings: {
        create: { platform, platformUserId: info.platformUserId, unionId: info.unionId },
      },
    },
  });
  return { user, isRegistration: true };
}

export async function authRoutes(app: FastifyInstance) {
  // ======== 发送短信验证码 ========
  app.post('/api/v1/register/sendSmsCode', async (request, reply) => {
    const body = sendSmsSchema.parse(request.body);
    const code = generateCode();
    const expiresAt = dayjs().add(CODE_EXPIRE_MINUTES, 'minute').toDate();

    await prisma.verificationCode.create({
      data: { target: body.phone, code, type: 'sms', businessType: body.businessType, expiresAt },
    });
    await sendSms(body.phone, code);
    return success(reply, { expireTime: expiresAt.getTime() });
  });

  // ======== 发送邮箱验证码 ========
  app.post('/api/v1/register/sendEmailCode', async (request, reply) => {
    const body = sendEmailSchema.parse(request.body);
    const code = generateCode();
    const expiresAt = dayjs().add(CODE_EXPIRE_MINUTES, 'minute').toDate();

    await prisma.verificationCode.create({
      data: { target: body.email, code, type: 'email', businessType: body.businessType, expiresAt },
    });
    await sendEmail(body.email, code);
    return success(reply, { expireTime: expiresAt.getTime() });
  });


  // ======== 统一登录 ========
  app.post('/api/v1/register/unifiedLogin', async (request, reply) => {
    const body = unifiedLoginSchema.parse(request.body);
    const { loginType, phone, email, code, password } = body;

    // --- 短信验证码登录 ---
    if (loginType === 0 && phone && code) {
      const record = await prisma.verificationCode.findFirst({
        where: { target: phone, type: 'sms', code, verified: false, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
      });
      if (!record) return fail(reply, '验证码无效或已过期');
      await prisma.verificationCode.update({ where: { id: record.id }, data: { verified: true } });

      let user = await prisma.user.findUnique({ where: { phone } });
      const isRegistration = !user;
      if (!user) {
        user = await prisma.user.create({ data: { phone, nickname: phone.slice(-4) } });
      }
      const tokens = generateTokens(user.id);
      return success(reply, {
        loginResponse: { token: tokens, userId: user.id, userInfo: user, isCrossPlatformUser: false, twoVerificationResponses: [] },
        flowStatus: '0', needContinue: false, isRegistration,
      });
    }

    // --- 邮箱验证码登录 ---
    if (loginType === 1 && email && code) {
      const record = await prisma.verificationCode.findFirst({
        where: { target: email, type: 'email', code, verified: false, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
      });
      if (!record) return fail(reply, '验证码无效或已过期');
      await prisma.verificationCode.update({ where: { id: record.id }, data: { verified: true } });

      let user = await prisma.user.findUnique({ where: { email } });
      const isRegistration = !user;
      if (!user) {
        user = await prisma.user.create({ data: { email, nickname: email.split('@')[0] } });
      }
      const tokens = generateTokens(user.id);
      return success(reply, {
        loginResponse: { token: tokens, userId: user.id, userInfo: user, isCrossPlatformUser: false, twoVerificationResponses: [] },
        flowStatus: '0', needContinue: false, isRegistration,
      });
    }

    // --- 密码登录 ---
    if (loginType === 2 && (phone || email) && password) {
      const user = phone
        ? await prisma.user.findUnique({ where: { phone } })
        : await prisma.user.findUnique({ where: { email: email! } });
      if (!user || !user.password) return fail(reply, '账号或密码错误');
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return fail(reply, '账号或密码错误');

      const tokens = generateTokens(user.id);
      return success(reply, {
        loginResponse: { token: tokens, userId: user.id, userInfo: user, isCrossPlatformUser: false, twoVerificationResponses: [] },
        flowStatus: '0', needContinue: false, isRegistration: false,
      });
    }

    return fail(reply, '不支持的登录类型');
  });

  // ======== 第三方 SDK 登录 ========
  app.post('/api/v1/sdk/login', async (request, reply) => {
    const body = sdkLoginSchema.parse(request.body);
    let info: ThirdPartyUserInfo;

    switch (body.sdkType) {
      case 'apple':
        if (!body.idToken) return fail(reply, '缺少 idToken');
        info = await verifyAppleToken(body.idToken);
        break;
      case 'google':
        if (!body.idToken) return fail(reply, '缺少 idToken');
        info = await verifyGoogleToken(body.idToken);
        break;
      case 'wechat':
        if (!body.wechatCode) return fail(reply, '缺少微信授权 code');
        info = await getWechatUserByCode(body.wechatCode);
        break;
      case 'qq':
        if (!body.qqAccessToken || !body.qqOpenId) return fail(reply, '缺少 QQ 授权信息');
        info = await getQQUser(body.qqAccessToken, body.qqOpenId);
        break;
      default:
        return fail(reply, '不支持的登录类型');
    }

    const { user, isRegistration } = await findOrCreateByThirdParty(body.sdkType, info);
    const tokens = generateTokens(user.id);

    return success(reply, {
      loginResponse: { token: tokens, userId: user.id, userInfo: user, isCrossPlatformUser: false, twoVerificationResponses: [] },
      flowStatus: '0', needContinue: false, isRegistration,
    });
  });

  // ======== Token 刷新 ========
  app.post('/api/v1/auth/token/refresh', async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken?: string };
    if (!refreshToken) return fail(reply, '缺少 refreshToken', 401);
    try {
      const payload = verifyRefreshToken(refreshToken);
      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user) return fail(reply, '用户不存在', 401);
      const tokens = generateTokens(user.id);
      return success(reply, tokens);
    } catch {
      return fail(reply, 'Refresh Token 无效或已过期', 401);
    }
  });

  // ======== 获取用户信息 ========
  app.get('/api/v1/users/profile', { preHandler: requireAuth }, async (request, reply) => {
    const user = await prisma.user.findUnique({ where: { id: request.userId } });
    if (!user) return fail(reply, '用户不存在', 404);
    return success(reply, user);
  });
}