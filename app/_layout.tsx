import { supabase } from "@/lib/supabase";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Session } from "@supabase/supabase-js";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import "react-native-reanimated";

import { COLORS } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    let timeouts: NodeJS.Timeout[] = [];

    const initializeAuth = async () => {
      try {
        console.log("🔐 Starting auth initialization...");

        // Get current session with timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Session check timeout")), 3000),
        );

        const result = (await Promise.race([
          sessionPromise,
          timeoutPromise,
        ])) as any;

        if (mounted) {
          console.log(
            "✅ Auth session retrieved:",
            result?.data?.session ? "logged in" : "logged out",
          );
          setSession(result?.data?.session || null);
          setInitialized(true);
        }
      } catch (error) {
        console.error("❌ Auth initialization error:", (error as any)?.message);
        if (mounted) {
          setSession(null);
          setInitialized(true);
        }
      }
    };

    // Start initialization immediately
    initializeAuth();

    // Safety timeout: 7 seconds absolute max
    const fallbackTimeout = setTimeout(() => {
      if (mounted && !initialized) {
        console.warn("⚠️ Auth initialization timeout - forcing completion");
        setSession(null);
        setInitialized(true);
      }
    }, 7000);
    timeouts.push(fallbackTimeout);

    // Setup auth state listener - THIS IS THE FIX
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (mounted) {
        console.log(
          "🔄 Auth state changed:",
          newSession ? "logged in" : "logged out",
        );
        setSession(newSession);
      }
    });

    return () => {
      mounted = false;
      timeouts.forEach((t) => clearTimeout(t));
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === "auth";

    if (!session && !inAuthGroup) {
      // Redirect to the sign-in page.
      router.replace("/auth");
    }
    // Remove auto-redirect to tabs to allow forgot password flow to stay on auth screen
  }, [session, initialized, segments]);

  // Show loading screen while initializing
  if (!initialized) {
    const theme = COLORS[colorScheme === "dark" ? "dark" : "light"];
    return (
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: theme.background,
          }}
        >
          <ActivityIndicator size="large" color={theme.green} />
        </View>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Add Expense" }}
        />
      </Stack>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
    </ThemeProvider>
  );
}
