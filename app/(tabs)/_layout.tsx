import { COLORS } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Tabs } from 'expo-router';
import { BookOpenCheck, LayoutDashboard, List, Users } from 'lucide-react-native';
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
                tabBarShowLabel: false,
                tabBarStyle: {
                    backgroundColor: theme.tabBar,
                    borderTopColor: theme.tabBarBorder,
                    height: Platform.OS === 'ios' ? 88 : 64,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 0,
                    paddingTop: 0,
                    elevation: 0,
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
            <Tabs.Screen
                name="payroll"
                options={{
                    title: 'Payroll',
                    tabBarIcon: ({ color, size }) => {
                        const Icon = Users as any;
                        return <Icon size={size} color={color} />;
                    },
                }}
            />
            <Tabs.Screen
                name="utang"
                options={{
                    title: 'Utang',
                    tabBarIcon: ({ color, size }) => {
                        const Icon = BookOpenCheck as any;
                        return <Icon size={size} color={color} />;
                    },
                }}
            />
        </Tabs>
    );
}
