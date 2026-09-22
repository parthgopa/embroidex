import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SHADOWS } from '../theme/theme';

const SignupScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { sendSignupOtp, verifySignupOtp, googleLogin } = useAuth();
  const { colors } = useTheme();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignup = async () => {
    try {
      setGoogleLoading(true);
      const { promptGoogleSignIn } = require('../services/googleAuth');
      const googleData = await promptGoogleSignIn();
      if (!googleData) return;

      await googleLogin(googleData);
      navigation.navigate('MainTabs', { screen: 'Home' });
    } catch (err) {
      console.error('Google Sign-Up Error:', err);
      Alert.alert('Google Sign-Up Failed', err.response?.data?.error || err.message || 'Could not sign up with Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Required', 'Enter your full name, email, and password.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await sendSignupOtp(name, email, password);
      Alert.alert('Code Sent', `A 6-digit code has been sent to ${email}.`);
      setStep(2);
    } catch (err) {
      Alert.alert('Failed', err.response?.data?.error || err.message || 'Could not send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      Alert.alert('Enter Code', 'Enter the 6-digit verification code.');
      return;
    }
    setLoading(true);
    try {
      await verifySignupOtp(name, email, password, otp);
      Alert.alert('Welcome!', 'Account created successfully.');
      navigation.navigate('MainTabs', { screen: 'Home' });
    } catch (err) {
      Alert.alert('Verification Failed', err.response?.data?.error || err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = [styles.inputBox, { backgroundColor: colors.background, borderColor: colors.border }];

  // Ensure ample clearance above Android 3-button or gesture system navbar and iOS home bar
  const effectiveBottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 48 : 20);
  const rootPaddingBottom = effectiveBottomInset;
  const scrollPaddingBottom = effectiveBottomInset + 40;

  return (
    <View style={[styles.root, { backgroundColor: colors.surface, paddingTop: Math.max(insets.top, 20), paddingBottom: rootPaddingBottom }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: scrollPaddingBottom }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => (step === 2 ? setStep(1) : navigation.goBack())}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.midnight} />
          </TouchableOpacity>

          <Text style={[styles.title, { color: colors.midnight }]}>
            {step === 1 ? 'Create Account' : 'Verify Email'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.slate }]}>
            {step === 1
              ? 'Join Embroidex to discover embroidery designs'
              : `Enter the 6-digit code sent to ${email}`}
          </Text>

          {step === 1 ? (
            <View style={styles.form}>
              {[
                { label: 'Full Name', icon: 'person-outline', value: name, setter: setName, placeholder: 'John Doe' },
                { label: 'Email', icon: 'mail-outline', value: email, setter: setEmail, placeholder: 'name@example.com', keyboard: 'email-address' },
              ].map(({ label, icon, value, setter, placeholder, keyboard }) => (
                <View key={label} style={styles.group}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
                  <View style={inputStyle}>
                    <Ionicons name={icon} size={19} color={colors.slate} style={styles.icon} />
                    <TextInput
                      style={[styles.input, { color: colors.midnight }]}
                      placeholder={placeholder}
                      placeholderTextColor={colors.slate}
                      autoCapitalize={keyboard ? 'none' : 'words'}
                      keyboardType={keyboard || 'default'}
                      value={value}
                      onChangeText={setter}
                    />
                  </View>
                </View>
              ))}

              <View style={styles.group}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Password (min 6 chars)</Text>
                <View style={inputStyle}>
                  <Ionicons name="lock-closed-outline" size={19} color={colors.slate} style={styles.icon} />
                  <TextInput
                    style={[styles.input, { color: colors.midnight }]}
                    placeholder="Create a strong password"
                    placeholderTextColor={colors.slate}
                    secureTextEntry={!showPw}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPw(!showPw)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.slate} />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.primary }, loading && styles.btnDisabled]}
                onPress={handleSendOtp}
                disabled={loading || googleLoading}
                activeOpacity={0.82}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Continue with OTP →</Text>}
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.slate }]}>OR</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>

              <TouchableOpacity
                style={[styles.googleBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={handleGoogleSignup}
                disabled={loading || googleLoading}
                activeOpacity={0.82}
              >
                {googleLoading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={20} color="#EA4335" style={styles.googleIcon} />
                    <Text style={[styles.googleBtnText, { color: colors.midnight }]}>Sign up with Google</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.switchRow}>
                <Text style={[styles.switchText, { color: colors.slate }]}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
                  <Text style={[styles.switchLink, { color: colors.primary }]}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.group}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Verification Code</Text>
                <TextInput
                  style={[inputStyle, styles.otpInput, { color: colors.primary }]}
                  placeholder="123456"
                  placeholderTextColor={colors.slate}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                />
              </View>

              <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.primary }, loading && styles.btnDisabled]}
                onPress={handleVerifyOtp}
                disabled={loading}
                activeOpacity={0.82}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verify & Complete Signup</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.resendBtn} onPress={handleSendOtp} disabled={loading}>
                <Text style={[styles.resendText, { color: colors.primary }]}>Resend Code</Text>
              </TouchableOpacity>

              <View style={styles.switchRow}>
                <Text style={[styles.switchText, { color: colors.slate }]}>Have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
                  <Text style={[styles.switchLink, { color: colors.primary }]}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24 },
  backBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, marginBottom: 24, marginTop: 4,
    ...SHADOWS.subtle,
  },
  title: { fontSize: 28, fontWeight: '900', letterSpacing: -0.6 },
  subtitle: { fontSize: 15, marginTop: 6, fontWeight: '500', marginBottom: 32, lineHeight: 22 },
  form: { gap: 18 },
  group: { gap: 8 },
  label: { fontSize: 14, fontWeight: '700' },
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    height: 52, borderRadius: 14, paddingHorizontal: 14, borderWidth: 1,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, height: '100%', fontSize: 15 },
  otpInput: {
    fontSize: 24, fontWeight: '800', textAlign: 'center', letterSpacing: 8,
  },
  btn: {
    height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
    ...SHADOWS.subtle,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  resendBtn: { alignItems: 'center', paddingVertical: 8 },
  resendText: { fontSize: 14, fontWeight: '700' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  switchText: { fontSize: 15, fontWeight: '500' },
  switchLink: { fontSize: 15, fontWeight: '800', textDecorationLine: 'underline' },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    ...SHADOWS.subtle,
  },
  googleIcon: {
    marginRight: 10,
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});

export default SignupScreen;
