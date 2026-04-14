import { request } from '../../services/request';

// ---- 支付方式 ----

export enum PaymentMethod {
  /** 微信支付 APP */
  WECHAT_APP = 'wechat_app',
  /** 微信支付 H5 */
  WECHAT_H5 = 'wechat_h5',
  /** 支付宝 APP */
  ALIPAY_APP = 'alipay_app',
  /** 支付宝 H5 */
  ALIPAY_H5 = 'alipay_h5',
  /** 蓝新金流（台湾） */
  NEWEBPAY = 'newebpay',
}

export enum PayStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  TIMEOUT = 'TIMEOUT',
}

// ---- 支付相关接口类型 ----

export interface PaymentOrderInfo {
  success: boolean;
  status: PayStatus;
  errorMessage?: string | null;
  paymentOrderId?: string;
  businessOrderNo?: string;
  amount?: number;
  /** 蓝新金流表单 HTML */
  paymentHtml?: string | null;
  /** 蓝新金流跳转 URL */
  paymentUrl?: string | null;
  /** 微信支付 APP 调起参数 */
  wechatPayParams?: WechatPayParams | null;
  /** 微信 H5 支付跳转 URL */
  wechatH5Url?: string | null;
  /** 支付宝 APP 调起 orderStr */
  alipayOrderStr?: string | null;
  /** 支付宝 H5 表单 HTML */
  alipayH5Html?: string | null;
  /** 实际使用的支付方式 */
  paymentMethod?: PaymentMethod;
}

/** 微信支付 APP 调起所需参数（后端预下单返回） */
export interface WechatPayParams {
  appId: string;
  partnerId: string;
  prepayId: string;
  nonceStr: string;
  timeStamp: string;
  package: string;
  sign: string;
}

export interface CreatePaymentRequest {
  orderId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  /** 微信 JSAPI 支付需要 */
  openId?: string;
}

// ---- 支付 API ----

/**
 * 创建支付单（统一支付网关）
 * 后端根据 paymentMethod 走不同支付渠道
 */
export const createPayment = (params: CreatePaymentRequest) =>
  request.post<PaymentOrderInfo>('/api/v1/payment/create', params);

/**
 * 继续支付（获取支付表单/参数）
 */
export const continuePayment = (params: { paymentOrderId: string; paymentMethod?: PaymentMethod }) =>
  request.post<PaymentOrderInfo>('/api/v1/payment/continue', params);

/**
 * 查询支付状态（前端轮询）
 */
export const getPaymentStatus = (
  businessOrderNo?: string,
  thirdPartyOrderNo?: string
) => {
  if (businessOrderNo) {
    return request.get<PaymentOrderInfo>('/api/v1/payment/getPayInfo', { businessOrderNo });
  }
  if (thirdPartyOrderNo) {
    return request.get<PaymentOrderInfo>('/api/v1/payment/getPayInfoByThirdOrderNo', { thirdPartyOrderNo });
  }
  throw new Error('businessOrderNo or thirdPartyOrderNo is required');
};

/**
 * 重试支付
 */
export const retryPayment = (params: { businessOrderNo: string; paymentMethod?: PaymentMethod }) =>
  request.post<PaymentOrderInfo>('/api/v1/payment/retry', params);
