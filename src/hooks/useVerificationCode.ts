import { useCallback, useEffect, useRef, useState } from 'react';

import { sendEmailCode, sendSmsCode } from '../screens/login/api';
import { CodeBusinessType } from '../types';

export enum VerificationCodeType {
  PHONE = 'phone',
  EMAIL = 'email',
}

/** 全局发送记录（内存级，防重复发送）*/
const sendCodeRecords: Record<string, { expiresAt: number; sendCount: number }> = {};

export interface UseVerificationCodeOptions {
  type: VerificationCodeType;
  account: string;
  countryCode?: string;
  countdownSeconds?: number;
  businessType?: CodeBusinessType;
  onVerifyRequest?: (params: {
    type: string;
    account: string;
    countryCode?: string;
    code: string;
  }) => Promise<void>;
}

export function useVerificationCode(options: UseVerificationCodeOptions) {
  const {
    type,
    account,
    countdownSeconds = 60,
    businessType = CodeBusinessType.REGISTER_LOGIN_CODE,
    onVerifyRequest,
  } = options;

  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sendCount, setSendCount] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const recordKey = `${type}-${account}-${businessType}`;

  // 恢复倒计时
  useEffect(() => {
    const record = sendCodeRecords[recordKey];
    if (!record) return;
    setSendCount((prev) => (prev > 0 ? prev : record.sendCount));
    const remaining = Math.ceil((record.expiresAt - Date.now()) / 1000);
    if (remaining > 0) {
      setSeconds(remaining);
      startTimer(record.expiresAt);
    }
    return () => stopTimer();
  }, [recordKey]);

  const startTimer = (expiresAt: number) => {
    stopTimer();
    timerRef.current = setInterval(() => {
      const remaining = Math.ceil((expiresAt - Date.now()) / 1000);
      if (remaining <= 0) {
        setSeconds(0);
        stopTimer();
      } else {
        setSeconds(remaining);
      }
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const sendCode = useCallback(async () => {
    // 防重复
    const record = sendCodeRecords[recordKey];
    if (record && Date.now() < record.expiresAt) {
      const remaining = Math.ceil((record.expiresAt - Date.now()) / 1000);
      setSeconds(remaining);
      startTimer(record.expiresAt);
      return;
    }
    if (sending || seconds > 0) return;

    setSending(true);
    try {
      if (type === VerificationCodeType.PHONE) {
        await sendSmsCode({ phone: account, businessType });
      } else {
        await sendEmailCode({ email: account, businessType });
      }

      const expiresAt = Date.now() + countdownSeconds * 1000;
      const nextCount = (sendCodeRecords[recordKey]?.sendCount ?? 0) + 1;
      sendCodeRecords[recordKey] = { expiresAt, sendCount: nextCount };
      setSeconds(countdownSeconds);
      setSendCount(nextCount);
      startTimer(expiresAt);
    } catch (error) {
      throw error;
    } finally {
      setSending(false);
    }
  }, [recordKey, type, account, sending, seconds, countdownSeconds, businessType]);

  const verifyCode = useCallback(
    async (code: string) => {
      if (verifying || !code) return false;
      setVerifying(true);
      try {
        if (!onVerifyRequest) throw new Error('onVerifyRequest is required');
        await onVerifyRequest({
          type,
          account,
          countryCode: options.countryCode,
          code,
        });
        // 验证成功后延迟清除记录
        setTimeout(() => { delete sendCodeRecords[recordKey]; }, 5000);
        return true;
      } finally {
        setVerifying(false);
      }
    },
    [type, account, verifying, onVerifyRequest, recordKey, options.countryCode]
  );

  return {
    sending,
    verifying,
    sendCount,
    countdown: {
      seconds,
      isRunning: seconds > 0,
      isCompleted: seconds === 0,
    },
    sendCode,
    verifyCode,
  };
}
