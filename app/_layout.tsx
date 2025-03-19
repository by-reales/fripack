import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import { View, StyleSheet } from 'react-native';

import { useColorScheme } from '@/hooks/useColorScheme';
import Onboarding from './onboarding';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isAppReady, setIsAppReady] = useState(false);
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const onboardingCompleted = await AsyncStorage.getItem('onboardingCompleted');
      setShowOnboarding(onboardingCompleted !== 'true');
    };

    checkOnboardingStatus();
  }, []);

  useEffect(() => {
    if (loaded && showOnboarding !== null) {
      SplashScreen.hideAsync();
      setIsAppReady(true);
    }
  }, [loaded, showOnboarding]);

  const handleOnboardingFinish = async () => {
    await AsyncStorage.setItem('onboardingCompleted', 'true');
    setShowOnboarding(false);
  };

  if (!loaded || showOnboarding === null) {
    return (
      <View style={styles.container}>
        <LottieView
          source={require('../animations/Animation - 1742401802107.json')}
          autoPlay
          loop
          style={styles.animation}
        />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {showOnboarding ? (
        <Onboarding onFinish={handleOnboardingFinish} />
      ) : (
        <>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </>
      )}
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff', // Cambia el color de fondo según tu diseño
  },
  animation: {
    width: '100%',
    height: '100%',
  },
});