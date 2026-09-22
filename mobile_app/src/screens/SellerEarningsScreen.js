import React, { useState, useEffect, useCallback } from 'react';
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

  // Active tab: 'overview' | 'withdrawals' | 'settings'
  const initialTab = route.params?.initialTab === 'settings' ? 'settings' : 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);

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

  // Re-fetch on focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchDashboardData();
      if (route.params?.initialTab === 'settings') {
        setActiveTab('settings');
      }
    });
    return unsubscribe;
  }, [navigation, fetchDashboardData, route.params?.initialTab]);

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
          { text: 'Configure Now', onPress: () => setActiveTab('settings') },
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
            Please sign in to view your seller earnings and manage payouts.
          </Text>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('LoginScreen')}
          >
            <Text style={styles.primaryBtnText}>Sign In Now</Text>
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
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 40 }]}
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
            <Text style={[styles.pageTitle, { color: colors.midnight }]}>Withdraw Earnings</Text>
            <Text style={[styles.pageSubtitle, { color: colors.slate }]}>
              Request withdrawal of your available balance
            </Text>
          </View>

          {/* Hero Available Balance Card - Exact Match with Website Banner */}
          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: isDark ? '#1e1b4b' : '#3730a3',
                borderColor: isDark ? '#4338ca' : '#4f46e5',
              },
            ]}
          >
            <View style={styles.heroTopRow}>
              <View>
                <Text style={styles.heroLabel}>AVAILABLE BALANCE</Text>
                <Text
                  style={[
                    styles.heroAmount,
                    availableBal < 0 && { color: '#fca5a5' },
                  ]}
                >
                  ₹{availableBal.toFixed(2)}
                </Text>
              </View>
              <View style={styles.heroIconBadge}>
                <Ionicons name="wallet-outline" size={26} color="#ffffff" />
              </View>
            </View>

            {/* 3-Column Sub-Metrics Grid: Total Earnings, Total Withdrawn, Pending Requests */}
            <View style={styles.bannerSubGrid}>
              <View style={styles.bannerSubItem}>
                <Text style={styles.bannerSubLabel}>TOTAL EARNINGS</Text>
                <Text style={styles.bannerSubVal}>₹{totalEarned.toFixed(2)}</Text>
              </View>
              <View style={styles.bannerSubItem}>
                <Text style={styles.bannerSubLabel}>TOTAL WITHDRAWN</Text>
                <Text style={styles.bannerSubVal}>₹{totalWithdrawn.toFixed(2)}</Text>
              </View>
              <View style={styles.bannerSubItem}>
                <Text style={styles.bannerSubLabel}>PENDING REQUESTS</Text>
                <Text style={[styles.bannerSubVal, { color: '#fde047' }]}>
                  ₹{pendingRequests.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Payout Destination Info Pill */}
            <View style={styles.payoutDestinationPill}>
              <Ionicons
                name={hasUpi ? 'qr-code-outline' : hasBank ? 'business-outline' : 'warning-outline'}
                size={14}
                color={payoutDetails ? '#34d399' : '#fbbf24'}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.payoutDestinationText} numberOfLines={1}>
                {hasUpi
                  ? `Payout via UPI: ${payoutDetails.upiId}`
                  : hasBank
                  ? `Payout to Bank: ${payoutDetails.bankName || 'Bank'} (${payoutDetails.accountNumber})`
                  : 'No payment method set up yet'}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.heroActionRow}>
              <TouchableOpacity
                style={[
                  styles.withdrawBtn,
                  {
                    backgroundColor: availableBal >= MIN_WITHDRAWAL ? colors.primary : 'rgba(255,255,255,0.18)',
                    opacity: availableBal >= MIN_WITHDRAWAL ? 1 : 0.65,
                  },
                ]}
                onPress={handleOpenWithdrawModal}
                disabled={availableBal < MIN_WITHDRAWAL}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-up-circle-outline" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.withdrawBtnText}>
                  {availableBal >= MIN_WITHDRAWAL ? 'Request Withdrawal' : `Min. ₹${MIN_WITHDRAWAL}`}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.bankQuickBtn}
                onPress={() => setActiveTab('settings')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={payoutDetails ? 'checkmark-circle' : 'add-circle-outline'}
                  size={16}
                  color={payoutDetails ? '#34d399' : '#ffffff'}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.bankQuickBtnText}>
                  {payoutDetails ? 'Edit Settings' : 'Setup Payout'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Warning / Helper Note when Balance is below ₹2000 */}
          {availableBal < MIN_WITHDRAWAL && (
            <View
              style={[
                styles.minWarningBox,
                {
                  backgroundColor: isDark ? 'rgba(217, 119, 6, 0.15)' : '#fffbeb',
                  borderColor: isDark ? '#b45309' : '#fde68a',
                },
              ]}
            >
              <Ionicons name="alert-circle-outline" size={18} color="#d97706" style={{ marginRight: 8 }} />
              <Text style={[styles.minWarningText, { color: isDark ? '#fde68a' : '#b45309' }]}>
                {availableBal < 0
                  ? `Available balance is ₹${availableBal.toFixed(2)} due to pending & completed payouts. You need at least ₹${MIN_WITHDRAWAL} to request a withdrawal.`
                  : `You need at least ₹${MIN_WITHDRAWAL} to request a withdrawal. Available: ₹${availableBal.toFixed(2)}`}
              </Text>
            </View>
          )}

          {/* Secondary Metric Cards Grid */}
          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.metricIconCircle, { backgroundColor: '#ecfdf5' }]}>
                <Ionicons name="trending-up-outline" size={20} color="#059669" />
              </View>
              <Text style={[styles.metricVal, { color: colors.midnight }]}>₹{totalEarned.toLocaleString('en-IN')}</Text>
              <Text style={[styles.metricLabel, { color: colors.slate }]}>Net Royalty (70%)</Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.metricIconCircle, { backgroundColor: '#eff6ff' }]}>
                <Ionicons name="cart-outline" size={20} color="#2563eb" />
              </View>
              <Text style={[styles.metricVal, { color: colors.midnight }]}>₹{totalSalesVal.toLocaleString('en-IN')}</Text>
              <Text style={[styles.metricLabel, { color: colors.slate }]}>Gross Sales</Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.metricIconCircle, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="bag-check-outline" size={20} color="#d97706" />
              </View>
              <Text style={[styles.metricVal, { color: colors.midnight }]}>{ordersCount}</Text>
              <Text style={[styles.metricLabel, { color: colors.slate }]}>Orders Fulfilled</Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.metricIconCircle, { backgroundColor: '#f3e8ff' }]}>
                <Ionicons name="pie-chart-outline" size={20} color="#9333ea" />
              </View>
              <Text style={[styles.metricVal, { color: colors.midnight }]}>{earnings.platform_fee_percent || 30}%</Text>
              <Text style={[styles.metricLabel, { color: colors.slate }]}>Platform Fee</Text>
            </View>
          </View>

          {/* Segmented Navigation Tabs */}
          <View style={styles.tabBar}>
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalCard, { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 48 : 24) + 24 }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.midnight }]}>Request Payout</Text>
              <TouchableOpacity onPress={() => setWithdrawModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.slate} />
              </TouchableOpacity>
            </View>

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
                  You need at least ₹{MIN_WITHDRAWAL} to request a withdrawal.
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
          </View>
        </KeyboardAvoidingView>
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
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    ...SHADOWS.medium,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  heroLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  bannerSubGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    marginBottom: 14,
    gap: 6,
  },
  bannerSubItem: {
    flex: 1,
  },
  bannerSubLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.82)',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  bannerSubVal: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#ffffff',
  },
  minWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
  },
  minWarningText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '600',
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
  heroIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payoutDestinationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    marginBottom: 16,
  },
  payoutDestinationText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  heroActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  withdrawBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  withdrawBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  bankQuickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  bankQuickBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginTop: 14,
    gap: 8,
  },
  metricCard: {
    width: '48.5%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    ...SHADOWS.small,
  },
  metricIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  metricVal: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
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
