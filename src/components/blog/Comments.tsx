"use client";

import { useState, useEffect } from "react";
import { Column, Row, Text, Heading, Button, Input, Badge } from "@once-ui-system/core";
import { formatDate } from "@/utils/formatDate";

interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  sentiment: number;
}

interface CommentsProps {
  postSlug: string;
}

export function Comments({ postSlug }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchComments();
  }, [postSlug]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/comments?postSlug=${postSlug}`);
      const data = await response.json();
      if (response.ok) {
        setComments(data.comments);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postSlug, author, content }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: data.message || "Comment posted successfully!" });
        setAuthor("");
        setContent("");
        fetchComments();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to post comment" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to post comment. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Column fillWidth gap="l" marginTop="xl">
      <Heading as="h2" variant="heading-strong-l">
        Comments ({comments.length})
      </Heading>

      {/* Comment Form */}
      <Column
        as="form"
        onSubmit={handleSubmit}
        fillWidth
        gap="m"
        padding="l"
        border="neutral-alpha-weak"
        radius="l"
        background="surface"
      >
        <Heading as="h3" variant="heading-default-m">
          Leave a comment
        </Heading>

        <Input
          id="author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          required
          maxLength={100}
          placeholder="Enter your name"
        />

        <Column fillWidth gap="4">
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            maxLength={2000}
            rows={4}
            placeholder="Share your thoughts..."
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid var(--neutral-alpha-weak)",
              backgroundColor: "var(--neutral-alpha-weak)",
              color: "var(--neutral-on-background-strong)",
              fontFamily: "inherit",
              fontSize: "14px",
              resize: "vertical",
            }}
          />
          <Text variant="body-default-xs" onBackground="neutral-weak">
            {content.length}/2000 characters
          </Text>
        </Column>

        {message && (
          <Text
            variant="body-default-s"
            onBackground={message.type === "success" ? "success-medium" : "danger-medium"}
          >
            {message.text}
          </Text>
        )}

        <Row>
          <Button type="submit" variant="primary" disabled={submitting || !author || !content}>
            {submitting ? "Posting..." : "Post Comment"}
          </Button>
        </Row>
      </Column>

      {/* Comments List */}
      <Column fillWidth gap="m">
        {loading ? (
          <Text onBackground="neutral-weak">Loading comments...</Text>
        ) : comments.length === 0 ? (
          <Text onBackground="neutral-weak">No comments yet. Be the first to comment!</Text>
        ) : (
          comments.map((comment) => (
            <Column
              key={comment.id}
              fillWidth
              gap="8"
              padding="l"
              border="neutral-alpha-weak"
              radius="m"
              background="surface"
            >
              <Row fillWidth horizontal="between" vertical="center">
                <Text variant="label-strong-m">{comment.author}</Text>
                <Text variant="body-default-xs" onBackground="neutral-weak">
                  {formatDate(comment.createdAt, false)}
                </Text>
              </Row>
              <Text variant="body-default-m" style={{ whiteSpace: "pre-wrap" }}>
                {comment.content}
              </Text>
            </Column>
          ))
        )}
      </Column>
    </Column>
  );
}
