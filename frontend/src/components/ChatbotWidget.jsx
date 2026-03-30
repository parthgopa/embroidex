import { useState, useEffect, useRef } from "react";
import { MdClose, MdSend } from "react-icons/md";
import ReactMarkdown from "react-markdown";
import styles from "./ChatbotWidget.module.css";

const WEBHOOK_URL = "https://n8n.merishiksha.com/webhook/76a9b7f7-c5ab-43dc-a5ef-81c9b6ba18d5/chat";
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
    if (!inputValue.trim() || !sessionId) return;

    const userMessage = {
      type: "user",
      text: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatInput: inputValue,
          sessionId: sessionId,
        }),
      });

      const data = await response.json();
      
      const botMessage = {
        type: "bot",
        text: data.output || "Sorry, I couldn't process that. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chatbot error:", error);
      const errorMessage = {
        type: "bot",
        text: "Sorry, I'm having trouble connecting. Please try again later.",
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
              <div className={styles.headerText}>
                <h4>Embroidex Assistant</h4>
                <span className={styles.statusOnline}>Online</span>
              </div>
            </div>
            <button className={styles.closeButton} onClick={toggleChat}>
              <MdClose size={24} />
            </button>
          </div>

          {/* Messages Area */}
          <div className={styles.messagesArea}>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`${styles.message} ${
                  message.type === "user" ? styles.userMessage : styles.botMessage
                }`}
              >
                <div className={styles.messageBubble}>
                  {message.type === "user" ? (
                    <p>{message.text}</p>
                  ) : (
                    <div className={styles.markdown}>
                      <ReactMarkdown>
                        {message.text}
                      </ReactMarkdown>
                    </div>
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
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              className={styles.messageInput}
            />
            <button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isTyping}
              className={styles.sendButton}
            >
              <MdSend size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button className={styles.floatingButton} onClick={toggleChat}>
        {isOpen ? (
          <MdClose size={28} />
        ) : (
          <div className={styles.chatbotIcon}>
            {/* User can replace this with custom image */}
            <span className={styles.iconEmoji}>
              <img src="/chatlogonew.png" alt="Embroidex Logo" className={styles.iconEmoji}/>
            </span>
          </div>
        )}
      </button>
    </>
  );
};

export default ChatbotWidget;
