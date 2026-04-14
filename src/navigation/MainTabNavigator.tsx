import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';

import type { MainTabParamList } from './types';

// 临时占位页面
const PlaceholderScreen = ({ title }: { title: string }) => (
  <View style={styles.center}>
    <Text style={styles.text}>{title}</Text>
  </View>
);

const HomeScreen = () => <PlaceholderScreen title="首页" />;
const DiscoverScreen = () => <PlaceholderScreen title="发现" />;
const MyScreen = () => <PlaceholderScreen title="我的" />;

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#304000',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: '首页' }}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{ tabBarLabel: '发现' }}
      />
      <Tab.Screen
        name="My"
        component={MyScreen}
        options={{ tabBarLabel: '我的' }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, color: '#333' },
});
