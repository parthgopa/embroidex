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

const LoginScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { login, googleLogin } = useAuth();
  const { colors, isDark } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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
        // Cart is a tab inside MainTabs
        navigation.navigate('MainTabs', { screen: 'Cart' });
      } else if (returnTo) {
        navigation.navigate(returnTo);
      } else {
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.error || err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = [styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }];

  return (
    <View style={[styles.root, { backgroundColor: colors.surface, paddingTop: Math.max(insets.top, 20), paddingBottom: Math.max(insets.bottom, 20) }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.midnight} />
          </TouchableOpacity>

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
              <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
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
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingBottom: 32 },
  backBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, marginBottom: 24, marginTop: 4,
    ...SHADOWS.subtle,
  },
  title: { fontSize: 28, fontWeight: '900', letterSpacing: -0.6 },
  subtitle: { fontSize: 15, marginTop: 6, fontWeight: '500', marginBottom: 32 },
  form: { gap: 18 },
  group: { gap: 8 },
  label: { fontSize: 14, fontWeight: '700' },
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
});

export default LoginScreen;
