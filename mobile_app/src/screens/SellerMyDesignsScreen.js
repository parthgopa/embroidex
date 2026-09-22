import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TopBar from '../components/TopBar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SHADOWS } from '../theme/theme';
import API from '../services/api';

const STATUS_CONFIG = {
  approved: {
    label: 'Approved',
    bg: '#ecfdf5',
    text: '#059669',
    border: '#a7f3d0',
    icon: 'checkmark-circle-outline',
  },
  pending: {
    label: 'In Review',
    bg: '#fffbeb',
    text: '#d97706',
    border: '#fde68a',
    icon: 'time-outline',
  },
  rejected: {
    label: 'Action Required',
    bg: '#fef2f2',
    text: '#dc2626',
    border: '#fecaca',
    icon: 'alert-circle-outline',
  },
};

const SellerMyDesignsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { isAuthenticated, isSeller } = useAuth();

  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [deletingId, setDeletingId] = useState(null);

  const fetchMyDesigns = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const response = await API.get('/seller/my-designs');
      setDesigns(response.data?.designs || []);
    } catch (error) {
      console.error('Error fetching seller designs:', error);
      Alert.alert('Error', error.message || 'Failed to load your portfolio.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchMyDesigns();
  }, [fetchMyDesigns]);

  // Re-fetch whenever screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchMyDesigns();
    });
    return unsubscribe;
  }, [navigation, fetchMyDesigns]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyDesigns();
  };

  const handleDelete = (item) => {
    Alert.alert(
      'Delete Design',
      `Are you sure you want to permanently delete "${item.title || 'this design'}"? This action cannot be reversed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(item._id);
              await API.delete(`/seller/design/${item._id}`);
              setDesigns((prev) => prev.filter((d) => d._id !== item._id));
              Alert.alert('Success', 'Design deleted successfully.');
            } catch (error) {
              Alert.alert('Error', error.message || 'Could not delete design.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const getThumbnailUri = (thumb) => {
    if (!thumb) return null;
    if (thumb.startsWith('data:') || thumb.startsWith('http')) {
      return { uri: thumb };
    }
    return { uri: `data:image/jpeg;base64,${thumb}` };
  };

  // Status counts
  const totalCount = designs.length;
  const approvedCount = designs.filter((d) => (d.status || '').toLowerCase() === 'approved').length;
  const pendingCount = designs.filter((d) => (d.status || 'pending').toLowerCase() === 'pending').length;
  const rejectedCount = designs.filter((d) => (d.status || '').toLowerCase() === 'rejected').length;

  const filteredDesigns = designs.filter((d) => {
    if (selectedFilter === 'all') return true;
    return (d.status || 'pending').toLowerCase() === selectedFilter;
  });

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TopBar showBack onBack={() => navigation.goBack()} />
        <View style={styles.centerContainer}>
          <Ionicons name="lock-closed-outline" size={56} color={colors.primary} style={{ marginBottom: 16 }} />
          <Text style={[styles.emptyTitle, { color: colors.midnight }]}>Authentication Required</Text>
          <Text style={[styles.emptySubtitle, { color: colors.slate }]}>
            Please sign in to view your seller portfolio and uploaded embroidery designs.
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
          <Ionicons name="briefcase-outline" size={56} color={colors.primary} style={{ marginBottom: 16 }} />
          <Text style={[styles.emptyTitle, { color: colors.midnight }]}>Become an Embroidex Seller</Text>
          <Text style={[styles.emptySubtitle, { color: colors.slate }]}>
            You have not registered as a seller yet. Register your designer profile to start uploading designs and earning 70% royalties.
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

  const renderHeader = () => (
    <View style={styles.headerArea}>
      {/* Title & Upload Action */}
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.pageTitle, { color: colors.midnight }]}>My Designs</Text>
          <Text style={[styles.pageSubtitle, { color: colors.slate }]}>
            Manage your uploaded designs, check approval statuses, or edit existing patterns.
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.uploadQuickBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('SellerUploadScreen')}
          activeOpacity={0.8}
        >
          <Ionicons name="cloud-upload-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.uploadQuickBtnText}>Upload Design</Text>
        </TouchableOpacity>
      </View>

      {/* KPI Stats Strip */}
      <View style={[styles.statsStrip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.midnight }]}>{totalCount}</Text>
          <Text style={[styles.statLabel, { color: colors.slate }]}>Total</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#059669' }]}>{approvedCount}</Text>
          <Text style={[styles.statLabel, { color: colors.slate }]}>Live</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#d97706' }]}>{pendingCount}</Text>
          <Text style={[styles.statLabel, { color: colors.slate }]}>Review</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#dc2626' }]}>{rejectedCount}</Text>
          <Text style={[styles.statLabel, { color: colors.slate }]}>Issues</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {[
          { key: 'all', label: `All (${totalCount})` },
          { key: 'approved', label: `Live (${approvedCount})` },
          { key: 'pending', label: `Pending (${pendingCount})` },
          { key: 'rejected', label: `Rejected (${rejectedCount})` },
        ].map((tab) => {
          const isActive = selectedFilter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.filterTab,
                {
                  backgroundColor: isActive ? colors.primary : colors.surface,
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedFilter(tab.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterTabText,
                  { color: isActive ? '#ffffff' : colors.slate, fontWeight: isActive ? '700' : '500' },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderDesignCard = ({ item }) => {
    const rawStatus = (item.status || 'pending').toLowerCase();
    const statusInfo = STATUS_CONFIG[rawStatus] || STATUS_CONFIG.pending;
    const isDeleting = deletingId === item._id;

    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardMain}>
          {/* Thumbnail */}
          <View style={[styles.imageContainer, { backgroundColor: colors.surfaceAlt }]}>
            {item.thumbnail ? (
              <Image source={getThumbnailUri(item.thumbnail)} style={styles.cardImage} resizeMode="cover" />
            ) : (
              <View style={styles.noImagePlaceholder}>
                <Ionicons name="image-outline" size={32} color={colors.slateMuted} />
              </View>
            )}
          </View>

          {/* Details */}
          <View style={styles.cardDetails}>
            {/* Status Badge */}
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isDark ? colors.surfaceAlt : statusInfo.bg,
                  borderColor: statusInfo.border,
                },
              ]}
            >
              <Ionicons name={statusInfo.icon} size={12} color={statusInfo.text} style={{ marginRight: 4 }} />
              <Text style={[styles.statusText, { color: statusInfo.text }]}>{statusInfo.label}</Text>
            </View>

            {/* Title */}
            <Text style={[styles.cardTitle, { color: colors.midnight }]} numberOfLines={2}>
              {item.title || 'Untitled Design'}
            </Text>

            {/* Category / Area Info */}
            <Text style={[styles.cardMeta, { color: colors.slate }]} numberOfLines={1}>
              {item.category ? item.category : 'Embroidery'}
              {item.subcategory ? ` • ${item.subcategory}` : ''}
            </Text>

            {/* Price & Format Row */}
            <View style={styles.priceRow}>
              <Text style={[styles.cardPrice, { color: colors.primary }]}>
                ₹{Number(item.price || 0).toLocaleString('en-IN')}
              </Text>
              {item.file_format && (
                <View style={[styles.pillBadge, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                  <Text style={[styles.pillText, { color: colors.slate }]}>{item.file_format}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Rejection / Admin Notice Box */}
        {rawStatus === 'rejected' && (item.rejection_reason || item.admin_notes) && (
          <View style={[styles.warningBox, { backgroundColor: isDark ? 'rgba(220,38,38,0.15)' : '#fef2f2' }]}>
            <Ionicons name="information-circle-outline" size={16} color="#dc2626" style={{ marginRight: 6 }} />
            <Text style={styles.warningText}>
              <Text style={{ fontWeight: '700' }}>Admin Note: </Text>
              {item.rejection_reason || item.admin_notes}
            </Text>
          </View>
        )}

        {/* Card Actions Footer */}
        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.footerBtn, { borderColor: colors.border }]}
            onPress={() => navigation.navigate('SellerUploadScreen', { design: item, editId: item._id })}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.footerBtnText, { color: colors.primary }]}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.footerBtn, { borderColor: colors.border, borderLeftWidth: 1, borderLeftColor: colors.border }]}
            onPress={() => navigation.navigate('DesignDetailScreen', { design: item, designId: item._id })}
            activeOpacity={0.7}
          >
            <Ionicons name="eye-outline" size={16} color={colors.midnight} style={{ marginRight: 6 }} />
            <Text style={[styles.footerBtnText, { color: colors.midnight }]}>Preview</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.footerBtn, styles.deleteBtn]}
            onPress={() => handleDelete(item)}
            disabled={isDeleting}
            activeOpacity={0.7}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#dc2626" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={16} color="#dc2626" style={{ marginRight: 6 }} />
                <Text style={[styles.footerBtnText, { color: '#dc2626' }]}>Delete</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIconCircle, { backgroundColor: colors.surfaceAlt }]}>
          <Ionicons name="file-tray-outline" size={48} color={colors.slateMuted} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.midnight }]}>
          {selectedFilter === 'all' ? 'No Designs Uploaded Yet' : `No ${selectedFilter} Designs`}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.slate }]}>
          {selectedFilter === 'all'
            ? 'Publish your first embroidery machine pattern (.EMB, .DST, etc.) to start selling on Embroidex.'
            : `You have no designs marked as "${selectedFilter}" at the moment.`}
        </Text>
        {selectedFilter === 'all' && (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('SellerUploadScreen')}
            activeOpacity={0.8}
          >
            <Ionicons name="cloud-upload-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.primaryBtnText}>Upload New Design</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar showBack onBack={() => navigation.goBack()} />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.slate }]}>Loading portfolio...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredDesigns}
          keyExtractor={(item, index) => item._id || String(index)}
          renderItem={renderDesignCard}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom, 16) + 40 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  headerArea: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  uploadQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    ...SHADOWS.small,
  },
  uploadQuickBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    ...SHADOWS.small,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: 12,
  },
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  cardMain: {
    flexDirection: 'row',
    padding: 12,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  noImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 12,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '800',
  },
  pillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 12,
    marginBottom: 10,
    padding: 10,
    borderRadius: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#dc2626',
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  footerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
  },
  deleteBtn: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0,0,0,0.06)',
  },
  footerBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 40,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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

export default SellerMyDesignsScreen;
