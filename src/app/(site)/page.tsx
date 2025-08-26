"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Card from "@/components/Card";
import { buildUICategories } from "@/lib/tools.utils";
import { useLocalStorage, useInfiniteScroll } from "@/lib/hooks";
import { trackEvent } from "@/lib/analytics";
import TrendingTools from "@/components/TrendingTools";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const categories = buildUICategories();
  const [visibleCategories, setVisibleCategories] = useState(
    categories.slice(0, 10)
  );
  const [favorites, setFavorites] = useLocalStorage<string[]>("favorites", []);
  const [clientFavorites, setClientFavorites] = useState<string[]>([]);

  useEffect(() => {
    setClientFavorites(favorites);
  }, [favorites]);

  const filteredCategories = categories.filter(
    (category) =>
      category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.tools.some((tool) =>
        tool.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  useEffect(() => {
    const handleScroll = () => {
      const hero = document.querySelector(".hero");
      if (hero) {
        const heroRect = hero.getBoundingClientRect();
        setIsScrolled(heroRect.bottom <= 64);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useInfiniteScroll(() => {
    if (visibleCategories.length < filteredCategories.length) {
      setVisibleCategories((prev) => [
        ...prev,
        ...filteredCategories.slice(prev.length, prev.length + 10),
      ]);
    }
  });

  const favoriteTools = categories.flatMap((category) =>
    category.tools
      .filter((tool) => clientFavorites.includes(tool.title))
      .map((tool) => ({
        ...tool,
        category: category.title,
        icon: category.icon,
      }))
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Header isScrolled={isScrolled} />
      {!isScrolled && <Hero />}
      <section className="py-8 px-4 max-w-7xl mx-auto">
        {favoriteTools.length > 0 && (
          <>
            <h2 className="text-2xl font-bold mb-4">Favorite Tools</h2>
            <div className="flex overflow-x-auto gap-6 pb-4 mb-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800 sm:grid sm:grid-cols-2 sm:overflow-x-visible lg:grid-cols-5 sm:pb-0">
              {favoriteTools.map((tool) => (
                <div
                  key={tool.title}
                  className="flex-none min-w-[250px] sm:min-w-0"
                >
                  <Card
                    icon={tool.icon}
                    title={tool.title}
                    desc={
                      categories.find((c) => c.title === tool.category)?.desc ||
                      ""
                    }
                    path={`${tool.slug}`}
                    isTool
                    category={tool.category}
                    iconColor={
                      categories.find((c) => c.title === tool.category)?.color
                    }
                  />
                </div>
              ))}
            </div>
          </>
        )}

        <h2 className="text-2xl font-bold mb-4"> Trending tools</h2>
        {<TrendingTools />}
        <h2 className="text-2xl font-bold mb-4">Tool Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {visibleCategories.length > 0 ? (
            visibleCategories.map((category) => (
              <Card
                key={category.title}
                icon={category.icon}
                title={category.title}
                desc={category.desc}
                path={category.path}
                iconColor={category.color}
              />
            ))
          ) : (
            <p className="text-center text-gray-600 dark:text-gray-400 col-span-3">
              No categories or tools found. Try a different search!
            </p>
          )}
        </div>
      </section>
    </motion.div>
  );
}
