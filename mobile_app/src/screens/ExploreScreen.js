import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Modal,
  Animated,
  Dimensions,
  RefreshControl,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TopBar from '../components/TopBar';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import API, { BASE_URL } from '../services/api';
import { COLORS, SHADOWS } from '../theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.86, 360);

// Bulletproof Image Helper (Supports Base64 Data URI, HTTP/HTTPS, Raw Base64, and Relative Server Paths)
const getImageUri = (thumb) => {
  if (!thumb || typeof thumb !== 'string') return null;
  const trimmed = thumb.trim();
  if (trimmed.startsWith('data:image')) return trimmed;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.length > 80 && !trimmed.includes('/') && !trimmed.includes('.')) {
    return `data:image/jpeg;base64,${trimmed}`;
  }
  return `${BASE_URL}/${trimmed.replace(/^\//, '')}`;
};

// Filter Options matching the Embroidex Web Application
const NEEDLE_OPTIONS = ['1', '2', '3', '4', '5', '5+'];
const FILE_FORMAT_OPTIONS = ['DST', 'PES', 'EMB', 'JEF', 'EXP', 'VP3', 'ART', 'XXX'];
const DESIGN_MACHINE_TYPE_OPTIONS = [
  'Flat/Multi Designs',
  'Only Cording Designs',
  'Only Sequin Designs',
  'Only Chain Stitch Designs',
  'Multi+Cording Designs',
  'Multi+Cording+Sequin Designs',
  'Multi+Sequin Designs',
  'Multi+Chain Stitch Designs',
  'Dual & Sandwich Sequin',
  'Cording + Sequin Designs',
  'Beads and Sequin Designs',
  '2/4/6 Sequin Design',
];
const DESIGN_AREA_OPTIONS = [
  '100 mm',
  '125 mm',
  '150 mm',
  '175 mm',
  '200 mm',
  '225 mm',
  '250 mm',
  '300 mm',
  '330 mm',
  '400 mm',
  '500 mm',
  '600 mm',
];
const PRICE_RANGE_OPTIONS = [
  { id: 'all', label: 'All Prices' },
  { id: '0-200', label: '₹0 - ₹200' },
  { id: '200-500', label: '₹200 - ₹500' },
  { id: '500-1000', label: '₹500 - ₹1,000' },
  { id: '1000+', label: '₹1,000+' },
];
const SORT_OPTIONS = [
  { id: 'latest', label: 'Newest First' },
  { id: 'price_asc', label: 'Price: Low to High' },
  { id: 'price_desc', label: 'Price: High to Low' },
  { id: 'title_asc', label: 'Title: A to Z' },
];

// Memoized Design Card: Modern Framed Thumbnail, Category Badges, Specs, and Add/Remove Cart Action
const DesignCard = React.memo(({ item, inCart, onAddToCart, onRemoveFromCart, onPress, colors, isDark }) => {
  const uri = getImageUri(item.thumbnail);
  const fileFormat = (item.file_format || item.design_file_type || 'EMB').toUpperCase();
  const price = Number(item.price || 0).toLocaleString('en-IN');

  return (
    <TouchableOpacity
      style={[
        styles.cardRow,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.86}
    >
      {/* Left Side: Framed Garment Thumbnail */}
      <View
        style={[
          styles.cardImgContainer,
          {
            backgroundColor: isDark ? '#020617' : '#f8fafc',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
          },
        ]}
      >
        {uri ? (
          <Image
            source={{ uri }}
            style={styles.cardImg}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.cardPlaceholder}>
            <Ionicons name="image-outline" size={28} color={colors.slate} />
          </View>
        )}

        {/* Floating Format Badge */}
        <View style={styles.formatTag}>
          <Text style={styles.formatTagText}>.{fileFormat}</Text>
        </View>
      </View>

      {/* Right Side: Details & Actions */}
      <View style={styles.cardDetails}>
        <View style={styles.cardTopInfo}>
          {/* Category & Spec Badges */}
          <View style={styles.tagsWrap}>
            {item.category && (
              <View
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: isDark ? 'rgba(99, 102, 241, 0.16)' : '#eef2ff',
                    borderColor: isDark ? 'rgba(99, 102, 241, 0.32)' : '#c7d2fe',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    { color: isDark ? '#a5b4fc' : '#4f46e5' },
                  ]}
                  numberOfLines={1}
                >
                  {item.category}
                </Text>
              </View>
            )}

            {item.area && (
              <View
                style={[
                  styles.specPill,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.specPillText, { color: colors.slate }]}>
                  {item.area}
                </Text>
              </View>
            )}

            {item.needles && (
              <View
                style={[
                  styles.specPill,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.specPillText, { color: colors.slate }]}>
                  {item.needles} Nd
                </Text>
              </View>
            )}
          </View>

          {/* Design Title */}
          <Text
            style={[styles.cardTitle, { color: colors.midnight }]}
            numberOfLines={2}
          >
            {item.title}
          </Text>

          {/* Machine Type or Subcategory micro text */}
          {(item.machine_type || item.subcategory) && (
            <Text
              style={[styles.machineTypeText, { color: colors.slate }]}
              numberOfLines={1}
            >
              {item.machine_type || item.subcategory}
            </Text>
          )}
        </View>

        {/* Bottom Row: Price & Add / Remove CTA */}
        <View style={styles.cardBottomRow}>
          <View style={styles.priceContainer}>
            <Text style={[styles.priceCurrency, { color: colors.primary }]}>₹</Text>
            <Text style={[styles.cardPrice, { color: colors.midnight }]}>{price}</Text>
          </View>

          {inCart ? (
            <TouchableOpacity
              style={[
                styles.removeBtn,
                {
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2',
                  borderColor: isDark ? 'rgba(239, 68, 68, 0.45)' : '#fca5a5',
                },
              ]}
              onPress={() => onRemoveFromCart(item._id)}
              activeOpacity={0.78}
            >
              <Ionicons name="trash-outline" size={14} color="#ef4444" style={{ marginRight: 4 }} />
              <Text style={styles.removeBtnText}>Remove</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
              onPress={() => onAddToCart(item)}
              activeOpacity={0.82}
            >
              <Ionicons name="cart-outline" size={15} color="#ffffff" style={{ marginRight: 4 }} />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

const ExploreScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { cartItems, addToCart, removeFromCart } = useCart();

  const [designs, setDesigns] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Active Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedMachineTypes, setSelectedMachineTypes] = useState([]);
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [selectedNeedles, setSelectedNeedles] = useState([]);
  const [selectedFileFormats, setSelectedFileFormats] = useState([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState(['all']);
  const [sortBy, setSortBy] = useState('latest');

  // Right-Side Filter Sidebar Modal State & Draft Filters
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [draftCategories, setDraftCategories] = useState([]);
  const [draftMachineTypes, setDraftMachineTypes] = useState([]);
  const [draftAreas, setDraftAreas] = useState([]);
  const [draftNeedles, setDraftNeedles] = useState([]);
  const [draftFileFormats, setDraftFileFormats] = useState([]);
  const [draftPriceRanges, setDraftPriceRanges] = useState(['all']);
  const [draftSortBy, setDraftSortBy] = useState('latest');

  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;

  // 1. Fetch Designs & Categories
  const fetchData = async () => {
    try {
      const [approvedRes, catRes] = await Promise.allSettled([
        API.get('/seller/approved'),
        API.get('/seller/categories'),
      ]);

      let loadedDesigns = [];
      if (approvedRes.status === 'fulfilled' && approvedRes.value.data?.designs) {
        loadedDesigns = [...approvedRes.value.data.designs].reverse();
        setDesigns(loadedDesigns);
      }

      if (catRes.status === 'fulfilled' && catRes.value.data?.categories) {
        setCategoriesList(Object.keys(catRes.value.data.categories));
      } else if (loadedDesigns.length > 0) {
        const unique = Array.from(new Set(loadedDesigns.map((d) => d.category).filter(Boolean)));
        setCategoriesList(unique);
      }
    } catch (err) {
      console.warn('Error loading explore data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. React to navigation route params (from Home screen category chips or showcase "See All")
  useEffect(() => {
    if (route.params?.category) {
      setSelectedCategories([route.params.category]);
      setDraftCategories([route.params.category]);
    }
  }, [route.params]);

  // 3. Lightning-Fast Memoized Filtering & Sorting
  const filteredDesigns = useMemo(() => {
    let result = designs;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (d) =>
          d.title?.toLowerCase().includes(q) ||
          d.description?.toLowerCase().includes(q) ||
          d.category?.toLowerCase().includes(q) ||
          d.subcategory?.toLowerCase().includes(q) ||
          (d.machine_type || d.design_type || '').toLowerCase().includes(q) ||
          (d.area || '').toLowerCase().includes(q)
      );
    }

    // Categories
    if (selectedCategories.length > 0) {
      result = result.filter((d) => selectedCategories.includes(d.category));
    }

    // Machine Types
    if (selectedMachineTypes.length > 0) {
      result = result.filter((d) => {
        const mType = d.machine_type || d.design_type || '';
        return selectedMachineTypes.includes(mType);
      });
    }

    // Area
    if (selectedAreas.length > 0) {
      result = result.filter((d) => selectedAreas.includes(d.area));
    }

    // Needles
    if (selectedNeedles.length > 0) {
      result = result.filter((d) => {
        const needles = Number(d.needles) || 1;
        return selectedNeedles.some((val) => {
          if (val === '5+') return needles >= 5;
          return needles === parseInt(val, 10);
        });
      });
    }

    // File Formats
    if (selectedFileFormats.length > 0) {
      result = result.filter((d) => {
        const fmt = (d.file_format || d.design_file_type || 'EMB').toUpperCase();
        return selectedFileFormats.includes(fmt);
      });
    }

    // Price Ranges
    if (selectedPriceRanges.length > 0 && !selectedPriceRanges.includes('all')) {
      result = result.filter((d) => {
        const price = Number(d.price) || 0;
        return selectedPriceRanges.some((r) => {
          if (r === '0-200') return price <= 200;
          if (r === '200-500') return price > 200 && price <= 500;
          if (r === '500-1000') return price > 500 && price <= 1000;
          if (r === '1000+') return price > 1000;
          return true;
        });
      });
    }

    // Sorting
    if (sortBy === 'price_asc') {
      return [...result].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === 'price_desc') {
      return [...result].sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sortBy === 'title_asc') {
      return [...result].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    return result;
  }, [
    designs,
    searchQuery,
    selectedCategories,
    selectedMachineTypes,
    selectedAreas,
    selectedNeedles,
    selectedFileFormats,
    selectedPriceRanges,
    sortBy,
  ]);

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Open Right-Side Filter Sidebar
  const openFilterDrawer = () => {
    setDraftCategories([...selectedCategories]);
    setDraftMachineTypes([...selectedMachineTypes]);
    setDraftAreas([...selectedAreas]);
    setDraftNeedles([...selectedNeedles]);
    setDraftFileFormats([...selectedFileFormats]);
    setDraftPriceRanges([...selectedPriceRanges]);
    setDraftSortBy(sortBy);

    setIsFilterModalVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 70,
      friction: 12,
      useNativeDriver: true,
    }).start();
  };

  // Close Right-Side Filter Sidebar
  const closeFilterDrawer = () => {
    Animated.timing(slideAnim, {
      toValue: DRAWER_WIDTH,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setIsFilterModalVisible(false);
    });
  };

  // Apply filters from right sidebar to active list
  const applyFilters = () => {
    setSelectedCategories([...draftCategories]);
    setSelectedMachineTypes([...draftMachineTypes]);
    setSelectedAreas([...draftAreas]);
    setSelectedNeedles([...draftNeedles]);
    setSelectedFileFormats([...draftFileFormats]);
    setSelectedPriceRanges([...draftPriceRanges]);
    setSortBy(draftSortBy);
    closeFilterDrawer();
  };

  // Reset all filters
  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedMachineTypes([]);
    setSelectedAreas([]);
    setSelectedNeedles([]);
    setSelectedFileFormats([]);
    setSelectedPriceRanges(['all']);
    setSortBy('latest');

    setDraftCategories([]);
    setDraftMachineTypes([]);
    setDraftAreas([]);
    setDraftNeedles([]);
    setDraftFileFormats([]);
    setDraftPriceRanges(['all']);
    setDraftSortBy('latest');
  };

  // Toggle helpers for draft filters
  const toggleDraftItem = (list, setList, item) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const toggleDraftPrice = (rangeId) => {
    if (rangeId === 'all') {
      setDraftPriceRanges(['all']);
      return;
    }
    let updated = draftPriceRanges.filter((r) => r !== 'all');
    if (updated.includes(rangeId)) {
      updated = updated.filter((r) => r !== rangeId);
    } else {
      updated = [...updated, rangeId];
    }
    if (updated.length === 0) {
      updated = ['all'];
    }
    setDraftPriceRanges(updated);
  };

  // Active filter count
  const activeFilterCount =
    (searchQuery ? 1 : 0) +
    selectedCategories.length +
    selectedMachineTypes.length +
    selectedAreas.length +
    selectedNeedles.length +
    selectedFileFormats.length +
    (selectedPriceRanges.includes('all') ? 0 : selectedPriceRanges.length) +
    (sortBy !== 'latest' ? 1 : 0);

  const draftFilterCount =
    draftCategories.length +
    draftMachineTypes.length +
    draftAreas.length +
    draftNeedles.length +
    draftFileFormats.length +
    (draftPriceRanges.includes('all') ? 0 : draftPriceRanges.length) +
    (draftSortBy !== 'latest' ? 1 : 0);

  // Single-tap quick category select
  const handleQuickCategorySelect = (catName) => {
    if (!catName || catName === 'all') {
      setSelectedCategories([]);
    } else if (selectedCategories.includes(catName)) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories([catName]);
    }
  };

  const cartSet = useMemo(() => {
    const s = new Set();
    cartItems.forEach((i) => {
      if (i._id) s.add(i._id);
      if (i.designId) s.add(i.designId);
    });
    return s;
  }, [cartItems]);

  const handleAddToCart = useCallback(
    (item) => {
      addToCart(item);
    },
    [addToCart]
  );

  const handleRemoveFromCart = useCallback(
    (designId) => {
      removeFromCart(designId);
    },
    [removeFromCart]
  );

  const renderItem = useCallback(
    ({ item }) => {
      const inCart = cartSet.has(item._id);
      return (
        <DesignCard
          item={item}
          inCart={inCart}
          onAddToCart={handleAddToCart}
          onRemoveFromCart={handleRemoveFromCart}
          onPress={() => navigation.navigate('DesignDetailScreen', { design: item })}
          colors={colors}
          isDark={isDark}
        />
      );
    },
    [cartSet, handleAddToCart, handleRemoveFromCart, navigation, colors, isDark]
  );

  const keyExtractor = useCallback((item) => item._id, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar />

      {/* Top Search & Filter Bar */}
      <View style={[styles.searchSection, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.searchRow}>
          {/* Search Input Box */}
          <View style={[styles.searchInputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={19} color={colors.slate} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchInput, { color: colors.midnight }]}
              placeholder="Search designs, styles, areas..."
              placeholderTextColor={colors.slate}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color={colors.slate} />
              </TouchableOpacity>
            )}
          </View>

          {/* Right-Side Filter Button */}
          <TouchableOpacity
            style={[
              styles.filterBtn,
              activeFilterCount > 0
                ? styles.filterBtnActive
                : { backgroundColor: colors.background, borderColor: colors.border },
            ]}
            onPress={openFilterDrawer}
            activeOpacity={0.8}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={activeFilterCount > 0 ? '#ffffff' : colors.midnight}
            />
            {activeFilterCount > 0 && (
              <View style={styles.filterCountBadge}>
                <Text style={styles.filterCountBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Horizontal Quick Category Strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickCatsScroll}
        >
          <TouchableOpacity
            style={[
              styles.quickCatChip,
              selectedCategories.length === 0
                ? styles.quickCatChipActive
                : { backgroundColor: colors.background, borderColor: colors.border },
            ]}
            onPress={() => handleQuickCategorySelect('all')}
          >
            <Text
              style={[
                styles.quickCatText,
                selectedCategories.length === 0
                  ? styles.quickCatTextActive
                  : { color: colors.slate },
              ]}
            >
              All Designs
            </Text>
          </TouchableOpacity>

          {categoriesList.map((cat, idx) => {
            const isSelected = selectedCategories.includes(cat);
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.quickCatChip,
                  isSelected
                    ? styles.quickCatChipActive
                    : { backgroundColor: colors.background, borderColor: colors.border },
                ]}
                onPress={() => handleQuickCategorySelect(cat)}
              >
                <Text
                  style={[
                    styles.quickCatText,
                    isSelected
                      ? styles.quickCatTextActive
                      : { color: colors.slate },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Results Header Status */}
      <View style={styles.resultsInfoRow}>
        <Text style={[styles.resultsCountText, { color: colors.slate }]}>
          Showing <Text style={{ fontWeight: '800', color: colors.midnight }}>{filteredDesigns.length}</Text> designs
        </Text>
        {activeFilterCount > 0 && (
          <TouchableOpacity onPress={resetAllFilters}>
            <Text style={[styles.resetText, { color: colors.primary }]}>Reset Filters</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main Designs List (Full Width Cards) */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.slate }]}>
            Loading curated embroidery designs...
          </Text>
        </View>
      ) : filteredDesigns.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={54} color={colors.slate} style={{ marginBottom: 12 }} />
          <Text style={[styles.emptyTitle, { color: colors.midnight }]}>No designs match your filters</Text>
          <Text style={[styles.emptySub, { color: colors.slate }]}>
            Try clearing your search query or expanding your category selection.
          </Text>
          <TouchableOpacity
            style={[styles.emptyResetBtn, { backgroundColor: colors.primary }]}
            onPress={resetAllFilters}
          >
            <Text style={styles.emptyResetText}>Reset All Filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredDesigns}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={7}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews={true}
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

      {/* ======================================================= */}
      {/* RIGHT-SIDE FILTER SIDEBAR MODAL                         */}
      {/* ======================================================= */}
      <Modal
        visible={isFilterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeFilterDrawer}
      >
        <View style={styles.drawerOverlay}>
          {/* Reliable Tap-outside Backdrop to Close */}
          <TouchableOpacity
            style={styles.drawerBackdrop}
            activeOpacity={1}
            onPress={closeFilterDrawer}
          />

          {/* Right-Side Slide-in Drawer Container */}
          <Animated.View
            style={[
              styles.drawerPanel,
              {
                width: DRAWER_WIDTH,
                backgroundColor: colors.surface,
                paddingTop: insets.top + 8,
                paddingBottom: insets.bottom + 8,
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            {/* Drawer Header */}
            <View style={[styles.drawerHeader, { borderBottomColor: colors.border }]}>
              <View style={styles.drawerTitleRow}>
                <Ionicons name="funnel" size={18} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.drawerTitle, { color: colors.midnight }]}>Filters</Text>
                {draftFilterCount > 0 && (
                  <View style={styles.drawerBadge}>
                    <Text style={styles.drawerBadgeText}>{draftFilterCount}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.drawerCloseBtn}
                onPress={closeFilterDrawer}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color={colors.midnight} />
              </TouchableOpacity>
            </View>

            {/* Scrollable Filter Categories */}
            <ScrollView
              style={styles.drawerScroll}
              contentContainerStyle={styles.drawerScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* 1. Sort By */}
              <View style={styles.filterSection}>
                <Text style={[styles.sectionTitle, { color: colors.midnight }]}>Sort By</Text>
                <View style={styles.pillGroup}>
                  {SORT_OPTIONS.map((opt) => {
                    const isSelected = draftSortBy === opt.id;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        style={[
                          styles.filterPill,
                          isSelected
                            ? styles.filterPillActive
                            : { backgroundColor: colors.background, borderColor: colors.border },
                        ]}
                        onPress={() => setDraftSortBy(opt.id)}
                      >
                        <Text
                          style={[
                            styles.filterPillText,
                            isSelected ? styles.filterPillTextActive : { color: colors.slate },
                          ]}
                        >
                          {opt.label}
                        </Text>
                        {isSelected && (
                          <Ionicons name="checkmark" size={14} color="#ffffff" style={{ marginLeft: 4 }} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 2. Categories */}
              {categoriesList.length > 0 && (
                <View style={styles.filterSection}>
                  <Text style={[styles.sectionTitle, { color: colors.midnight }]}>Categories</Text>
                  <View style={styles.pillGroup}>
                    {categoriesList.map((cat) => {
                      const isSelected = draftCategories.includes(cat);
                      return (
                        <TouchableOpacity
                          key={cat}
                          style={[
                            styles.filterPill,
                            isSelected
                              ? styles.filterPillActive
                              : { backgroundColor: colors.background, borderColor: colors.border },
                          ]}
                          onPress={() =>
                            toggleDraftItem(draftCategories, setDraftCategories, cat)
                          }
                        >
                          <Text
                            style={[
                              styles.filterPillText,
                              isSelected ? styles.filterPillTextActive : { color: colors.slate },
                            ]}
                          >
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* 3. Design / Machine Types */}
              <View style={styles.filterSection}>
                <Text style={[styles.sectionTitle, { color: colors.midnight }]}>
                  Design / Machine Type
                </Text>
                <View style={styles.pillGroup}>
                  {DESIGN_MACHINE_TYPE_OPTIONS.map((type) => {
                    const isSelected = draftMachineTypes.includes(type);
                    return (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.filterPill,
                          isSelected
                            ? styles.filterPillActive
                            : { backgroundColor: colors.background, borderColor: colors.border },
                        ]}
                        onPress={() =>
                          toggleDraftItem(draftMachineTypes, setDraftMachineTypes, type)
                        }
                      >
                        <Text
                          style={[
                            styles.filterPillText,
                            isSelected ? styles.filterPillTextActive : { color: colors.slate },
                          ]}
                        >
                          {type}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 4. Area Size */}
              <View style={styles.filterSection}>
                <Text style={[styles.sectionTitle, { color: colors.midnight }]}>Area Size</Text>
                <View style={styles.pillGroupCompact}>
                  {DESIGN_AREA_OPTIONS.map((area) => {
                    const isSelected = draftAreas.includes(area);
                    return (
                      <TouchableOpacity
                        key={area}
                        style={[
                          styles.filterPillCompact,
                          isSelected
                            ? styles.filterPillActive
                            : { backgroundColor: colors.background, borderColor: colors.border },
                        ]}
                        onPress={() =>
                          toggleDraftItem(draftAreas, setDraftAreas, area)
                        }
                      >
                        <Text
                          style={[
                            styles.filterPillText,
                            isSelected ? styles.filterPillTextActive : { color: colors.slate },
                          ]}
                        >
                          {area}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 5. Number of Needles */}
              <View style={styles.filterSection}>
                <Text style={[styles.sectionTitle, { color: colors.midnight }]}>
                  Number of Needles
                </Text>
                <View style={styles.pillGroupCompact}>
                  {NEEDLE_OPTIONS.map((needle) => {
                    const isSelected = draftNeedles.includes(needle);
                    return (
                      <TouchableOpacity
                        key={needle}
                        style={[
                          styles.filterPillCompact,
                          isSelected
                            ? styles.filterPillActive
                            : { backgroundColor: colors.background, borderColor: colors.border },
                        ]}
                        onPress={() =>
                          toggleDraftItem(draftNeedles, setDraftNeedles, needle)
                        }
                      >
                        <Text
                          style={[
                            styles.filterPillText,
                            isSelected ? styles.filterPillTextActive : { color: colors.slate },
                          ]}
                        >
                          {needle} {needle === '1' ? 'Needle' : 'Needles'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 6. File Formats */}
              <View style={styles.filterSection}>
                <Text style={[styles.sectionTitle, { color: colors.midnight }]}>File Formats</Text>
                <View style={styles.pillGroupCompact}>
                  {FILE_FORMAT_OPTIONS.map((fmt) => {
                    const isSelected = draftFileFormats.includes(fmt);
                    return (
                      <TouchableOpacity
                        key={fmt}
                        style={[
                          styles.filterPillCompact,
                          isSelected
                            ? styles.filterPillActive
                            : { backgroundColor: colors.background, borderColor: colors.border },
                        ]}
                        onPress={() =>
                          toggleDraftItem(draftFileFormats, setDraftFileFormats, fmt)
                        }
                      >
                        <Text
                          style={[
                            styles.filterPillText,
                            isSelected ? styles.filterPillTextActive : { color: colors.slate },
                          ]}
                        >
                          .{fmt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 7. Price Ranges */}
              <View style={styles.filterSection}>
                <Text style={[styles.sectionTitle, { color: colors.midnight }]}>Price Range</Text>
                <View style={styles.pillGroup}>
                  {PRICE_RANGE_OPTIONS.map((range) => {
                    const isSelected = draftPriceRanges.includes(range.id);
                    return (
                      <TouchableOpacity
                        key={range.id}
                        style={[
                          styles.filterPill,
                          isSelected
                            ? styles.filterPillActive
                            : { backgroundColor: colors.background, borderColor: colors.border },
                        ]}
                        onPress={() => toggleDraftPrice(range.id)}
                      >
                        <Text
                          style={[
                            styles.filterPillText,
                            isSelected ? styles.filterPillTextActive : { color: colors.slate },
                          ]}
                        >
                          {range.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Bottom Actions Row */}
            <View style={[styles.drawerFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.drawerResetBtn, { borderColor: colors.border }]}
                onPress={() => {
                  setDraftCategories([]);
                  setDraftMachineTypes([]);
                  setDraftAreas([]);
                  setDraftNeedles([]);
                  setDraftFileFormats([]);
                  setDraftPriceRanges(['all']);
                  setDraftSortBy('latest');
                }}
              >
                <Text style={[styles.drawerResetText, { color: colors.slate }]}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerApplyBtn}
                onPress={applyFilters}
                activeOpacity={0.85}
              >
                <Text style={styles.drawerApplyText}>
                  Apply Filters {draftFilterCount > 0 ? `(${draftFilterCount})` : ''}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    ...SHADOWS.subtle,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  filterBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterCountBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.accentPink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  filterCountBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  quickCatsScroll: {
    paddingTop: 10,
    gap: 8,
  },
  quickCatChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  quickCatChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  quickCatText: {
    fontSize: 12,
    fontWeight: '600',
  },
  quickCatTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  resultsInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  resultsCountText: {
    fontSize: 12,
  },
  resetText: {
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },

  // Premium Framed Card (Left Image, Right Details, Category Badge, Remove CTA)
  cardRow: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
    alignItems: 'center',
    minHeight: 140,
    ...SHADOWS.subtle,
  },
  cardImgContainer: {
    width: 108,
    height: 128,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
  },
  cardImg: {
    width: '100%',
    height: '100%',
  },
  cardPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatTag: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  formatTagText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  cardDetails: {
    flex: 1,
    marginLeft: 12,
    minHeight: 128,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  cardTopInfo: {
    flexShrink: 1,
    marginBottom: 4,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  categoryPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  specPill: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  specPillText: {
    fontSize: 9.5,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
    letterSpacing: -0.2,
    marginTop: 2,
  },
  machineTypeText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    marginTop: 'auto',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  priceCurrency: {
    fontSize: 13,
    fontWeight: '900',
    marginRight: 1,
  },
  cardPrice: {
    fontSize: 16.5,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    ...SHADOWS.subtle,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5.5,
    borderRadius: 18,
    borderWidth: 1,
  },
  removeBtnText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '800',
  },

  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  emptyResetBtn: {
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyResetText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },

  // Right-Side Filter Sidebar Drawer Styles
  drawerOverlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  drawerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerPanel: {
    height: '100%',
    ...SHADOWS.floating,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  drawerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  drawerBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  drawerBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  drawerCloseBtn: {
    padding: 4,
  },
  drawerScroll: {
    flex: 1,
  },
  drawerScrollContent: {
    padding: 16,
  },
  filterSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  pillGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillGroupCompact: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterPillCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  drawerFooter: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  drawerResetBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerResetText: {
    fontSize: 14,
    fontWeight: '700',
  },
  drawerApplyBtn: {
    flex: 2,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.subtle,
  },
  drawerApplyText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default ExploreScreen;
