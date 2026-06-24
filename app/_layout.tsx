import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { ThemeProvider } from "../lib/useColors";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontError) {
      console.error("Font loading error:", fontError);
    }
  }, [fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: "slide_from_right",
                }}
              >
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="ai-message" />
                <Stack.Screen name="ai-reply" />
                <Stack.Screen name="ai-translate" />
                <Stack.Screen name="ai-assistant" />
                <Stack.Screen name="smart-templates" />
                <Stack.Screen name="direct-chat" />
                <Stack.Screen name="link-generator" />
                <Stack.Screen name="qr-generator" />
                <Stack.Screen name="fancy-text" />
                <Stack.Screen name="text-repeater" />
                <Stack.Screen name="empty-message" />
                <Stack.Screen name="status-quotes" />
                <Stack.Screen name="business-templates" />
                <Stack.Screen name="group-manager" />
                <Stack.Screen name="voice-message" />
                <Stack.Screen name="+not-found" />
              </Stack>
            </GestureHandlerRootView>
          </QueryClientProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
