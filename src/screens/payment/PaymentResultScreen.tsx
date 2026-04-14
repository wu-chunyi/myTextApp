import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../navigation/types';
import { getPaymentStatus, PayStatus } from './api';

type ResultRouteProp = RouteProp<RootStackParamList, 'Payment/Result'>;

export const PaymentResultScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<ResultRouteProp>();
  const { businessOrderNo, orderId } = route.params;
  const [status, setStatus] = useState<PayStatus>(PayStatus.PROCESSING);
  const [amount, setAmount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!businessOrderNo && !orderId) {
      setStatus(PayStatus.FAILED);
      return;
    }

    let pollCount = 0;
    const maxPollCount = 30;
    const pollInterval = 2000;
    const timeoutDuration = 60000;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    const startTime = Date.now();

    const checkStatus = async () => {
      try {
        const result = await getPaymentStatus(businessOrderNo || orderId);
        if (result.status === PayStatus.SUCCESS) {
          setStatus(PayStatus.SUCCESS);
          setAmount(result.amount || 0);
          if (pollTimer) clearInterval(pollTimer);
        } else if (
          result.status === PayStatus.PENDING ||
          result.status === PayStatus.PROCESSING
        ) {
          pollCount++;
          if (Date.now() - startTime >= timeoutDuration) {
            setStatus(PayStatus.TIMEOUT);
            setErrorMessage('订单处理超时');
            if (pollTimer) clearInterval(pollTimer);
          } else if (pollCount >= maxPollCount) {
            setStatus(PayStatus.FAILED);
            setErrorMessage(result.errorMessage || '查询支付状态失败');
            if (pollTimer) clearInterval(pollTimer);
          } else if (!pollTimer) {
            pollTimer = setInterval(checkStatus, pollInterval);
          }
        } else {
          setStatus(PayStatus.FAILED);
          setErrorMessage(result.errorMessage || '');
          if (pollTimer) clearInterval(pollTimer);
        }
      } catch {
        pollCount++;
        if (pollCount >= maxPollCount) {
          setStatus(PayStatus.FAILED);
          setErrorMessage('查询支付状态失败，请稍后重试');
          if (pollTimer) clearInterval(pollTimer);
        } else if (!pollTimer) {
          pollTimer = setInterval(checkStatus, pollInterval);
        }
      }
    };

    checkStatus();
    return () => { if (pollTimer) clearInterval(pollTimer); };
  }, [businessOrderNo, orderId]);

  const handleClose = () => navigation.goBack();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose}>
          <Text style={styles.doneText}>完成</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {status === PayStatus.PROCESSING && (
          <>
            <ActivityIndicator size="large" color="#304000" />
            <Text style={styles.statusText}>支付中...</Text>
          </>
        )}
        {status === PayStatus.SUCCESS && (
          <>
            <View style={styles.successIcon}>
              <Text style={styles.checkmark}>✓</Text>
            </View>
            <Text style={styles.statusText}>付款成功</Text>
            <Text style={styles.amountText}>${amount}</Text>
          </>
        )}
        {status === PayStatus.TIMEOUT && (
          <>
            <Text style={styles.statusText}>订单处理超时</Text>
            <Text style={styles.errorText}>付款结果以订单状态为准</Text>
          </>
        )}
        {status === PayStatus.FAILED && (
          <>
            <View style={styles.failIcon}>
              <Text style={styles.exclamation}>!</Text>
            </View>
            <Text style={styles.statusText}>付款失败</Text>
            <Text style={styles.errorText}>
              {errorMessage || '您的订单还未完成支付，请尽快支付。'}
            </Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { alignItems: 'flex-end', padding: 16 },
  doneText: { fontSize: 16, color: '#333' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  statusText: { fontSize: 18, fontWeight: '600', color: '#333', marginTop: 16 },
  amountText: { fontSize: 16, color: '#666', marginTop: 8 },
  errorText: { fontSize: 14, color: '#666', marginTop: 8, textAlign: 'center' },
  successIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#CAE05A', justifyContent: 'center', alignItems: 'center',
  },
  checkmark: { fontSize: 36, color: '#304000', fontWeight: '700' },
  failIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#FF8B1E', justifyContent: 'center', alignItems: 'center',
  },
  exclamation: { fontSize: 36, color: '#fff', fontWeight: '700' },
});

export default PaymentResultScreen;
