"use client";

import React, { useState } from "react";

const tags = [
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "React Native",
  "Vue.js",
  "Angular",
  "CSS",
  "HTML",
  "Python",
  "Java",
  "C++",
  "Ruby",
  "Go",
  "Django",
  "Flask",
  "Ruby on Rails",
  "Spring Boot",
  "Express.js",
  "Laravel",
  "ASP.NET",
  "FastAPI",
  "cypress",
  "selenium",
  "jest",
  "Testing",
  "playwright",
  "IT-Security",
  "GraphQL",
  "REST API",
  "MongoDB",
  "PostgreSQL",
  "MySQL",
  "SQLite",
  "Redis",
  "Docker",
  "Kubernetes",
  "AWS",
  "Azure",
  "Google Cloud",
  "Firebase",
  "Machine Learning",
  "Deep Learning",
  "Data Science",
  "AI",
  "LangChain",
  "Blockchain",
  "Cryptocurrency",
  "DevOps",
  "Next.js",
  "Gatsby",
  "Tailwind CSS",
  "Bootstrap",
  "Sass",
  "Framer-Motion",
  "jQuery",
  "PHP",
  "Swift",
  "Kotlin",
  "Objective-C",
  "Rust",
  "Scala",
  "vercel",
  "Netlify",
  "Heroku",
  "DigitalOcean",
  "Render",
  "Git",
  "GitHub",
  "GitLab",
  "Bitbucket",
  "CI/CD",
  "Jenkins",
  "cPanel",
  "WordPress",
  "Shopify",
  "Cloudflare",
  "Contentful",
  "Sanity",
  "Strapi",
  "Prisma",
  "GraphCMS",
  "Webflow",
  "Figma",
  "Adobe XD",
  "Google Ads",
];

const sortedTags = [...tags].sort((a, b) => a.localeCompare(b));

const TagSelector: React.FC<{ onSelectTag: (tag: string) => void }> = ({
  onSelectTag,
}) => {
  const [expanded, setExpanded] = useState(false);
  const visibleTags = expanded ? sortedTags : sortedTags.slice(0, 20);

  return (
    <div className="p-4 bg-white rounded-2xl shadow">
      <h2 className="text-lg font-bold mb-2">Select Tags</h2>
      <div className="flex flex-wrap">
        {visibleTags.map((tag) => (
          <button
            key={tag}
            className="m-1 px-3 py-1 bg-blue-500 text-white rounded-2xl hover:bg-blue-600"
            onClick={() => onSelectTag(tag)}
          >
            {tag}
          </button>
        ))}
        {sortedTags.length > 20 && (
          <button
            className="m-1 px-3 py-1 bg-gray-300 text-gray-800 rounded-2xl hover:bg-gray-400"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? "Show Less" : "Show All"}
          </button>
        )}
      </div>
    </div>
  );
};

export default TagSelector;
