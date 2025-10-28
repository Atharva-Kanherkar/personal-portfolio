"use client";

import { useState, useRef, useEffect } from "react";
import { Button, Text } from "@once-ui-system/core";
import Link from "next/link";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

type ModelType = "perplexity" | "gemini";

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hey! I'm Atharva (well, a mini version of me). Ask me anything about my projects, tech stack, experiences in open source, or even my thoughts on literature, philosophy, or hip hop. What's on your mind?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelType>("perplexity");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    const assistantMessageId = (Date.now() + 1).toString();
    const streamingMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, streamingMessage]);

    try {
      const conversationHistory = messages
        .filter((msg) => msg.id !== "welcome")
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No reader available");
      }

      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "token") {
                accumulatedContent += data.content;

                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: accumulatedContent }
                      : msg
                  )
                );
              } else if (data.type === "error") {
                throw new Error(data.error);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content:
                  "Sorry, I'm having trouble responding right now. Try again in a moment!",
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    textareaRef.current?.focus();
  };

  const suggestions = [
    "Tell me about RedLead",
    "What's your approach to building scalable systems?",
    "Tell me about your open source work",
    "What do you think about AI coding assistants?",
  ];

  const showSuggestions = messages.length === 1; // Only show on welcome message

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          backdropFilter: "blur(24px)",
          borderBottom: "1px solid var(--neutral-alpha-weak)",
          padding: "16px 24px",
        }}
      >
        <div
          style={{
            maxWidth: "48rem",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link href="/" style={{ textDecoration: "none" }}>
            <Button variant="tertiary" size="m" prefixIcon="arrowLeft">
              Back
            </Button>
          </Link>

          <Text variant="heading-strong-s" onBackground="neutral-strong">
            Chat with Atharva
          </Text>

          {/* Model Selector */}
          <div style={{ position: "relative" }}>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as ModelType)}
              className="model-selector"
              style={{
                padding: "8px 32px 8px 12px",
                borderRadius: "var(--radius-m)",
                background: "var(--neutral-alpha-weak)",
                border: "1px solid var(--neutral-alpha-medium)",
                color: "var(--neutral-on-background-strong)",
                fontSize: "var(--font-size-xs)",
                fontFamily: "var(--font-body)",
                cursor: "pointer",
                outline: "none",
                appearance: "none",
              }}
            >
              <option value="perplexity">Perplexity Sonar</option>
              <option value="gemini">Gemini Flash</option>
            </select>
            <div
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                color: "var(--neutral-on-background-weak)",
              }}
            >
              ▼
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 16px",
        }}
      >
        <div
          style={{
            maxWidth: "48rem",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: "32px",
          }}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                width: "100%",
              }}
            >
              {/* Only show label if message has content OR it's a user message */}
              {(message.content || message.role === "user") && (
                <Text
                  variant="label-default-xs"
                  onBackground="neutral-weak"
                  style={{
                    textAlign: message.role === "user" ? "right" : "left",
                  }}
                >
                  {message.role === "user" ? "You" : "Atharva"}
                </Text>
              )}

              {/* Message Content */}
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    message.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                {message.role === "user" ? (
                  // User message with bubble
                  <div
                    style={{
                      maxWidth: "70%",
                      padding: "12px 16px",
                      borderRadius: "18px",
                      background: "var(--brand-background-strong)",
                    }}
                  >
                    <Text
                      variant="body-default-s"
                      onBackground="brand-weak"
                      style={{ whiteSpace: "pre-wrap" }}
                    >
                      {message.content}
                    </Text>
                  </div>
                ) : message.content ? (
                  // AI message with content - plain text, no bubble (ChatGPT style)
                  <div style={{ width: "100%" }}>
                    <Text
                      variant="body-default-s"
                      onBackground="neutral-medium"
                      style={{ whiteSpace: "pre-wrap" }}
                    >
                      {message.content}
                      {isLoading &&
                        message.id === messages[messages.length - 1]?.id && (
                          <span
                            style={{
                              display: "inline-block",
                              width: "2px",
                              height: "16px",
                              background: "var(--neutral-on-background-medium)",
                              marginLeft: "2px",
                              animation: "blink 1s infinite",
                            }}
                          />
                        )}
                    </Text>
                  </div>
                ) : (
                  // Loading dots when message is empty
                  <div style={{ display: "flex", gap: "4px" }}>
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "var(--neutral-on-background-weak)",
                        animation: "bounce 1.4s infinite ease-in-out",
                        animationDelay: "-0.32s",
                      }}
                    />
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "var(--neutral-on-background-weak)",
                        animation: "bounce 1.4s infinite ease-in-out",
                        animationDelay: "-0.16s",
                      }}
                    />
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "var(--neutral-on-background-weak)",
                        animation: "bounce 1.4s infinite ease-in-out",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Suggestions - Only show at start */}
          {showSuggestions && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "12px",
                marginTop: "16px",
              }}
            >
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "var(--radius-m)",
                    background: "var(--neutral-alpha-weak)",
                    border: "1px solid var(--neutral-alpha-medium)",
                    color: "var(--neutral-on-background-medium)",
                    fontSize: "var(--font-size-xs)",
                    fontFamily: "var(--font-body)",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--brand-alpha-medium)";
                    e.currentTarget.style.background = "var(--brand-alpha-weak)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--neutral-alpha-medium)";
                    e.currentTarget.style.background = "var(--neutral-alpha-weak)";
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div
        style={{
          position: "sticky",
          bottom: 0,
          backdropFilter: "blur(24px)",
          borderTop: "1px solid var(--neutral-alpha-weak)",
          padding: "16px",
        }}
      >
        <div
          style={{
            maxWidth: "48rem",
            margin: "0 auto",
            display: "flex",
            gap: "12px",
            alignItems: "flex-end",
          }}
        >
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Atharva..."
            disabled={isLoading}
            rows={1}
            style={{
              flex: 1,
              resize: "none",
              borderRadius: "24px",
              background: "var(--neutral-alpha-weak)",
              border: "1px solid var(--neutral-alpha-medium)",
              padding: "12px 16px",
              fontSize: "15px",
              color: "var(--neutral-on-background-strong)",
              fontFamily: "var(--font-body)",
              outline: "none",
              maxHeight: "200px",
              minHeight: "44px",
              transition: "border-color 0.2s ease",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "var(--brand-alpha-strong)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "var(--neutral-alpha-medium)";
            }}
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            size="l"
            variant="primary"
            prefixIcon="send"
          >
            Send
          </Button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes bounce {
          0%,
          80%,
          100% {
            transform: scale(0);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes blink {
          0%,
          50% {
            opacity: 1;
          }
          51%,
          100% {
            opacity: 0;
          }
        }

        /* Style the dropdown options */
        .model-selector option {
          background: var(--page-background);
          color: var(--neutral-on-background-strong);
          padding: 8px;
        }

        .model-selector:hover {
          border-color: var(--brand-alpha-medium);
        }

        .model-selector:focus {
          border-color: var(--brand-alpha-strong);
        }
      `}</style>
    </div>
  );
}
