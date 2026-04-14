export const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-jwt-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  wechat: {
    appId: process.env.WECHAT_APP_ID || '',
    appSecret: process.env.WECHAT_APP_SECRET || '',
    mchId: process.env.WECHAT_MCH_ID || '',
    apiKeyV3: process.env.WECHAT_API_KEY_V3 || '',
  },

  qq: {
    appId: process.env.QQ_APP_ID || '',
    appSecret: process.env.QQ_APP_SECRET || '',
  },

  apple: {
    clientId: process.env.APPLE_CLIENT_ID || '',
    teamId: process.env.APPLE_TEAM_ID || '',
    keyId: process.env.APPLE_KEY_ID || '',
  },

  alipay: {
    appId: process.env.ALIPAY_APP_ID || '',
    privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
    publicKey: process.env.ALIPAY_PUBLIC_KEY || '',
  },

  newebpay: {
    merchantId: process.env.NEWEBPAY_MERCHANT_ID || '',
    hashKey: process.env.NEWEBPAY_HASH_KEY || '',
    hashIv: process.env.NEWEBPAY_HASH_IV || '',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
};
