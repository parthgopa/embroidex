import React, { createContext, useContext, useState, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Dimensions,
  PanResponder,
  Modal,
  Pressable,
} from 'react-native';
import CustomDrawerContent from '../components/CustomDrawerContent';
import { useTheme } from './ThemeContext';

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(WINDOW_WIDTH * 0.82, 330);

const DrawerContext = createContext({
  openDrawer: () => {},
  closeDrawer: () => {},
  toggleDrawer: () => {},
  isOpen: false,
});

export const useDrawer = () => useContext(DrawerContext);

export const DrawerProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const { colors } = useTheme();

  const openDrawer = () => {
    translateX.setValue(-DRAWER_WIDTH);
    setIsOpen(true);
    Animated.spring(translateX, {
      toValue: 0,
      friction: 8,
      tension: 50,
      useNativeDriver: true,
    }).start();
  };

  const closeDrawer = (immediate = false) => {
    if (immediate) {
      translateX.setValue(-DRAWER_WIDTH);
      setIsOpen(false);
      return;
    }
    Animated.timing(translateX, {
      toValue: -DRAWER_WIDTH,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setIsOpen(false);
    });
  };

  const toggleDrawer = () => {
    if (isOpen) {
      closeDrawer();
    } else {
      openDrawer();
    }
  };

  // PanResponder with capture phase to reliably allow swipe-to-close on the drawer
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        // Intercept leftward swipes when horizontal movement dominates vertical movement
        return gestureState.dx < -8 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dx < -8 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(-DRAWER_WIDTH, gestureState.dx));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -DRAWER_WIDTH * 0.2 || gestureState.vx < -0.35) {
          closeDrawer();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            friction: 8,
            tension: 50,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, {
          toValue: 0,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  return (
    <DrawerContext.Provider value={{ openDrawer, closeDrawer, toggleDrawer, isOpen }}>
      <View style={styles.wrapper}>
        {children}

        {/* Modal Window: Guaranteed backdrop touch capture & hardware back on Android */}
        <Modal
          visible={isOpen}
          transparent
          animationType="fade"
          onRequestClose={() => closeDrawer()}
        >
          <View style={styles.modalOverlay}>
            {/* Full Screen Pressable Backdrop */}
            <Pressable
              style={styles.backdrop}
              onPress={() => closeDrawer()}
              accessibilityLabel="Close sidebar"
              accessibilityRole="button"
            />

            {/* Sliding Sidebar Drawer */}
            <Animated.View
              {...panResponder.panHandlers}
              style={[
                styles.drawer,
                {
                  width: DRAWER_WIDTH,
                  backgroundColor: colors.surface,
                  transform: [{ translateX }],
                },
              ]}
            >
              <CustomDrawerContent closeDrawer={closeDrawer} />
            </Animated.View>
          </View>
        </Modal>
      </View>
    </DrawerContext.Provider>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  modalOverlay: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 24,
  },
});

export default DrawerContext;
