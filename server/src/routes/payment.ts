import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { prisma } from '../lib/prisma';
import { success, fail } from '../lib/response';
import { requireAuth } from '../middleware/auth';
import { createWechatAppOrder, createWechatH5Order, verifyWechatNotification } from '../services/payment/wechatPay';
import { createAlipayAppOrder, createAlipayH5Order, verifyAlipayNotification } from '../services/payment/alipay';

const NOTIFY_BASE_URL = process.env.NOTIFY_BASE_URL || 'https://api.example.com';

const continuePaymentSchema = z.object({
  paymentOrderId: z.string(),
  paymentMethod: z.enum(['wechat_app', 'wechat_h5', 'alipay_app', 'alipay_h5', 'newebpay']).optional(),
});

export async function paymentRoutes(app: FastifyInstance) {

  // ======== 继续支付 / 创建支付 ========
  app.post('/api/v1/payment/continue', { preHandler: requireAuth }, async (request, reply) => {
    const body = continuePaymentSchema.parse(request.body);
    const payment = await prisma.payment.findUnique({
      where: { paymentOrderId: body.paymentOrderId },
      include: { order: true },
    });
    if (!payment) return fail(reply, '支付单不存在', 404);
    if (payment.status === 'success') return fail(reply, '该订单已支付');

    const method = body.paymentMethod || payment.paymentMethod;
    const amount = Number(payment.amount);
    const description = `订单 ${payment.order.orderNo}`;
    const outTradeNo = payment.paymentOrderId;

    // 更新支付方式
    if (body.paymentMethod && body.paymentMethod !== payment.paymentMethod) {
      await prisma.payment.update({ where: { id: payment.id }, data: { paymentMethod: body.paymentMethod } });
    }

    const result: Record<string, unknown> = {
      success: true,
      status: 'pending',
      paymentOrderId: payment.paymentOrderId,
      businessOrderNo: payment.order.orderNo,
      amount,
      paymentMethod: method,
    };

    switch (method) {
      case 'wechat_app': {
        const params = await createWechatAppOrder({
          outTradeNo, amount: Math.round(amount * 100),
          description, notifyUrl: `${NOTIFY_BASE_URL}/api/v1/payment/notify/wechat`,
        });
        result.wechatPayParams = params;
        break;
      }
      case 'wechat_h5': {
        const clientIp = (request.headers['x-forwarded-for'] as string)?.split(',')[0] || request.ip;
        const { h5Url } = await createWechatH5Order({
          outTradeNo, amount: Math.round(amount * 100),
          description, notifyUrl: `${NOTIFY_BASE_URL}/api/v1/payment/notify/wechat`, clientIp,
        });
        result.wechatH5Url = h5Url;
        break;
      }
      case 'alipay_app': {
        const orderStr = createAlipayAppOrder({
          outTradeNo, amount: amount.toFixed(2),
          subject: description, notifyUrl: `${NOTIFY_BASE_URL}/api/v1/payment/notify/alipay`,
        });
        result.alipayOrderStr = orderStr;
        break;
      }
      case 'alipay_h5': {
        const h5Url = createAlipayH5Order({
          outTradeNo, amount: amount.toFixed(2),
          subject: description,
          notifyUrl: `${NOTIFY_BASE_URL}/api/v1/payment/notify/alipay`,
          returnUrl: `${NOTIFY_BASE_URL}/pages/redirect?businessOrderNo=${payment.order.orderNo}`,
        });
        result.alipayH5Html = h5Url;
        break;
      }
      case 'newebpay':
      default: {
        // TODO: 蓝新金流预下单，返回 paymentHtml + paymentUrl
        result.paymentHtml = '<form id="mainForm"><!-- 蓝新表单 --></form>';
        result.paymentUrl = 'https://ccore.newebpay.com/MPG/mpg_gateway';
        break;
      }
    }

    return success(reply, result);
  });

  // ======== 查询支付状态 ========
  app.get('/api/v1/payment/getPayInfo', async (request, reply) => {
    const { businessOrderNo } = request.query as { businessOrderNo?: string };
    if (!businessOrderNo) return fail(reply, '缺少 businessOrderNo');

    const order = await prisma.order.findUnique({ where: { orderNo: businessOrderNo } });
    if (!order) return fail(reply, '订单不存在', 404);

    const payment = await prisma.payment.findFirst({
      where: { orderId: order.id },
      orderBy: { createdAt: 'desc' },
    });

    return success(reply, {
      status: payment?.status?.toUpperCase() || 'PENDING',
      amount: payment ? Number(payment.amount) : 0,
      businessOrderNo: order.orderNo,
      errorMessage: payment?.errorMessage,
    });
  });

  // ======== 微信支付回调 ========
  app.post('/api/v1/payment/notify/wechat', async (request, reply) => {
    try {
      const body = request.body as { resource?: { ciphertext?: string; associated_data?: string; nonce?: string } };
      // TODO: 解密 body.resource 获取 out_trade_no 和 trade_state
      // verifyWechatNotification(...)

      const outTradeNo: string = ''; // TODO: 从解密后的数据中获取
      const tradeState: string = ''; // SUCCESS / CLOSED / ...

      if (outTradeNo && tradeState === 'SUCCESS') {
        await prisma.payment.update({
          where: { paymentOrderId: outTradeNo },
          data: { status: 'success', paidAt: new Date() },
        });
        // 更新订单状态
        const payment = await prisma.payment.findUnique({ where: { paymentOrderId: outTradeNo } });
        if (payment) {
          await prisma.order.update({ where: { id: payment.orderId }, data: { status: 'paid' } });
        }
      }

      return reply.send({ code: 'SUCCESS', message: '成功' });
    } catch (error) {
      console.error('微信支付回调处理失败:', error);
      return reply.status(500).send({ code: 'FAIL', message: '处理失败' });
    }
  });

  // ======== 支付宝回调 ========
  app.post('/api/v1/payment/notify/alipay', async (request, reply) => {
    try {
      const params = request.body as Record<string, string>;

      // 验签
      if (!verifyAlipayNotification(params)) {
        return reply.send('fail');
      }

      const outTradeNo = params.out_trade_no;
      const tradeStatus = params.trade_status;

      if (outTradeNo && (tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED')) {
        await prisma.payment.update({
          where: { paymentOrderId: outTradeNo },
          data: {
            status: 'success',
            thirdPartyOrderNo: params.trade_no,
            paidAt: new Date(),
          },
        });
        const payment = await prisma.payment.findUnique({ where: { paymentOrderId: outTradeNo } });
        if (payment) {
          await prisma.order.update({ where: { id: payment.orderId }, data: { status: 'paid' } });
        }
      }

      return reply.send('success');
    } catch (error) {
      console.error('支付宝回调处理失败:', error);
      return reply.send('fail');
    }
  });

  // ======== 系统维护状态 ========
  app.get('/api/v1/system/maintenance', async (_request, reply) => {
    const records = await prisma.systemMaintenance.findMany();
    const globalRecord = records.find((r: any) => r.module === 'global');
    const modules: Record<string, { underMaintenance: boolean; message?: string | null }> = {};
    records.forEach((r: any) => { modules[r.module] = { underMaintenance: r.underMaintenance, message: r.message }; });

    return success(reply, {
      underMaintenance: globalRecord?.underMaintenance || false,
      lowestVersion: globalRecord?.lowestVersion,
      message: globalRecord?.message,
      modules,
    });
  });
}
