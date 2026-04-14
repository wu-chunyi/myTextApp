import axios from 'axios';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface ThirdPartyUserInfo {
  platformUserId: string;
  unionId?: string;
  nickname?: string;
  avatar?: string;
  email?: string;
}

// ---- 微信 ----

export async function getWechatUserByCode(code: string): Promise<ThirdPartyUserInfo> {
  // 1. code 换 access_token
  const tokenRes = await axios.get('https://api.weixin.qq.com/sns/oauth2/access_token', {
    params: {
      appid: config.wechat.appId,
      secret: config.wechat.appSecret,
      code,
      grant_type: 'authorization_code',
    },
  });
  const { access_token, openid, unionid } = tokenRes.data;
  if (!access_token) throw new Error(`微信授权失败: ${tokenRes.data.errmsg}`);

  // 2. 获取用户信息
  const userRes = await axios.get('https://api.weixin.qq.com/sns/userinfo', {
    params: { access_token, openid, lang: 'zh_CN' },
  });

  return {
    platformUserId: openid,
    unionId: unionid || userRes.data.unionid,
    nickname: userRes.data.nickname,
    avatar: userRes.data.headimgurl,
  };
}

// ---- QQ ----

export async function getQQUser(accessToken: string, openId: string): Promise<ThirdPartyUserInfo> {
  const userRes = await axios.get('https://graph.qq.com/user/get_user_info', {
    params: {
      access_token: accessToken,
      oauth_consumer_key: config.qq.appId,
      openid: openId,
      format: 'json',
    },
  });
  if (userRes.data.ret !== 0) {
    throw new Error(`QQ 获取用户信息失败: ${userRes.data.msg}`);
  }

  return {
    platformUserId: openId,
    nickname: userRes.data.nickname,
    avatar: userRes.data.figureurl_qq_2 || userRes.data.figureurl_qq_1,
  };
}

// ---- Apple ----

export async function verifyAppleToken(idToken: string): Promise<ThirdPartyUserInfo> {
  // 解码 idToken（Apple 的 JWT）
  const decoded = jwt.decode(idToken, { complete: true });
  if (!decoded?.payload) throw new Error('Apple idToken 解码失败');

  const payload = decoded.payload as {
    sub: string;       // Apple 用户唯一标识
    email?: string;
    email_verified?: string;
  };

  // 生产环境应该验证签名：从 https://appleid.apple.com/auth/keys 获取公钥验证
  // TODO: 添加签名验证

  return {
    platformUserId: payload.sub,
    email: payload.email,
  };
}

// ---- Google ----

export async function verifyGoogleToken(idToken: string): Promise<ThirdPartyUserInfo> {
  const res = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
  if (!res.data.sub) throw new Error('Google Token 验证失败');

  return {
    platformUserId: res.data.sub,
    email: res.data.email,
    nickname: res.data.name,
    avatar: res.data.picture,
  };
}
