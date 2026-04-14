import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../navigation/types';
import {
  useVerificationCode,
  VerificationCodeType,
} from '../../hooks/useVerificationCode';
import { useUnifiedLogin } from './hooks/useUnifiedLogin';

type VerifyCodeRouteProp = RouteProp<RootStackParamList, 'Login/VerifyCode'>;

export const VerifyCodeScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<VerifyCodeRouteProp>();
  const { type, account, countryCode, redirect } = route.params;
  const [code, setCode] = useState('');
  const { handlePhoneLogin, handleEmailLogin } = useUnifiedLogin();

  const {
    sending,
    verifying,
    countdown,
    sendCode,
    verifyCode,
  } = useVerificationCode({
    type: type === 'phone' ? VerificationCodeType.PHONE : VerificationCodeType.EMAIL,
    account,
    countryCode,
    onVerifyRequest: async ({ code }) => {
      if (type === 'phone') {
        await handlePhoneLogin({ code, account, redirect });
      } else {
        await handleEmailLogin({ code, account, redirect });
      }
    },
  });

  // 进入页面自动发送验证码
  useEffect(() => {
    sendCode().catch((e) => {
      Alert.alert('发送失败', (e as Error).message);
    });
  }, []);

  const handleVerify = async () => {
    if (code.length < 4) return;
    try {
      await verifyCode(code);
    } catch (e) {
      Alert.alert('验证失败', (e as Error).message);
    }
  };

  // 自动验证（输入满 6 位）
  useEffect(() => {
    if (code.length === 6) {
      handleVerify();
    }
  }, [code]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>输入验证码</Text>
        <Text style={styles.subtitle}>
          验证码已发送至 {type === 'phone' ? `${countryCode} ${account}` : account}
        </Text>

        <TextInput
          style={styles.codeInput}
          placeholder="请输入验证码"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
        />

        <TouchableOpacity
          style={[styles.verifyBtn, (verifying || code.length < 4) && styles.btnDisabled]}
          onPress={handleVerify}
          disabled={verifying || code.length < 4}
        >
          <Text style={styles.verifyBtnText}>
            {verifying ? '验证中...' : '验证'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => sendCode()}
          disabled={countdown.isRunning || sending}
          style={styles.resendBtn}
        >
          <Text style={[styles.resendText, countdown.isRunning && styles.resendDisabled]}>
            {countdown.isRunning
              ? `重新发送 (${countdown.seconds}s)`
              : sending
                ? '发送中...'
                : '重新发送验证码'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 24 },
  title: { fontSize: 24, fontWeight: '700', color: '#333', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 32 },
  codeInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  verifyBtn: {
    backgroundColor: '#304000',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  btnDisabled: { opacity: 0.5 },
  verifyBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  resendBtn: { alignItems: 'center', marginTop: 24 },
  resendText: { fontSize: 14, color: '#304000', fontWeight: '500' },
  resendDisabled: { color: '#999' },
});

export default VerifyCodeScreen;
