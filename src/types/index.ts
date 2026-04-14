/**
 * 短信业务类型
 */
export enum CodeBusinessType {
  /** 注册/登录验证码 */
  REGISTER_LOGIN_CODE = 0,
  /** 换绑验证码 */
  REBIND_CODE = 1,
  /** 商家验证码 */
  BUSINESS_CODE = 2,
}

/**
 * 登录方式（用于埋点）
 */
export type LoginMethod = 'phone' | 'email' | 'apple' | 'google' | 'line' | 'fetnet' | 'password';

/**
 * 环境类型
 */
export type Environment = 'LOCAL' | 'DEV' | 'PRE' | 'RC' | 'ONLINE';
