import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default:
      "Dev-Bug-Coder-Blog - Developer Community for Coding Errors & Solutions",
    template: "%s | Dev-Bug-Coder-Blog",
  },
  description:
    "A full-stack developer blog platform where programmers share real-world coding errors, bugs, and their solutions. Document issues, learn from others, and build a collaborative coding community. Features authentication, code snippets, comments, likes, and more.",
  keywords: [
    "developer blog",
    "coding errors",
    "programming bugs",
    "bug fixes",
    "code solutions",
    "developer community",
    "coding tutorials",
    "software debugging",
    "programming errors",
    "tech blog",
    "code snippets",
    "error handling",
    "full stack development",
    "React",
    "Next.js",
    "TypeScript",
    "MongoDB",
    "Prisma",
    "developer resources",
    "programming help",
    "bug tracking",
    "code review",
    "software development",
    "web development",
    "coding best practices",
  ],
  authors: [
    {
      name: "Arnob Mahmud",
      url: "https://arnob-mahmud.vercel.app/",
    },
  ],
  creator: "Arnob Mahmud",
  publisher: "Arnob Mahmud",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://dev-bug-coder-blog.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://dev-bug-coder-blog.vercel.app",
    title:
      "Dev-Bug-Coder-Blog - Developer Community for Coding Errors & Solutions",
    description:
      "A full-stack developer blog platform where programmers share real-world coding errors, bugs, and their solutions. Join our collaborative coding community.",
    siteName: "Dev-Bug-Coder-Blog",
    images: [
      {
        url: "/assets/logo-bg.png",
        width: 1200,
        height: 630,
        alt: "Dev-Bug-Coder-Blog - Developer Community Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Dev-Bug-Coder-Blog - Developer Community for Coding Errors & Solutions",
    description:
      "Share and learn from real-world coding errors and solutions. Join our developer community.",
    images: ["/assets/logo-bg.png"],
    creator: "@arnob_mahmud",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/assets/logo.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/assets/logo.png",
  },
  manifest: "/manifest.json",
  category: "Technology",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Dev-Bug-Coder-Blog",
    alternateName: "DevBugBlog",
    url: "https://dev-bug-coder-blog.vercel.app",
    description:
      "A full-stack developer blog platform where programmers share real-world coding errors, bugs, and their solutions.",
    author: {
      "@type": "Person",
      name: "Arnob Mahmud",
      url: "https://arnob-mahmud.vercel.app/",
    },
    publisher: {
      "@type": "Person",
      name: "Arnob Mahmud",
      url: "https://arnob-mahmud.vercel.app/",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate:
          "https://dev-bug-coder-blog.vercel.app/posts?search={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
    mainEntity: {
      "@type": "Blog",
      name: "Dev-Bug-Coder-Blog",
      description:
        "Developer community blog for sharing coding errors and solutions",
      blogPost: {
        "@type": "BlogPosting",
        headline: "Coding errors, bugs, and solutions",
        author: {
          "@type": "Person",
          name: "Arnob Mahmud",
        },
      },
    },
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning className="flex flex-col min-h-screen">
        <QueryProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
