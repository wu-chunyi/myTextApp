import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { tokenManager } from '../../services/tokenManager';
import { ThirdPartyType } from './types';
import { useUnifiedLogin } from './hooks/useUnifiedLogin';

/** 验证手机号格式（台湾） */
const validatePhone = (phone: string) => /^09\d{8}$/.test(phone);
/** 验证邮箱格式 */
const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const [account, setAccount] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { handleAppleLogin, handleWechatLogin, handleQQLogin } = useUnifiedLogin();

  useEffect(() => {
    if (tokenManager.isLogin) {
      navigation.reset({ index: 0, routes: [{ name: 'Main' as never }] });
    }
  }, []);

  const handleSubmit = () => {
    if (!account) {
      setErrorMsg('请输入手机号或Email');
      return;
    }
    const isPhone = validatePhone(account);
    const isEmail = validateEmail(account);
    if (!isPhone && !isEmail) {
      setErrorMsg('请填写正确格式的手机号或Email');
      return;
    }

    Keyboard.dismiss();
    // @ts-ignore - dynamic navigation
    navigation.navigate('Login/VerifyCode', {
      type: isEmail ? 'email' : 'phone',
      account,
      countryCode: '+886',
    });
  };

  /** 第三方 SDK 登录统一入口 */
  const handleSDKLogin = async (handler: () => Promise<void>) => {
    setLoading(true);
    try {
      await handler();
    } catch (e) {
      if ((e as { code?: string })?.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('登录失败', (e as Error).message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleThirdPartyLogin = async (type: ThirdPartyType | 'password') => {
    Keyboard.dismiss();
    switch (type) {
      case ThirdPartyType.APPLE:
        return handleSDKLogin(() => handleAppleLogin());
      case ThirdPartyType.WECHAT:
        return handleSDKLogin(() => handleWechatLogin());
      case ThirdPartyType.QQ:
        return handleSDKLogin(() => handleQQLogin());
      case 'password':
        // @ts-ignore
        navigation.navigate('Login/PasswordLogin');
        return;
      default:
        // Google / LINE 等走 OAuth WebView
        // @ts-ignore
        navigation.navigate('Login/ThirdPartyLogin', { type });
    }
  };

  const handleSkip = () => {
    // @ts-ignore
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  return (
    <LinearGradient colors={['#FFFFFF', '#FFFFFF', '#F0F8E0']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>略过</Text>
          </TouchableOpacity>
        </View>

        {/* Logo */}
        <View style={styles.logoArea}>
          <Text style={styles.logoText}>MyTestApp</Text>
          <Text style={styles.sloganText}>欢迎使用</Text>
        </View>

        {/* 输入区 */}
        <View style={styles.inputArea}>
          <TextInput
            style={[styles.input, errorMsg ? styles.inputError : null]}
            placeholder="请输入手机号或Email"
            value={account}
            onChangeText={(text) => { setAccount(text); setErrorMsg(''); }}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />
          {!!errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitBtnText}>继续</Text>
          </TouchableOpacity>
        </View>

        {/* 分隔线 */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>使用其他方式登录</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* 第三方登录 */}
        <View style={styles.thirdPartyRow}>
          <ThirdPartyBtn label="微信" onPress={() => handleThirdPartyLogin(ThirdPartyType.WECHAT)} />
          <ThirdPartyBtn label="QQ" onPress={() => handleThirdPartyLogin(ThirdPartyType.QQ)} />
          {Platform.OS === 'ios' && (
            <ThirdPartyBtn label="Apple" onPress={() => handleThirdPartyLogin(ThirdPartyType.APPLE)} />
          )}
          {Platform.OS !== 'ios' && (
            <ThirdPartyBtn label="Google" onPress={() => handleThirdPartyLogin(ThirdPartyType.GOOGLE)} />
          )}
          <ThirdPartyBtn label="密码" onPress={() => handleThirdPartyLogin('password')} />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const ThirdPartyBtn = ({ label, onPress }: { label: string; onPress: () => void }) => (
  <TouchableOpacity style={styles.tpBtn} onPress={onPress}>
    <Text style={styles.tpBtnText}>{label}</Text>
  </TouchableOpacity>
);


const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'flex-end' },
  skipText: { fontSize: 14, color: '#666', padding: 8 },
  logoArea: { alignItems: 'center', marginTop: 40, marginBottom: 50 },
  logoText: { fontSize: 28, fontWeight: '800', color: '#333' },
  sloganText: { fontSize: 14, color: '#999', marginTop: 4 },
  inputArea: { width: '100%' },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputError: { borderColor: '#FF4444' },
  errorText: { color: '#FF4444', fontSize: 12, marginTop: 4, marginLeft: 4 },
  submitBtn: {
    backgroundColor: '#304000',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  dividerText: { marginHorizontal: 12, fontSize: 12, color: '#999' },
  thirdPartyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  tpBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tpBtnText: { fontSize: 12, color: '#333', fontWeight: '500' },
});

export default LoginScreen;