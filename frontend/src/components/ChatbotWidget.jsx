import { useState, useEffect, useRef } from "react";
import { MdClose, MdSend } from "react-icons/md";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";
import API from "../services/api";
import styles from "./ChatbotWidget.module.css";

const SESSION_KEY = "embroidex_chatbot_session";

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    let storedSessionId = localStorage.getItem(SESSION_KEY);
    if (!storedSessionId) {
      storedSessionId = generateUUID();
      localStorage.setItem(SESSION_KEY, storedSessionId);
    }
    setSessionId(storedSessionId);
  }, []);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          type: "bot",
          text: "Hi! I'm the Embroidex Assistant 🧵 Ask me anything about buying or selling embroidery designs!",
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateUUID = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    const textToSend = inputValue.trim();
    if (!textToSend) return;

    const userMessage = {
      type: "user",
      text: textToSend,
      timestamp: new Date(),
    };

    const currentHistory = [...messages, userMessage];
    setMessages(currentHistory);
    setInputValue("");
    setIsTyping(true);

    try {
      const res = await API.post("/chatbot/message", {
        message: textToSend,
        history: messages,
      });

      const replyText = res.data?.reply || res.data?.text || "I'm not sure about that — please contact our support team for help.";

      const botMessage = {
        type: "bot",
        text: replyText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chatbot API error:", error);
      const errorMessage = {
        type: "bot",
        text: "Sorry, I'm having trouble connecting to Gemini API right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className={styles.chatWindow}>
          {/* Header */}
          <div className={styles.chatHeader}>
            <div className={styles.headerContent}>
              <div className={styles.botAvatar}>🧵</div>
              <div>
                <h3>Embroidex Assistant</h3>
              </div>
            </div>
            <button className={styles.closeButton} onClick={toggleChat}>
              <MdClose size={22} />
            </button>
          </div>

          {/* Messages Container */}
          <div className={styles.messagesArea}>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`${styles.message} ${msg.type === "user" ? styles.userMessage : styles.botMessage
                  }`}
              >
                <div className={styles.messageBubble}>
                  {msg.type === "bot" ? (
                    <div className={styles.markdown}>
                      <ReactMarkdown
                        components={{
                          a: ({ node, ...props }) => {
                            if (props.href && props.href.startsWith("/")) {
                              return (
                                <Link to={props.href}>
                                  {props.children}
                                </Link>
                              );
                            }
                            return (
                              <a {...props} target="_blank" rel="noopener noreferrer">
                                {props.children}
                              </a>
                            );
                          },
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className={`${styles.message} ${styles.botMessage}`}>
                <div className={styles.messageBubble}>
                  <div className={styles.typingIndicator}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className={styles.inputArea}>
            <input
              type="text"
              placeholder="Ask about buying, selling, fees..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              className={styles.messageInput}
              disabled={isTyping}
            />
            <button
              onClick={sendMessage}
              className={styles.sendButton}
              disabled={!inputValue.trim() || isTyping}
            >
              <MdSend size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button className={styles.floatingButton} onClick={toggleChat}>
        <div className={styles.chatbotIcon}>
          {/* User can replace this with custom image */}
          <span className={styles.iconEmoji}>
            <img src="/chatlogonew.png" alt="Embroidex Logo" className={styles.iconEmoji} />
          </span>
        </div>
      </button>
    </>
  );
};

export default ChatbotWidget;
