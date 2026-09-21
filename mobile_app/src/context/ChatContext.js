import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../services/api';

const SESSIONS_STORAGE_KEY = '@embroidex_chat_sessions';
const ACTIVE_SESSION_KEY = '@embroidex_active_session_id';

const DEFAULT_WELCOME_MESSAGE = {
  id: 'welcome-msg',
  type: 'bot',
  text: 'Hello! I am your Embroidex Assistant. How can I help you today with embroidery designs, formats, or seller payouts?',
  timestamp: Date.now(),
};

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([DEFAULT_WELCOME_MESSAGE]);
  const [currentSessionId, setCurrentSessionId] = useState(String(Date.now()));
  const [previousSessions, setPreviousSessions] = useState([]);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // 1. App Startup: Archive any previous chat and start a fresh new chat session
  useEffect(() => {
    const initializeChatSessions = async () => {
      try {
        const storedSessions = await AsyncStorage.getItem(SESSIONS_STORAGE_KEY);
        let sessionsList = [];
        if (storedSessions) {
          sessionsList = JSON.parse(storedSessions) || [];
        }

        // Check if there was an unfinished previous chat from last run
        const lastActiveStored = await AsyncStorage.getItem('@embroidex_last_chat_messages');
        if (lastActiveStored) {
          const lastMessages = JSON.parse(lastActiveStored);
          // If the previous chat had at least one user message, archive it to previousSessions
          const hasUserMessage = lastMessages.some((m) => m.type === 'user');
          if (hasUserMessage) {
            const firstUserQuery =
              lastMessages.find((m) => m.type === 'user')?.text || 'Embroidery Inquiry';
            const archivedSession = {
              id: String(Date.now() - 1000),
              title: firstUserQuery.slice(0, 42) + (firstUserQuery.length > 42 ? '...' : ''),
              createdAt: lastMessages[0]?.timestamp || Date.now(),
              updatedAt: Date.now(),
              messages: lastMessages,
            };
            sessionsList = [archivedSession, ...sessionsList.filter((s) => s.id !== archivedSession.id)];
            await AsyncStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessionsList));
          }
        }

        setPreviousSessions(sessionsList);

        // Open a FRESH new chat session for this app launch
        const newSessionId = String(Date.now());
        setCurrentSessionId(newSessionId);
        setMessages([
          {
            ...DEFAULT_WELCOME_MESSAGE,
            id: `welcome-${newSessionId}`,
            timestamp: Date.now(),
          },
        ]);
        await AsyncStorage.setItem(ACTIVE_SESSION_KEY, newSessionId);
        await AsyncStorage.setItem('@embroidex_last_chat_messages', JSON.stringify([DEFAULT_WELCOME_MESSAGE]));
      } catch (err) {
        console.warn('Error initializing chat sessions:', err);
      } finally {
        setInitialized(true);
      }
    };

    initializeChatSessions();
  }, []);

  // 2. Persist active messages to temporary storage for cross-screen persistence in current session
  useEffect(() => {
    if (!initialized) return;
    const persistActiveChat = async () => {
      try {
        await AsyncStorage.setItem('@embroidex_last_chat_messages', JSON.stringify(messages));
      } catch (err) {
        console.warn('Could not persist active chat:', err);
      }
    };
    persistActiveChat();
  }, [messages, initialized]);

  // Generate conversation summary for backend context
  const generateConversationSummary = (msgList) => {
    if (!msgList || msgList.length <= 2) return '';
    const userTopics = msgList
      .filter((m) => m.type === 'user')
      .map((m) => m.text.trim())
      .slice(-6);
    if (userTopics.length === 0) return '';
    return `User previously inquired about: "${userTopics.join('; ')}". Maintain helpful context.`;
  };

  // Send a message within the current session
  const sendMessage = async (userQuery) => {
    const query = userQuery?.trim();
    if (!query || isSending) return;

    const userMessage = {
      id: String(Date.now()),
      type: 'user',
      text: query,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsSending(true);

    try {
      const summaryContext = generateConversationSummary(messages);
      const historyPayload = messages.map((m) => ({
        type: m.type,
        text: m.text,
      }));

      if (summaryContext && historyPayload.length > 0) {
        historyPayload[0] = {
          ...historyPayload[0],
          text: `[Context: ${summaryContext}]\n\n${historyPayload[0].text}`,
        };
      }

      const res = await API.post('/chatbot/message', {
        message: query,
        history: historyPayload,
        summary: summaryContext,
      });

      const replyText =
        res.data?.reply ||
        res.data?.message ||
        'I am here to assist with your embroidery design questions!';

      const botMessage = {
        id: String(Date.now() + 1),
        type: 'bot',
        text: replyText,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.warn('Chatbot API error:', err.message);
      const errorMessage = {
        id: String(Date.now() + 1),
        type: 'bot',
        text: 'Sorry, I had trouble reaching the assistant. Please try again shortly.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  // Start a new chat session manually
  const startNewChat = async () => {
    // If current chat has user messages, save it to previousSessions before starting fresh
    if (messages.some((m) => m.type === 'user')) {
      const firstUserQuery =
        messages.find((m) => m.type === 'user')?.text || 'Embroidery Inquiry';
      const sessionToSave = {
        id: currentSessionId || String(Date.now()),
        title: firstUserQuery.slice(0, 42) + (firstUserQuery.length > 42 ? '...' : ''),
        createdAt: messages[0]?.timestamp || Date.now(),
        updatedAt: Date.now(),
        messages: [...messages],
      };
      const updatedSessions = [sessionToSave, ...previousSessions.filter((s) => s.id !== sessionToSave.id)];
      setPreviousSessions(updatedSessions);
      await AsyncStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updatedSessions));
    }

    // Reset to brand new session
    const newSessionId = String(Date.now());
    setCurrentSessionId(newSessionId);
    const freshMessages = [
      {
        ...DEFAULT_WELCOME_MESSAGE,
        id: `welcome-${newSessionId}`,
        timestamp: Date.now(),
      },
    ];
    setMessages(freshMessages);
    await AsyncStorage.setItem(ACTIVE_SESSION_KEY, newSessionId);
    await AsyncStorage.setItem('@embroidex_last_chat_messages', JSON.stringify(freshMessages));
  };

  // Load a selected previous session into the active chat
  const loadPreviousSession = (session) => {
    if (!session || !session.messages) return;
    setCurrentSessionId(session.id);
    setMessages(session.messages);
  };

  // Delete a specific past session
  const deleteSession = async (sessionId) => {
    const updated = previousSessions.filter((s) => s.id !== sessionId);
    setPreviousSessions(updated);
    try {
      await AsyncStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Could not delete session:', err);
    }
  };

  // Clear all archived sessions
  const clearAllHistory = async () => {
    setPreviousSessions([]);
    try {
      await AsyncStorage.removeItem(SESSIONS_STORAGE_KEY);
    } catch (err) {
      console.warn('Could not clear sessions storage:', err);
    }
  };

  const minimizeChat = () => {
    setIsChatMinimized(true);
  };

  const openChat = () => {
    setIsChatMinimized(false);
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        currentSessionId,
        previousSessions,
        isSending,
        isChatMinimized,
        sendMessage,
        startNewChat,
        loadPreviousSession,
        deleteSession,
        clearAllHistory,
        minimizeChat,
        openChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
