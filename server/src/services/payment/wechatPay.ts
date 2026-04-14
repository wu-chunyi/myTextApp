import crypto from 'crypto';
import axios from 'axios';
import { config } from '../../config';

const BASE_URL = 'https://api.mch.weixin.qq.com/v3';

/** 微信支付 APP 预下单 */
export async function createWechatAppOrder(params: {
  outTradeNo: string;
  amount: number; // 单位：分
  description: string;
  notifyUrl: string;
}) {
  const body = {
    appid: config.wechat.appId,
    mchid: config.wechat.mchId,
    description: params.description,
    out_trade_no: params.outTradeNo,
    notify_url: params.notifyUrl,
    amount: { total: params.amount, currency: 'CNY' },
  };

  // TODO: 实际需要用商户私钥签名请求
  const res = await axios.post(`${BASE_URL}/pay/transactions/app`, body, {
    headers: { 'Content-Type': 'application/json' },
  });

  const prepayId = res.data.prepay_id;
  const timeStamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = crypto.randomBytes(16).toString('hex');

  // 构造 APP 调起支付的签名
  const signStr = `${config.wechat.appId}\n${timeStamp}\n${nonceStr}\n${prepayId}\n`;
  // TODO: 用商户私钥 RSA 签名
  const sign = ''; // 需要私钥签名

  return {
    appId: config.wechat.appId,
    partnerId: config.wechat.mchId,
    prepayId,
    nonceStr,
    timeStamp,
    package: 'Sign=WXPay',
    sign,
  };
}

/** 微信支付 H5 预下单 */
export async function createWechatH5Order(params: {
  outTradeNo: string;
  amount: number;
  description: string;
  notifyUrl: string;
  clientIp: string;
}) {
  const body = {
    appid: config.wechat.appId,
    mchid: config.wechat.mchId,
    description: params.description,
    out_trade_no: params.outTradeNo,
    notify_url: params.notifyUrl,
    amount: { total: params.amount, currency: 'CNY' },
    scene_info: {
      payer_client_ip: params.clientIp,
      h5_info: { type: 'Wap' },
    },
  };

  const res = await axios.post(`${BASE_URL}/pay/transactions/h5`, body, {
    headers: { 'Content-Type': 'application/json' },
  });

  return { h5Url: res.data.h5_url as string };
}

/** 验证微信支付回调签名 */
export function verifyWechatNotification(_headers: Record<string, string>, _body: string): boolean {
  // TODO: 用微信平台证书验签
  return true;
}
