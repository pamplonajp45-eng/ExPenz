import { COLORS } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Tabs } from 'expo-router';
import { LayoutDashboard, List } from 'lucide-react-native';
import React from 'react';
import { Platform } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = COLORS[colorScheme];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.green,
        tabBarInactiveTintColor: theme.muted,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.tabBarBorder,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingTop: 12,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => {
            const Icon = LayoutDashboard as any;
            return <Icon size={size} color={color} />;
          },
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Expenses',
          tabBarIcon: ({ color, size }) => {
            const Icon = List as any;
            return <Icon size={size} color={color} />;
          },
        }}
      />
    </Tabs>
  );
}
