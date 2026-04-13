import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, Linking } from 'react-native';
import { MaterialCommunityIcons, Ionicons, Feather } from '@expo/vector-icons';

const STEPS = [
  { icon: 'git-branch', lib: 'Feather', text: 'Fork / Clone 此项目' },
  { icon: 'settings-outline', lib: 'Ionicons', text: '运行 ./setup.sh 初始化配置' },
  { icon: 'key-outline', lib: 'Ionicons', text: '配置 EXPO_TOKEN 到 GitHub Secrets' },
  { icon: 'rocket-launch-outline', lib: 'MaterialCommunityIcons', text: 'Push 代码，自动打包 APK / IPA' },
];

function StepIcon({ icon, lib }) {
  const props = { name: icon, size: 22, color: '#6C63FF' };
  if (lib === 'Feather') return <Feather {...props} />;
  if (lib === 'Ionicons') return <Ionicons {...props} />;
  return <MaterialCommunityIcons {...props} />;
}

export default function App() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="package-variant-closed" size={64} color="#fff" />
        <Text style={styles.title}>Expo CI Builder</Text>
        <Text style={styles.subtitle}>GitHub Actions 自动打包模板</Text>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Ionicons name="logo-android" size={14} color="#3DDC84" />
            <Text style={styles.badgeText}>Android</Text>
          </View>
          <View style={styles.badge}>
            <Ionicons name="logo-apple" size={14} color="#999" />
            <Text style={styles.badgeText}>iOS</Text>
          </View>
          <View style={styles.badge}>
            <MaterialCommunityIcons name="cached" size={14} color="#F4A261" />
            <Text style={styles.badgeText}>CI/CD</Text>
          </View>
        </View>
      </View>

      {/* Features */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>✨ 特性</Text>
        <FeatureItem icon="cloud-upload-outline" text="Push 代码自动构建 APK" />
        <FeatureItem icon="timer-outline" text="Gradle 缓存加速，二次构建更快" />
        <FeatureItem icon="cellphone-arrow-down" text="构建产物自动上传，一键下载" />
        <FeatureItem icon="apple-ios" text="支持 iOS 构建（需开发者账号）" />
        <FeatureItem icon="script-text-outline" text="一键初始化脚本，快速上手" />
      </View>

      {/* Steps */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🚀 快速开始</Text>
        {STEPS.map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <View style={styles.stepNum}>
              <Text style={styles.stepNumText}>{i + 1}</Text>
            </View>
            <StepIcon icon={step.icon} lib={step.lib} />
            <Text style={styles.stepText}>{step.text}</Text>
          </View>
        ))}
      </View>

      {/* Footer */}
      <Text
        style={styles.link}
        onPress={() => Linking.openURL('https://github.com/wu-chunyi/expo-ci-demo')}
      >
        📖 查看完整文档 →
      </Text>
      <Text style={styles.footer}>v1.0.0 · Made with Expo + GitHub Actions</Text>
    </ScrollView>
  );
}

function FeatureItem({ icon, text }) {
  return (
    <View style={styles.featureRow}>
      <MaterialCommunityIcons name={icon} size={20} color="#6C63FF" />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#0F0F1A',
    alignItems: 'center',
    paddingBottom: 40,
  },
  header: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 70,
    paddingBottom: 30,
    backgroundColor: '#1A1A2E',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A3E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    color: '#ccc',
    fontSize: 12,
  },
  card: {
    width: '88%',
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 14,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  featureText: {
    color: '#ccc',
    fontSize: 14,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  stepText: {
    color: '#ccc',
    fontSize: 14,
    flex: 1,
  },
  link: {
    color: '#6C63FF',
    fontSize: 14,
    marginTop: 24,
    fontWeight: '600',
  },
  footer: {
    color: '#555',
    fontSize: 12,
    marginTop: 12,
  },
});
