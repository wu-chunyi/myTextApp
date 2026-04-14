/**
 * 短信 & 邮件发送服务
 *
 * 开发/自用模式：验证码直接打印到控制台 + 固定验证码 "123456"
 * 生产模式：对接实际短信/邮件服务
 */

const isDev = process.env.NODE_ENV !== 'production';

/** 开发模式固定验证码，方便测试不用每次看控制台 */
const DEV_FIXED_CODE = isDev ? '123456' : null;

export function generateCode(): string {
  if (DEV_FIXED_CODE) return DEV_FIXED_CODE;
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendSms(phone: string, code: string): Promise<void> {
  if (isDev) {
    console.log(`\n📱 ============================`);
    console.log(`📱  短信验证码: ${code}`);
    console.log(`📱  发送至: ${phone}`);
    console.log(`📱 ============================\n`);
    return;
  }
  // 生产环境：对接腾讯云短信 ¥0.04/条
  // const tencentcloud = require('tencentcloud-sdk-nodejs-sms');
  // ...
  console.log(`[SMS] ${code} → ${phone}`);
}

export async function sendEmail(email: string, code: string): Promise<void> {
  if (isDev) {
    console.log(`\n📧 ============================`);
    console.log(`📧  邮件验证码: ${code}`);
    console.log(`📧  发送至: ${email}`);
    console.log(`📧 ============================\n`);
    return;
  }
  // 生产环境：nodemailer + QQ邮箱（免费）或 Resend（免费3000条/月）
  // import nodemailer from 'nodemailer';
  // ...
  console.log(`[EMAIL] ${code} → ${email}`);
}
