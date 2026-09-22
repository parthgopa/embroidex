import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
  Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TopBar from '../components/TopBar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SHADOWS } from '../theme/theme';
import API from '../services/api';

const ProfileScreen = ({ navigation }) => {
  const { user, isAuthenticated, isSeller, logout, stats } = useAuth();
  const { colors } = useTheme();

  // Change Password Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [pwStep, setPwStep] = useState('initial'); // 'initial' | 'otp' | 'new_password'
  const [pwOtp, setPwOtp] = useState('');
  const [changeToken, setChangeToken] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwCountdown, setPwCountdown] = useState(60);

  useEffect(() => {
    let timer;
    if (modalVisible && pwStep === 'otp' && pwCountdown > 0) {
      timer = setInterval(() => setPwCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [modalVisible, pwStep, pwCountdown]);

  const handleOpenChangePassword = () => {
    setModalVisible(true);
    setPwStep('initial');
    setPwOtp('');
    setNewPw('');
    setConfirmPw('');
    setChangeToken('');
  };

  const handleSendPwOtp = async () => {
    setPwLoading(true);
    try {
      const res = await API.post('/auth/change-password/send-otp');
      Alert.alert('Verification Code Sent', res.data?.message || `A 6-digit code has been sent to ${user?.email}.`);
      setPwStep('otp');
      setPwCountdown(60);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to send verification code.');
    } finally {
      setPwLoading(false);
    }
  };

  const handleVerifyPwOtp = async (codeToVerify) => {
    const clean = (codeToVerify || pwOtp).replace(/[^0-9]/g, '').slice(0, 6);
    if (clean.length !== 6) {
      Alert.alert('Required', 'Please enter a valid 6-digit verification code.');
      return;
    }
    setPwLoading(true);
    try {
      const res = await API.post('/auth/change-password/verify-otp', { otp: clean });
      setChangeToken(res.data.change_token);
      setPwStep('new_password');
      Alert.alert('Code Verified', 'Please enter your new password.');
    } catch (err) {
      Alert.alert('Verification Failed', err.response?.data?.error || 'Invalid or expired code.');
    } finally {
      setPwLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPw.length < 6) {
      Alert.alert('Password Too Short', 'Password must be at least 6 characters long.');
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert('Mismatch', 'Passwords do not match. Please re-enter.');
      return;
    }
    setPwLoading(true);
    try {
      const res = await API.post('/auth/change-password/update', {
        change_token: changeToken,
        new_password: newPw,
      });
      Alert.alert('Success', res.data?.message || 'Password changed successfully!');
      setModalVisible(false);
      setPwStep('initial');
    } catch (err) {
      Alert.alert('Update Failed', err.response?.data?.error || 'Could not update password.');
    } finally {
      setPwLoading(false);
    }
  };

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

          <View style={styles.badgeRow}>
            {/* Role Badge */}
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

            {/* Registered As Badge (Google or Password) */}
            {isAuthenticated && (
              <View style={[styles.authMethodBadge, { backgroundColor: colors.background, borderColor: colors.border }]}>
                {user?.signup_method === 'google' ? (
                  <>
                    <Ionicons name="logo-google" size={13} color="#EA4335" />
                    <Text style={[styles.authMethodText, { color: colors.slate }]}>Google</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="lock-closed-outline" size={13} color={colors.primary} />
                    <Text style={[styles.authMethodText, { color: colors.slate }]}>Password</Text>
                  </>
                )}
              </View>
            )}
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

              {/* Password Change Option (Only for Password Accounts) */}
              {user?.signup_method !== 'google' && (
                <TouchableOpacity
                  style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}
                  onPress={handleOpenChangePassword}
                >
                  <Ionicons name="key-outline" size={20} color={colors.midnight} style={styles.menuIcon} />
                  <Text style={[styles.menuLabel, { color: colors.midnight, flex: 1 }]}>Change Password</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.slate} />
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.menuItemDanger} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color={colors.danger} style={styles.menuIcon} />
                <Text style={[styles.menuLabel, { color: colors.danger }]}>Sign Out</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* CHANGE PASSWORD MODAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.midnight }]}>Change Password</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color={colors.slate} />
              </TouchableOpacity>
            </View>

            {/* STEP 1: SEND CODE */}
            {pwStep === 'initial' && (
              <View style={styles.modalBody}>
                <Text style={[styles.modalDesc, { color: colors.slate }]}>
                  To update your password, we'll send a 6-digit OTP verification code to your registered email:
                </Text>
                <View style={[styles.emailBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Ionicons name="mail-outline" size={18} color={colors.primary} />
                  <Text style={[styles.emailBoxText, { color: colors.midnight }]}>{user?.email}</Text>
                </View>

                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                  onPress={handleSendPwOtp}
                  disabled={pwLoading}
                >
                  {pwLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalBtnText}>Send Verification Code</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 2: VERIFY OTP */}
            {pwStep === 'otp' && (
              <View style={styles.modalBody}>
                <Text style={[styles.modalDesc, { color: colors.slate }]}>
                  Enter the 6-digit code sent to <Text style={{ fontWeight: '700', color: colors.midnight }}>{user?.email}</Text>:
                </Text>

                <TextInput
                  style={[styles.modalOtpInput, { color: colors.primary, borderColor: colors.primary }]}
                  placeholder="------"
                  placeholderTextColor={colors.slate}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={pwOtp}
                  onChangeText={(text) => {
                    const clean = text.replace(/[^0-9]/g, '').slice(0, 6);
                    setPwOtp(clean);
                    if (clean.length === 6) {
                      handleVerifyPwOtp(clean);
                    }
                  }}
                  autoFocus
                />

                <View style={styles.modalResendRow}>
                  {pwCountdown > 0 ? (
                    <Text style={[styles.modalResendText, { color: colors.slate }]}>
                      Resend code in {pwCountdown}s
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={handleSendPwOtp} disabled={pwLoading}>
                      <Text style={[styles.modalResendBtn, { color: colors.primary }]}>Resend Code</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                  onPress={() => handleVerifyPwOtp(pwOtp)}
                  disabled={pwLoading || pwOtp.length !== 6}
                >
                  {pwLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalBtnText}>Verify Code</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 3: NEW PASSWORD & CONFIRM PASSWORD WITH REAL-TIME MATCH */}
            {pwStep === 'new_password' && (
              <View style={styles.modalBody}>
                <Text style={[styles.modalDesc, { color: colors.slate }]}>
                  Set a new, secure password (minimum 6 characters).
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>New Password</Text>
                  <View style={[styles.modalInputWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Ionicons name="lock-closed-outline" size={18} color={colors.slate} />
                    <TextInput
                      style={[styles.modalTextInput, { color: colors.midnight }]}
                      placeholder="Min. 6 characters"
                      placeholderTextColor={colors.slate}
                      secureTextEntry={!showNewPw}
                      value={newPw}
                      onChangeText={setNewPw}
                    />
                    <TouchableOpacity onPress={() => setShowNewPw(!showNewPw)}>
                      <Ionicons name={showNewPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.slate} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Confirm New Password</Text>
                  <View style={[styles.modalInputWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Ionicons name="lock-closed-outline" size={18} color={colors.slate} />
                    <TextInput
                      style={[styles.modalTextInput, { color: colors.midnight }]}
                      placeholder="Re-enter password"
                      placeholderTextColor={colors.slate}
                      secureTextEntry={!showConfirmPw}
                      value={confirmPw}
                      onChangeText={setConfirmPw}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPw(!showConfirmPw)}>
                      <Ionicons name={showConfirmPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.slate} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* REAL-TIME MATCH INDICATION */}
                {newPw.length > 0 && confirmPw.length > 0 && (
                  <View style={styles.matchIndicatorRow}>
                    {newPw === confirmPw ? (
                      <>
                        <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                        <Text style={[styles.matchText, { color: '#16a34a' }]}>Passwords match</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="alert-circle" size={16} color="#dc2626" />
                        <Text style={[styles.matchText, { color: '#dc2626' }]}>Passwords do not match</Text>
                      </>
                    )}
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    { backgroundColor: colors.primary },
                    (newPw !== confirmPw || newPw.length < 6 || pwLoading) && styles.btnDisabled,
                  ]}
                  onPress={handleUpdatePassword}
                  disabled={pwLoading || newPw !== confirmPw || newPw.length < 6}
                >
                  {pwLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalBtnText}>Update Password</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  roleBadgeText: { fontSize: 11, fontWeight: '800' },
  authMethodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  authMethodText: {
    fontSize: 11,
    fontWeight: '700',
  },
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

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    ...SHADOWS.card,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalBody: {
    gap: 14,
  },
  modalDesc: {
    fontSize: 13.5,
    lineHeight: 20,
  },
  emailBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  emailBoxText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOtpInput: {
    height: 52,
    borderWidth: 2,
    borderRadius: 12,
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 10,
    backgroundColor: '#fff',
    marginTop: 6,
  },
  modalResendRow: {
    alignItems: 'center',
    marginVertical: 4,
  },
  modalResendText: {
    fontSize: 12.5,
  },
  modalResendBtn: {
    fontSize: 13,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  modalInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  modalTextInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    paddingHorizontal: 8,
  },
  matchIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  matchText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  modalBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    ...SHADOWS.subtle,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  modalBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
});

export default ProfileScreen;
