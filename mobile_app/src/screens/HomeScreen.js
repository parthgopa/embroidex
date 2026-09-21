import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import TopBar from '../components/TopBar';
import Ionicons from 'react-native-vector-icons/Ionicons';
import API, { BASE_URL } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { COLORS, SHADOWS } from '../theme/theme';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showcases, setShowcases] = useState([]);

  const fetchHomeData = async () => {
    try {
      const res = await API.get('/homepage/data');
      if (res.data?.showcases) {
        setShowcases(res.data.showcases);
      }
    } catch (err) {
      console.warn('Error fetching homepage data:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomeData();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Wilcom & Industrial Machine Hero Banner */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Framed Wilcom CAD & Industrial Multihead Machine Image */}
          <View style={styles.heroImgContainer}>
            <Image
              source={require('../assets/hero_banner.jpg')}
              style={styles.heroImg}
              resizeMode="cover"
            />
            {/* Top Floating Badge */}
            <View style={styles.heroBadgeOverlay}>
              <Ionicons name="sparkles" size={13} color="#fbbf24" style={{ marginRight: 5 }} />
              <Text style={styles.heroBadgeText}>WILCOM & MACHINE FILES</Text>
            </View>
          </View>

          {/* Bottom Card Content with reduced text & icons */}
          <View style={styles.heroContent}>
            <Text style={[styles.heroTitle, { color: colors.midnight }]}>
              Embroidery Design Marketplace
            </Text>
            <Text style={[styles.heroSubtitle, { color: colors.slate }]}>
              Verified .EMB & .DST files designed for multi-head machines
            </Text>

            {/* Action Buttons: Prominent Icons for Explore and AI */}
            <View style={styles.heroActionRow}>
              <TouchableOpacity
                style={[styles.heroExploreBtn, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('Explore')}
                activeOpacity={0.85}
              >
                <Ionicons name="compass" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.heroExploreBtnText}>Explore Designs</Text>
                <Ionicons name="arrow-forward" size={15} color="#ffffff" style={{ marginLeft: 6 }} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.heroAiBtn,
                  {
                    backgroundColor: isDark ? 'rgba(99, 102, 241, 0.18)' : '#eef2ff',
                    borderColor: isDark ? 'rgba(99, 102, 241, 0.35)' : '#c7d2fe',
                  },
                ]}
                onPress={() => navigation.navigate('ChatbotModal')}
                activeOpacity={0.85}
              >
                <Ionicons name="sparkles" size={16} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.heroAiBtnText, { color: colors.primary }]}>Ask AI</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Dynamic Multi Head Machine Showcase Sections */}
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
        ) : (
          showcases.map((showcase, sIdx) => (
            <View key={sIdx} style={styles.showcaseSection}>
              <View style={styles.showcaseHeaderRow}>
                <View style={styles.showcaseTitleLeft}>
                  <Text style={[styles.showcaseTitle, { color: colors.midnight }]}>
                    {showcase.title}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('Explore', {
                      category: showcase.category,
                    })
                  }
                  style={styles.seeAllRow}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {/* Horizontal Scroll of Full-Height Showcase Image Cards */}
              {showcase.images && showcase.images.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.showcaseHorizontalScroll}
                >
                  {showcase.images.map((img, imgIdx) => (
                    <TouchableOpacity
                      key={imgIdx}
                      style={[
                        styles.showcaseCard,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                        },
                      ]}
                      activeOpacity={0.88}
                      onPress={() =>
                        navigation.navigate('Explore', {
                          category: showcase.category,
                        })
                      }
                    >
                      <View style={[styles.showcaseImgWrapper, { backgroundColor: isDark ? '#020617' : '#f1f5f9' }]}>
                        <Image
                          source={{ uri: `${BASE_URL}/${img.url}` }}
                          style={styles.showcaseImg}
                          resizeMode="cover"
                        />
                      </View>
                      <View
                        style={[
                          styles.showcaseCardLabel,
                          {
                            backgroundColor: colors.surface,
                            borderTopColor: colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[styles.showcaseCardName, { color: colors.midnight }]}
                          numberOfLines={1}
                        >
                          {img.name}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
    ...SHADOWS.card,
  },
  heroImgContainer: {
    width: '100%',
    height: 220,
    position: 'relative',
    backgroundColor: '#0f172a',
  },
  heroImg: {
    width: '100%',
    height: '100%',
  },
  heroBadgeOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  heroBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  heroContent: {
    padding: 16,
  },
  heroTitle: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    fontSize: 12.5,
    marginTop: 4,
    fontWeight: '500',
  },
  heroActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  heroExploreBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.subtle,
  },
  heroExploreBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  heroAiBtn: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  heroAiBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },

  // Showcase Section
  showcaseSection: {
    marginBottom: 24,
  },
  showcaseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  showcaseTitleLeft: {
    flex: 1,
  },
  showcaseTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  showcaseHorizontalScroll: {
    gap: 12,
    paddingVertical: 4,
  },
  showcaseCard: {
    width: 142,
    height: 190,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    ...SHADOWS.subtle,
  },
  showcaseImgWrapper: {
    width: '100%',
    height: 146,
  },
  showcaseImg: {
    width: '100%',
    height: '100%',
  },
  showcaseCardLabel: {
    height: 44,
    paddingHorizontal: 10,
    justifyContent: 'center',
    borderTopWidth: 1,
  },
  showcaseCardName: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export default HomeScreen;
