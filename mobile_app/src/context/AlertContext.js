import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert as RNAlert,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from './ThemeContext';

const AlertContext = createContext({});

let globalAlertHandler = null;
const originalRNAlert = RNAlert.alert;

/**
 * Intelligent type detection based on keywords in title/message,
 * or an explicit type ('success' | 'error' | 'info') passed in options.
 */
export const detectAlertType = (title = '', message = '', options = {}) => {
  if (options?.type) {
    const t = String(options.type).toLowerCase();
    if (['success', 'error', 'info'].includes(t)) return t;
  }

  const combined = `${title || ''} ${message || ''}`.toLowerCase();

  // 1. Success keywords -> Green
  if (
    /(success|successful|successfully|welcome|verified|code sent|code resent|saved|updated|deleted|completed|purchased|downloaded)/i.test(
      combined
    )
  ) {
    return 'success';
  }

  // 2. Error keywords -> Soft Red (calm, non-alarming)
  if (
    /(error|failed|failure|invalid|mismatch|wrong|incorrect|exceeds|could not|cannot|denied)/i.test(
      combined
    )
  ) {
    return 'error';
  }

  // 3. Info / Neutral -> Grey
  return 'info';
};

/**
 * Custom alert function that delegates to our in-app rounded modal.
 * Can be called as Alert.alert(...) or via useAlert().showAlert(...)
 */
export const showCustomAlert = (title, message, buttons, options) => {
  if (globalAlertHandler) {
    globalAlertHandler({ title, message, buttons, options });
  } else {
    originalRNAlert(title, message, buttons, options);
  }
};

// Global monkey-patch so all Alert.alert calls across the app use our simple custom UI
RNAlert.alert = showCustomAlert;

export const AlertProvider = ({ children }) => {
  const { colors, isDark } = useTheme();
  const [alertConfig, setAlertConfig] = useState(null);
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.92)).current;

  const handleOpenAlert = useCallback(
    ({ title, message, buttons, options }) => {
      let normalizedButtons = buttons;
      if (!normalizedButtons || normalizedButtons.length === 0) {
        normalizedButtons = [{ text: 'OK', style: 'default' }];
      }

      const alertType = detectAlertType(title, message, options);

      setAlertConfig({
        title,
        message,
        buttons: normalizedButtons,
        cancelable: options?.cancelable ?? true,
        type: alertType,
      });

      opacityAnim.setValue(0);
      scaleAnim.setValue(0.92);
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 75,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [opacityAnim, scaleAnim]
  );

  useEffect(() => {
    globalAlertHandler = handleOpenAlert;
    return () => {
      globalAlertHandler = null;
    };
  }, [handleOpenAlert]);

  const closeAlert = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.94,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setAlertConfig(null);
    });
  }, [opacityAnim, scaleAnim]);

  // Dynamic theme based on alert type:
  // - Success: Green (#10b981)
  // - Info: Grey (#64748b)
  // - Error: Soft Rose-Red (#f43f5e - clean and friendly, not like a harsh alert)
  const typeConfig = useMemo(() => {
    const type = alertConfig?.type || 'info';

    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle-outline',
          iconColor: '#10b981',
          badgeBg: isDark ? 'rgba(16, 185, 129, 0.18)' : '#ecfdf5',
          btnBg: '#10b981',
          borderHighlight: isDark ? 'rgba(16, 185, 129, 0.25)' : '#d1fae5',
        };
      case 'error':
        return {
          icon: 'alert-circle-outline',
          iconColor: '#f43f5e',
          badgeBg: isDark ? 'rgba(244, 63, 94, 0.16)' : '#fff1f2',
          btnBg: '#f43f5e',
          borderHighlight: isDark ? 'rgba(244, 63, 94, 0.25)' : '#ffe4e6',
        };
      case 'info':
      default:
        return {
          icon: 'information-circle-outline',
          iconColor: '#64748b',
          badgeBg: isDark ? 'rgba(148, 163, 184, 0.16)' : '#f1f5f9',
          btnBg: '#64748b',
          borderHighlight: isDark ? 'rgba(148, 163, 184, 0.22)' : '#e2e8f0',
        };
    }
  }, [alertConfig?.type, isDark]);

  const alertContextValue = useMemo(
    () => ({
      showAlert: showCustomAlert,
      showSuccess: (title, message, buttons, options) =>
        showCustomAlert(title, message, buttons, { ...options, type: 'success' }),
      showError: (title, message, buttons, options) =>
        showCustomAlert(title, message, buttons, { ...options, type: 'error' }),
      showInfo: (title, message, buttons, options) =>
        showCustomAlert(title, message, buttons, { ...options, type: 'info' }),
    }),
    []
  );

  return (
    <AlertContext.Provider value={alertContextValue}>
      {children}

      <Modal
        visible={!!alertConfig}
        transparent
        animationType="none"
        onRequestClose={() => {
          if (alertConfig?.cancelable) closeAlert();
        }}
      >
        <View style={styles.backdrop}>
          <Animated.View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: typeConfig.borderHighlight,
                opacity: opacityAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* Type Icon Badge */}
            <View style={[styles.iconBadge, { backgroundColor: typeConfig.badgeBg }]}>
              <Ionicons name={typeConfig.icon} size={28} color={typeConfig.iconColor} />
            </View>

            {/* Title */}
            {alertConfig?.title ? (
              <Text style={[styles.title, { color: colors.midnight }]}>
                {alertConfig.title}
              </Text>
            ) : null}

            {/* Message */}
            {alertConfig?.message ? (
              <Text style={[styles.message, { color: colors.slate }]}>
                {alertConfig.message}
              </Text>
            ) : null}

            {/* Buttons Row / Stack */}
            <View
              style={[
                styles.buttonsRow,
                alertConfig?.buttons?.length > 2 && styles.buttonsStacked,
              ]}
            >
              {alertConfig?.buttons?.map((btn, index) => {
                const isCancel = btn.style === 'cancel';
                const isDestructive = btn.style === 'destructive';
                const isSingle = alertConfig.buttons.length === 1;

                const buttonBg = isCancel
                  ? isDark
                    ? 'rgba(255,255,255,0.08)'
                    : '#f1f5f9'
                  : isDestructive
                  ? '#ef4444'
                  : typeConfig.btnBg;

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.btn,
                      { backgroundColor: buttonBg },
                      isCancel && [styles.btnCancel, { borderColor: colors.border }],
                      isSingle && styles.btnSingle,
                      !isSingle && alertConfig.buttons.length === 2 && { flex: 1 },
                      index > 0 && alertConfig.buttons.length <= 2 && { marginLeft: 10 },
                      alertConfig.buttons.length > 2 && { marginBottom: 8, width: '100%' },
                    ]}
                    onPress={() => {
                      closeAlert();
                      if (btn.onPress) {
                        setTimeout(() => btn.onPress(), 120);
                      }
                    }}
                    activeOpacity={0.82}
                  >
                    <Text
                      style={[
                        styles.btnText,
                        isCancel
                          ? { color: colors.midnight }
                          : { color: '#ffffff' },
                        isDestructive && { color: '#ffffff', fontWeight: '700' },
                      ]}
                    >
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
};

export const useAlert = () => useContext(AlertContext);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.52)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
  },
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
  },
  buttonsStacked: {
    flexDirection: 'column',
  },
  btn: {
    paddingVertical: 10.5,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSingle: {
    minWidth: 100,
    paddingHorizontal: 24,
  },
  btnCancel: {
    borderWidth: 1,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
