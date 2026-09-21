import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
  NativeModules,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import API, { BASE_URL } from '../services/api';
import { SHADOWS } from '../theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Helpers ──────────────────────────────────────────────────────────────────

const getImageUri = (thumb) => {
  if (!thumb || typeof thumb !== 'string') return null;
  const t = thumb.trim();
  if (t.startsWith('data:image')) return t;
  if (t.startsWith('http://') || t.startsWith('https://')) return t;
  if (t.length > 80 && !t.includes('/') && !t.includes('.')) {
    return `data:image/jpeg;base64,${t}`;
  }
  return `${BASE_URL}/${t.replace(/^\//, '')}`;
};

const stripHtml = (html) => {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

// FLAG_SECURE — graceful no-op if native module not present
const setFlagSecure = (enable) => {
  try {
    if (NativeModules.RNFlagSecure) {
      enable
        ? NativeModules.RNFlagSecure.activate()
        : NativeModules.RNFlagSecure.deactivate();
    }
  } catch (_) {}
};

// ── Gallery Dot ───────────────────────────────────────────────────────────────
const GalleryDot = ({ active, colors }) => (
  <View
    style={[
      styles.dot,
      {
        backgroundColor: active ? colors.primary : 'rgba(255,255,255,0.4)',
        width: active ? 18 : 6,
      },
    ]}
  />
);

// ── Spec Table Row ────────────────────────────────────────────────────────────
const SpecTableRow = ({ label, value, isAlt, colors, isDark }) => (
  <View
    style={[
      styles.specRow,
      {
        backgroundColor: isAlt
          ? (isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc')
          : colors.surface,
        borderColor: colors.border,
      },
    ]}
  >
    <Text style={[styles.specLabel, { color: colors.slate }]}>{label}</Text>
    <View style={styles.specDivider} />
    <Text style={[styles.specValue, { color: colors.midnight }]} numberOfLines={2}>
      {value}
    </Text>
  </View>
);

// ── Main Screen ───────────────────────────────────────────────────────────────
const DesignDetailScreen = ({ navigation, route }) => {
  const { design: initialDesign } = route.params || {};
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { addToCart, removeFromCart, isInCart } = useCart();

  const [design, setDesign] = useState(initialDesign || null);
  const [loadingFull, setLoadingFull] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [cartAdded, setCartAdded] = useState(isInCart(initialDesign?._id));
  const flatRef = useRef(null);

  // ── Fetch full design (includes additional_images) ──────────────────────────
  useEffect(() => {
    const fetchFull = async () => {
      if (!initialDesign?._id) {
        setLoadingFull(false);
        return;
      }
      try {
        const res = await API.get(`/seller/design/${initialDesign._id}`);
        if (res.data?.design) {
          setDesign(res.data.design);
        }
      } catch (err) {
        // Fallback to the partial object already in memory
        console.warn('Could not fetch full design:', err.message);
      } finally {
        setLoadingFull(false);
      }
    };
    fetchFull();
  }, [initialDesign?._id]);

  // FLAG_SECURE: set on mount, clear on unmount
  useEffect(() => {
    setFlagSecure(true);
    return () => setFlagSecure(false);
  }, []);

  // Sync cart state when design changes
  useEffect(() => {
    if (design?._id) setCartAdded(isInCart(design._id));
  }, [design?._id, isInCart]);

  const handleAddToCart = useCallback(() => {
    if (!design) return;
    addToCart(design);
    setCartAdded(true);
    navigation.navigate('MainTabs', { screen: 'Cart' });
  }, [design, addToCart, navigation]);

  const handleGoToCart = useCallback(() => {
    navigation.navigate('MainTabs', { screen: 'Cart' });
  }, [navigation]);

  const handleRemoveFromCart = useCallback(() => {
    if (!design) return;
    removeFromCart(design._id);
    setCartAdded(false);
  }, [design, removeFromCart]);

  const onGalleryScroll = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveImg(idx);
  };

  // ── Build gallery images list ──────────────────────────────────────────────
  const galleryImages = (() => {
    const list = [];
    // 1. Thumbnail first
    const thumb = getImageUri(design?.thumbnail);
    if (thumb) list.push(thumb);
    // 2. additional_images — array of raw base64 strings stored in DB
    const extras = design?.additional_images;
    if (Array.isArray(extras)) {
      extras.forEach((img) => {
        if (!img) return;
        const uri = typeof img === 'string' ? getImageUri(img) : getImageUri(img?.url || img?.src);
        if (uri && uri !== thumb) list.push(uri);
      });
    }
    return list;
  })();

  // ── Not found ─────────────────────────────────────────────────────────────
  if (!initialDesign) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorCenter}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.slate} />
          <Text style={[styles.errorText, { color: colors.slate }]}>Design not found</Text>
          <TouchableOpacity
            style={[styles.backFallback, { backgroundColor: colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backFallbackText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const fileFormat = (design?.file_format || design?.design_file_type || 'EMB').toUpperCase();
  const price = Number(design?.price || 0).toLocaleString('en-IN');
  const descriptionText = stripHtml(design?.description || '');

  // Build specs — only rows with actual values
  const specs = [
    { label: 'Category', value: design?.category },
    { label: 'Subcategory', value: design?.subcategory },
    { label: 'Machine Type', value: design?.machine_type || design?.design_type },
    { label: 'Design Area', value: design?.area },
    { label: 'Needles', value: design?.needles ? `${design.needles} Needles` : null },
    { label: 'File Format', value: fileFormat },
    { label: 'Stitch Count', value: design?.total_stitch_count ? Number(design.total_stitch_count).toLocaleString('en-IN') : null },
    { label: 'Files Included', value: (design?.file_names || []).join(', ') || null },
  ].filter((s) => s.value);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Custom Header ── */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
            paddingTop: insets.top + 8,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.headerBackBtn,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9' },
          ]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.75}
        >
          <Ionicons name="arrow-back" size={20} color={colors.midnight} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.midnight }]} numberOfLines={1}>
          {design?.title || 'Design Details'}
        </Text>

        <View
          style={[
            styles.secureTag,
            { backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#fee2e2' },
          ]}
        >
          <Ionicons name="lock-closed" size={11} color="#ef4444" style={{ marginRight: 3 }} />
          <Text style={styles.secureTagText}>Protected</Text>
        </View>
      </View>

      {/* ── Scrollable Content ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 110 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Gallery ── */}
        <View style={[styles.galleryContainer, { backgroundColor: isDark ? '#020617' : '#0f172a' }]}>
          {galleryImages.length > 0 ? (
            <FlatList
              ref={flatRef}
              data={galleryImages}
              keyExtractor={(_, i) => String(i)}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={onGalleryScroll}
              scrollEventThrottle={16}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item }}
                  style={[styles.galleryImage, { width: SCREEN_WIDTH }]}
                  resizeMode="contain"
                />
              )}
            />
          ) : (
            <View style={styles.galleryPlaceholder}>
              <Ionicons name="image-outline" size={52} color="rgba(255,255,255,0.2)" />
              <Text style={styles.galleryPlaceholderText}>No Preview</Text>
            </View>
          )}

          {/* Loading spinner over gallery while fetching full data */}
          {loadingFull && (
            <View style={styles.galleryLoader}>
              <ActivityIndicator color="#ffffff" size="small" />
            </View>
          )}

          {/* Format badge */}
          <View style={styles.galleryFormatBadge}>
            <Text style={styles.galleryFormatBadgeText}>.{fileFormat}</Text>
          </View>

          {/* Image counter / dots */}
          {galleryImages.length > 1 && (
            <View style={styles.dotsRow}>
              {galleryImages.map((_, i) => (
                <GalleryDot key={i} active={i === activeImg} colors={colors} />
              ))}
            </View>
          )}

          {/* Image counter text */}
          {galleryImages.length > 1 && (
            <View style={styles.imgCounter}>
              <Text style={styles.imgCounterText}>
                {activeImg + 1}/{galleryImages.length}
              </Text>
            </View>
          )}
        </View>

        {/* ── Title & Chips ── */}
        <View
          style={[
            styles.titleSection,
            { backgroundColor: colors.surface, borderBottomColor: colors.border },
          ]}
        >
          <View style={styles.chipRow}>
            {design?.category && (
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor: isDark ? 'rgba(99,102,241,0.18)' : '#eef2ff',
                    borderColor: isDark ? 'rgba(99,102,241,0.35)' : '#c7d2fe',
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: isDark ? '#a5b4fc' : '#4f46e5' }]}>
                  {design.category}
                </Text>
              </View>
            )}
            {design?.area && (
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: colors.slate }]}>{design.area}</Text>
              </View>
            )}
            {design?.needles && (
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons name="color-wand-outline" size={11} color={colors.slate} style={{ marginRight: 3 }} />
                <Text style={[styles.chipText, { color: colors.slate }]}>{design.needles} Nd</Text>
              </View>
            )}
          </View>
          <Text style={[styles.designTitle, { color: colors.midnight }]}>
            {design?.title}
          </Text>
          {(design?.machine_type || design?.design_type) && (
            <Text style={[styles.machineSubtitle, { color: colors.slate }]}>
              {design.machine_type || design.design_type}
            </Text>
          )}
        </View>

        {/* ── Specs Table ── */}
        {specs.length > 0 && (
          <View
            style={[
              styles.section,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name="list" size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.sectionTitle, { color: colors.midnight }]}>Specifications</Text>
            </View>

            {/* Table header */}
            <View
              style={[
                styles.tableHeader,
                {
                  backgroundColor: colors.primary,
                },
              ]}
            >
              <Text style={styles.tableHeaderLabel}>Property</Text>
              <View style={styles.tableHeaderDivider} />
              <Text style={styles.tableHeaderValue}>Detail</Text>
            </View>

            {/* Table rows */}
            <View
              style={[
                styles.tableBody,
                { borderColor: colors.border },
              ]}
            >
              {specs.map((spec, idx) => (
                <SpecTableRow
                  key={spec.label}
                  label={spec.label}
                  value={spec.value}
                  isAlt={idx % 2 === 1}
                  colors={colors}
                  isDark={isDark}
                />
              ))}
            </View>
          </View>
        )}

        {/* ── Description ── */}
        {descriptionText.length > 0 && (
          <View
            style={[
              styles.section,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.sectionTitle, { color: colors.midnight }]}>Description</Text>
            </View>
            <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
              {descriptionText}
            </Text>
          </View>
        )}

        {/* ── Seller badge ── */}
        {(design?.seller_name || design?.seller_email) && (
          <View
            style={[
              styles.section,
              styles.sellerRow,
              {
                backgroundColor: isDark ? 'rgba(99,102,241,0.1)' : '#eef2ff',
                borderColor: isDark ? 'rgba(99,102,241,0.25)' : '#c7d2fe',
              },
            ]}
          >
            <Ionicons name="storefront-outline" size={18} color={colors.primary} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.sellerLabel, { color: colors.slate }]}>Sold by</Text>
              <Text style={[styles.sellerName, { color: colors.primary }]}>
                {design.seller_name || design.seller_email}
              </Text>
            </View>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          </View>
        )}
      </ScrollView>

      {/* ── Sticky Bottom Bar ── */}
      <View
        style={[
          styles.stickyBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 12),
            ...SHADOWS.floating,
          },
        ]}
      >
        <View style={styles.stickyPriceBlock}>
          <Text style={[styles.stickyPriceLabel, { color: colors.slate }]}>Price</Text>
          <View style={styles.stickyPriceRow}>
            <Text style={[styles.stickyPriceCurrency, { color: colors.primary }]}>₹</Text>
            <Text style={[styles.stickyPrice, { color: colors.midnight }]}>{price}</Text>
          </View>
        </View>

        {cartAdded ? (
          <View style={styles.stickyActionsRow}>
            <TouchableOpacity
              style={[
                styles.stickyRemoveBtn,
                {
                  backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#fee2e2',
                  borderColor: isDark ? 'rgba(239,68,68,0.45)' : '#fca5a5',
                },
              ]}
              onPress={handleRemoveFromCart}
              activeOpacity={0.82}
              accessibilityLabel="Remove from Cart"
            >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.stickyCartBtn,
                { backgroundColor: colors.success || '#16a34a' },
              ]}
              onPress={handleGoToCart}
              activeOpacity={0.85}
            >
              <Ionicons
                name="cart"
                size={18}
                color="#ffffff"
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.stickyCartBtnText, { color: '#ffffff' }]}>
                Continue Purchase
              </Text>
              <Ionicons
                name="arrow-forward"
                size={16}
                color="#ffffff"
                style={{ marginLeft: 6 }}
              />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.stickyCartBtn,
              { backgroundColor: colors.primary },
            ]}
            onPress={handleAddToCart}
            activeOpacity={0.85}
          >
            <Ionicons
              name="cart"
              size={18}
              color="#ffffff"
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.stickyCartBtnText, { color: '#ffffff' }]}>
              Add to Cart
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  // Error
  errorCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { fontSize: 16, marginTop: 12, marginBottom: 20 },
  backFallback: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  backFallbackText: { color: '#fff', fontWeight: '800' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  secureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  secureTagText: { color: '#ef4444', fontSize: 10, fontWeight: '800' },

  // Gallery
  galleryContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.72,
    position: 'relative',
    overflow: 'hidden',
  },
  galleryImage: {
    height: SCREEN_WIDTH * 0.72,
  },
  galleryPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryPlaceholderText: {
    color: 'rgba(255,255,255,0.3)',
    marginTop: 10,
    fontSize: 13,
  },
  galleryLoader: {
    position: 'absolute',
    bottom: 12,
    right: 50,
  },
  galleryFormatBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(15,23,42,0.78)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  galleryFormatBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  dotsRow: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  dot: { height: 6, borderRadius: 3 },
  imgCounter: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(15,23,42,0.68)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  imgCounterText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  // Title section
  scroll: { flex: 1 },
  titleSection: {
    padding: 16,
    borderBottomWidth: 1,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
  },
  chipText: { fontSize: 11, fontWeight: '700' },
  designTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.4, lineHeight: 26 },
  machineSubtitle: { fontSize: 13, fontWeight: '500', marginTop: 4 },

  // Common section
  section: {
    marginTop: 8,
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800' },

  // Specs table
  tableHeader: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 2,
  },
  tableHeaderLabel: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  tableHeaderDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tableHeaderValue: {
    flex: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  tableBody: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  specRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
  },
  specLabel: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    fontWeight: '700',
  },
  specDivider: {
    width: 1,
    backgroundColor: 'rgba(148,163,184,0.2)',
  },
  specValue: {
    flex: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '600',
  },

  // Description
  descriptionText: { fontSize: 13.5, lineHeight: 21 },

  // Seller
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerLabel: { fontSize: 11, fontWeight: '600' },
  sellerName: { fontSize: 13, fontWeight: '800' },

  // Sticky bar
  stickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  stickyPriceBlock: { marginRight: 16 },
  stickyPriceLabel: { fontSize: 11, fontWeight: '600' },
  stickyPriceRow: { flexDirection: 'row', alignItems: 'flex-end' },
  stickyPriceCurrency: { fontSize: 15, fontWeight: '800', lineHeight: 28 },
  stickyPrice: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  stickyActionsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stickyRemoveBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stickyCartBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  stickyCartBtnText: { fontSize: 15, fontWeight: '800' },
});

export default DesignDetailScreen;
