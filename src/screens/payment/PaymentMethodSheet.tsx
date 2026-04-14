import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';

import { PaymentMethod } from './api';

export interface PaymentMethodOption {
  method: PaymentMethod;
  label: string;
  icon: string;
  /** 是否在当前平台可用 */
  available: boolean;
}

/**
 * 默认支付方式列表
 * 根据平台自动决定 APP / H5
 */
export const getPaymentMethods = (): PaymentMethodOption[] => {
  const isNative = Platform.OS !== 'web';
  return [
    {
      method: isNative ? PaymentMethod.WECHAT_APP : PaymentMethod.WECHAT_H5,
      label: '微信支付',
      icon: '💬',
      available: true,
    },
    {
      method: isNative ? PaymentMethod.ALIPAY_APP : PaymentMethod.ALIPAY_H5,
      label: '支付宝',
      icon: '🔵',
      available: true,
    },
    {
      method: PaymentMethod.NEWEBPAY,
      label: '信用卡 (蓝新)',
      icon: '💳',
      available: true,
    },
  ];
};

interface PaymentMethodSheetProps {
  visible: boolean;
  amount: number;
  onSelect: (method: PaymentMethod) => void;
  onClose: () => void;
}

/**
 * 支付方式选择底部弹窗
 */
export const PaymentMethodSheet: React.FC<PaymentMethodSheetProps> = ({
  visible,
  amount,
  onSelect,
  onClose,
}) => {
  const methods = getPaymentMethods();
  const [selected, setSelected] = useState<PaymentMethod>(methods[0].method);

  const handleConfirm = () => {
    onSelect(selected);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>选择支付方式</Text>
            <Text style={styles.amountText}>¥{amount.toFixed(2)}</Text>
          </View>

          {/* 支付方式列表 */}
          {methods.filter((m) => m.available).map((item) => (
            <TouchableOpacity
              key={item.method}
              style={[styles.methodItem, selected === item.method && styles.methodSelected]}
              onPress={() => setSelected(item.method)}
            >
              <Text style={styles.methodIcon}>{item.icon}</Text>
              <Text style={styles.methodLabel}>{item.label}</Text>
              <View style={[styles.radio, selected === item.method && styles.radioSelected]}>
                {selected === item.method && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}

          {/* 确认按钮 */}
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
            <Text style={styles.confirmBtnText}>确认支付 ¥{amount.toFixed(2)}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 40,
  },
  header: {
    alignItems: 'center', marginBottom: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  amountText: { fontSize: 14, color: '#999', marginTop: 4 },
  methodItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 16,
    paddingHorizontal: 12, borderRadius: 12, marginBottom: 8,
    backgroundColor: '#F8F8F8',
  },
  methodSelected: { backgroundColor: '#F0F8E0', borderWidth: 1, borderColor: '#B0D060' },
  methodIcon: { fontSize: 24, marginRight: 12 },
  methodLabel: { flex: 1, fontSize: 16, color: '#333' },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    borderColor: '#CCC', justifyContent: 'center', alignItems: 'center',
  },
  radioSelected: { borderColor: '#304000' },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#304000' },
  confirmBtn: {
    backgroundColor: '#304000', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 16,
  },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default PaymentMethodSheet;
