import React, { createContext, useContext, useState, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  PanResponder,
  Modal,
} from 'react-native';
import CustomDrawerContent from '../components/CustomDrawerContent';
import { useTheme } from './ThemeContext';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(width * 0.82, 330);

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

  // PanResponder to allow swipe-to-close on the drawer
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 15 && gestureState.dx < 0;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(-DRAWER_WIDTH, gestureState.dx));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -DRAWER_WIDTH * 0.25 || gestureState.vx < -0.5) {
          closeDrawer();
        } else {
          openDrawer();
        }
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
          statusBarTranslucent
          onRequestClose={() => closeDrawer()}
        >
          <View style={styles.modalOverlay}>
            {/* Direct Tap-outside Backdrop to Close (Zero Animated Wrapper blocking touches) */}
            <TouchableOpacity
              style={styles.backdrop}
              activeOpacity={1}
              onPress={() => closeDrawer()}
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
    flex: 1,
    position: 'relative',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 24,
  },
});

export default DrawerContext;
