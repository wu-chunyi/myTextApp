import React, { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, Platform, Linking, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import InAppBrowser from 'react-native-inappbrowser-reborn';

import type { RootStackParamList } from '../../navigation/types';
import { getAppScheme } from '../../utils/environment';
import {
  continuePayment,
  PaymentMethod,
  type PaymentOrderInfo,
} from './api';
import { PaymentMethodSheet } from './PaymentMethodSheet';

type PaymentRouteProp = RouteProp<RootStackParamList, 'Payment'>;

/** 解析蓝新金流表单 HTML */
const parseNewebPayForm = (rawHtml: string) => {
  const formMatch = rawHtml.match(/<form[^>]*id=["']mainForm["'][^>]*action=["']([^"']+)["'][^>]*>([\s\S]*?)<\/form>/i);
  const formInnerHtml = formMatch?.[2] ?? rawHtml;
  const action = formMatch?.[1] ?? '';
  const field = (name: string) => {
    const inputMatch = formInnerHtml.match(
      new RegExp(`<input[^>]*name=["']${name}["'][^>]*value=["']([^"']*)["'][^>]*>`, 'i')
    );
    return inputMatch?.[1] ?? '';
  };
  return {
    action,
    MerchantID: field('MerchantID'),
    TradeInfo: field('TradeInfo'),
    TradeSha: field('TradeSha'),
    Version: field('Version'),
  };
};

export const PaymentScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<PaymentRouteProp>();
  const { paymentOrderId, orderId } = route.params;
  const redirectedRef = useRef(false);
  const [showMethodSheet, setShowMethodSheet] = useState(true);
  const [processing, setProcessing] = useState(false);
  // 从路由中或默认 100 作为演示金额
  const amount = 0;

  const navigateToResult = useCallback(
    (params: Record<string, string | undefined>) => {
      // @ts-ignore
      navigation.navigate('Payment/Result', { paymentOrderId, orderId, ...params });
    },
    [navigation, paymentOrderId, orderId]
  );

  // ---- 蓝新金流 ----
  const payWithNewebPay = async (data: PaymentOrderInfo) => {
    if (!data.paymentUrl || !data.paymentHtml) {
      throw new Error('支付 URL 或 HTML 为空');
    }
    const formData = parseNewebPayForm(data.paymentHtml);
    const qs = new URLSearchParams(formData as Record<string, string>);
    const url = `${data.paymentUrl}?${qs.toString()}`;

    if (Platform.OS === 'web') {
      // @ts-ignore
      window.location.href = url;
      return;
    }
    const available = await InAppBrowser.isAvailable();
    if (!available) { Linking.openURL(url); return; }

    const res = await InAppBrowser.openAuth(url, `${getAppScheme()}://Redirect`, {
      dismissButtonStyle: 'close', preferredBarTintColor: '#ffffff',
      preferredControlTintColor: '#000000', animated: true,
      modalPresentationStyle: 'fullScreen', modalEnabled: true,
      ephemeralWebSession: true, showTitle: false, toolbarColor: '#ffffff',
      enableUrlBarHiding: true, enableDefaultShare: false,
      forceCloseOnRedirection: true, hasBackButton: false, showInRecents: false,
    });
    if (redirectedRef.current) return;
    if (res.type === 'success') {
      navigateToResult({ businessOrderNo: data.businessOrderNo });
    } else {
      navigation.goBack();
    }
  };

  // ---- 微信支付 APP ----
  const payWithWechatApp = async (data: PaymentOrderInfo) => {
    if (data.wechatH5Url) {
      await payWithWechatH5(data);
      return;
    }
    throw new Error('微信 App 支付暂时关闭，请改用微信 H5 或其他支付方式');
  };

  // ---- 微信 H5 ----
  const payWithWechatH5 = async (data: PaymentOrderInfo) => {
    if (!data.wechatH5Url) throw new Error('微信H5支付URL缺失');
    await Linking.openURL(data.wechatH5Url);
    // H5 支付完成后会回调，前端轮询结果
    navigateToResult({ businessOrderNo: data.businessOrderNo });
  };

  // ---- 支付宝 APP ----
  const payWithAlipayApp = async (data: PaymentOrderInfo) => {
    if (!data.alipayOrderStr) throw new Error('支付宝支付参数缺失');
    // 支付宝 SDK 调起（需要原生模块桥接）
    // 如果没有原生 Alipay SDK，可以走 H5 降级
    await Linking.openURL(`alipays://platformapi/startapp?saId=10000007&orderStr=${encodeURIComponent(data.alipayOrderStr)}`);
    navigateToResult({ businessOrderNo: data.businessOrderNo });
  };

  // ---- 支付宝 H5 ----
  const payWithAlipayH5 = async (data: PaymentOrderInfo) => {
    if (!data.alipayH5Html) throw new Error('支付宝H5表单缺失');
    // 用 InAppBrowser 打开支付宝 H5 表单
    // 实际场景中，后端会返回一个可以直接跳转的 URL
    const available = await InAppBrowser.isAvailable();
    if (available) {
      await InAppBrowser.open(data.alipayH5Html, { showTitle: true, toolbarColor: '#1677FF' });
    } else {
      await Linking.openURL(data.alipayH5Html);
    }
    navigateToResult({ businessOrderNo: data.businessOrderNo });
  };

  // ---- 统一分发 ----
  const handleSelectMethod = useCallback(async (method: PaymentMethod) => {
    setShowMethodSheet(false);
    setProcessing(true);
    redirectedRef.current = false;

    try {
      if (!paymentOrderId) throw new Error('缺少支付单号');
      const data = await continuePayment({ paymentOrderId, paymentMethod: method });

      if (!data.amount) {
        navigateToResult({ businessOrderNo: data.businessOrderNo });
        return;
      }

      switch (method) {
        case PaymentMethod.WECHAT_APP:
          await payWithWechatApp(data);
          break;
        case PaymentMethod.WECHAT_H5:
          await payWithWechatH5(data);
          break;
        case PaymentMethod.ALIPAY_APP:
          await payWithAlipayApp(data);
          break;
        case PaymentMethod.ALIPAY_H5:
          await payWithAlipayH5(data);
          break;
        case PaymentMethod.NEWEBPAY:
        default:
          await payWithNewebPay(data);
          break;
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('支付失败', (error as Error).message);
      setShowMethodSheet(true);
    } finally {
      setProcessing(false);
    }
  }, [paymentOrderId, navigateToResult]);

  return (
    <View style={styles.container}>
      {processing && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#304000" />
          <Text style={styles.text}>支付处理中...</Text>
        </View>
      )}
      <PaymentMethodSheet
        visible={showMethodSheet}
        amount={amount}
        onSelect={handleSelectMethod}
        onClose={() => navigation.goBack()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingWrap: { alignItems: 'center', gap: 12 },
  text: { fontSize: 16, color: '#666', marginTop: 8 },
});

export default PaymentScreen;
