import React, { useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { DrawerProvider } from './src/context/DrawerContext';
import { ChatProvider } from './src/context/ChatContext';
import { AlertProvider } from './src/context/AlertContext';
import { navigationRef } from './src/navigation/navigationRef';
import RootNavigator from './src/navigation/RootNavigator';
import AnimatedSplash from './src/components/AnimatedSplash';
import FloatingAiBot from './src/components/FloatingAiBot';

function MainApp() {
  const { isDark, colors } = useTheme();

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.surface,
      text: colors.midnight,
      border: colors.border,
      primary: colors.primary,
    },
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.surface}
        animated={true}
      />
      <AlertProvider>
        <AuthProvider>
          <CartProvider>
            <ChatProvider>
              <NavigationContainer ref={navigationRef} theme={navTheme}>
                <DrawerProvider>
                  <RootNavigator />
                  <FloatingAiBot />
                </DrawerProvider>
              </NavigationContainer>
            </ChatProvider>
          </CartProvider>
        </AuthProvider>
      </AlertProvider>
    </View>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return (
      <SafeAreaProvider>
        <AnimatedSplash onFinish={() => setShowSplash(false)} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <MainApp />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default App;

