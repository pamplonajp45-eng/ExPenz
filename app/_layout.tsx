import { supabase } from '@/lib/supabase';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Session } from '@supabase/supabase-js';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        // Add 5 second timeout for session check
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session check timeout')), 5000)
        );

        const { data: { session } } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;

        if (mounted) {
          setSession(session);
          setInitialized(true);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setSession(null);
          setInitialized(true); // Still initialize even on timeout
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription?.unsubscribe();
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
