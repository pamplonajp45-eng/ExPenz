import { supabase } from '@/lib/supabase';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Session } from '@supabase/supabase-js';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { ActivityIndicator, View } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { COLORS } from '@/constants/Colors';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [initAttempt, setInitAttempt] = useState(0);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    let timeouts: NodeJS.Timeout[] = [];

    const assertInitialized = () => {
      if (mounted) {
        console.log('🔐 Forcing initialization - state will be set now');
        setSession(null);
        setInitialized(true);
      }
    };

    const initializeAuth = async () => {
      try {
        console.log('🔐 Starting auth initialization...');
        
        // Add 4 second timeout for session check (aggressive for Vercel)
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session check timeout')), 4000)
        );

        const result = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;

        if (mounted) {
          console.log('✅ Auth session retrieved');
          setSession(result?.data?.session || null);
          setInitialized(true);
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', (error as any)?.message);
        if (mounted) {
          setSession(null);
          setInitialized(true);
        }
      }
    };

    // Start initialization immediately
    initializeAuth();
    
    // Safety timeout 1: 6 seconds (catches any hanging promises)
    const timeout1 = setTimeout(() => {
      console.warn('⚠️ Auth timeout 1 (6s) - forcing initialization');
      assertInitialized();
    }, 6000);
    timeouts.push(timeout1);

    // Safety timeout 2: 10 seconds (absolute fallback)
    const timeout2 = setTimeout(() => {
      if (mounted && !initialized) {
        console.warn('⚠️ Auth timeout 2 (10s) - CRITICAL fallback');
        assertInitialized();
      }
    }, 10000);
    timeouts.push(timeout2);

    // Setup auth state listener
    let subscription: any;
    try {
      const authPromise = supabase.auth.onAuthStateChange((_event, newSession) => {
        if (mounted) {
          console.log('🔄 Auth state changed');
          setSession(newSession);
        }
      });
      
      subscription = authPromise?.data?.subscription;
    } catch (err) {
      console.error('Failed to setup auth listener:', err);
    }

    return () => {
      mounted = false;
      timeouts.forEach(t => clearTimeout(t));
      try {
        subscription?.unsubscribe?.();
      } catch (err) {
        console.error('Error unsubscribing:', err);
      }
    };
  }, []);

  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!session && !inAuthGroup) {
      // Redirect to the sign-in page.
      router.replace('/auth');
    }
    // Remove auto-redirect to tabs to allow forgot password flow to stay on auth screen
  }, [session, initialized, segments]);

  // Show loading screen while initializing
  if (!initialized) {
    const theme = COLORS[colorScheme === 'dark' ? 'dark' : 'light'];
    return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.background,
          }}
        >
          <ActivityIndicator size="large" color={theme.green} />
        </View>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Add Expense' }} />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
