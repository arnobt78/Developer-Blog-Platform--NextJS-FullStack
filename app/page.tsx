/**
 * Home Page - Landing page with hero section and sidebar
 * Uses React Query for data fetching with caching
 */
"use client";

import React from "react";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import { usePosts } from "@/hooks/use-posts";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  // Use React Query hook for cached data fetching
  const { data: posts = [], isLoading } = usePosts({});

  // Recent posts (last 5)
  const recentPosts = [...posts]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5)
    .map((post) => ({ id: post.id, title: post.title }));

  // Popular topics (top 5 tags by likes + helpfulCount)
  const tagStats: Record<string, number> = {};
  posts.forEach((post) => {
    post.tags.forEach((tag) => {
      tagStats[tag] = (tagStats[tag] || 0) + post.likes + post.helpfulCount;
    });
  });
  const popularTopics = Object.entries(tagStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);

  return (
    <div className="flex pt-32 max-w-9xl mx-auto px-2 sm:px-4 xl:px-8 pb-8 flex-col md:flex-row">
      <main className="w-3/4 p-4">
        <section className="hero">
          <h1 className="text-4xl font-extrabold font-amatic text-pretty text-center mt-2 mb-4">
            Dev-Bug-Coder-Blog for Developers: Where Fixing Bugs Becomes a
            Habit.
          </h1>

          <h3 className="text-xl font-indie font-extrabold text-pretty text-center mt-2 mb-4">
            Share. Collaborate. Learn. Grow Together.
          </h3>
        </section>

        <section className="photo-section mt-8 shadow-xl">
          <Image
            src="/assets/hero-1.png"
            alt="Hero"
            width={1200}
            height={300}
            className="w-full h-[300px] object-cover"
            priority
          />
        </section>

        <section className="blog-content m-16">
          <h2 className="text-2xl font-courier text-pretty text-center my-8">
            Got a bug? Found a fix? Share it with the dev world.
          </h2>
          <p className="font-courier text-pretty text-justify text-xl">
            Dev-Bug-Coder-Blog is your go-to hub for real-world coding issues
            and practical solutions. Whether you're facing a pesky bug,
            debugging your way through a framework, or just solved an issue and
            want to share it with fellow devs—this is the place to be. Join our
            developer community and explore a growing archive of daily errors,
            helpful snippets, and expert fixes contributed by coders just like
            you. Let's turn bugs into breakthroughs—one post at a time.
            <br />
            <br />
            Whether you're a seasoned pro or just starting out, our platform
            offers a wealth of knowledge to help you navigate the ever-evolving
            world of coding. From common pitfalls to advanced techniques, our
            community-driven content is designed to empower you on your coding
            journey. So, roll up your sleeves, dive into the code, and let's
            tackle those bugs together! Join us in building a vibrant community
            where knowledge is shared, skills are honed, and breakthroughs are
            celebrated. Together, we can transform the way we approach coding
            challenges and inspire each other to reach new heights. Welcome to
            Dev-Bug-Coder-Blog, where every bug is an opportunity for growth and
            learning. Let's embark on this coding adventure together!
            <br />
            <br />
            <b>
              Let's debug smarter. Share boldly. And code with confidence. Happy
              Coding!
            </b>
          </p>
        </section>
      </main>
      {isLoading ? (
        <aside className="w-1/4 p-4 space-y-4">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
          <Skeleton className="h-6 w-32 mt-6 mb-4" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-18" />
          </div>
        </aside>
      ) : (
        <Sidebar recentPosts={recentPosts} popularTopics={popularTopics} />
      )}
    </div>
  );
}
