import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../context/ThemeContext';
import { navigationRef, navigate } from '../navigation/navigationRef';
import { SHADOWS } from '../theme/theme';

const FloatingAiBot = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { isChatMinimized, openChat, messages } = useChat();
  const [currentRoute, setCurrentRoute] = useState('');
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const bottomAnim = React.useRef(new Animated.Value(28)).current;

  // Listen to navigation state to detect route and hide FAB on ChatbotModal
  useEffect(() => {
    let unsubscribe;
    const interval = setInterval(() => {
      if (navigationRef.isReady()) {
        setCurrentRoute(navigationRef.getCurrentRoute()?.name || '');
        try {
          unsubscribe = navigationRef.addListener('state', () => {
            setCurrentRoute(navigationRef.getCurrentRoute()?.name || '');
          });
          clearInterval(interval);
        } catch (e) {
          // retry
        }
      }
    }, 100);

    return () => {
      clearInterval(interval);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Determine if the current screen has an app bottom navbar or sticky footer
  const hasBottomBar = ['MainTabs', 'Home', 'Explore', 'Cart', 'Purchases', 'Profile', 'DesignDetailScreen'].includes(currentRoute);

  // Smoothly adjust bottom offset: above mobile navbar when no app navbar, or above tab bar when tab bar is present
  useEffect(() => {
    const targetBottom = hasBottomBar
      ? (insets.bottom > 0 ? insets.bottom : 0) + 80
      : Math.max(insets.bottom, 12) + 16;

    Animated.spring(bottomAnim, {
      toValue: targetBottom,
      friction: 8,
      tension: 50,
      useNativeDriver: false,
    }).start();
  }, [hasBottomBar, insets.bottom]);

  // Subtle pulsing animation when minimized
  useEffect(() => {
    if (isChatMinimized) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isChatMinimized]);

  // Hide floating bot if already inside the ChatbotModal
  if (currentRoute === 'ChatbotModal') {
    return null;
  }

  const handlePress = () => {
    openChat();
    navigate('ChatbotModal');
  };

  const hasHistory = messages && messages.length > 1;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: bottomAnim,
          transform: [{ scale: pulseAnim }],
        },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
        onPress={handlePress}
        activeOpacity={0.88}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="sparkles" size={22} color="#ffffff" />
        {isChatMinimized && (
          <View style={styles.activeDot} />
        )}
      </TouchableOpacity>

      {/* Subtle "Ask AI" tooltip pill when minimized */}
      {isChatMinimized && hasHistory && (
        <TouchableOpacity
          style={styles.minimizedPill}
          onPress={handlePress}
          activeOpacity={0.85}
        >
          <Text style={styles.minimizedPillText}>AI Chat</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 18,
    alignItems: 'center',
    zIndex: 9999,
  },
  fab: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38,
    shadowRadius: 10,
    elevation: 9,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  activeDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  minimizedPill: {
    marginTop: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  minimizedPillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
});

export default FloatingAiBot;
