import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDrawer } from '../context/DrawerContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { SHADOWS } from '../theme/theme';

const TopBar = ({ title, showBack = false, onBack }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { cartCount } = useCart();
  const { openDrawer } = useDrawer();
  const { colors, isDark } = useTheme();

  const handleMenuPress = () => {
    openDrawer();
  };

  const handleChatbotPress = () => {
    navigation.navigate('ChatbotModal');
  };

  const handleCartPress = () => {
    navigation.navigate('MainTabs', { screen: 'Cart' });
  };

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top, backgroundColor: colors.surface }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.surface}
        translucent={false}
      />
      <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {/* Left: Hamburger Menu or Back Arrow */}
        <View style={styles.leftSection}>
          {showBack ? (
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#f1f5f9' }]}
              onPress={onBack || (() => navigation.goBack())}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.midnight} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#f1f5f9' }]}
              onPress={handleMenuPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="menu" size={26} color={colors.midnight} />
            </TouchableOpacity>
          )}
        </View>

        {/* Center: Brand Identity - Continuous website-like text */}
        <TouchableOpacity
          style={styles.brandSection}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
          activeOpacity={0.8}
        >
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.brandTitle, { color: colors.midnight }]}>
            Embroid<Text style={[styles.brandAccent, { color: colors.primary }]}>ex</Text>
          </Text>
        </TouchableOpacity>

        {/* Right Action Icons: AI Bot, Cart */}
        <View style={styles.rightSection}>
          {/* AI Bot Pill */}
          <TouchableOpacity
            style={styles.aiBtn}
            onPress={handleChatbotPress}
            activeOpacity={0.8}
          >
            <Ionicons name="sparkles" size={13} color="#fbcfe8" />
            <Text style={styles.aiLabel}>AI</Text>
          </TouchableOpacity>

          {/* Shopping Cart with Badge */}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#f1f5f9' }]}
            onPress={handleCartPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="cart-outline" size={22} color={colors.midnight} />
            {cartCount > 0 && (
              <View style={[styles.cartBadge, { backgroundColor: colors.accentPink }]}>
                <Text style={styles.cartBadgeText}>
                  {cartCount > 9 ? '9+' : cartCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    borderBottomWidth: 1,
    ...SHADOWS.subtle,
  },
  container: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  leftSection: {
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: 7,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  brandAccent: {
    fontStyle: 'italic',
    fontWeight: '900',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#312e81',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
  },
  aiLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  cartBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  cartBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#ffffff',
  },
});

export default TopBar;
