 import { getPosts } from "@/utils/utils";
import { Grid, Column, Row, Heading, Badge } from "@once-ui-system/core";
import Post from "./Post";

interface PostsProps {
  range?: [number] | [number, number];
  columns?: "1" | "2" | "3";
  thumbnail?: boolean;
  direction?: "row" | "column";
  exclude?: string[];
  category?: string;
  showCategories?: boolean; // Add this missing prop
}

export function Posts({
  range,
  columns = "1",
  thumbnail = false,
  exclude = [],
  direction,
  category,
  showCategories = false, // Add this with default value
}: PostsProps) {
  let allBlogs = getPosts(["src", "app", "blog", "posts"]);

  // Exclude by slug (exact match)
  if (exclude.length) {
    allBlogs = allBlogs.filter((post) => !exclude.includes(post.slug));
  }

  // Filter by category if specified
  if (category) {
    allBlogs = allBlogs.filter((post) => 
      post.metadata.category === category
    );
  }

  const sortedBlogs = allBlogs.sort((a, b) => {
    return new Date(b.metadata.publishedAt).getTime() - new Date(a.metadata.publishedAt).getTime();
  });

  const displayedBlogs = range
    ? sortedBlogs.slice(range[0] - 1, range.length === 2 ? range[1] : sortedBlogs.length)
    : sortedBlogs;

  // If showCategories is true but no posts have categories, show all posts normally
  if (showCategories) {
    const categories = [
      { name: "Technology", slug: "tech" },
      { name: "Literature", slug: "literature" },
      { name: "Philosophy", slug: "philosophy" },
      { name: "Hip Hop", slug: "hiphop" }
    ];

    // Check if any posts have categories
    const postsWithCategories = displayedBlogs.filter(post => post.metadata.category);
    
    // If no posts have categories, fall back to normal display
    if (postsWithCategories.length === 0) {
      return (
        <Column fillWidth gap="l">
          <Row fillWidth horizontal="between" vertical="center">
            <Heading as="h3" variant="heading-strong-l">
              All Posts
            </Heading>
            <Badge>
              {displayedBlogs.length} {displayedBlogs.length === 1 ? 'post' : 'posts'}
            </Badge>
          </Row>
          <Grid columns={columns} s={{ columns: 1 }} fillWidth gap="16">
            {displayedBlogs.map((post) => (
              <Post
                key={post.slug}
                post={post}
                thumbnail={thumbnail}
                direction={direction}
              />
            ))}
          </Grid>
        </Column>
      );
    }

    // Show categorized posts
    return (
      <Column fillWidth gap="xl">
        {categories.map((cat) => {
          const categoryPosts = displayedBlogs.filter(
            (post) => post.metadata.category === cat.slug
          );

          if (categoryPosts.length === 0) return null;

          return (
            <Column key={cat.slug} fillWidth gap="l">
              <Row fillWidth horizontal="between" vertical="center">
                <Heading as="h3" variant="heading-strong-l">
                  {cat.name}
                </Heading>
                <Badge>
                  {categoryPosts.length} {categoryPosts.length === 1 ? 'post' : 'posts'}
                </Badge>
              </Row>
              <Grid columns={columns} s={{ columns: 1 }} fillWidth gap="16">
                {categoryPosts.map((post) => (
                  <Post
                    key={post.slug}
                    post={post}
                    thumbnail={thumbnail}
                    direction={direction}
                  />
                ))}
              </Grid>
            </Column>
          );
        })}
      </Column>
    );
  }

  return (
    <>
      {displayedBlogs.length > 0 && (
        <Grid columns={columns} s={{ columns: 1 }} fillWidth marginBottom="40" gap="16">
          {displayedBlogs.map((post) => (
            <Post
              key={post.slug}
              post={post}
              thumbnail={thumbnail}
              direction={direction}
            />
          ))}
        </Grid>
      )}
    </>
  );
}