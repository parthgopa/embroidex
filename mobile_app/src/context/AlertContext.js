import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert as RNAlert,
  Animated,
} from 'react-native';
import { useTheme } from './ThemeContext';

const AlertContext = createContext({});

let globalAlertHandler = null;
const originalRNAlert = RNAlert.alert;

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

  const handleOpenAlert = useCallback(
    ({ title, message, buttons, options }) => {
      let normalizedButtons = buttons;
      if (!normalizedButtons || normalizedButtons.length === 0) {
        normalizedButtons = [{ text: 'OK', style: 'default' }];
      }

      setAlertConfig({
        title,
        message,
        buttons: normalizedButtons,
        cancelable: options?.cancelable ?? true,
      });

      opacityAnim.setValue(0);
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    },
    [opacityAnim]
  );

  useEffect(() => {
    globalAlertHandler = handleOpenAlert;
    return () => {
      globalAlertHandler = null;
    };
  }, [handleOpenAlert]);

  const closeAlert = useCallback(() => {
    Animated.timing(opacityAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      setAlertConfig(null);
    });
  }, [opacityAnim]);

  return (
    <AlertContext.Provider value={{ showAlert: showCustomAlert }}>
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
                borderColor: colors.border,
                opacity: opacityAnim,
              },
            ]}
          >
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

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.btn,
                      isCancel
                        ? [
                            styles.btnCancel,
                            {
                              backgroundColor: isDark
                                ? 'rgba(255,255,255,0.08)'
                                : '#f1f5f9',
                              borderColor: colors.border,
                            },
                          ]
                        : isDestructive
                        ? [styles.btnDestructive, { backgroundColor: '#ef4444' }]
                        : [styles.btnPrimary, { backgroundColor: colors.primary }],
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
                    activeOpacity={0.8}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
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
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSingle: {
    minWidth: 90,
    paddingHorizontal: 22,
  },
  btnPrimary: {},
  btnCancel: {
    borderWidth: 1,
  },
  btnDestructive: {},
  btnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
