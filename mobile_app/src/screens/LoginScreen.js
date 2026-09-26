import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, BackHandler,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SHADOWS } from '../theme/theme';
import API from '../services/api';

const LoginScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { login, googleLogin } = useAuth();
  const { colors } = useTheme();

  // 'login' | 'forgot_email' | 'forgot_otp' | 'forgot_reset'
  const [mode, setMode] = useState('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Forgot password flow state
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const otpInputRef = useRef(null);

  // Resend OTP countdown timer
  useEffect(() => {
    let timer;
    if (mode === 'forgot_otp' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [mode, countdown]);

  // Handle hardware back button on Android
  useEffect(() => {
    const onBackPress = () => {
      if (mode === 'forgot_reset' || mode === 'forgot_email') {
        setMode('login');
        return true;
      }
      if (mode === 'forgot_otp') {
        setMode('forgot_email');
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [mode]);

  const handleBack = () => {
    if (mode === 'forgot_reset' || mode === 'forgot_email') {
      setMode('login');
    } else if (mode === 'forgot_otp') {
      setMode('forgot_email');
    } else {
      navigation.goBack();
    }
  };

  // --- GOOGLE LOGIN ---
  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      const { promptGoogleSignIn } = require('../services/googleAuth');
      const googleData = await promptGoogleSignIn();
      if (!googleData) return;

      await googleLogin(googleData);
      const returnTo = route.params?.returnTo;
      if (returnTo === 'Cart') {
        navigation.navigate('MainTabs', { screen: 'Cart' });
      } else if (returnTo) {
        navigation.navigate(returnTo);
      } else {
        navigation.goBack();
      }
    } catch (err) {
      console.error('Google Sign-In Error:', err);
      Alert.alert('Google Sign-In Failed', err.response?.data?.error || err.message || 'Could not sign in with Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  // --- STANDARD LOGIN ---
  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Required', 'Enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      const returnTo = route.params?.returnTo;
      if (returnTo === 'Cart') {
        navigation.navigate('MainTabs', { screen: 'Cart' });
      } else if (returnTo) {
        navigation.navigate(returnTo);
      } else {
        navigation.goBack();
      }
    } catch (err) {
      let message = err.response?.data?.error || err.message || 'Wrong password or email';
      if (message === 'Invalid credentials' || message.toLowerCase().includes('invalid credential')) {
        message = 'Wrong password or email';
      }
      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  // --- FORGOT PASSWORD STEP 1: SEND OTP ---
  const handleSendResetCode = async () => {
    const cleanEmail = resetEmail.trim().toLowerCase();
    if (!cleanEmail) {
      Alert.alert('Required', 'Please enter your registered email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await API.post('/auth/forgot-password', { email: cleanEmail });
      Alert.alert('Verification Code Sent', res.data?.message || `A 6-digit code has been sent to ${cleanEmail}.`);
      setMode('forgot_otp');
      setCountdown(60);
      setOtp('');
      setTimeout(() => otpInputRef.current?.focus(), 300);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Could not send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- FORGOT PASSWORD STEP 2: AUTO-CHECK OTP ---
  const handleOtpTextChange = (text) => {
    const clean = text.replace(/[^0-9]/g, '').slice(0, 6);
    setOtp(clean);

    if (clean.length === 6) {
      autoVerifyOtp(clean);
    }
  };

  const autoVerifyOtp = async (codeToVerify) => {
    setVerifyingOtp(true);
    try {
      const res = await API.post('/auth/verify-reset-otp', {
        email: resetEmail.trim().toLowerCase(),
        otp: codeToVerify,
      });
      setResetToken(res.data.reset_token);
      setMode('forgot_reset');
      Alert.alert('Verified', 'Verification code confirmed. Please set your new password.');
    } catch (err) {
      Alert.alert('Verification Failed', err.response?.data?.error || 'Incorrect or expired code. Please try again.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    try {
      await API.post('/auth/forgot-password', {
        email: resetEmail.trim().toLowerCase(),
      });
      setCountdown(60);
      setOtp('');
      Alert.alert('Code Resent', `A fresh 6-digit code was sent to ${resetEmail}.`);
    } catch (err) {
      Alert.alert('Resend Failed', err.response?.data?.error || 'Could not resend verification code.');
    } finally {
      setResending(false);
    }
  };

  // --- FORGOT PASSWORD STEP 3: RESET PASSWORD ---
  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const res = await API.post('/auth/reset-password', {
        email: resetEmail.trim().toLowerCase(),
        reset_token: resetToken,
        new_password: newPassword,
      });

      Alert.alert('Success', res.data?.message || 'Password reset successfully! Please sign in.');
      setEmail(resetEmail);
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setResetToken('');
      setOtp('');
      setMode('login');
    } catch (err) {
      Alert.alert('Reset Failed', err.response?.data?.error || 'Could not update password.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = [styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }];

  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e?.endCoordinates?.height || 0)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Ensure ample clearance above Android 3-button or gesture system navbar and iOS home bar
  const effectiveBottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 48 : 20);
  const rootPaddingBottom = effectiveBottomInset;
  const scrollPaddingBottom = keyboardHeight > 0 ? keyboardHeight + 60 : effectiveBottomInset + 40;

  return (
    <View style={[styles.root, { backgroundColor: colors.surface, paddingTop: Math.max(insets.top, 20), paddingBottom: rootPaddingBottom }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: scrollPaddingBottom }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* TOP BACK BUTTON */}
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={handleBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.midnight} />
          </TouchableOpacity>

          {/* ========================================================= */}
          {/* MODE 1: LOGIN                                             */}
          {/* ========================================================= */}
          {mode === 'login' && (
            <>
              <Text style={[styles.title, { color: colors.midnight }]}>Welcome Back</Text>
              <Text style={[styles.subtitle, { color: colors.slate }]}>Sign in to your Embroidex account</Text>

              <View style={styles.form}>
                <View style={styles.group}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
                  <View style={inputStyle}>
                    <Ionicons name="mail-outline" size={19} color={colors.slate} style={styles.icon} />
                    <TextInput
                      style={[styles.input, { color: colors.midnight }]}
                      placeholder="name@example.com"
                      placeholderTextColor={colors.slate}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>
                </View>

                <View style={styles.group}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setResetEmail(email || '');
                        setMode('forgot_email');
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={[styles.forgotLink, { color: colors.primary }]}>Forgot Password?</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={inputStyle}>
                    <Ionicons name="lock-closed-outline" size={19} color={colors.slate} style={styles.icon} />
                    <TextInput
                      style={[styles.input, { color: colors.midnight }]}
                      placeholder="Enter your password"
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
                  onPress={handleLogin}
                  disabled={loading || googleLoading}
                  activeOpacity={0.82}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign In</Text>}
                </TouchableOpacity>

                <View style={styles.dividerRow}>
                  <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                  <Text style={[styles.dividerText, { color: colors.slate }]}>OR</Text>
                  <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                </View>

                <TouchableOpacity
                  style={[styles.googleBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={handleGoogleLogin}
                  disabled={loading || googleLoading}
                  activeOpacity={0.82}
                >
                  {googleLoading ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <>
                      <Ionicons name="logo-google" size={20} color="#EA4335" style={styles.googleIcon} />
                      <Text style={[styles.googleBtnText, { color: colors.midnight }]}>Continue with Google</Text>
                    </>
                  )}
                </TouchableOpacity>

                <View style={styles.switchRow}>
                  <Text style={[styles.switchText, { color: colors.slate }]}>Don't have an account? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('SignupScreen')}>
                    <Text style={[styles.switchLink, { color: colors.primary }]}>Create Account</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          {/* ========================================================= */}
          {/* MODE 2: FORGOT PASSWORD - EMAIL INPUT                     */}
          {/* ========================================================= */}
          {mode === 'forgot_email' && (
            <>
              <Text style={[styles.title, { color: colors.midnight }]}>Forgot Password</Text>
              <Text style={[styles.subtitle, { color: colors.slate }]}>
                Enter your registered email address to receive a 6-digit verification code.
              </Text>

              <View style={styles.form}>
                <View style={styles.group}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Registered Email</Text>
                  <View style={inputStyle}>
                    <Ionicons name="mail-outline" size={19} color={colors.slate} style={styles.icon} />
                    <TextInput
                      style={[styles.input, { color: colors.midnight }]}
                      placeholder="name@example.com"
                      placeholderTextColor={colors.slate}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      value={resetEmail}
                      onChangeText={setResetEmail}
                      autoFocus
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: colors.primary }, loading && styles.btnDisabled]}
                  onPress={handleSendResetCode}
                  disabled={loading}
                  activeOpacity={0.82}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>Send Verification Code</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setMode('login')}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={[styles.cancelText, { color: colors.slate }]}>Return to Sign In</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ========================================================= */}
          {/* MODE 3: FORGOT PASSWORD - 6-DIGIT OTP AUTO-CHECK          */}
          {/* ========================================================= */}
          {mode === 'forgot_otp' && (
            <>
              <Text style={[styles.title, { color: colors.midnight }]}>Enter 6-Digit Code</Text>
              <Text style={[styles.subtitle, { color: colors.slate }]}>
                We sent a code to <Text style={{ fontWeight: '700', color: colors.midnight }}>{resetEmail}</Text>. Code is automatically checked upon entering 6 digits.
              </Text>

              <View style={styles.form}>
                <View style={[styles.otpCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.otpCardLabel, { color: colors.textSecondary }]}>6-DIGIT VERIFICATION CODE</Text>
                  <TextInput
                    ref={otpInputRef}
                    style={[styles.otpInput, { color: colors.primary, borderColor: colors.primary }]}
                    placeholder="------"
                    placeholderTextColor={colors.slate}
                    keyboardType="number-pad"
                    maxLength={6}
                    value={otp}
                    onChangeText={handleOtpTextChange}
                    editable={!verifyingOtp}
                    autoFocus
                  />

                  {verifyingOtp && (
                    <View style={styles.verifyingRow}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={[styles.verifyingText, { color: colors.primary }]}>
                        Checking code automatically...
                      </Text>
                    </View>
                  )}

                  <View style={styles.resendContainer}>
                    <Text style={[styles.resendInfo, { color: colors.slate }]}>Didn't receive code?</Text>
                    {countdown > 0 ? (
                      <View style={[styles.countdownTag, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.countdownNumber, { color: colors.primary }]}>Resend in {countdown}s</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={handleResendCode}
                        disabled={resending || verifyingOtp}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={[styles.resendBtnText, { color: colors.primary }]}>
                          {resending ? 'Sending...' : 'Resend Code'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setMode('forgot_email')}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={[styles.cancelText, { color: colors.slate }]}>Change Email Address</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ========================================================= */}
          {/* MODE 4: FORGOT PASSWORD - RESET PASSWORD                   */}
          {/* ========================================================= */}
          {mode === 'forgot_reset' && (
            <>
              <Text style={[styles.title, { color: colors.midnight }]}>Create New Password</Text>
              <Text style={[styles.subtitle, { color: colors.slate }]}>
                Choose a strong password for your Embroidex account.
              </Text>

              <View style={styles.form}>
                <View style={styles.group}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>New Password</Text>
                  <View style={inputStyle}>
                    <Ionicons name="lock-closed-outline" size={19} color={colors.slate} style={styles.icon} />
                    <TextInput
                      style={[styles.input, { color: colors.midnight }]}
                      placeholder="Minimum 6 characters"
                      placeholderTextColor={colors.slate}
                      secureTextEntry={!showNewPw}
                      value={newPassword}
                      onChangeText={setNewPassword}
                    />
                    <TouchableOpacity onPress={() => setShowNewPw(!showNewPw)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Ionicons name={showNewPw ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.slate} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.group}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Confirm New Password</Text>
                  <View style={inputStyle}>
                    <Ionicons name="lock-closed-outline" size={19} color={colors.slate} style={styles.icon} />
                    <TextInput
                      style={[styles.input, { color: colors.midnight }]}
                      placeholder="Re-enter password"
                      placeholderTextColor={colors.slate}
                      secureTextEntry={!showConfirmPw}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPw(!showConfirmPw)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Ionicons name={showConfirmPw ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.slate} />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: colors.primary }, loading && styles.btnDisabled]}
                  onPress={handleUpdatePassword}
                  disabled={loading}
                  activeOpacity={0.82}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>Update Password</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setMode('login')}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={[styles.cancelText, { color: colors.slate }]}>Cancel</Text>
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
  subtitle: { fontSize: 15, marginTop: 6, fontWeight: '500', marginBottom: 28, lineHeight: 22 },
  form: { gap: 18 },
  group: { gap: 8 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: { fontSize: 14, fontWeight: '700' },
  forgotLink: {
    fontSize: 13,
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    height: 52, borderRadius: 14, paddingHorizontal: 14, borderWidth: 1,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, height: '100%', fontSize: 15 },
  btn: {
    height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
    ...SHADOWS.subtle,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
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
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  switchText: { fontSize: 15, fontWeight: '500' },
  switchLink: { fontSize: 15, fontWeight: '800', textDecorationLine: 'underline' },

  /* OTP Card & Auto Check */
  otpCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    ...SHADOWS.subtle,
  },
  otpCardLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  otpInput: {
    width: '100%',
    maxWidth: 240,
    height: 58,
    borderWidth: 2,
    borderRadius: 14,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 10,
    backgroundColor: '#fff',
  },
  verifyingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  verifyingText: {
    fontSize: 13,
    fontWeight: '700',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
  },
  resendInfo: {
    fontSize: 13,
    fontWeight: '500',
  },
  countdownTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  countdownNumber: {
    fontSize: 13,
    fontWeight: '700',
  },
  resendBtnText: {
    fontSize: 13,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen;
