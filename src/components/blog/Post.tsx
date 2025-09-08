 "use client";

import { Card, Column, Media, Row, Avatar, Text } from "@once-ui-system/core";
import { formatDate } from "@/utils/formatDate";
import { person } from "@/resources";
import { useState } from "react";

interface PostProps {
  post: any;
  thumbnail: boolean;
  direction?: "row" | "column";
}

export default function Post({ post, thumbnail, direction }: PostProps) {
  const [imageError, setImageError] = useState(false);
  
  // Get the first image from the images array, or fall back to the single image property
  const postImage = post.metadata.images?.[0]?.src || post.metadata.image;
  
  // Use avatar as fallback if no image exists or if image fails to load
  const displayImage = imageError || !postImage ? person.avatar : postImage;

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <Card
      fillWidth
      key={post.slug}
      href={`/blog/${post.slug}`}
      transition="micro-medium"
      direction={direction}
      border="transparent"
      background="transparent"
      padding="4"
      radius="l-4"
      gap={direction === "column" ? undefined : "24"}
      s={{ direction: "column" }}
    >
      {thumbnail && (
        <Media
          priority
          sizes="(max-width: 768px) 100vw, 640px"
          border="neutral-alpha-weak"
          cursor="interactive"
          radius="l"
          src={displayImage}
          alt={
            imageError || !postImage 
              ? `${person.name}'s avatar` 
              : (post.metadata.images?.[0]?.alt || "Thumbnail of " + post.metadata.title)
          }
          aspectRatio="16 / 9"
          onError={handleImageError}
          style={{
            objectFit: imageError || !postImage ? "cover" : "cover"
          }}
        />
      )}
      <Row fillWidth>
        <Column maxWidth={28} paddingY="24" paddingX="l" gap="20" vertical="center">
          <Row gap="24" vertical="center">
            <Row vertical="center" gap="16">
              <Avatar src={person.avatar} size="s" />
              <Text variant="label-default-s">{person.name}</Text>
            </Row>
            <Text variant="body-default-xs" onBackground="neutral-weak">
              {formatDate(post.metadata.publishedAt || post.metadata.date, false)}
              {/* Add category display */}
              {post.metadata.category && (
                <>
                  <span style={{ margin: "0 8px" }}>•</span>
                  <span style={{ textTransform: "capitalize" }}>
                    {post.metadata.category}
                  </span>
                </>
              )}
            </Text>
          </Row>
          <Text variant="heading-strong-l" wrap="balance">
            {post.metadata.title}
          </Text>
          {/* Show summary if available, otherwise fall back to tag */}
          {post.metadata.summary ? (
            <Text variant="body-default-s" onBackground="neutral-medium" wrap="balance">
              {post.metadata.summary}
            </Text>
          ) : post.metadata.tag && (
            <Text variant="label-strong-s" onBackground="neutral-weak">
              {post.metadata.tag}
            </Text>
          )}
        </Column>
      </Row>
    </Card>
  );
}