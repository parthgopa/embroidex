import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TopBar from '../components/TopBar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SHADOWS } from '../theme/theme';
import API, { BASE_URL } from '../services/api';
import { downloadPurchasedZip } from '../utils/downloadHelper';

// ── Helpers ───────────────────────────────────────────────────────────────────
const getImageUri = (thumb) => {
  if (!thumb || typeof thumb !== 'string') return null;
  const t = thumb.trim();
  if (t.startsWith('data:image') || t.startsWith('http')) return t;
  if (t.length > 80 && !t.includes('/') && !t.includes('.')) return `data:image/jpeg;base64,${t}`;
  return `${BASE_URL}/${t.replace(/^\//, '')}`;
};

const formatDate = (isoString) => {
  if (!isoString) return 'Recent';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Recent';
  }
};

// ── Receipt Modal ─────────────────────────────────────────────────────────────
const ReceiptModal = ({ visible, purchase, onClose, colors, isDark }) => {
  if (!purchase) return null;

  const receiptNo = purchase.receipt || `RCPT-${(purchase._id || '').slice(-8).toUpperCase()}`;
  const dateStr = formatDate(purchase.purchased_at);
  const paymentMethod = purchase.payment_detail || purchase.payment_method || 'Online Payment';
  const paymentId = purchase.payment_id || 'N/A';
  const amount = Number(purchase.amount_paid || 0).toLocaleString('en-IN');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.receiptCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.receiptHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.receiptBrand}>
              <Text style={[styles.receiptBrandTitle, { color: colors.primary }]}>Embroidex</Text>
              <Text style={[styles.receiptBrandSub, { color: colors.slate }]}>
                Official Purchase Receipt
              </Text>
            </View>
            <View
              style={[
                styles.verifiedPill,
                { backgroundColor: isDark ? 'rgba(34,197,94,0.15)' : '#dcfce7' },
              ]}
            >
              <Ionicons name="checkmark-circle" size={14} color="#16a34a" style={{ marginRight: 4 }} />
              <Text style={styles.verifiedText}>PAID</Text>
            </View>
          </View>

          {/* Details */}
          <View style={styles.receiptBody}>
            <View style={styles.receiptRow}>
              <Text style={[styles.receiptLabel, { color: colors.slate }]}>Receipt #</Text>
              <Text style={[styles.receiptVal, { color: colors.midnight }]} numberOfLines={1}>
                {receiptNo}
              </Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={[styles.receiptLabel, { color: colors.slate }]}>Date</Text>
              <Text style={[styles.receiptVal, { color: colors.midnight }]}>{dateStr}</Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={[styles.receiptLabel, { color: colors.slate }]}>Design</Text>
              <Text
                style={[styles.receiptVal, { color: colors.midnight, fontWeight: '700' }]}
                numberOfLines={2}
              >
                {purchase.design_title || 'Embroidery Design'}
              </Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={[styles.receiptLabel, { color: colors.slate }]}>Payment Method</Text>
              <Text style={[styles.receiptVal, { color: colors.midnight }]} numberOfLines={1}>
                {paymentMethod}
              </Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={[styles.receiptLabel, { color: colors.slate }]}>Payment ID</Text>
              <Text style={[styles.receiptVal, { color: colors.slate, fontSize: 12 }]} numberOfLines={1}>
                {paymentId}
              </Text>
            </View>

            <View
              style={[
                styles.totalRow,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.totalLabel, { color: colors.midnight }]}>Total Paid</Text>
              <Text style={[styles.totalAmount, { color: colors.primary }]}>₹{amount}</Text>
            </View>
          </View>

          {/* Close CTA */}
          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: colors.primary }]}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.closeBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ── Purchase Item Card ────────────────────────────────────────────────────────
const PurchaseItemCard = React.memo(({ item, onDownload, onReceipt, onViewDesign, isDownloading, colors, isDark }) => {
  const uri = getImageUri(item.design_thumbnail);
  const amount = Number(item.amount_paid || 0).toLocaleString('en-IN');
  const dateStr = formatDate(item.purchased_at);
  const receiptNo = item.receipt || `RCPT-${(item._id || '').slice(-6).toUpperCase()}`;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.cardTop}
        onPress={() => onViewDesign(item)}
        activeOpacity={0.8}
      >
        {/* Thumbnail with Format Tag */}
        <View
          style={[
            styles.thumbWrap,
            {
              backgroundColor: isDark ? '#020617' : '#f1f5f9',
              borderColor: colors.border,
            },
          ]}
        >
          {uri ? (
            <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <Ionicons name="image-outline" size={24} color={colors.slate} />
          )}
          <View style={styles.formatBadge}>
            <Text style={styles.formatBadgeText}>.ZIP</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.cardInfo}>
          <Text style={[styles.cardTitle, { color: colors.midnight }]} numberOfLines={2}>
            {item.design_title || 'Embroidery Design'}
          </Text>

          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={12} color={colors.slate} style={{ marginRight: 4 }} />
            <Text style={[styles.metaText, { color: colors.slate }]}>{dateStr}</Text>
            <Text style={[styles.metaDot, { color: colors.slate }]}>•</Text>
            <Text style={[styles.receiptPill, { color: colors.slate }]}>{receiptNo}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={[styles.priceCurrency, { color: colors.primary }]}>₹</Text>
            <Text style={[styles.priceValue, { color: colors.midnight }]}>{amount}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Action Buttons */}
      <View style={[styles.cardActions, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.receiptBtn,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f8fafc',
              borderColor: colors.border,
            },
          ]}
          onPress={() => onReceipt(item)}
          activeOpacity={0.75}
        >
          <Ionicons name="receipt-outline" size={15} color={colors.midnight} style={{ marginRight: 6 }} />
          <Text style={[styles.receiptBtnText, { color: colors.midnight }]}>Receipt</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.downloadBtn,
            {
              backgroundColor: colors.success || '#16a34a',
              opacity: isDownloading ? 0.7 : 1,
            },
          ]}
          onPress={() => onDownload(item)}
          disabled={isDownloading}
          activeOpacity={0.82}
        >
          {isDownloading ? (
            <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 6 }} />
          ) : (
            <Ionicons name="cloud-download-outline" size={16} color="#ffffff" style={{ marginRight: 6 }} />
          )}
          <Text style={styles.downloadBtnText}>{isDownloading ? 'Downloading...' : 'Download ZIP'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

// ── Main Screen ───────────────────────────────────────────────────────────────
const MyPurchasesScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, token: authToken } = useAuth();
  const { colors, isDark } = useTheme();

  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchPurchases = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const res = await API.get('/payment/my-purchases');
      setPurchases(res.data?.purchases || []);
    } catch (err) {
      console.log('Error fetching purchases:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPurchases();
  }, [fetchPurchases]);

  // ── Download File ──────────────────────────────────────────────────────────
  const handleDownload = async (item) => {
    if (downloadingId) return;
    setDownloadingId(item._id);
    try {
      await downloadPurchasedZip(item, authToken);
    } finally {
      setDownloadingId(null);
    }
  };

  // ── View Design Details ────────────────────────────────────────────────────
  const handleViewDesign = (item) => {
    if (item.design_id) {
      navigation.navigate('DesignDetailScreen', {
        design: {
          _id: item.design_id,
          title: item.design_title,
          thumbnail: item.design_thumbnail,
          price: item.amount_paid,
        },
      });
    }
  };

  // ── Render States ──────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar />

      {/* Header Banner */}
      <View
        style={[
          styles.headerBanner,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View>
          <Text style={[styles.headerTitle, { color: colors.midnight }]}>My Purchases</Text>
          <Text style={[styles.headerSubtitle, { color: colors.slate }]}>
            Unlimited lifetime downloads for all designs
          </Text>
        </View>
        {isAuthenticated && purchases.length > 0 && (
          <View
            style={[
              styles.countPill,
              { backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : '#e0e7ff' },
            ]}
          >
            <Text style={[styles.countPillText, { color: colors.primary }]}>
              {purchases.length} {purchases.length === 1 ? 'Design' : 'Designs'}
            </Text>
          </View>
        )}
      </View>

      {/* Main Content */}
      {!isAuthenticated ? (
        // Not Signed In
        <View style={styles.centerState}>
          <View
            style={[
              styles.stateIconCircle,
              {
                backgroundColor: isDark ? 'rgba(99,102,241,0.12)' : '#eef2ff',
                borderColor: isDark ? 'rgba(99,102,241,0.25)' : '#c7d2fe',
              },
            ]}
          >
            <Ionicons name="bag-check-outline" size={44} color={colors.primary} />
          </View>
          <Text style={[styles.stateTitle, { color: colors.midnight }]}>Purchases Library</Text>
          <Text style={[styles.stateDesc, { color: colors.slate }]}>
            Sign in to your Embroidex account to view and download all your purchased embroidery patterns.
          </Text>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('LoginScreen')}
            activeOpacity={0.85}
          >
            <Ionicons name="log-in-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.primaryBtnText}>Sign In to Account</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        // Loading Indicator
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.slate }]}>Loading your purchases...</Text>
        </View>
      ) : purchases.length === 0 ? (
        // Empty Purchases
        <View style={styles.centerState}>
          <View
            style={[
              styles.stateIconCircle,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons name="cart-outline" size={44} color={colors.slate} />
          </View>
          <Text style={[styles.stateTitle, { color: colors.midnight }]}>No Purchases Yet</Text>
          <Text style={[styles.stateDesc, { color: colors.slate }]}>
            Explore thousands of premium machine embroidery patterns and start crafting today.
          </Text>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('Explore')}
            activeOpacity={0.85}
          >
            <Ionicons name="compass-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.primaryBtnText}>Browse Marketplace</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Purchases List
        <FlatList
          data={purchases}
          keyExtractor={(item) => String(item._id)}
          renderItem={({ item }) => (
            <PurchaseItemCard
              item={item}
              onDownload={handleDownload}
              onReceipt={setSelectedReceipt}
              onViewDesign={handleViewDesign}
              isDownloading={downloadingId === item._id}
              colors={colors}
              isDark={isDark}
            />
          )}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}

      {/* Official Receipt Modal */}
      <ReceiptModal
        visible={!!selectedReceipt}
        purchase={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        colors={colors}
        isDark={isDark}
      />
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBanner: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  countPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  countPillText: {
    fontSize: 12,
    fontWeight: '800',
  },

  // State Centers
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  stateIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  stateTitle: {
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  stateDesc: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    ...SHADOWS.button,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },

  // Purchases List
  listContent: {
    padding: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  cardTop: {
    flexDirection: 'row',
    padding: 14,
  },
  thumbWrap: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  formatBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    backgroundColor: 'rgba(15,23,42,0.85)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  formatBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  metaDot: {
    marginHorizontal: 6,
    fontSize: 12,
  },
  receiptPill: {
    fontSize: 11,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  priceCurrency: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 20,
  },
  priceValue: {
    fontSize: 17,
    fontWeight: '900',
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 10,
  },
  receiptBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  downloadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
  },
  downloadBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },

  // Modal Backdrop & Card
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  receiptCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    ...SHADOWS.floating,
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  receiptBrand: {
    flex: 1,
  },
  receiptBrandTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  receiptBrandSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    color: '#16a34a',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  receiptBody: {
    marginBottom: 18,
  },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },
  receiptLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  receiptVal: {
    fontSize: 13,
    fontWeight: '600',
    maxWidth: '65%',
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  totalAmount: {
    fontSize: 19,
    fontWeight: '900',
  },
  closeBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
  },
  closeBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default MyPurchasesScreen;
