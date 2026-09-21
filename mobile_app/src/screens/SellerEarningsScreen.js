import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TopBar from '../components/TopBar';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../theme/theme';

const SellerEarningsScreen = ({ navigation }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar showBack onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Ionicons name="wallet-outline" size={56} color={colors.primary} style={{ marginBottom: 16 }} />
        <Text style={[styles.title, { color: colors.midnight }]}>Earnings & Withdrawals</Text>
        <Text style={[styles.subtitle, { color: colors.slate }]}>
          Track your net 70% design sales earnings, set up bank account details and request withdrawals.
        </Text>
        <View style={[styles.phaseBadge, { backgroundColor: colors.primaryMuted }]}>
          <Text style={[styles.phaseBadgeText, { color: colors.primary }]}>Full Payout System in Phase 6</Text>
        </View>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.btnText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.midnight,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.slate,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  phaseBadge: {
    backgroundColor: COLORS.primaryMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 24,
  },
  phaseBadgeText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 12,
  },
  btn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
});

export default SellerEarningsScreen;
