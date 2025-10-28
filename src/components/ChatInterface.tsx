"use client";

import { useState, useRef, useEffect } from "react";
import {
  Column,
  Row,
  Heading,
  Text,
  Button,
  IconButton,
  Flex,
} from "@once-ui-system/core";
import styles from "./ChatInterface.module.scss";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  provider?: "perplexity" | "gemini";
}

export const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hey there! I'm Atharva (well, a mini version of me 😄). Ask me anything about my projects, tech stack, experiences in open source, or even my thoughts on literature, philosophy, or hip hop. What's on your mind?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

    try {
      // Build conversation history (excluding welcome message)
      const conversationHistory = messages
        .filter((msg) => msg.id !== "welcome")
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(data.timestamp),
        provider: data.provider,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Sorry, I'm having trouble responding right now. Try again in a moment!",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
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

  const handleClear = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hey there! I'm Atharva (well, a mini version of me 😄). Ask me anything about my projects, tech stack, experiences in open source, or even my thoughts on literature, philosophy, or hip hop. What's on your mind?",
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <Column fillWidth className={styles.container}>
      <Row
        fillWidth
        horizontal="between"
        vertical="center"
        className={styles.header}
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ cursor: "pointer" }}
      >
        <Row gap="12" vertical="center">
          <div className={styles.avatar}>A</div>
          <Column gap="4">
            <Heading variant="heading-strong-s">Chat with Atharva</Heading>
            <Text variant="body-default-xs" onBackground="neutral-weak">
              Ask me about my work, tech, or interests
            </Text>
          </Column>
        </Row>
        <Row gap="8">
          {messages.length > 1 && (
            <IconButton
              icon="refresh"
              size="m"
              variant="ghost"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                handleClear();
              }}
              tooltip="Clear chat"
            />
          )}
          <IconButton
            icon={isExpanded ? "chevronDown" : "chevronUp"}
            size="m"
            variant="ghost"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          />
        </Row>
      </Row>

      {isExpanded && (
        <>
          <Column fillWidth className={styles.messagesContainer}>
            {messages.map((message) => (
              <Row
                key={message.id}
                fillWidth
                horizontal={message.role === "user" ? "end" : "start"}
                className={styles.messageRow}
              >
                <Column gap="4" fillWidth={false}>
                  <div
                    className={`${styles.message} ${
                      message.role === "user"
                        ? styles.userMessage
                        : styles.assistantMessage
                    }`}
                  >
                    <Text
                      variant="body-default-s"
                      onBackground={
                        message.role === "user" ? "brand-weak" : "neutral-weak"
                      }
                    >
                      {message.content}
                    </Text>
                  </div>
                  {message.provider && (
                    <Text
                      variant="label-default-xs"
                      onBackground="neutral-weak"
                      className={styles.providerBadge}
                    >
                      {message.provider === "perplexity" ? "🟣 Perplexity" : "✨ Gemini"}
                    </Text>
                  )}
                </Column>
              </Row>
            ))}
            {isLoading && (
              <Row fillWidth horizontal="start" className={styles.messageRow}>
                <div className={`${styles.message} ${styles.assistantMessage}`}>
                  <div className={styles.loadingDots}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </Row>
            )}
            <div ref={messagesEndRef} />
          </Column>

          <Row fillWidth gap="8" className={styles.inputContainer}>
            <Flex fillWidth className={styles.inputWrapper}>
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                className={styles.input}
                rows={1}
                disabled={isLoading}
              />
            </Flex>
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              size="m"
              variant="primary"
              prefixIcon="send"
            >
              Send
            </Button>
          </Row>
        </>
      )}
    </Column>
  );
};
