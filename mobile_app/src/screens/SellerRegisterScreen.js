import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SHADOWS } from '../theme/theme';

const SellerRegisterScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { registerSeller, isAuthenticated, isSeller, refreshProfile } = useAuth();
  const { colors, isDark } = useTheme();

  const [mobileNumber, setMobileNumber] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessWebsite, setBusinessWebsite] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in before registering as a seller.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('LoginScreen') },
      ]);
      return;
    }

    if (!mobileNumber.trim() || !businessAddress.trim()) {
      Alert.alert('Required Fields', 'Mobile number and business address are required.');
      return;
    }

    setLoading(true);
    try {
      await registerSeller({
        mobile_number: mobileNumber.trim(),
        business_address: businessAddress.trim(),
        business_website: businessWebsite.trim(),
      });
      if (refreshProfile) {
        await refreshProfile();
      }
      Alert.alert('Congratulations! 🎉', 'You are now a registered seller on Embroidex!');
      navigation.navigate('SellerUploadScreen');
    } catch (err) {
      Alert.alert('Registration Failed', err?.message || 'Could not register seller account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 16) }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.surface}
        animated={true}
      />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Bar with Back Button */}
          <View style={styles.topNavRow}>
            <TouchableOpacity
              style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="arrow-back" size={20} color={colors.midnight} />
            </TouchableOpacity>
            <Text style={[styles.navTitle, { color: colors.midnight }]}>Seller Registration</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* If already a registered seller, show active seller banner */}
          {isSeller ? (
            <View style={[styles.alreadySellerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.sellerBadgeIcon, { backgroundColor: isDark ? 'rgba(34,197,94,0.15)' : '#dcfce7' }]}>
                <Ionicons name="checkmark-circle" size={48} color="#16a34a" />
              </View>
              <Text style={[styles.alreadyTitle, { color: colors.midnight }]}>You are a Verified Seller</Text>
              <Text style={[styles.alreadySub, { color: colors.slate }]}>
                Your seller account is active. You can upload new embroidery designs, monitor your portfolio, and track your sales earnings.
              </Text>

              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('SellerUploadScreen')}
                activeOpacity={0.85}
              >
                <Ionicons name="cloud-upload-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.actionBtnText}>Upload New Design</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryActionBtn, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc' }]}
                onPress={() => navigation.navigate('SellerEarningsScreen')}
                activeOpacity={0.8}
              >
                <Ionicons name="wallet-outline" size={18} color={colors.midnight} style={{ marginRight: 8 }} />
                <Text style={[styles.secondaryActionBtnText, { color: colors.midnight }]}>Earnings & Withdrawals</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Header */}
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.midnight }]}>Become a Seller</Text>
                <Text style={[styles.subtitle, { color: colors.slate }]}>
                  Monetize your machine embroidery patterns on India's premier marketplace.
                </Text>
              </View>

              {/* Perks Card */}
              <View style={[styles.perksCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.perksTitle, { color: colors.midnight }]}>Seller Advantages</Text>
                <View style={styles.perkRow}>
                  <Ionicons name="cash-outline" size={18} color={colors.primary} style={styles.perkIcon} />
                  <Text style={[styles.perkItem, { color: colors.slate }]}>
                    <Text style={{ fontWeight: '700', color: colors.midnight }}>70% Net Earnings</Text> on every customer purchase
                  </Text>
                </View>
                <View style={styles.perkRow}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} style={styles.perkIcon} />
                  <Text style={[styles.perkItem, { color: colors.slate }]}>
                    <Text style={{ fontWeight: '700', color: colors.midnight }}>Copyright Protection</Text> with screenshot blocking
                  </Text>
                </View>
                <View style={styles.perkRow}>
                  <Ionicons name="flash-outline" size={18} color={colors.primary} style={styles.perkIcon} />
                  <Text style={[styles.perkItem, { color: colors.slate }]}>
                    <Text style={{ fontWeight: '700', color: colors.midnight }}>Direct Bank Payouts</Text> with minimum ₹2,000 threshold
                  </Text>
                </View>
              </View>

              {/* Registration Form */}
              <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.midnight }]}>Mobile / WhatsApp Number *</Text>
                  <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Ionicons name="call-outline" size={18} color={colors.slate} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.midnight }]}
                      placeholder="+91 9876543210"
                      placeholderTextColor={colors.slate}
                      keyboardType="phone-pad"
                      value={mobileNumber}
                      onChangeText={setMobileNumber}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.midnight }]}>Business / Workshop Address *</Text>
                  <TextInput
                    style={[styles.inputContainer, styles.multilineInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.midnight }]}
                    placeholder="Enter workshop or business address"
                    placeholderTextColor={colors.slate}
                    multiline
                    numberOfLines={3}
                    value={businessAddress}
                    onChangeText={setBusinessAddress}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.midnight }]}>Business Website / Portfolio (Optional)</Text>
                  <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Ionicons name="globe-outline" size={18} color={colors.slate} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.midnight }]}
                      placeholder="https://myworkshop.com"
                      placeholderTextColor={colors.slate}
                      autoCapitalize="none"
                      value={businessWebsite}
                      onChangeText={setBusinessWebsite}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, { backgroundColor: colors.primary }, loading && { opacity: 0.7 }]}
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={0.82}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.submitBtnText}>Activate Seller Account</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  perksCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
  },
  perksTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  perkIcon: {
    marginRight: 10,
  },
  perkItem: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  formCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    ...SHADOWS.card,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
  },
  submitBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...SHADOWS.button,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  alreadySellerCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
    ...SHADOWS.card,
  },
  sellerBadgeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  alreadyTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  alreadySub: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 48,
    borderRadius: 12,
    marginBottom: 12,
    ...SHADOWS.button,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export default SellerRegisterScreen;
