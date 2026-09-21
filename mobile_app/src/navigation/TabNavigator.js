import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import CartScreen from '../screens/CartScreen';
import MyPurchasesScreen from '../screens/MyPurchasesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { SHADOWS } from '../theme/theme';

const Tab = createBottomTabNavigator();

const TabBarIcon = ({ focused, iconName, badge, colors }) => {
  return (
    <View
      style={[
        styles.iconWrapper,
        focused && { backgroundColor: colors.primaryMuted },
      ]}
    >
      <Ionicons
        name={focused ? iconName : `${iconName}-outline`}
        size={22}
        color={focused ? colors.primary : colors.slate}
      />
      {badge !== undefined && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      )}
    </View>
  );
};

const TabNavigator = () => {
  const { cartCount } = useCart();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.slate,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            height: 56 + Math.max(insets.bottom, 6),
            paddingBottom: Math.max(insets.bottom, 6),
          },
        ],
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} iconName="home" colors={colors} />
          ),
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          tabBarLabel: 'Explore',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} iconName="compass" colors={colors} />
          ),
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarLabel: 'Cart',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              focused={focused}
              iconName="cart"
              badge={cartCount}
              colors={colors}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Purchases"
        component={MyPurchasesScreen}
        options={{
          tabBarLabel: 'Purchases',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} iconName="bag-check" colors={colors} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} iconName="person" colors={colors} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
    ...SHADOWS.subtle,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 30,
    borderRadius: 15,
  },
  iconWrapperActive: {},
  emoji: {
    fontSize: 18,
    opacity: 0.7,
  },
  emojiActive: {
    opacity: 1,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ec4899',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
});

export default TabNavigator;
