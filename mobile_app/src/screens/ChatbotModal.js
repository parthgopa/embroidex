import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Linking,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { navigate } from '../navigation/navigationRef';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../context/ThemeContext';
import { SHADOWS } from '../theme/theme';

const ChatbotModal = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const {
    messages,
    previousSessions,
    isSending,
    sendMessage,
    startNewChat,
    loadPreviousSession,
    deleteSession,
    minimizeChat,
  } = useChat();
  const [input, setInput] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const flatListRef = React.useRef(null);

  const quickPills = [
    'How do I buy designs?',
    'What file formats are supported?',
    'What is the seller commission?',
    'How do withdrawals work?',
  ];

  const handleLinkPress = (href) => {
    if (!href) return;
    const raw = href.trim();
    const clean = raw.toLowerCase();

    // 1. Minimize / dismiss chatbot modal
    if (navigation.canGoBack()) {
      navigation.goBack();
    }

    // 2. Route smoothly to destination screen using global navigationRef
    setTimeout(() => {
      if (clean.includes('/seller/register')) {
        navigate('SellerRegisterScreen');
      } else if (clean.includes('/seller/upload')) {
        navigate('SellerUploadScreen');
      } else if (clean.includes('/seller/earnings') || clean.includes('/seller/dashboard')) {
        navigate('SellerEarningsScreen');
      } else if (clean.includes('/login')) {
        navigate('LoginScreen');
      } else if (clean.includes('/signup') || clean.includes('/register')) {
        navigate('SignupScreen');
      } else if (clean.includes('/cart')) {
        navigate('MainTabs', { screen: 'Cart' });
      } else if (clean.includes('/purchases') || clean.includes('/my-purchases')) {
        navigate('MainTabs', { screen: 'Purchases' });
      } else if (clean.includes('/explore') || clean.includes('/designs')) {
        let categoryParam = null;
        if (raw.includes('category=')) {
          const parts = raw.split('category=');
          if (parts[1]) {
            categoryParam = decodeURIComponent(parts[1].split('&')[0]);
          }
        }
        navigate('MainTabs', {
          screen: 'Explore',
          params: categoryParam ? { category: categoryParam } : undefined,
        });
      } else if (clean.startsWith('http')) {
        Linking.openURL(raw).catch((err) => console.warn('Could not open url:', err));
      } else {
        navigate('MainTabs', { screen: 'Home' });
      }
    }, 220);
  };

  const renderBotMessage = (text) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const segments = [];
    const detectedLinks = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ type: 'text', value: text.substring(lastIndex, match.index) });
      }
      const title = match[1];
      const href = match[2];
      segments.push({ type: 'link', title, href });
      detectedLinks.push({ title, href });
      lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      segments.push({ type: 'text', value: text.substring(lastIndex) });
    }

    if (detectedLinks.length === 0) {
      return <Text style={[styles.botBubbleText, { color: colors.midnight }]}>{text}</Text>;
    }

    return (
      <View>
        <Text style={[styles.botBubbleText, { color: colors.midnight }]}>
          {segments.map((seg, idx) => {
            if (seg.type === 'text') {
              return <Text key={idx}>{seg.value}</Text>;
            }
            return (
              <Text
                key={idx}
                style={[styles.inlineLink, { color: colors.primary }]}
                onPress={() => handleLinkPress(seg.href)}
              >
                {seg.title} ↗
              </Text>
            );
          })}
        </Text>

        {/* Dedicated Interactive Route Action Cards */}
        <View style={styles.linkActionsList}>
          {detectedLinks.map((link, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.linkActionCard, { backgroundColor: colors.primary }]}
              onPress={() => handleLinkPress(link.href)}
              activeOpacity={0.82}
            >
              <View style={styles.linkActionCardLeft}>
                <Ionicons name="arrow-forward-circle" size={17} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.linkActionCardText} numberOfLines={1}>{link.title}</Text>
              </View>
              <View style={[styles.linkActionBadge, { backgroundColor: colors.surface }]}>
                <Text style={[styles.linkActionBadgeText, { color: colors.primary }]}>Go to Page</Text>
                <Ionicons name="arrow-forward" size={11} color={colors.primary} style={{ marginLeft: 3 }} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const handleSend = (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || isSending) return;
    setInput('');
    sendMessage(query);
  };

  const renderItem = ({ item }) => (
    <View
      style={[
        styles.bubble,
        item.type === 'user'
          ? [styles.userBubble, { backgroundColor: colors.primary }]
          : [styles.botBubble, { backgroundColor: colors.surface, borderColor: colors.border }],
      ]}
    >
      {item.type === 'user' ? (
        <Text style={styles.userBubbleText}>{item.text}</Text>
      ) : (
        renderBotMessage(item.text)
      )}
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.surface}
        translucent={false}
      />

      {/* Top Header with Safe Area Insets */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={14} color="#ffffff" />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.midnight }]}>Embroidex Assistant</Text>
            <Text style={[styles.headerSubtitle, { color: colors.slate }]}>Powered by Gemini</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          {/* History / Previous Chats Button */}
          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: colors.background }]}
            onPress={() => setShowHistoryModal(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="time-outline" size={19} color={colors.midnight} />
            {previousSessions.length > 0 && (
              <View style={styles.historyBadge}>
                <Text style={styles.historyBadgeText}>{previousSessions.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* New Chat Button */}
          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: colors.background }]}
            onPress={() => startNewChat()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="add" size={22} color={colors.midnight} />
          </TouchableOpacity>

          {/* Minimize Button */}
          <TouchableOpacity
            style={[
              styles.minimizeBtn,
              {
                backgroundColor: isDark ? colors.background : '#eef2ff',
                borderColor: colors.border,
              },
            ]}
            onPress={() => {
              minimizeChat();
              navigation.goBack();
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-down" size={16} color={colors.primary} />
          </TouchableOpacity>

          {/* Close Button */}
          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={22} color={colors.midnight} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Quick Suggestion Pills */}
        <View style={[styles.pillsContainer, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={quickPills}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.pillsScroll}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.pill, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => handleSend(item)}
              >
                <Text style={[styles.pillText, { color: colors.primary }]}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Chat Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {isSending && (
          <View style={styles.typingIndicator}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.typingText, { color: colors.slate }]}>Assistant is replying...</Text>
          </View>
        )}

        {/* Bottom Input Row */}
        <View style={[styles.inputRow, { paddingBottom: Math.max(insets.bottom, 12), backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                color: colors.midnight,
                borderColor: colors.border,
              },
            ]}
            placeholder="Type your question here..."
            placeholderTextColor={colors.slate}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || isSending) && styles.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={!input.trim() || isSending}
            activeOpacity={0.8}
          >
            <Ionicons
              name="send"
              size={18}
              color={input.trim() && !isSending ? '#ffffff' : colors.lightSlate}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Previous Chats History Modal */}
      <Modal
        visible={showHistoryModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <View style={[styles.historyModalContainer, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 10, backgroundColor: colors.surface }]}>
          {/* History Header */}
          <View style={[styles.historyModalHeader, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.historyModalTitle, { color: colors.midnight }]}>Previous Chats</Text>
              <Text style={[styles.historyModalSubtitle, { color: colors.slate }]}>
                {previousSessions.length} archived conversation{previousSessions.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => setShowHistoryModal(false)}
            >
              <Ionicons name="close" size={22} color={colors.midnight} />
            </TouchableOpacity>
          </View>

          {/* New Chat CTA inside modal */}
          <TouchableOpacity
            style={styles.historyNewChatBtn}
            onPress={() => {
              startNewChat();
              setShowHistoryModal(false);
            }}
          >
            <Ionicons name="add-circle" size={20} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.historyNewChatText}>Start a Fresh Chat</Text>
          </TouchableOpacity>

          {/* Sessions List */}
          {previousSessions.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Ionicons name="chatbubbles-outline" size={48} color={colors.slate} />
              <Text style={[styles.emptyHistoryTitle, { color: colors.midnight }]}>No Previous Chats</Text>
              <Text style={[styles.emptyHistoryText, { color: colors.slate }]}>
                When you restart the app, your previous conversations will be automatically saved here.
              </Text>
            </View>
          ) : (
            <FlatList
              data={previousSessions}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.historyList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.historyCard,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                  onPress={() => {
                    loadPreviousSession(item);
                    setShowHistoryModal(false);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.historyCardIcon, { backgroundColor: colors.primaryMuted }]}>
                    <Ionicons name="chatbubble-ellipses" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.historyCardContent}>
                    <Text style={[styles.historyCardTitle, { color: colors.midnight }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[styles.historyCardMeta, { color: colors.slate }]}>
                      {new Date(item.updatedAt).toLocaleDateString()} • {item.messages?.length || 0} messages
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.historyDeleteBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => deleteSession(item.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="trash-outline" size={17} color={colors.slate} />
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    ...SHADOWS.subtle,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#312e81',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  historyBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  historyBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  minimizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  minimizeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  pillsContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  pillsScroll: {
    paddingHorizontal: 14,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  messagesList: {
    padding: 16,
    gap: 12,
  },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  botBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    ...SHADOWS.subtle,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  botBubbleText: {
    fontSize: 14,
    lineHeight: 21,
  },
  userBubbleText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
  },
  inlineLink: {
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  linkActionsList: {
    marginTop: 10,
    gap: 6,
  },
  linkActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    ...SHADOWS.subtle,
  },
  linkActionCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  linkActionCardText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  linkActionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  linkActionBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 6,
    gap: 8,
  },
  typingText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    paddingHorizontal: 18,
    fontSize: 14,
    borderWidth: 1,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.45,
  },
  historyModalContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  historyModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  historyModalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  historyModalSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  historyNewChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    ...SHADOWS.subtle,
  },
  historyNewChatText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyHistory: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    marginTop: 40,
  },
  emptyHistoryTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 14,
  },
  emptyHistoryText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  historyList: {
    paddingBottom: 24,
    gap: 10,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  historyCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyCardContent: {
    flex: 1,
    marginRight: 8,
  },
  historyCardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  historyCardMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  historyDeleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});

export default ChatbotModal;
