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
      <Heading marginBottom="l" variant="heading-strong-xl" marginLeft="24">
        {blog.title}
      </Heading>
      
      {/* Show latest posts from all categories */}
      <Column fillWidth flex={1} gap="40">
        <Posts range={[1, 2]} thumbnail />
        
        {/* Show posts organized by categories */}
        <Column fillWidth gap="40">
          <Heading as="h2" variant="heading-strong-xl" marginLeft="l">
            Explore by Interest
          </Heading>
          <Posts showCategories={true} thumbnail columns="2" />
        </Column>
        
        <Mailchimp marginBottom="l" />
      </Column>
    </Column>
  );
}