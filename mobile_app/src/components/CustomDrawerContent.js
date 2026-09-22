import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { SHADOWS } from '../theme/theme';

const CustomDrawerContent = (props) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, isSeller, logout, stats } = useAuth();
  const { cartCount } = useCart();
  const { themeMode, setThemeMode, colors, isDark } = useTheme();
  const [sellerMenuExpanded, setSellerMenuExpanded] = useState(true);

  const handleNavigation = (routeName, params) => {
    if (props.closeDrawer) {
      props.closeDrawer(true);
    } else if (navigation.closeDrawer) {
      navigation.closeDrawer();
    }
    navigation.navigate(routeName, params);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          if (props.closeDrawer) {
            props.closeDrawer();
          }
          navigation.navigate('MainTabs', { screen: 'Home' });
        },
      },
    ]);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top + 10, paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 48 : 10) + 10, backgroundColor: colors.surface }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Profile Section */}
        <View style={styles.headerProfile}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatarGradient, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {isAuthenticated ? getInitials(user?.name) : 'EX'}
              </Text>
            </View>
            {isSeller && (
              <View style={[styles.verifiedBadge, { backgroundColor: colors.success }]}>
                <Text style={styles.verifiedCheck}>✓</Text>
              </View>
            )}
          </View>

          <View style={styles.profileInfo}>
            <Text style={[styles.userName, { color: colors.midnight }]} numberOfLines={1}>
              {isAuthenticated ? user?.name : 'Welcome to Embroidex'}
            </Text>
            <Text style={[styles.userEmail, { color: colors.slate }]} numberOfLines={1}>
              {isAuthenticated ? user?.email : 'Explore premium embroidery'}
            </Text>
            <View style={styles.roleRow}>
              <View
                style={[
                  styles.roleBadge,
                  isSeller
                    ? [styles.sellerBadge, { backgroundColor: isDark ? 'rgba(22, 163, 74, 0.2)' : 'rgba(22, 163, 74, 0.12)' }]
                    : [styles.buyerBadge, { backgroundColor: colors.borderLight }],
                ]}
              >
                <Text
                  style={[
                    styles.roleBadgeText,
                    isSeller ? [styles.sellerBadgeText, { color: colors.success }] : [styles.buyerBadgeText, { color: colors.slate }],
                  ]}
                >
                  {isAuthenticated
                    ? isSeller
                      ? '⭐ Verified Seller'
                      : 'Buyer Account'
                    : 'Guest'}
                </Text>
              </View>
            </View>
          </View>

          {/* Close 'X' Button */}
          <TouchableOpacity
            style={[styles.closeDrawerBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9' }]}
            onPress={() => {
              if (props.closeDrawer) props.closeDrawer();
              else if (navigation.closeDrawer) navigation.closeDrawer();
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Close Drawer"
          >
            <Ionicons name="close" size={20} color={colors.midnight} />
          </TouchableOpacity>
        </View>

        {/* Upgrade or Switch Banner */}
        {!isAuthenticated ? (
          <TouchableOpacity
            style={[styles.ctaBanner, { backgroundColor: colors.primary }]}
            onPress={() => handleNavigation('LoginScreen')}
          >
            <Text style={styles.ctaBannerTitle}>Sign In or Register</Text>
            <Text style={styles.ctaBannerSub}>
              Access instant downloads & track orders
            </Text>
          </TouchableOpacity>
        ) : !isSeller ? (
          <TouchableOpacity
            style={styles.sellerBanner}
            onPress={() => handleNavigation('SellerRegisterScreen')}
          >
            <View style={styles.sellerBannerHeader}>
              <Ionicons name="briefcase-outline" size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.sellerBannerTitle}>Become a Seller</Text>
            </View>
            <Text style={styles.sellerBannerSub}>
              Earn 70% commission selling your designs
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.sellerQuickStats, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.quickStatItem}>
              <Text style={[styles.quickStatVal, { color: colors.midnight }]}>
                {stats?.totalDesigns || 0}
              </Text>
              <Text style={[styles.quickStatLabel, { color: colors.slate }]}>Designs</Text>
            </View>
            <View style={[styles.quickStatDivider, { backgroundColor: colors.border }]} />
            <View style={styles.quickStatItem}>
              <Text style={[styles.quickStatVal, { color: colors.midnight }]}>
                ₹{stats?.totalEarnings || 0}
              </Text>
              <Text style={[styles.quickStatLabel, { color: colors.slate }]}>Earnings</Text>
            </View>
          </View>
        )}

        <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

        {/* Navigation Section: Explore & Home */}
        <View style={styles.navSection}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleNavigation('MainTabs', { screen: 'Home' })}
          >
            <Ionicons name="home-outline" size={20} color={colors.midnight} style={styles.navIcon} />
            <Text style={[styles.navLabel, { color: colors.midnight }]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleNavigation('MainTabs', { screen: 'Explore' })}
          >
            <Ionicons name="compass-outline" size={20} color={colors.midnight} style={styles.navIcon} />
            <Text style={[styles.navLabel, { color: colors.midnight }]}>Explore All Designs</Text>
            <View style={[styles.countBadge, { backgroundColor: colors.primaryMuted }]}>
              <Text style={[styles.countBadgeText, { color: colors.primary }]}>New</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleNavigation('ChatbotModal')}
          >
            <Ionicons name="sparkles-outline" size={20} color="#7c3aed" style={styles.navIcon} />
            <Text style={[styles.navLabel, { color: colors.midnight }]}>Embroidex AI Assistant</Text>
            <View style={styles.aiTag}>
              <Text style={styles.aiTagText}>Gemini</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

        {/* ACCOUNT & ORDERS Section */}
        <View style={styles.navSection}>
          <Text style={[styles.sectionHeader, { color: colors.slate }]}>ACCOUNT & ORDERS</Text>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleNavigation('MainTabs', { screen: 'Purchases' })}
          >
            <Ionicons name="bag-handle-outline" size={20} color={colors.midnight} style={styles.navIcon} />
            <Text style={[styles.navLabel, { color: colors.midnight }]}>My Purchases</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleNavigation('MainTabs', { screen: 'Cart' })}
          >
            <Ionicons name="cart-outline" size={20} color={colors.midnight} style={styles.navIcon} />
            <Text style={[styles.navLabel, { color: colors.midnight }]}>My Cart</Text>
            {cartCount > 0 && (
              <View style={[styles.cartCountPill, { backgroundColor: colors.accentPink }]}>
                <Text style={styles.cartCountPillText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleNavigation('MainTabs', { screen: 'Profile' })}
          >
            <Ionicons name="person-outline" size={20} color={colors.midnight} style={styles.navIcon} />
            <Text style={[styles.navLabel, { color: colors.midnight }]}>My Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

        {/* SELLER STUDIO Section */}
        {isAuthenticated && isSeller && (
          <View style={styles.navSection}>
            <TouchableOpacity
              style={styles.sectionHeaderRow}
              onPress={() => setSellerMenuExpanded(!sellerMenuExpanded)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.sectionHeader, { color: colors.slate, marginBottom: 0 }]}>SELLER STUDIO</Text>
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              </View>
              <Ionicons
                name={sellerMenuExpanded ? "chevron-down" : "chevron-forward"}
                size={14}
                color={colors.slate}
              />
            </TouchableOpacity>

            {sellerMenuExpanded && (
              <>
                <TouchableOpacity
                  style={styles.navItem}
                  onPress={() => handleNavigation('SellerUploadScreen')}
                >
                  <Ionicons name="cloud-upload-outline" size={20} color={colors.midnight} style={styles.navIcon} />
                  <Text style={[styles.navLabel, { color: colors.midnight }]}>Upload Design</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.navItem}
                  onPress={() => handleNavigation('SellerMyDesignsScreen')}
                >
                  <Ionicons name="copy-outline" size={20} color={colors.midnight} style={styles.navIcon} />
                  <Text style={[styles.navLabel, { color: colors.midnight }]}>My Designs</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.navItem}
                  onPress={() => handleNavigation('SellerEarningsScreen')}
                >
                  <Ionicons name="wallet-outline" size={20} color={colors.midnight} style={styles.navIcon} />
                  <Text style={[styles.navLabel, { color: colors.midnight }]}>Earnings & Payouts</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.navItem}
                  onPress={() => handleNavigation('SellerEarningsScreen', { initialTab: 'settings' })}
                >
                  <Ionicons name="card-outline" size={20} color={colors.midnight} style={styles.navIcon} />
                  <Text style={[styles.navLabel, { color: colors.midnight }]}>Payment Settings</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

        {/* Account & Profile */}
        <View style={styles.navSection}>
          <Text style={[styles.sectionHeader, { color: colors.slate }]}>ACCOUNT</Text>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleNavigation('MainTabs', { screen: 'Profile' })}
          >
            <Ionicons name="person-circle-outline" size={21} color={colors.midnight} style={styles.navIcon} />
            <Text style={[styles.navLabel, { color: colors.midnight }]}>Profile & Settings</Text>
          </TouchableOpacity>

          {isAuthenticated ? (
            <TouchableOpacity style={styles.logoutItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color={colors.danger || '#ef4444'} style={styles.navIcon} />
              <Text style={[styles.logoutLabel, { color: colors.danger || '#ef4444' }]}>Sign Out</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.loginItem}
              onPress={() => handleNavigation('LoginScreen')}
            >
              <Ionicons name="log-in-outline" size={20} color={colors.primary} style={styles.navIcon} />
              <Text style={[styles.loginLabel, { color: colors.primary }]}>Sign In / Register</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Theme Mode Toggle (Icon-only: System / Light / Dark) */}
        <View style={[styles.themeToggleContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.themeIconBtn,
              themeMode === 'system' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setThemeMode('system')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="phone-portrait-outline"
              size={17}
              color={themeMode === 'system' ? '#ffffff' : colors.slate}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.themeIconBtn,
              themeMode === 'light' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setThemeMode('light')}
            activeOpacity={0.8}
          >
            <Ionicons
              name={themeMode === 'light' ? 'sunny' : 'sunny-outline'}
              size={18}
              color={themeMode === 'light' ? '#ffffff' : colors.slate}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.themeIconBtn,
              themeMode === 'dark' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setThemeMode('dark')}
            activeOpacity={0.8}
          >
            <Ionicons
              name={themeMode === 'dark' ? 'moon' : 'moon-outline'}
              size={17}
              color={themeMode === 'dark' ? '#ffffff' : colors.slate}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 4,
  },
  closeDrawerBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatarGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.subtle,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  verifiedCheck: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  userEmail: {
    fontSize: 12,
    marginTop: 1,
  },
  roleRow: {
    marginTop: 4,
    flexDirection: 'row',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  buyerBadge: {},
  buyerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  sellerBadge: {},
  sellerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  ctaBanner: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    ...SHADOWS.subtle,
  },
  ctaBannerTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  ctaBannerSub: {
    color: '#c7d2fe',
    fontSize: 11,
    marginTop: 2,
  },
  sellerBanner: {
    backgroundColor: '#312e81',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  sellerBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sellerBannerEmoji: {
    fontSize: 14,
  },
  sellerBannerTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  sellerBannerSub: {
    color: '#c7d2fe',
    fontSize: 11,
    marginTop: 2,
  },
  sellerQuickStats: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatVal: {
    fontSize: 15,
    fontWeight: '800',
  },
  quickStatLabel: {
    fontSize: 11,
    marginTop: 1,
  },
  quickStatDivider: {
    width: 1,
    height: '80%',
    alignSelf: 'center',
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  navSection: {
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  proBadge: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 8,
  },
  proBadgeText: {
    color: '#2563eb',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  expandChevron: {
    fontSize: 14,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  navIcon: {
    fontSize: 17,
    width: 28,
  },
  navLabel: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  cartCountPill: {
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 10,
  },
  cartCountPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  aiTag: {
    backgroundColor: '#312e81',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  aiTagText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  logoutLabel: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  loginItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  loginLabel: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  themeToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 4,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 18,
  },
  themeIconBtn: {
    flex: 1,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CustomDrawerContent;
