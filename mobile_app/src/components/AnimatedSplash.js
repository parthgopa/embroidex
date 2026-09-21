import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const AnimatedSplash = ({ onFinish }) => {
  // Animation Values
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const rotateX = useRef(new Animated.Value(60)).current;     // 3D tilt
  const rotateY = useRef(new Animated.Value(-40)).current;    // 3D spin
  const ring1Scale = useRef(new Animated.Value(0.6)).current;
  const ring1Opacity = useRef(new Animated.Value(0.8)).current;
  const ring2Scale = useRef(new Animated.Value(0.4)).current;
  const ring2Opacity = useRef(new Animated.Value(0.6)).current;
  
  const textTranslateY = useRef(new Animated.Value(24)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Initial 3D Pop & Spin
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(rotateX, {
        toValue: 0,
        duration: 1100,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: true,
      }),
      Animated.timing(rotateY, {
        toValue: 0,
        duration: 1300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // Expanding Glow Rings
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(ring1Scale, {
              toValue: 1.4,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(ring1Scale, {
              toValue: 0.7,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(ring1Opacity, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(ring1Opacity, {
              toValue: 0.8,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      ),
      // Text Slide Up
      Animated.sequence([
        Animated.delay(350),
        Animated.parallel([
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.spring(textTranslateY, {
            toValue: 0,
            friction: 6,
            useNativeDriver: true,
          }),
        ]),
      ]),
      // Bottom Progress Bar
      Animated.timing(progressWidth, {
        toValue: width * 0.55,
        duration: 2200,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start();

    // Finish Transition after 2.5s
    const timer = setTimeout(() => {
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 400,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        if (onFinish) onFinish();
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const rotateXInterpolate = rotateX.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const rotateYInterpolate = rotateY.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: containerOpacity,
        },
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" translucent={false} />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Top Spacer for Optical Equilibrium */}
        <View style={styles.topSpacer} />

        {/* Centered Brand Experience */}
        <View style={styles.centerContent}>
          {/* 3D Animated Logo Container */}
          <View style={styles.logoPerspectiveWrapper}>
            {/* Glow Ring 1 */}
            <Animated.View
              style={[
                styles.glowRing,
                {
                  transform: [{ scale: ring1Scale }],
                  opacity: ring1Opacity,
                },
              ]}
            />
            {/* Glow Ring 2 */}
            <Animated.View
              style={[
                styles.glowRing,
                styles.glowRingOuter,
                {
                  transform: [{ scale: ring2Scale }],
                  opacity: ring2Opacity,
                },
              ]}
            />

            {/* 3D Card with Brand Logo */}
            <Animated.View
              style={[
                styles.logoCard3D,
                {
                  opacity: logoOpacity,
                  transform: [
                    { perspective: 1000 },
                    { scale: logoScale },
                    { rotateX: rotateXInterpolate },
                    { rotateY: rotateYInterpolate },
                  ],
                },
              ]}
            >
              <Image
                source={require('../assets/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </Animated.View>
          </View>

          {/* Brand Name & Tagline */}
          <Animated.View
            style={[
              styles.textBlock,
              {
                opacity: textOpacity,
                transform: [{ translateY: textTranslateY }],
              },
            ]}
          >
            <Text style={styles.titleEmbroid}>
              Embroid<Text style={styles.titleAccent}>ex</Text>
            </Text>

            <Text style={styles.tagline}>
              Premium Embroidery Marketplace
            </Text>
            <Text style={styles.subTagline}>
              Verified Machine Patterns • Instant Downloads
            </Text>
          </Animated.View>
        </View>

        {/* Bottom Loading Progress Bar */}
        <View style={styles.bottomLoader}>
          <View style={styles.progressBarBackground}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: progressWidth,
                },
              ]}
            />
          </View>
          <Text style={styles.loadingLabel}>Preparing your workshop...</Text>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#0f172a', // Solid luxury midnight
  },
  safeArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  topSpacer: {
    height: 30,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPerspectiveWrapper: {
    width: 170,
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  glowRing: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.45)',
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
  },
  glowRingOuter: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderColor: 'rgba(236, 72, 153, 0.35)',
  },
  logoCard3D: {
    width: 120,
    height: 120,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 14,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  logoImage: {
    width: 88,
    height: 88,
  },
  textBlock: {
    alignItems: 'center',
    marginTop: 6,
  },
  titleEmbroid: {
    fontSize: 38,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.8,
  },
  titleAccent: {
    color: '#818cf8',
    fontStyle: 'italic',
    fontWeight: '900',
  },
  tagline: {
    fontSize: 15,
    fontWeight: '700',
    color: '#c7d2fe',
    marginTop: 10,
    letterSpacing: 0.2,
  },
  subTagline: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94a3b8',
    marginTop: 4,
  },
  bottomLoader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  progressBarBackground: {
    width: width * 0.55,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
  loadingLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 10,
    letterSpacing: 0.4,
  },
});

export default AnimatedSplash;
