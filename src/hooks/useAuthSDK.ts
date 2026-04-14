import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

/**
 * 原生认证 SDK Hook
 * 支持 Apple / 微信 / QQ
 */
export const useAuthSDK = () => {
  /** Apple Sign-In (iOS only) */
  const authApple = async () => {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    return credential;
  };

  /**
   * 微信登录
   * 调起微信客户端授权，返回 code
   * 后端用 code 换取 access_token + openid + unionid
   */
  const authWechat = async (): Promise<{ code: string }> => {
    const WechatLib = require('react-native-wechat-lib');

    // 检查微信是否已安装
    const isInstalled = await WechatLib.isWXAppInstalled();
    if (!isInstalled) {
      throw new Error('请先安装微信');
    }

    const res = await WechatLib.sendAuthRequest('snsapi_userinfo', 'wechat_login');
    if (res.errCode === 0) {
      return { code: res.code };
    }
    if (res.errCode === -2) {
      throw Object.assign(new Error('用户取消微信登录'), { code: 'ERR_REQUEST_CANCELED' });
    }
    throw new Error(res.errStr || '微信登录失败');
  };

  /**
   * QQ 登录
   * 通过 expo-auth-session 走 OAuth2 流程
   * 返回 accessToken + openId
   */
  const authQQ = async (): Promise<{ accessToken: string; openId: string }> => {
    const { makeRedirectUri } = await import('expo-auth-session');
    const { openAuthSessionAsync } = await import('expo-web-browser');

    const QQ_APP_ID = process.env.EXPO_PUBLIC_QQ_APP_ID || '';
    const redirectUri = makeRedirectUri({ scheme: 'mytestapp' });

    const authUrl =
      `https://graph.qq.com/oauth2.0/authorize` +
      `?response_type=token` +
      `&client_id=${QQ_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=get_user_info` +
      `&display=${Platform.OS === 'web' ? 'pc' : 'mobile'}`;

    const result = await openAuthSessionAsync(authUrl, redirectUri);

    if (result.type !== 'success' || !result.url) {
      throw Object.assign(new Error('用户取消QQ登录'), { code: 'ERR_REQUEST_CANCELED' });
    }

    // 从 hash fragment 中提取 access_token 和 openid
    const hashParams = new URLSearchParams(result.url.split('#')[1] || '');
    const accessToken = hashParams.get('access_token');
    const openId = hashParams.get('openid') || '';

    if (!accessToken) {
      throw new Error('QQ授权失败，未获取到 access_token');
    }

    // 如果 hash 中没有 openId，需要额外请求
    let finalOpenId = openId;
    if (!finalOpenId) {
      try {
        const resp = await fetch(
          `https://graph.qq.com/oauth2.0/me?access_token=${accessToken}&fmt=json`
        );
        const data = await resp.json();
        finalOpenId = data.openid || '';
      } catch {
        // openId 获取失败不阻塞，后端可以从 access_token 获取
      }
    }

    return { accessToken, openId: finalOpenId };
  };

  return {
    authApple,
    authWechat,
    authQQ,
  };
};
