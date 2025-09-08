import { About, Blog, Gallery, Home, Newsletter, Person, Social, Work } from "@/types";
import { Line, Logo, Row, Text } from "@once-ui-system/core";

const person: Person = {
  firstName: "Atharva",
  lastName: "Kanherkar",
  name: `Atharva Kanherkar`,
  role: "Software Engineer",
  avatar: "/images/avatar.png",
  email: "atharvakanherkar25@gmail.com",
  location: "Asia/Kolkata", // Expecting the IANA time zone identifier, e.g., 'Europe/Vienna'
  languages: ["English"], // optional: Leave the array empty if you don't want to display languages
};

 const newsletter: Newsletter = {
  display: false, // Set to false if you don't want newsletter signup
  title: <>Subscribe to {person.firstName}'s Newsletter</>,
  description: <>Updates on backend engineering, open source contributions, and system architecture insights</>, // Updated description
};

const social: Social = [
  // Links are automatically displayed.
  // Import new icons in /once-ui/icons.ts
  {
    name: "GitHub",
    icon: "github",
    link: "https://github.com/Atharva-Kanherkar",
  },
  {
    name: "LinkedIn",
    icon: "linkedin",
    link: "https://www.linkedin.com/in/atharva-kanherkar-4370a3257/",
  },

  {
    name: "Email",
    icon: "email",
    link: `mailto:${person.email}`,
  },
];

 // ...existing code...
const home: Home = {
  path: "/",
  image: "/images/og/home.jpg",
  label: "Home",
  title: `${person.name}'s Portfolio`,
  description: `Portfolio website showcasing my work as a ${person.role}`,
  headline: <>Building scalable backends and distributed systems</>, // Updated to match your focus
  featured: {
    display: false, // Remove this template project feature
    title: (
      <Row gap="12" vertical="center">
        <strong className="ml-4">Once UI</strong>{" "}
        <Line background="brand-alpha-strong" vert height="20" />
        <Text marginRight="4" onBackground="brand-medium">
          Featured work
        </Text>
      </Row>
    ),
    href: "/work/building-once-ui-a-customizable-design-system", // This is template content
  },
  subline: (
    <>
      I'm Atharva, a backend engineer passionate about building scalable systems, 
      contributing to open source, and exploring distributed architectures.
    </>
  ),
};
 

const about: About = {
  path: "/about",
  label: "About",
  title: `About – ${person.name}`,
  description: `Meet ${person.name}, ${person.role} from ${person.location}`,
  tableOfContent: {
    display: true,
    subItems: false,
  },
  avatar: {
    display: true,
  },
  calendar: {
    display: false,
    link: "https://cal.com",
  },
  intro: {
    display: true,
    title: "Introduction",
    description: (
      <>
      I am a backend-focused fullstack developer with a strong foundation in open source and DevOps. I’ve contributed to projects through GSoC (Workflows4s), the Linux Foundation’s LFX Mentorship, and Typelevel, while also working on distributed, data-driven systems at Rimo in Tokyo. Skilled in Go, TypeScript, Scala, C++ and cloud-native technologies, I thrive on building scalable backends, developer-first tools, and production-ready SaaS products.
       </>
    ),
  },
  work: {
  display: true,
  title: "Work Experience",
  description: `Engineering projects and open source contributions by ${person.name}`, 
  experiences: [
    {
      company: "Rimo LLC, Tokyo",
      timeframe: "May 2025 – Jul 2025",
      role: "Software Engineering Intern (Workflows Team)",
      achievements: [
        <>
          Implemented crucial backend components including Node.js version upgrades, 
          workflow-wide consistency validation, and Temporal engine separation.
        </>,
        <>
          Improved developer experience and workflow data management visualization 
          by handling foundational upgrades and system-wide management.
        </>,
      ],
      images: [],
    },
    {
      company: "Linux Foundation – Open Mainframe Project (Zowe)",
      timeframe: "Jan 2025 – Apr 2025",
      role: "LFX Mentorship Program Developer",
      achievements: [
        <>
          Contributed to Zowe by improving documentation, refactoring 
          core logic, and fixing keyring-related errors.
        </>,
        <>
          Designed solutions that improved onboarding experience and 
          developer productivity for Zowe contributors.
        </>,
      ],
      images: [],
    },
    {
      company: "The Palisadoes Foundation",
      timeframe: "2024 – Present",
      role: "Open Source Maintainer",
      achievements: [
        <>
          Maintainer for multiple repositories under the Palisadoes Foundation, 
          reviewing pull requests, guiding contributors, and improving code quality.
        </>,
        <>
          Ensured long-term sustainability of open source projects 
          through active mentorship and documentation improvements.
        </>,
      ],
      images: [],
    },
    {
      company: "Google Summer of Code – Workflows4s",
      timeframe: "May 2025 – Aug 2025",
      role: "Open Source Developer",
      achievements: [
        <>
          Developing a web UI for inspecting workflow details in Workflows4s 
          using Scala.js, Tapir, and Scala HTTP server technologies.
        </>,
        <>
          Implementing features such as state inspection, timeline visualization, 
          and real-time workflow updates.
        </>,
      ],
      images: [],
    },
    {
      company: "Typelevel",
      timeframe: "2025 – Present",
      role: "Open Source Contributor",
      achievements: [
        <>
          Contributed to Cats Effect and other Typelevel projects, 
          improving functional programming libraries in Scala.
        </>,
        <>
          Actively engaged with the community to resolve issues 
          and propose performance-oriented solutions.
        </>,
      ],
      images: [],
    },
  ],
},

  studies: {
  display: true, 
  title: "Studies",
  institutions: [
    {
      name: "Indian Institute of Information Technology, Design & Manufacturing, Jabalpur",
      description: <>Pursuing B.Tech in Computer Science & Engineering (2022 – Present).</>,
    },
    {
      name: "Self-Directed Learning & Open Source",
      description: <>Contributions and mentorships through Google Summer of Code, Linux Foundation LFX, and Typelevel — gaining expertise in backend systems, functional programming, and DevOps.</>,
    },
  ],
},

technical: {
  display: true, 
  title: "Technical Skills",
  skills: [
    {
      title: "Backend Development",
      description: (
        <>Experienced in building scalable distributed systems, RESTful APIs, and microservices with Go, Node.js, and Scala.</>
      ),
      tags: [
        { name: "Go", icon: "go" },
        { name: "Node.js", icon: "nodejs" },
        { name: "Scala", icon: "scala" },
        { name: "Express", icon: "express" },
      ],
      images: [],
    },
    {
      title: "Frontend & Fullstack",
      description: (
        <>Proficient in building production-ready applications with TypeScript, Next.js, and React, integrated with modern backends.</>
      ),
      tags: [
        { name: "TypeScript", icon: "typescript" },
        { name: "Next.js", icon: "nextjs" },
        { name: "React", icon: "react" },
      ],
      images: [],
    },
    {
      title: "DevOps & Cloud",
      description: (
        <>Hands-on with Docker, Kubernetes, CI/CD, and cloud deployments (AWS, GCP). Skilled in containerized workflows and monitoring with Prometheus & Grafana.</>
      ),
      tags: [
        { name: "Docker", icon: "docker" },
        { name: "Kubernetes", icon: "kubernetes" },
        { name: "AWS", icon: "aws" },
        { name: "GCP", icon: "gcp" },
      ],
      images: [],
    },
    {
      title: "Databases & Systems",
      description: (
        <>Experienced with relational and non-relational databases (PostgreSQL, MongoDB, Redis) and exploring database internals in Scala.</>
      ),
      tags: [
        { name: "PostgreSQL", icon: "postgresql" },
        { name: "MongoDB", icon: "mongodb" },
        { name: "Redis", icon: "redis" },
      ],
      images: [],
    },
  ],
},

};

const blog: Blog = {
  path: "/blog",
  label: "Blog",
  title: "Crafting scalable backends and tinkering with distributed systems...",
  description: `Read what ${person.name} has been up to recently`,
  // Create new blog posts by adding a new .mdx file to app/blog/posts
  // All posts will be listed on the /blog route
};

const work: Work = {
  path: "/work",
  label: "Work",
  title: `Projects – ${person.name}`,
  description: `Design and dev projects by ${person.name}`,
  // Create new project pages by adding a new .mdx file to app/blog/posts
  // All projects will be listed on the /home and /work routes
};

const gallery: Gallery = {
  path: "/gallery",
  label: "Gallery",
  title: `Photo gallery – ${person.name}`,
  description: `A photo collection by ${person.name}`,
  // Images by https://lorant.one
  // These are placeholder images, replace with your own
  images: [
    {
      src: "/images/gallery/horizontal-1.jpg",
      alt: "image",
      orientation: "horizontal",
    },
    {
      src: "/images/gallery/vertical-4.jpg",
      alt: "image",
      orientation: "vertical",
    },
    {
      src: "/images/gallery/horizontal-3.jpg",
      alt: "image",
      orientation: "horizontal",
    },
    {
      src: "/images/gallery/vertical-1.jpg",
      alt: "image",
      orientation: "vertical",
    },
    {
      src: "/images/gallery/vertical-2.jpg",
      alt: "image",
      orientation: "vertical",
    },
    {
      src: "/images/gallery/horizontal-2.jpg",
      alt: "image",
      orientation: "horizontal",
    },
    {
      src: "/images/gallery/horizontal-4.jpg",
      alt: "image",
      orientation: "horizontal",
    },
    {
      src: "/images/gallery/vertical-3.jpg",
      alt: "image",
      orientation: "vertical",
    },
  ],
};

export { person, social, newsletter, home, about, blog, work, gallery };
