import { useNavigation } from '@react-navigation/native';
import { useRef } from 'react';

import { CodeBusinessType } from '../../../types';
import { unifiedLogin, thirdPartySDKLogin } from '../api';
import { LoginType, ThirdPartyType } from '../types';
import type { UnifiedLoginResponse } from '../types';
import { useAuthSDK } from '../../../hooks/useAuthSDK';

export interface UnifiedLoginParams {
  account?: string;
  bindEmail?: string;
  flowStatus?: string;
  redirect?: string;
}

export const useUnifiedLogin = () => {
  const { authApple, authWechat, authQQ } = useAuthSDK();
  const navigation = useNavigation();
  const isProcessing = useRef(false);

  /** 处理二次验证分支 */
  const handleTwoVerification = (response: UnifiedLoginResponse) => {
    const twoVerificationInfo = JSON.stringify(
      response.loginResponse!.twoVerificationResponses
    );
    navigation.navigate('Login/VerifyIdentity', {
      twoVerificationInfo,
      secondaryVerificationToken:
        response.loginResponse?.secondaryVerificationToken,
    });
  };

  /** 处理跨平台用户分支 */
  const handleCrossPlatformUser = (
    response: UnifiedLoginResponse,
    account?: string
  ) => {
    if (response.loginResponse?.isCrossPlatformUser) {
      navigation.navigate('Login/WelcomeBack', {
        ...response.loginResponse?.userInfo,
        phone: account,
      });
    }
  };

  /** 登录成功后跳转 */
  const handleLoginSuccess = (redirect?: string) => {
    if (redirect) {
      navigation.navigate(redirect as never);
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    }
  };

  /** 手机号登录 */
  const handlePhoneLogin = async ({
    isBindPhone,
    code,
    account,
    bindEmail,
    flowStatus,
    redirect,
  }: {
    isBindPhone?: boolean;
    code?: string;
  } & UnifiedLoginParams) => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    try {
      const loginRes = await unifiedLogin({
        loginType: isBindPhone ? LoginType.UNIFIED : LoginType.SMS_CODE,
        phone: account,
        code,
        businessType: CodeBusinessType.REGISTER_LOGIN_CODE,
        email: isBindPhone ? undefined : bindEmail,
        flowStatus: flowStatus ? Number(flowStatus) : undefined,
      });

      if (loginRes.loginResponse?.twoVerificationResponses) {
        handleTwoVerification(loginRes);
        return;
      }
      if (loginRes.loginResponse?.isCrossPlatformUser) {
        handleCrossPlatformUser(loginRes, account);
        return;
      }
      if (loginRes.needContinue) {
        navigation.navigate('Login/AccountInfo', {
          ...loginRes.phoneExistsResponse?.userInfo,
          flowStatus: loginRes.flowStatus,
          email: bindEmail,
          phone: account,
        });
      } else {
        handleLoginSuccess(redirect);
      }
    } finally {
      isProcessing.current = false;
    }
  };

  /** 邮箱登录 */
  const handleEmailLogin = async ({
    code,
    account,
    redirect,
  }: { code?: string } & UnifiedLoginParams) => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    try {
      const loginRes = await unifiedLogin({
        loginType: LoginType.EMAIL_CODE,
        email: account,
        code,
        businessType: CodeBusinessType.REGISTER_LOGIN_CODE,
      });
      if (loginRes.loginResponse?.twoVerificationResponses) {
        handleTwoVerification(loginRes);
        return;
      }
      if (loginRes.needContinue) {
        // 需要绑定手机号
        // TODO: navigation.navigate('Bind/PhoneBind', { ... });
      } else {
        handleLoginSuccess(redirect);
      }
    } finally {
      isProcessing.current = false;
    }
  };

  /** Apple 登录 */
  const handleAppleLogin = async (params: { redirect?: string } = {}) => {
    const credential = await authApple();
    const loginRes = await thirdPartySDKLogin({
      sdkType: ThirdPartyType.APPLE,
      idToken: credential.identityToken,
      authorizationCode: credential.authorizationCode,
    });
    if (loginRes.loginResponse?.twoVerificationResponses) {
      handleTwoVerification(loginRes);
      return;
    }
    if (loginRes.needContinue) {
      // 需要绑定手机号
      // TODO: navigation.navigate('Bind/PhoneBind', { ... });
      return;
    }
    handleLoginSuccess(params.redirect);
  };

  /** 微信登录 */
  const handleWechatLogin = async (params: { redirect?: string } = {}) => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    try {
      const { code } = await authWechat();
      const loginRes = await thirdPartySDKLogin({
        sdkType: ThirdPartyType.WECHAT,
        wechatCode: code,
      });
      if (loginRes.loginResponse?.twoVerificationResponses) {
        handleTwoVerification(loginRes);
        return;
      }
      if (loginRes.needContinue) {
        // 微信登录后可能需要绑定手机号
        // TODO: navigation.navigate('Bind/PhoneBind', { ... });
        return;
      }
      handleLoginSuccess(params.redirect);
    } finally {
      isProcessing.current = false;
    }
  };

  /** QQ 登录 */
  const handleQQLogin = async (params: { redirect?: string } = {}) => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    try {
      const { accessToken, openId } = await authQQ();
      const loginRes = await thirdPartySDKLogin({
        sdkType: ThirdPartyType.QQ,
        qqAccessToken: accessToken,
        qqOpenId: openId,
      });
      if (loginRes.loginResponse?.twoVerificationResponses) {
        handleTwoVerification(loginRes);
        return;
      }
      if (loginRes.needContinue) {
        // QQ登录后可能需要绑定手机号
        // TODO: navigation.navigate('Bind/PhoneBind', { ... });
        return;
      }
      handleLoginSuccess(params.redirect);
    } finally {
      isProcessing.current = false;
    }
  };

  return {
    handlePhoneLogin,
    handleEmailLogin,
    handleAppleLogin,
    handleWechatLogin,
    handleQQLogin,
  };
};
