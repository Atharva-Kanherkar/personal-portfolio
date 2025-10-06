 import { Column, Heading, Meta, Schema, Row, Badge } from "@once-ui-system/core";
import { Mailchimp } from "@/components";
import { Posts } from "@/components/blog/Posts";
import { baseURL, blog, person, newsletter } from "@/resources";

export async function generateMetadata() {
  return Meta.generate({
    title: blog.title,
    description: blog.description,
    baseURL: baseURL,
    image: `/api/og/generate?title=${encodeURIComponent(blog.title)}`,
    path: blog.path,
  });
}

export default function Blog() {
  return (
    <Column maxWidth="m" paddingTop="24">
      <Schema
        as="blogPosting"
        baseURL={baseURL}
        title={blog.title}
        description={blog.description}
        path={blog.path}
        image={`/api/og/generate?title=${encodeURIComponent(blog.title)}`}
        author={{
          name: person.name,
          url: `${baseURL}/blog`,
          image: `${baseURL}${person.avatar}`,
        }}
      />
      <Column fillWidth gap="8" marginBottom="xl" paddingX="l">
        <Heading variant="heading-strong-xl">
          {blog.title}
        </Heading>
        <Heading as="p" variant="body-default-l" onBackground="neutral-weak" wrap="balance">
          {blog.description}
        </Heading>
      </Column>

      <Column fillWidth flex={1} gap="xl">
        {/* Show posts organized by categories */}
        <Posts showCategories={true} thumbnail columns="2" />

        <Mailchimp marginBottom="l" />
      </Column>
    </Column>
  );
}