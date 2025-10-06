import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { notFound } from "next/navigation";

export type Team = {
  name: string;
  role: string;
  avatar: string;
  linkedIn: string;
};

export type ImageMetadata = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
};

export type Metadata = {
  category: string;
  title: string;
  publishedAt: string;
  summary: string;
  image?: string;
  images?: ImageMetadata[];
  tag?: string;
  team: Team[];
  link?: string;
};

export type Post = {
  metadata: Metadata;
  slug: string;
  content: string;
};

function getMDXFiles(dir: string) {
  if (!fs.existsSync(dir)) {
    notFound();
  }

  return fs.readdirSync(dir).filter((file) => path.extname(file) === ".mdx");
}

function readMDXFile(filePath: string): { metadata: Metadata; content: string } {
  if (!fs.existsSync(filePath)) {
    notFound();
  }

  const rawContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(rawContent);

  const metadata: Metadata = {
    category: data.category || "",
    title: data.title || "",
    publishedAt: data.publishedAt,
    summary: data.summary || "",
    image: data.image,
    images: data.images as ImageMetadata[] | undefined,
    tag: data.tag,
    team: data.team || [],
    link: data.link,
  };

  return { metadata, content };
}

function getMDXData(dir: string): Post[] {
  const mdxFiles = getMDXFiles(dir);
  return mdxFiles.map((file) => {
    const { metadata, content } = readMDXFile(path.join(dir, file));
    const slug = path.basename(file, path.extname(file));

    return {
      metadata,
      slug,
      content,
    };
  });
}

export function getPosts(customPath = ["", "", "", ""]): Post[] {
  const postsDir = path.join(process.cwd(), ...customPath);
  return getMDXData(postsDir);
}
