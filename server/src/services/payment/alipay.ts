import crypto from 'crypto';
import dayjs from 'dayjs';
import { config } from '../../config';

/**
 * 构造支付宝 APP 支付 orderStr
 */
export function createAlipayAppOrder(params: {
  outTradeNo: string;
  amount: string; // 单位：元，如 "0.01"
  subject: string;
  notifyUrl: string;
}): string {
  const bizContent = JSON.stringify({
    out_trade_no: params.outTradeNo,
    total_amount: params.amount,
    subject: params.subject,
    product_code: 'QUICK_MSECURITY_PAY',
  });

  const commonParams: Record<string, string> = {
    app_id: config.alipay.appId,
    method: 'alipay.trade.app.pay',
    charset: 'utf-8',
    sign_type: 'RSA2',
    timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    version: '1.0',
    notify_url: params.notifyUrl,
    biz_content: bizContent,
  };

  // 排序 + 拼接
  const sortedKeys = Object.keys(commonParams).sort();
  const signStr = sortedKeys.map((k) => `${k}=${commonParams[k]}`).join('&');

  // RSA2 签名
  const sign = crypto
    .createSign('RSA-SHA256')
    .update(signStr, 'utf-8')
    .sign(config.alipay.privateKey, 'base64');

  commonParams.sign = sign;

  // 拼接最终 orderStr
  const orderStr = Object.keys(commonParams)
    .map((k) => `${k}=${encodeURIComponent(commonParams[k])}`)
    .join('&');

  return orderStr;
}

/**
 * 构造支付宝 H5 支付表单
 */
export function createAlipayH5Order(params: {
  outTradeNo: string;
  amount: string;
  subject: string;
  notifyUrl: string;
  returnUrl: string;
}): string {
  const bizContent = JSON.stringify({
    out_trade_no: params.outTradeNo,
    total_amount: params.amount,
    subject: params.subject,
    product_code: 'FAST_INSTANT_TRADE_PAY',
  });

  const commonParams: Record<string, string> = {
    app_id: config.alipay.appId,
    method: 'alipay.trade.wap.pay',
    charset: 'utf-8',
    sign_type: 'RSA2',
    timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    version: '1.0',
    notify_url: params.notifyUrl,
    return_url: params.returnUrl,
    biz_content: bizContent,
  };

  const sortedKeys = Object.keys(commonParams).sort();
  const signStr = sortedKeys.map((k) => `${k}=${commonParams[k]}`).join('&');

  const sign = crypto
    .createSign('RSA-SHA256')
    .update(signStr, 'utf-8')
    .sign(config.alipay.privateKey, 'base64');

  commonParams.sign = sign;

  // 返回跳转 URL
  const query = Object.keys(commonParams)
    .map((k) => `${k}=${encodeURIComponent(commonParams[k])}`)
    .join('&');

  return `https://openapi.alipay.com/gateway.do?${query}`;
}

/** 验证支付宝回调签名 */
export function verifyAlipayNotification(_params: Record<string, string>): boolean {
  // TODO: 用支付宝公钥验签
  return true;
}
