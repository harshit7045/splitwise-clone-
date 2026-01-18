import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments, useRootNavigationState, Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { TamaguiProvider, Theme } from 'tamagui';
import { useAuth } from '../hooks/useAuth';
import config from '../../tamagui.config';

SplashScreen.preventAutoHideAsync();

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function RootLayout() {
  const [loaded] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  });

  const { isAuthenticated, restoreSession, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    restoreSession();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (!rootNavigationState?.key) return;

    // Check if we are in an auth route
    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

    if (isLoading) return;

    if (isAuthenticated === false && !inAuthGroup) {
      // Not logged in and not in auth group -> Redirect to login
      router.replace('/login');
    } else if (isAuthenticated === true && inAuthGroup) {
      // Logged in and in auth group -> Redirect to dashboard
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, loaded, isLoading]);


  return (
    <QueryClientProvider client={queryClient}>
      <TamaguiProvider config={config}>
        <Theme name="dark">
          {!loaded || isLoading ? (
            <Slot />
          ) : (
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="add-expense" options={{ headerShown: false, presentation: 'modal' }} />
              <Stack.Screen name="group/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="register" options={{ headerShown: false }} />
              <Stack.Screen name="groups/create" options={{ headerShown: false }} />
              <Stack.Screen name="groups/join" options={{ headerShown: false }} />
            </Stack>
          )}
        </Theme>
      </TamaguiProvider>
    </QueryClientProvider>
  );
}
