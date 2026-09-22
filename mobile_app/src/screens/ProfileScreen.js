import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TopBar from '../components/TopBar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SHADOWS } from '../theme/theme';

const ProfileScreen = ({ navigation }) => {
  const { user, isAuthenticated, isSeller, logout, stats } = useAuth();
  const { colors } = useTheme();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.navigate('Home');
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {isAuthenticated ? user?.name?.slice(0, 2).toUpperCase() : 'EX'}
            </Text>
          </View>
          <Text style={[styles.name, { color: colors.midnight }]}>
            {isAuthenticated ? user?.name : 'Guest User'}
          </Text>
          <Text style={[styles.email, { color: colors.slate }]}>
            {isAuthenticated ? user?.email : 'Sign in to access your library'}
          </Text>

          <View style={[
            styles.roleBadge,
            isSeller
              ? { backgroundColor: 'rgba(22,163,74,0.12)' }
              : { backgroundColor: colors.borderLight },
          ]}>
            <Text style={[styles.roleBadgeText, { color: isSeller ? colors.success : colors.slate }]}>
              {isAuthenticated
                ? isSeller ? '⭐ Verified Seller' : 'Buyer Account'
                : 'Not Signed In'}
            </Text>
          </View>
        </View>

        {/* Stats */}
        {isAuthenticated && (
          <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.statBox}>
              <Text style={[styles.statVal, { color: colors.primary }]}>{stats?.totalPurchases || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.slate }]}>Purchases</Text>
            </View>
            {isSeller && (
              <>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statBox}>
                  <Text style={[styles.statVal, { color: colors.primary }]}>{stats?.totalDesigns || 0}</Text>
                  <Text style={[styles.statLabel, { color: colors.slate }]}>Designs</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statBox}>
                  <Text style={[styles.statVal, { color: colors.primary }]}>₹{stats?.totalEarnings || 0}</Text>
                  <Text style={[styles.statLabel, { color: colors.slate }]}>Earnings</Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* Menu */}
        <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {!isAuthenticated ? (
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}
              onPress={() => navigation.navigate('LoginScreen')}
            >
              <Ionicons name="log-in-outline" size={20} color={colors.primary} style={styles.menuIcon} />
              <Text style={[styles.menuLabel, { color: colors.midnight }]}>Sign In to Account</Text>
            </TouchableOpacity>
          ) : (
            <>
              {!isSeller && (
                <TouchableOpacity
                  style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}
                  onPress={() => navigation.navigate('SellerRegisterScreen')}
                >
                  <Ionicons name="briefcase-outline" size={20} color={colors.primary} style={styles.menuIcon} />
                  <Text style={[styles.menuLabel, { color: colors.midnight }]}>Become a Seller (Earn 70%)</Text>
                </TouchableOpacity>
              )}
              {isSeller && (
                <>
                  <TouchableOpacity
                    style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}
                    onPress={() => navigation.navigate('SellerUploadScreen')}
                  >
                    <Ionicons name="cloud-upload-outline" size={20} color={colors.midnight} style={styles.menuIcon} />
                    <Text style={[styles.menuLabel, { color: colors.midnight }]}>Upload Design</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}
                    onPress={() => navigation.navigate('SellerMyDesignsScreen')}
                  >
                    <Ionicons name="copy-outline" size={20} color={colors.midnight} style={styles.menuIcon} />
                    <Text style={[styles.menuLabel, { color: colors.midnight }]}>My Designs</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}
                    onPress={() => navigation.navigate('SellerEarningsScreen')}
                  >
                    <Ionicons name="wallet-outline" size={20} color={colors.midnight} style={styles.menuIcon} />
                    <Text style={[styles.menuLabel, { color: colors.midnight }]}>Earnings & Payouts</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}
                    onPress={() => navigation.navigate('SellerEarningsScreen', { initialTab: 'settings' })}
                  >
                    <Ionicons name="card-outline" size={20} color={colors.midnight} style={styles.menuIcon} />
                    <Text style={[styles.menuLabel, { color: colors.midnight }]}>Payment Settings</Text>
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity
                style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}
                onPress={() => navigation.navigate('Purchases')}
              >
                <Ionicons name="bag-handle-outline" size={20} color={colors.midnight} style={styles.menuIcon} />
                <Text style={[styles.menuLabel, { color: colors.midnight }]}>My Purchases</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItemDanger} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color={colors.danger} style={styles.menuIcon} />
                <Text style={[styles.menuLabel, { color: colors.danger }]}>Sign Out</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16 },
  profileCard: {
    borderRadius: 20, padding: 24, alignItems: 'center',
    marginBottom: 16, borderWidth: 1, ...SHADOWS.subtle,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12, ...SHADOWS.card,
  },
  avatarText: { fontSize: 26, fontWeight: '900', color: '#ffffff' },
  name: { fontSize: 18, fontWeight: '800' },
  email: { fontSize: 13, marginTop: 2 },
  roleBadge: { marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  roleBadgeText: { fontSize: 11, fontWeight: '800' },
  statsRow: {
    flexDirection: 'row', borderRadius: 16, padding: 14,
    marginBottom: 16, borderWidth: 1, ...SHADOWS.subtle,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '900' },
  statLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, height: '70%', alignSelf: 'center' },
  menuCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, ...SHADOWS.subtle },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1,
  },
  menuItemDanger: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16,
  },
  menuIcon: { width: 32 },
  menuLabel: { fontSize: 14, fontWeight: '700' },
});

export default ProfileScreen;
