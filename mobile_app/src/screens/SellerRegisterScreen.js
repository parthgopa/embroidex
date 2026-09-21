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
import { COLORS, SHADOWS } from '../theme/theme';

const SellerRegisterScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { registerSeller, isAuthenticated } = useAuth();
  const [mobileNumber, setMobileNumber] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessWebsite, setBusinessWebsite] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in before registering as a seller.', [
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
      Alert.alert('Congratulations! 🎉', 'You are now a verified seller on Embroidex!');
      navigation.navigate('MainTabs', { screen: 'Profile' });
    } catch (err) {
      Alert.alert('Registration Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 20), paddingBottom: Math.max(insets.bottom, 20) }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent={false} />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Bar with Native Circular Back Button */}
          <View style={styles.topNavRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="arrow-back" size={22} color={COLORS.midnight} />
            </TouchableOpacity>
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Become a Seller</Text>
            <Text style={styles.subtitle}>
              Upload your embroidery machine patterns and earn 70% on every sale with instant payouts.
            </Text>
          </View>

          <View style={styles.perksCard}>
            <Text style={styles.perksTitle}>Seller Advantages</Text>
            <View style={styles.perkRow}>
              <Ionicons name="cash-outline" size={17} color="#1d4ed8" style={styles.perkIcon} />
              <Text style={styles.perkItem}>70% Net Earnings on every purchase</Text>
            </View>
            <View style={styles.perkRow}>
              <Ionicons name="shield-checkmark-outline" size={17} color="#1d4ed8" style={styles.perkIcon} />
              <Text style={styles.perkItem}>Copyright protection with screenshot blocking</Text>
            </View>
            <View style={styles.perkRow}>
              <Ionicons name="flash-outline" size={17} color="#1d4ed8" style={styles.perkIcon} />
              <Text style={styles.perkItem}>Direct bank payouts via Razorpay</Text>
            </View>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mobile / WhatsApp Number *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={19} color={COLORS.slate} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="+91 9876543210"
                  placeholderTextColor={COLORS.slate}
                  keyboardType="phone-pad"
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Business / Workshop Address *</Text>
              <TextInput
                style={[styles.inputContainer, styles.multilineInput]}
                placeholder="Enter your workshop or store address"
                placeholderTextColor={COLORS.slate}
                multiline
                numberOfLines={3}
                value={businessAddress}
                onChangeText={setBusinessAddress}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Business Website / Portfolio (Optional)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="globe-outline" size={19} color={COLORS.slate} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="https://myworkshop.com"
                  placeholderTextColor={COLORS.slate}
                  autoCapitalize="none"
                  value={businessWebsite}
                  onChangeText={setBusinessWebsite}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitBtnText}>Activate Seller Account</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 4,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.subtle,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.midnight,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.slate,
    marginTop: 6,
    lineHeight: 22,
  },
  perksCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  perksTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e3a8a',
    marginBottom: 10,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  perkIcon: {
    marginRight: 8,
  },
  perkItem: {
    fontSize: 13,
    color: '#1d4ed8',
    fontWeight: '600',
    flex: 1,
  },
  form: {
    gap: 18,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.darkSlate,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: COLORS.background,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: COLORS.midnight,
  },
  multilineInput: {
    height: 90,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    ...SHADOWS.subtle,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
});

export default SellerRegisterScreen;
