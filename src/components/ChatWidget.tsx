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
      style={{
        backdropFilter: "blur(24px)",
        borderWidth: "1px",
        borderStyle: "solid",
        background: "var(--neutral-alpha-weak)",
      }}
    >
      <Row gap="16" vertical="center" horizontal="between">
        <Column gap="8">
          <Heading variant="heading-strong-l">Chat with Atharva</Heading>
          <Text variant="body-default-s" onBackground="neutral-weak">
            Ask me anything about my projects, tech stack, or interests
          </Text>
        </Column>
      </Row>

      {/* Preview of welcome message */}
      <Column gap="8">
        <Text variant="label-default-xs" onBackground="neutral-weak">
          Atharva
        </Text>
        <Text variant="body-default-s" onBackground="neutral-medium">
          Hey! I'm Atharva (well, a mini version of me). Ask me anything about my
          projects, tech stack, experiences in open source, or even my thoughts on
          literature, philosophy, or hip hop...
        </Text>
      </Column>

      {/* Suggestion chips preview */}
      <Column gap="8">
        <Text variant="label-default-xs" onBackground="neutral-weak">
          Try asking:
        </Text>
        <Row gap="8" wrap fillWidth>
          <div
            style={{
              padding: "8px 12px",
              borderRadius: "var(--radius-m)",
              background: "var(--neutral-alpha-weak)",
              border: "1px solid var(--neutral-alpha-medium)",
              fontSize: "var(--font-size-xs)",
              color: "var(--neutral-on-background-weak)",
            }}
          >
            Tell me about RedLead
          </div>
          <div
            style={{
              padding: "8px 12px",
              borderRadius: "var(--radius-m)",
              background: "var(--neutral-alpha-weak)",
              border: "1px solid var(--neutral-alpha-medium)",
              fontSize: "var(--font-size-xs)",
              color: "var(--neutral-on-background-weak)",
            }}
          >
            Your open source work
          </div>
          <div
            style={{
              padding: "8px 12px",
              borderRadius: "var(--radius-m)",
              background: "var(--neutral-alpha-weak)",
              border: "1px solid var(--neutral-alpha-medium)",
              fontSize: "var(--font-size-xs)",
              color: "var(--neutral-on-background-weak)",
            }}
          >
            Thoughts on AI coding
          </div>
        </Row>
      </Column>

      <Link href="/chat" style={{ textDecoration: "none" }}>
        <Button fillWidth size="l" variant="primary" prefixIcon="messageCircle">
          Start chatting
        </Button>
      </Link>

      <Text variant="label-default-xs" onBackground="neutral-weak" align="center">
        Powered by Perplexity AI & Gemini • Streaming responses
      </Text>
    </Column>
  );
};
