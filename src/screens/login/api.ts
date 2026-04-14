import { request } from '../../services/request';
import { tokenManager, type AuthToken } from '../../services/tokenManager';
import { useUserStore } from '../../store/userStore';
import type { CodeBusinessType } from '../../types';
import type {
  LoginType,
  ThirdPartyType,
  UnifiedLoginResponse,
} from './types';

interface DeviceInfo {
  deviceId: string;
  deviceType: string | null;
  deviceName: string | null;
  osVersion: string | null;
  appVersion: string | null;
}

// ---- 验证码 API ----

interface SendCodeResponse {
  expireTime: number;
}

export const sendSmsCode = (params: { phone: string; businessType?: CodeBusinessType }) =>
  request.post<SendCodeResponse>('/api/v1/register/sendSmsCode', params);

export const sendEmailCode = (params: { email: string; businessType?: CodeBusinessType }) =>
  request.post<SendCodeResponse>('/api/v1/register/sendEmailCode', params);

// ---- 统一登录 API ----

interface UnifiedLoginRequest {
  loginType: LoginType;
  flowStatus?: number;
  phone?: string;
  email?: string;
  code?: string;
  password?: string;
  deviceInfo?: DeviceInfo;
  temporaryToken?: string;
  accountUseFlag?: boolean;
  businessType?: CodeBusinessType;
  secondaryVerificationToken?: string;
}

/**
 * 统一登录成功后的连锁操作
 */
const handleUnifiedResponse = async (data: UnifiedLoginResponse) => {
  if (data.loginResponse?.token) {
    // 1. 保存 Token
    tokenManager.saveTokens(data.loginResponse.token);
    // 2. 清除访客标识
    tokenManager.clearGuestTokens();

    const { userId } = data.loginResponse;
    if (!userId) {
      throw new Error('登录失败，用户ID不存在');
    }

    // 3. TODO: 埋点 - Analytics
    // 4. TODO: Sentry setUser
    // 5. TODO: 注册推送 Device Token
    // 6. 拉取用户信息
    useUserStore.getState().fetchUserProfile();
  }
};

/**
 * 统一登录
 */
export const unifiedLogin = async (params: UnifiedLoginRequest): Promise<UnifiedLoginResponse> => {
  const data = await request.post<UnifiedLoginResponse>(
    '/api/v1/register/unifiedLogin',
    params
  );
  await handleUnifiedResponse(data);
  return data;
};

// ---- 第三方 SDK 登录 ----

export interface ThirdPartySDKLoginRequest {
  sdkType: ThirdPartyType;
  /** Apple idToken */
  idToken?: string | null;
  /** Apple authorizationCode */
  authorizationCode?: string | null;
  /** 微信授权 code */
  wechatCode?: string;
  /** QQ accessToken */
  qqAccessToken?: string;
  /** QQ openId */
  qqOpenId?: string;
}

export const thirdPartySDKLogin = async (
  params: ThirdPartySDKLoginRequest
): Promise<UnifiedLoginResponse> => {
  const data = await request.post<UnifiedLoginResponse>(
    '/api/v1/sdk/login',
    params
  );
  await handleUnifiedResponse(data);
  return data;
};

// ---- 第三方 OAuth 重定向 ----

export const getThirdPartyLoginPath = (type: ThirdPartyType): string => {
  return `/api/v1/login/${type}`;
};

export const getThirdPartyBindPath = (type: ThirdPartyType): string => {
  return `/api/v1/bind/${type}`;
};

// ---- 密码登录 ----

export const loginWithPassword = (params: {
  account: string;
  password: string;
  deviceInfo?: DeviceInfo;
  businessType?: CodeBusinessType;
}) => request.post<UnifiedLoginResponse>('/api/v1/users/login', params);

// ---- Token 刷新 ----

export const refreshToken = (refreshTokenStr: string) =>
  request.post<AuthToken>('/api/v1/auth/token/refresh', { refreshToken: refreshTokenStr });
