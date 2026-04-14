/**
 * 用户信息接口
 */
export interface UserInfo {
  username: string;
  nickname: string;
  phone?: string;
  email?: string;
  avatar?: string;
  displayUid?: string;
  couponCount?: number;
  userId?: number;
}

/**
 * 登录类型枚举
 */
export enum LoginType {
  /** 短信验证码登录 */
  SMS_CODE = 0,
  /** 邮箱验证码登录 */
  EMAIL_CODE = 1,
  /** 账号密码登录 */
  PASSWORD = 2,
  /** 第三方登录 */
  THIRD_PARTY = 3,
  /** 统一登录流程 */
  UNIFIED = 4,
}

/**
 * 验证方式枚举
 */
export enum VerificationType {
  SMS_CODE = 'SMS_CODE',
  EMAIL_CODE = 'EMAIL_CODE',
  PASSWORD = 'PASSWORD',
}

/**
 * 第三方平台类型
 */
export enum ThirdPartyType {
  GOOGLE = 'google',
  LINE = 'line',
  APPLE = 'apple',
  FACEBOOK = 'facebook',
  WECHAT = 'wechat',
  QQ = 'qq',
  ALIPAY = 'alipay',
}

/**
 * 二次验证响应
 */
export interface TwoVerificationResponse {
  verificationType: 'SMS_CODE' | 'EMAIL_CODE' | 'PASSWORD';
  maskedTarget: string;
}

/**
 * Auth Token
 */
export interface AuthTokenRef {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}

/**
 * 登录响应
 */
export interface LoginResponse {
  token: AuthTokenRef;
  secondaryVerificationToken?: string;
  userId?: number;
  userInfo?: UserInfo;
  isCrossPlatformUser: boolean;
  twoVerificationResponses: TwoVerificationResponse[];
}

/**
 * 统一登录响应
 */
export interface UnifiedLoginResponse {
  loginResponse?: LoginResponse;
  flowStatus: string;
  needContinue: boolean;
  nextStepHint?: string;
  temporaryToken?: string;
  phoneExistsResponse?: {
    userId: string;
    phone: string;
    userInfo?: UserInfo;
  };
  isRegistration?: boolean;
  initialLoginMethod?: string;
}
