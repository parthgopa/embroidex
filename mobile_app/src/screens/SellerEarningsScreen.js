import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TopBar from '../components/TopBar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SHADOWS } from '../theme/theme';
import API from '../services/api';

const MIN_WITHDRAWAL = 2000;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

const SellerEarningsScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { isAuthenticated, isSeller } = useAuth();
  const scrollViewRef = useRef(null);
  const tabBarYRef = useRef(0);
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

  // Active tab: 'overview' | 'withdrawals' | 'settings'
  const initialTab = route.params?.initialTab === 'settings' ? 'settings' : 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Switch to Payment Settings tab and smoothly scroll to it
  const handleOpenSettingsTab = useCallback(() => {
    setActiveTab('settings');
    setTimeout(() => {
      if (tabBarYRef.current > 0) {
        scrollViewRef.current?.scrollTo({ y: Math.max(0, tabBarYRef.current - 12), animated: true });
      } else {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }
    }, 120);
  }, []);

  // Data states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [earnings, setEarnings] = useState({
    total_sales: 0,
    platform_fee: 0,
    total_earnings: 0,
    total_withdrawn: 0,
    available_balance: 0,
    total_orders: 0,
    platform_fee_percent: 30,
  });
  const [sales, setSales] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [balanceData, setBalanceData] = useState({
    availableBalance: 0,
    totalEarnings: 0,
    totalWithdrawn: 0,
    pendingAmount: 0,
    hasPayoutDetails: false,
  });
  const [payoutDetails, setPayoutDetails] = useState(null); // { type: 'UPI' | 'BANK', upiId, accountHolderName, bankName, accountNumber, ifscCode }

  // Payment Settings Form State
  const [payoutType, setPayoutType] = useState('UPI'); // 'UPI' | 'BANK'
  const [upiId, setUpiId] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  // Withdrawal Request Modal State
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  // Fetch Dashboard Data
  const fetchDashboardData = useCallback(async () => {
    if (!isAuthenticated || !isSeller) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const [balanceRes, earningsRes, payoutRes, withdrawalsRes] = await Promise.allSettled([
        API.get('/withdrawal/balance'),
        API.get('/seller/earnings'),
        API.get('/withdrawal/payout-settings'),
        API.get('/withdrawal/history'),
      ]);

      if (balanceRes.status === 'fulfilled' && balanceRes.value.data) {
        const b = balanceRes.value.data;
        setBalanceData({
          availableBalance: Number(b.availableBalance ?? 0),
          totalEarnings: Number(b.totalEarnings ?? 0),
          totalWithdrawn: Number(b.totalWithdrawn ?? 0),
          pendingAmount: Number(b.pendingAmount ?? 0),
          hasPayoutDetails: Boolean(b.hasPayoutDetails),
        });
      }

      if (earningsRes.status === 'fulfilled' && earningsRes.value.data) {
        setEarnings(earningsRes.value.data.earnings || {});
        setSales(earningsRes.value.data.sales || []);
      }

      if (payoutRes.status === 'fulfilled' && payoutRes.value.data) {
        const details = payoutRes.value.data.payoutDetails;
        setPayoutDetails(details);
        if (details) {
          setPayoutType(details.type || 'UPI');
          if (details.type === 'UPI') {
            setUpiId(details.upiId || '');
          } else if (details.type === 'BANK') {
            setAccountHolderName(details.accountHolderName || '');
            setBankName(details.bankName || '');
            setAccountNumber(details.accountNumber || '');
            setIfscCode(details.ifscCode || '');
          }
        }
      }

      if (withdrawalsRes.status === 'fulfilled' && withdrawalsRes.value.data) {
        setWithdrawals(withdrawalsRes.value.data.withdrawals || []);
      }
    } catch (error) {
      console.error('Error loading earnings dashboard:', error);
      Alert.alert('Error', error.message || 'Failed to refresh financial metrics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, isSeller]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Re-fetch on focus and scroll if opened directly to settings
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchDashboardData();
      if (route.params?.initialTab === 'settings') {
        handleOpenSettingsTab();
      }
    });
    return unsubscribe;
  }, [navigation, fetchDashboardData, route.params?.initialTab, handleOpenSettingsTab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // Save Payment Settings (UPI or BANK)
  const handleSavePaymentSettings = async () => {
    setSavingSettings(true);
    try {
      const payload = { type: payoutType };

      if (payoutType === 'UPI') {
        if (!upiId.trim()) {
          Alert.alert('Validation Error', 'Please enter a valid UPI ID (e.g. username@bank, 9876543210@paytm).');
          setSavingSettings(false);
          return;
        }
        payload.upiId = upiId.trim();
      } else if (payoutType === 'BANK') {
        if (!accountHolderName.trim()) {
          Alert.alert('Validation Error', 'Please enter account holder name.');
          setSavingSettings(false);
          return;
        }
        if (!accountNumber.trim()) {
          Alert.alert('Validation Error', 'Please enter account number.');
          setSavingSettings(false);
          return;
        }
        if (!ifscCode.trim()) {
          Alert.alert('Validation Error', 'Please enter IFSC code.');
          setSavingSettings(false);
          return;
        }
        const cleanIfsc = ifscCode.trim().toUpperCase();
        if (!IFSC_REGEX.test(cleanIfsc)) {
          Alert.alert('Validation Error', 'Invalid IFSC code. Format: 4 letters, 0, 6 alphanumeric (e.g. HDFC0001234).');
          setSavingSettings(false);
          return;
        }
        payload.accountHolderName = accountHolderName.trim();
        payload.bankName = bankName.trim();
        payload.accountNumber = accountNumber.trim();
        payload.ifscCode = cleanIfsc;
      }

      const res = await API.post('/withdrawal/payout-settings', payload);
      setPayoutDetails(res.data.payoutDetails);
      Alert.alert('Success', res.data.message || 'Payment settings updated successfully!');
      fetchDashboardData();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to save payment settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  // Open Withdrawal Modal
  const handleOpenWithdrawModal = () => {
    // Check if ANY payout method is set (UPI or BANK)
    if (!payoutDetails) {
      Alert.alert(
        'Payment Method Required',
        'Please set up either your UPI ID or Bank Account in Payment Settings before requesting a withdrawal.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Configure Now', onPress: handleOpenSettingsTab },
        ]
      );
      return;
    }

    if (availableBal < MIN_WITHDRAWAL) {
      Alert.alert(
        'Minimum Threshold Not Met',
        `Minimum withdrawal amount is ₹${MIN_WITHDRAWAL.toLocaleString('en-IN')}. Your available balance is ₹${availableBal.toFixed(2)}.`
      );
      return;
    }

    setWithdrawAmount(String(Math.max(0, Math.floor(availableBal))));
    setWithdrawModalVisible(true);
  };

  // Submit Withdrawal Request
  const handleSubmitWithdraw = async () => {
    const amount = Number(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount.');
      return;
    }

    if (amount < MIN_WITHDRAWAL) {
      Alert.alert('Validation Error', `Minimum withdrawal amount is ₹${MIN_WITHDRAWAL.toLocaleString('en-IN')}.`);
      return;
    }

    if (amount > availableBal) {
      Alert.alert('Validation Error', `Amount exceeds available balance of ₹${availableBal.toFixed(2)}.`);
      return;
    }

    try {
      setSubmittingWithdraw(true);
      const res = await API.post('/withdrawal/request', { amount });
      setWithdrawModalVisible(false);
      setWithdrawAmount('');
      Alert.alert(
        'Withdrawal Request Submitted',
        res.data.message || 'Your withdrawal request is pending and will be processed in 2-3 business days.'
      );
      fetchDashboardData();
      setActiveTab('withdrawals');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to submit withdrawal request.');
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TopBar showBack onBack={() => navigation.goBack()} />
        <View style={styles.centerContainer}>
          <Ionicons name="lock-closed-outline" size={56} color={colors.primary} style={{ marginBottom: 16 }} />
          <Text style={[styles.emptyTitle, { color: colors.midnight }]}>Authentication Required</Text>
          <Text style={[styles.emptySubtitle, { color: colors.slate }]}>
            Please login in to view your seller earnings and manage payouts.
          </Text>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('LoginScreen')}
          >
            <Text style={styles.primaryBtnText}>Login In Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!isSeller) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TopBar showBack onBack={() => navigation.goBack()} />
        <View style={styles.centerContainer}>
          <Ionicons name="cash-outline" size={56} color={colors.primary} style={{ marginBottom: 16 }} />
          <Text style={[styles.emptyTitle, { color: colors.midnight }]}>Become a Seller</Text>
          <Text style={[styles.emptySubtitle, { color: colors.slate }]}>
            Register your designer studio to earn 70% royalties whenever buyers purchase your embroidery designs.
          </Text>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('SellerRegisterScreen')}
          >
            <Text style={styles.primaryBtnText}>Register as Seller</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const availableBal = Number(balanceData.availableBalance ?? earnings.available_balance ?? 0);
  const totalEarned = Number(balanceData.totalEarnings ?? earnings.total_earnings ?? 0);
  const totalWithdrawn = Number(balanceData.totalWithdrawn ?? 0);
  const pendingRequests = Number(balanceData.pendingAmount ?? 0);
  const totalSalesVal = Number(earnings.total_sales || 0);
  const ordersCount = Number(earnings.total_orders || 0);

  // Check which method is active
  const hasUpi = payoutDetails?.type === 'UPI' && Boolean(payoutDetails?.upiId);
  const hasBank = payoutDetails?.type === 'BANK' && Boolean(payoutDetails?.accountNumber);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar showBack onBack={() => navigation.goBack()} />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.slate }]}>Loading earnings & payouts...</Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 100 : Math.max(insets.bottom, 16) + 60 },
          ]}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {/* Header Title */}
          <View style={styles.headerTitleArea}>
            <Text style={[styles.pageTitle, { color: colors.midnight }]}>My Earnings (मेरी कमाई)</Text>
            <Text style={[styles.pageSubtitle, { color: colors.slate }]}>
              Check your earnings and withdraw money to your bank or UPI
            </Text>
          </View>

          {/* Hero Available Balance Card - Simple, Bold & Easy to Understand */}
          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: isDark ? '#1e1b4b' : '#312e81',
                borderColor: isDark ? '#4338ca' : '#4f46e5',
              },
            ]}
          >
            <View style={styles.heroTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroLabel}>MONEY YOU CAN WITHDRAW</Text>
                <Text
                  style={[
                    styles.heroAmount,
                    availableBal < 0 && { color: '#fca5a5' },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  ₹{availableBal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
                <Text style={styles.heroHelperSubtitle}>
                  उपलब्ध बैलेंस • Ready to transfer to your bank
                </Text>
              </View>
              <View style={styles.heroIconBadge}>
                <Ionicons name="wallet" size={28} color="#ffffff" />
              </View>
            </View>

            {/* Pending Withdrawal Notification (if any) */}
            {pendingRequests > 0 && (
              <View style={styles.pendingNoticeBanner}>
                <Ionicons name="time-outline" size={16} color="#fde047" style={{ marginRight: 6 }} />
                <Text style={styles.pendingNoticeText}>
                  ₹{pendingRequests.toLocaleString('en-IN')} transfer is processing (takes 2-3 business days)
                </Text>
              </View>
            )}

            {/* Main Action Button */}
            <TouchableOpacity
              style={[
                styles.withdrawMainBtn,
                {
                  backgroundColor: availableBal >= MIN_WITHDRAWAL ? '#10b981' : 'rgba(255,255,255,0.18)',
                  opacity: availableBal >= MIN_WITHDRAWAL ? 1 : 0.7,
                },
              ]}
              onPress={handleOpenWithdrawModal}
              disabled={availableBal < MIN_WITHDRAWAL}
              activeOpacity={0.8}
            >
              <Ionicons
                name={availableBal >= MIN_WITHDRAWAL ? 'arrow-up-circle' : 'lock-closed-outline'}
                size={20}
                color="#ffffff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.withdrawMainBtnText}>
                {availableBal >= MIN_WITHDRAWAL
                  ? 'Withdraw Money to Bank / UPI'
                  : `Withdraw (Min. ₹${MIN_WITHDRAWAL.toLocaleString('en-IN')} required)`}
              </Text>
            </TouchableOpacity>

            {/* Helper text if balance is below threshold */}
            {availableBal < MIN_WITHDRAWAL && (
              <Text style={styles.minThresholdHint}>
                ℹ️ You need ₹{MIN_WITHDRAWAL.toLocaleString('en-IN')} to withdraw. You need ₹{Math.max(0, MIN_WITHDRAWAL - availableBal).toFixed(0)} more.
              </Text>
            )}
          </View>

          {/* Connected Payout Account Card (Where the money will go) */}
          {payoutDetails ? (
            <View style={[styles.payoutAccountCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.payoutAccountIconWrap, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5' }]}>
                <Ionicons
                  name={hasUpi ? 'qr-code-outline' : 'business-outline'}
                  size={22}
                  color="#059669"
                />
              </View>
              <View style={styles.payoutAccountInfo}>
                <Text style={[styles.payoutAccountLabel, { color: colors.slate }]}>
                  Your money will be sent to:
                </Text>
                <Text style={[styles.payoutAccountValue, { color: colors.midnight }]} numberOfLines={1}>
                  {hasUpi
                    ? `UPI ID: ${payoutDetails.upiId}`
                    : `${payoutDetails.bankName || 'Bank'} A/C: ••••${String(payoutDetails.accountNumber || '').slice(-4)}`}
                </Text>
                {hasBank && payoutDetails.accountHolderName ? (
                  <Text style={[styles.payoutAccountSub, { color: colors.slateMuted }]} numberOfLines={1}>
                    Name: {payoutDetails.accountHolderName}
                  </Text>
                ) : null}
              </View>
              <TouchableOpacity
                style={[
                  styles.editAccountBtn,
                  {
                    borderColor: colors.primary,
                    backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#eef2ff',
                  },
                ]}
                onPress={handleOpenSettingsTab}
                activeOpacity={0.7}
              >
                <Ionicons name="pencil" size={13} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={[styles.editAccountBtnText, { color: colors.primary }]}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View
              style={[
                styles.payoutMissingCard,
                {
                  backgroundColor: isDark ? 'rgba(217, 119, 6, 0.15)' : '#fffbeb',
                  borderColor: isDark ? '#b45309' : '#fde68a',
                },
              ]}
            >
              <View style={styles.payoutMissingLeft}>
                <Ionicons name="alert-circle" size={24} color="#d97706" style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.payoutMissingTitle, { color: isDark ? '#fde047' : '#92400e' }]}>
                    No Bank or UPI Added
                  </Text>
                  <Text style={[styles.payoutMissingSub, { color: isDark ? '#fef3c7' : '#b45309' }]}>
                    Add your account details to receive your money.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.addAccountBtn, { backgroundColor: '#d97706' }]}
                onPress={handleOpenSettingsTab}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle-outline" size={15} color="#ffffff" style={{ marginRight: 4 }} />
                <Text style={styles.addAccountBtnText}>Add Now</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Simple 3-Card Summary (Total Earned, Sent to Bank, Designs Sold) */}
          <View style={styles.summaryContainer}>
            {/* Big Total Earned Card */}
            <View style={[styles.summaryCardFull, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.summaryCardIconWrap, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5' }]}>
                <Ionicons name="cash-outline" size={22} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.summaryCardLabel, { color: colors.slate }]}>TOTAL MONEY EARNED (कुल कमाई)</Text>
                <Text style={[styles.summaryCardValBig, { color: colors.midnight }]}>
                  ₹{totalEarned.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
                <Text style={[styles.summaryCardSub, { color: colors.slateMuted }]}>
                  Your 70% share from all sold designs
                </Text>
              </View>
            </View>

            {/* Row of 2 Supporting Cards */}
            <View style={styles.summaryCardsRow}>
              <View style={[styles.summaryCardHalf, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.summaryCardIconWrapSmall, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff' }]}>
                  <Ionicons name="checkmark-done-circle-outline" size={18} color="#2563eb" />
                </View>
                <Text style={[styles.summaryCardValMedium, { color: colors.midnight }]}>
                  ₹{totalWithdrawn.toLocaleString('en-IN')}
                </Text>
                <Text style={[styles.summaryCardLabelSmall, { color: colors.slate }]}>SENT TO BANK</Text>
                <Text style={[styles.summaryCardSubSmall, { color: colors.slateMuted }]}>Already paid out</Text>
              </View>

              <View style={[styles.summaryCardHalf, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.summaryCardIconWrapSmall, { backgroundColor: isDark ? 'rgba(147, 51, 234, 0.15)' : '#f5f3ff' }]}>
                  <Ionicons name="shirt-outline" size={18} color="#7c3aed" />
                </View>
                <Text style={[styles.summaryCardValMedium, { color: colors.midnight }]}>
                  {ordersCount}
                </Text>
                <Text style={[styles.summaryCardLabelSmall, { color: colors.slate }]}>DESIGNS SOLD</Text>
                <Text style={[styles.summaryCardSubSmall, { color: colors.slateMuted }]}>Total copies purchased</Text>
              </View>
            </View>
          </View>

          {/* Segmented Navigation Tabs */}
          <View
            style={styles.tabBar}
            onLayout={(e) => {
              tabBarYRef.current = e.nativeEvent.layout.y;
            }}
          >
            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'overview' && [styles.activeTabBtn, { borderBottomColor: colors.primary }],
              ]}
              onPress={() => setActiveTab('overview')}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'overview' ? colors.primary : colors.slate },
                  activeTab === 'overview' && { fontWeight: '700' },
                ]}
              >
                Sales ({sales.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'withdrawals' && [styles.activeTabBtn, { borderBottomColor: colors.primary }],
              ]}
              onPress={() => setActiveTab('withdrawals')}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'withdrawals' ? colors.primary : colors.slate },
                  activeTab === 'withdrawals' && { fontWeight: '700' },
                ]}
              >
                Withdrawals ({withdrawals.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'settings' && [styles.activeTabBtn, { borderBottomColor: colors.primary }],
              ]}
              onPress={() => setActiveTab('settings')}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === 'settings' ? colors.primary : colors.slate },
                  activeTab === 'settings' && { fontWeight: '700' },
                ]}
              >
                Payment Settings
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: SALES HISTORY */}
          {activeTab === 'overview' && (
            <View style={styles.tabContent}>
              {sales.length === 0 ? (
                <View style={styles.emptyHistoryBox}>
                  <Ionicons name="receipt-outline" size={40} color={colors.slateMuted} />
                  <Text style={[styles.emptyHistoryTitle, { color: colors.midnight }]}>No Sales Yet</Text>
                  <Text style={[styles.emptyHistorySub, { color: colors.slate }]}>
                    When buyers purchase your embroidery designs, each transaction and 70% royalty breakdown will appear here.
                  </Text>
                </View>
              ) : (
                sales.map((item, index) => {
                  const dateStr = item.purchased_at
                    ? new Date(item.purchased_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Recent';

                  return (
                    <View
                      key={item._id || String(index)}
                      style={[styles.historyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    >
                      <View style={styles.historyCardTop}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={[styles.historyTitle, { color: colors.midnight }]} numberOfLines={1}>
                            {item.design_title || 'Embroidery Design'}
                          </Text>
                          <Text style={[styles.historyDate, { color: colors.slate }]}>{dateStr}</Text>
                        </View>
                        <View style={styles.earningBadge}>
                          <Text style={styles.earningBadgeText}>+₹{item.seller_earning}</Text>
                        </View>
                      </View>

                      <View style={[styles.historyCardFooter, { borderTopColor: colors.border }]}>
                        <Text style={[styles.breakdownText, { color: colors.slate }]}>
                          Sale: ₹{item.sale_price} • Platform Fee: ₹{item.platform_fee} (30%)
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* TAB 2: WITHDRAWALS */}
          {activeTab === 'withdrawals' && (
            <View style={styles.tabContent}>
              {withdrawals.length === 0 ? (
                <View style={styles.emptyHistoryBox}>
                  <Ionicons name="cash-outline" size={40} color={colors.slateMuted} />
                  <Text style={[styles.emptyHistoryTitle, { color: colors.midnight }]}>No Withdrawal Requests</Text>
                  <Text style={[styles.emptyHistorySub, { color: colors.slate }]}>
                    Your submitted payout requests and their bank/UPI transfer statuses will be tracked here.
                  </Text>
                </View>
              ) : (
                withdrawals.map((w, index) => {
                  const status = (w.status || 'pending').toLowerCase();
                  const isDone = ['approved', 'completed', 'processed'].includes(status);
                  const isFail = status === 'rejected';

                  const badgeBg = isDone ? '#ecfdf5' : isFail ? '#fef2f2' : '#fffbeb';
                  const badgeText = isDone ? '#059669' : isFail ? '#dc2626' : '#d97706';

                  const dateStr = w.requestedAt || w.requested_at
                    ? new Date(w.requestedAt || w.requested_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Recent';

                  const pDetails = w.payoutDetails || w.bank_account;
                  const isUpiPayout = pDetails?.type === 'UPI' || Boolean(pDetails?.upiId);

                  return (
                    <View
                      key={w._id || String(index)}
                      style={[styles.historyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    >
                      <View style={styles.historyCardTop}>
                        <View>
                          <Text style={[styles.withdrawAmountText, { color: colors.midnight }]}>
                            ₹{Number(w.amount || 0).toLocaleString('en-IN')}
                          </Text>
                          <Text style={[styles.historyDate, { color: colors.slate }]}>
                            Ref: {w.referenceId || w.reference_id || 'WD-REQ'} • {dateStr}
                          </Text>
                        </View>
                        <View style={[styles.statusPill, { backgroundColor: badgeBg }]}>
                          <Text style={[styles.statusPillText, { color: badgeText }]}>
                            {status.toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      {pDetails && (
                        <View style={[styles.historyCardFooter, { borderTopColor: colors.border }]}>
                          <Text style={[styles.breakdownText, { color: colors.slate }]}>
                            {isUpiPayout
                              ? `Transfer via UPI: ${pDetails.upiId}`
                              : `Transfer to Bank: ${pDetails.bankName || pDetails.bank_name || 'Bank'} (${pDetails.accountNumber || pDetails.account_number})`}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* TAB 3: PAYMENT SETTINGS (EXACT MATCH TO WEBSITE SCREENSHOTS 3 & 4) */}
          {activeTab === 'settings' && (
            <View style={styles.tabContent}>
              <View style={[styles.paymentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.paymentCardHeader}>
                  <View style={[styles.paymentCardIconWrap, { backgroundColor: colors.primaryMuted }]}>
                    <Ionicons name="card-outline" size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.paymentCardTitle, { color: colors.midnight }]}>
                      {payoutDetails ? 'Update Payment Method' : 'Set Up Payment Method'}
                    </Text>
                    <Text style={[styles.paymentCardSubtitle, { color: colors.slate }]}>
                      Select your preferred withdrawal method and fill in details
                    </Text>
                  </View>
                </View>

                {/* Method Selector: UPI Transfer vs Bank Account */}
                <View style={[styles.methodSelector, { backgroundColor: colors.surfaceAlt }]}>
                  <TouchableOpacity
                    style={[
                      styles.methodBtn,
                      payoutType === 'UPI' && [styles.methodBtnActive, { backgroundColor: colors.surface }],
                    ]}
                    onPress={() => setPayoutType('UPI')}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="qr-code-outline"
                      size={16}
                      color={payoutType === 'UPI' ? colors.primary : colors.slate}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.methodBtnText,
                        { color: payoutType === 'UPI' ? colors.primary : colors.slate, fontWeight: payoutType === 'UPI' ? '700' : '500' },
                      ]}
                    >
                      UPI Transfer
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.methodBtn,
                      payoutType === 'BANK' && [styles.methodBtnActive, { backgroundColor: colors.surface }],
                    ]}
                    onPress={() => setPayoutType('BANK')}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="business-outline"
                      size={16}
                      color={payoutType === 'BANK' ? colors.primary : colors.slate}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.methodBtnText,
                        { color: payoutType === 'BANK' ? colors.primary : colors.slate, fontWeight: payoutType === 'BANK' ? '700' : '500' },
                      ]}
                    >
                      Bank Account
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* UPI FORM (Screenshot 3) */}
                {payoutType === 'UPI' && (
                  <View style={styles.methodFieldsWrap}>
                    <Text style={[styles.inputLabel, { color: colors.midnight }]}>
                      UPI ID <Text style={{ color: '#dc2626' }}>*</Text>
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.midnight },
                      ]}
                      placeholder="e.g. 8468847069@oksbi, username@paytm"
                      placeholderTextColor={colors.slateMuted}
                      value={upiId}
                      onChangeText={setUpiId}
                      onFocus={() => setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 150)}
                      autoCapitalize="none"
                    />
                    <Text style={[styles.inputHint, { color: colors.slateMuted }]}>
                      Enter the VPA / UPI ID linked to your bank account for direct payouts.
                    </Text>
                  </View>
                )}

                {/* BANK ACCOUNT FORM (Screenshot 4) */}
                {payoutType === 'BANK' && (
                  <View style={styles.methodFieldsWrap}>
                    <Text style={[styles.inputLabel, { color: colors.midnight }]}>
                      Account Holder Name <Text style={{ color: '#dc2626' }}>*</Text>
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.midnight },
                      ]}
                      placeholder="Full name per bank records"
                      placeholderTextColor={colors.slateMuted}
                      value={accountHolderName}
                      onChangeText={setAccountHolderName}
                      onFocus={() => setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 150)}
                    />

                    <Text style={[styles.inputLabel, { color: colors.midnight }]}>Bank Name</Text>
                    <TextInput
                      style={[
                        styles.input,
                        { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.midnight },
                      ]}
                      placeholder="e.g. HDFC Bank, SBI"
                      placeholderTextColor={colors.slateMuted}
                      value={bankName}
                      onChangeText={setBankName}
                      onFocus={() => setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 150)}
                    />

                    <Text style={[styles.inputLabel, { color: colors.midnight }]}>
                      Account Number <Text style={{ color: '#dc2626' }}>*</Text>
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.midnight },
                      ]}
                      placeholder="Enter account number"
                      placeholderTextColor={colors.slateMuted}
                      keyboardType="number-pad"
                      value={accountNumber}
                      onChangeText={setAccountNumber}
                      onFocus={() => setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 150)}
                    />

                    <Text style={[styles.inputLabel, { color: colors.midnight }]}>
                      IFSC Code <Text style={{ color: '#dc2626' }}>*</Text>
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.midnight },
                      ]}
                      placeholder="E.G. HDFC0001234"
                      placeholderTextColor={colors.slateMuted}
                      autoCapitalize="characters"
                      maxLength={11}
                      value={ifscCode}
                      onChangeText={(t) => setIfscCode(t.toUpperCase())}
                      onFocus={() => setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 150)}
                    />
                  </View>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                  style={[styles.updateSettingsBtn, { backgroundColor: colors.primary }]}
                  onPress={handleSavePaymentSettings}
                  disabled={savingSettings}
                  activeOpacity={0.8}
                >
                  {savingSettings ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.updateSettingsBtnText}>Update Payment Settings</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* WITHDRAWAL REQUEST MODAL */}
      <Modal
        visible={withdrawModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setWithdrawModalVisible(false)}
      >
        <View
          style={[
            styles.modalOverlay,
            { paddingBottom: keyboardHeight > 0 ? keyboardHeight : Math.max(insets.bottom, Platform.OS === 'android' ? 48 : 24) },
          ]}
        >
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.surface,
                paddingBottom: 16,
                maxHeight: Dimensions.get('window').height * (keyboardHeight > 0 ? 0.65 : 0.85),
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.midnight }]}>Request Payout</Text>
              <TouchableOpacity onPress={() => setWithdrawModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.slate} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              <View style={[styles.balanceNoticeBox, { backgroundColor: colors.surfaceAlt }]}>
                <Text style={[styles.balanceNoticeLabel, { color: colors.slate }]}>Available Balance</Text>
                <Text
                  style={[
                    styles.balanceNoticeAmount,
                    { color: availableBal < 0 ? '#ef4444' : colors.primary },
                  ]}
                >
                  ₹{availableBal.toFixed(2)}
                </Text>
              </View>

              <Text style={[styles.inputLabel, { color: colors.midnight, marginTop: 12 }]}>
                Withdrawal Amount (₹) *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.midnight, fontSize: 18, fontWeight: '700' },
                ]}
                placeholder={`Minimum ₹${MIN_WITHDRAWAL}`}
                placeholderTextColor={colors.slateMuted}
                keyboardType="number-pad"
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
                editable={availableBal >= MIN_WITHDRAWAL}
              />
              <Text style={[styles.inputHint, { color: colors.slate, marginTop: 4 }]}>
                Minimum: ₹{MIN_WITHDRAWAL} | Available: ₹{availableBal.toFixed(2)}
              </Text>

              {availableBal < MIN_WITHDRAWAL && (
                <View style={[styles.modalWarningNotice, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2', borderColor: isDark ? '#b91c1c' : '#fecaca' }]}>
                  <Ionicons name="alert-circle" size={16} color="#dc2626" style={{ marginRight: 6 }} />
                  <Text style={[styles.modalWarningText, { color: '#dc2626' }]}>
                    You need at least ₹${MIN_WITHDRAWAL} to request a withdrawal.
                  </Text>
                </View>
              )}

              {/* Quick Amount Chips */}
              {availableBal >= MIN_WITHDRAWAL && (
                <View style={styles.chipRow}>
                  {[2000, 5000, 10000].map((amt) => {
                    if (amt > availableBal) return null;
                    return (
                      <TouchableOpacity
                        key={amt}
                        style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
                        onPress={() => setWithdrawAmount(String(amt))}
                      >
                        <Text style={[styles.chipText, { color: colors.midnight }]}>₹{amt}</Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    style={[styles.chip, { borderColor: colors.primary, backgroundColor: colors.primaryMuted }]}
                    onPress={() => setWithdrawAmount(String(Math.floor(availableBal)))}
                  >
                    <Text style={[styles.chipText, { color: colors.primary, fontWeight: '700' }]}>All (Max)</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Target Payout Destination (UPI or Bank) */}
              {payoutDetails && (
                <View style={[styles.targetBankNote, { borderColor: colors.border }]}>
                  <Ionicons
                    name={hasUpi ? 'qr-code-outline' : 'business-outline'}
                    size={18}
                    color={colors.primary}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={[styles.targetBankText, { color: colors.midnight }]}>
                    Settling via{' '}
                    <Text style={{ fontWeight: '700' }}>
                      {hasUpi
                        ? `UPI (${payoutDetails.upiId})`
                        : `${payoutDetails.bankName || 'Bank'} (${payoutDetails.accountNumber})`}
                    </Text>
                  </Text>
                </View>
              )}

              <Text style={[styles.payoutDisclaimer, { color: colors.slateMuted }]}>
                Processing Time: Withdrawal requests are processed within 2-3 business days.
              </Text>

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  {
                    backgroundColor: availableBal >= MIN_WITHDRAWAL ? colors.primary : 'rgba(100,116,139,0.5)',
                    opacity: availableBal >= MIN_WITHDRAWAL ? 1 : 0.65,
                  },
                ]}
                onPress={handleSubmitWithdraw}
                disabled={availableBal < MIN_WITHDRAWAL || submittingWithdraw}
              >
                {submittingWithdraw ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.submitBtnText}>Request Withdrawal</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  headerTitleArea: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 13,
    marginTop: 3,
    lineHeight: 18,
  },
  heroCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    ...SHADOWS.medium,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLabel: {
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroAmount: {
    fontSize: 34,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 4,
    letterSpacing: -0.6,
  },
  heroHelperSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.78)',
    fontWeight: '500',
    marginTop: 3,
  },
  heroIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(253, 224, 71, 0.18)',
    borderColor: 'rgba(253, 224, 71, 0.35)',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 14,
  },
  pendingNoticeText: {
    color: '#fef08a',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
    lineHeight: 16,
  },
  withdrawMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 16,
    ...SHADOWS.small,
  },
  withdrawMainBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  minThresholdHint: {
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
  payoutAccountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    ...SHADOWS.small,
  },
  payoutAccountIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payoutAccountInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  payoutAccountLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  payoutAccountValue: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  payoutAccountSub: {
    fontSize: 11,
    marginTop: 2,
  },
  editAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  editAccountBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  payoutMissingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  payoutMissingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  payoutMissingTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  payoutMissingSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  addAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  addAccountBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  summaryContainer: {
    paddingHorizontal: 16,
    marginTop: 14,
  },
  summaryCardFull: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
    ...SHADOWS.small,
  },
  summaryCardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  summaryCardLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  summaryCardValBig: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 2,
    letterSpacing: -0.5,
  },
  summaryCardSub: {
    fontSize: 11,
    marginTop: 2,
  },
  summaryCardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryCardHalf: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    ...SHADOWS.small,
  },
  summaryCardIconWrapSmall: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  summaryCardValMedium: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  summaryCardLabelSmall: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
    letterSpacing: 0.2,
  },
  summaryCardSubSmall: {
    fontSize: 10.5,
    marginTop: 2,
  },
  modalWarningNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  modalWarningText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabBtn: {
    borderBottomWidth: 2,
  },
  tabBtnText: {
    fontSize: 13,
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  emptyHistoryBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyHistoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },
  emptyHistorySub: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
    maxWidth: 260,
  },
  historyCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  historyCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  historyDate: {
    fontSize: 11,
    marginTop: 2,
  },
  earningBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  earningBadgeText: {
    color: '#059669',
    fontWeight: '800',
    fontSize: 13,
  },
  historyCardFooter: {
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  breakdownText: {
    fontSize: 11,
  },
  withdrawAmountText: {
    fontSize: 16,
    fontWeight: '800',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  paymentCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    ...SHADOWS.small,
  },
  paymentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentCardIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentCardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  paymentCardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  methodSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
  },
  methodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  methodBtnActive: {
    ...SHADOWS.subtle,
  },
  methodBtnText: {
    fontSize: 13,
  },
  methodFieldsWrap: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  inputHint: {
    fontSize: 11,
    marginTop: 6,
    lineHeight: 15,
  },
  updateSettingsBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    ...SHADOWS.small,
  },
  updateSettingsBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  submitBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    ...SHADOWS.small,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  balanceNoticeBox: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  balanceNoticeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  balanceNoticeAmount: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 2,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
  },
  targetBankNote: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    marginTop: 14,
    paddingTop: 10,
  },
  targetBankText: {
    fontSize: 12,
    flex: 1,
  },
  payoutDisclaimer: {
    fontSize: 11,
    marginTop: 8,
    lineHeight: 15,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
    maxWidth: 280,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    ...SHADOWS.small,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },
});

export default SellerEarningsScreen;
