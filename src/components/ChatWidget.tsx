"use client";

import { Column, Row, Heading, Text, Button } from "@once-ui-system/core";
import Link from "next/link";

export const ChatWidget = () => {
  return (
    <Column
      fillWidth
      gap="l"
      padding="24"
      radius="l"
      border="neutral-alpha-weak"
      background="neutral-alpha-weak"
      style={{
        backdropFilter: "blur(24px)",
        borderWidth: "1px",
        borderStyle: "solid",
      }}
    >
      <Row gap="16" vertical="center">
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #8B5CF6 0%, #3B82F6 50%, #06B6D4 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "20px",
            fontWeight: "600",
            boxShadow: "0 8px 16px rgba(139, 92, 246, 0.3)",
          }}
        >
          A
        </div>
        <Column gap="4">
          <Heading variant="heading-strong-m">Chat with Atharva</Heading>
          <Text variant="body-default-s" onBackground="neutral-weak">
            Ask me about my projects, tech stack, or interests
          </Text>
        </Column>
      </Row>

      <Column
        gap="12"
        padding="16"
        radius="m"
        style={{
          background: "var(--page-background)",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: "var(--neutral-alpha-weak)",
        }}
      >
        <Row gap="8" vertical="start">
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #8B5CF6 0%, #3B82F6 50%, #06B6D4 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "12px",
              fontWeight: "600",
              flexShrink: 0,
            }}
          >
            A
          </div>
          <Text variant="body-default-s" onBackground="neutral-weak">
            Hey! I'm Atharva (well, a mini version of me). Ask me anything about my projects, tech stack, open source work, or even my thoughts on literature and hip hop!
          </Text>
        </Row>
      </Column>

      <Row gap="12" fillWidth>
        <Link href="/chat" style={{ flex: 1, textDecoration: "none" }}>
          <Button
            fillWidth
            size="l"
            variant="primary"
            prefixIcon="messageCircle"
          >
            Start chatting
          </Button>
        </Link>
      </Row>

      <Text
        variant="label-default-xs"
        onBackground="neutral-weak"
        align="center"
      >
        Powered by Perplexity AI & Gemini
      </Text>
    </Column>
  );
};
