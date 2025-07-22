'use client';

import React, { useState, useEffect, useRef } from 'react';
import { tools, ToolConfig } from '@/lib/tools'; // Adjust the import path based on your project structure
import { useRouter } from 'next/navigation';
import * as Icons from 'react-icons/fa'; // Import FontAwesome icons from react-icons
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from 'use-debounce';

// Dynamically resolve icons from react-icons/fa
const getIcon = (iconName: string) => {
  const iconKey = iconName as keyof typeof Icons;
  return Icons[iconKey] || Icons.FaTools; // Fallback to FaTools if icon not found
};

const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 300); // Debounce the query by 300ms
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Only filter tools if debouncedQuery is not empty
  const filteredTools = debouncedQuery.trim()
    ? tools.filter(
        (tool: ToolConfig) =>
          tool.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          tool.category.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          tool.keywords.some((keyword: string) => keyword.toLowerCase().includes(debouncedQuery.toLowerCase()))
      )
    : [];

  // Dynamically generate suggested categories from tools array
  const suggestedCategories = Array.from(new Set(tools.map((tool: ToolConfig) => tool.category)))
    .slice(0, 3) // Limit to 3 categories for UI purposes
    .map((category: string) => {
      const representativeTool = tools.find((tool: ToolConfig) => tool.category === category)!;
      return {
        name: category
          .replace('-', ' ')
          .split(' ')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        icon: representativeTool.icon,
        onClick: () => {
          setQuery(category
            .replace('-', ' ')
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' '));
          setIsOpen(true);
        },
      };
    });

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredTools.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredTools.length) % filteredTools.length);
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && filteredTools[selectedIndex]) {
        router.push(`/tools/${filteredTools[selectedIndex].category}/${filteredTools[selectedIndex].slug}`);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  return (
    <div className="w-full max-w-2xl px-4">
      {/* Search Bar */}
      <div className="relative z-30 bg-white rounded-lg shadow-sm">
        <input
          type="text"
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search 100+ AIOToolSuite tools..."
          className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-800 placeholder-gray-400"
          autoComplete="off"
        />
        <div className="absolute top-1/2 right-4 transform -translate-y-1/2 text-gray-400 pointer-events-none">
          <Icons.FaSearch className="w-5 h-5" />
        </div>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-[450px] overflow-y-auto z-20"
          >
            {/* Suggested Categories */}
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Icons.FaCheck className="w-4 h-4" />
                Suggested Categories
              </h3>
              <div className="flex flex-wrap gap-3">
                {suggestedCategories.map((category) => {
                  const IconComponent = getIcon(category.icon);
                  return (
                    <button
                      key={category.name}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 text-sm font-medium"
                      onClick={category.onClick}
                    >
                      <IconComponent className="w-4 h-4" />
                      <span>{category.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tool Results */}
            <div className="px-5 py-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Icons.FaList className="w-4 h-4" />
                Tool Results
              </h3>
              <ul className="space-y-1">
                {debouncedQuery.trim() === '' ? (
                  <li className="text-gray-500 text-sm italic">Start typing to search tools...</li>
                ) : filteredTools.length === 0 ? (
                  <li className="text-gray-500 text-sm italic">No tools found.</li>
                ) : (
                  filteredTools.map((tool: ToolConfig, index: number) => {
                    const IconComponent = getIcon(tool.icon);
                    return (
                      <li
                        key={`${tool.category}-${tool.slug}`}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-all duration-200 ${
                          index === selectedIndex ? 'bg-gray-200' : ''
                        }`}
                        onClick={() => {
                          router.push(`/tools/${tool.category}/${tool.slug}`);
                          setIsOpen(false);
                        }}
                      >
                        <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full">
                          <IconComponent className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{tool.title}</p>
                          <p className="text-sm text-gray-500">
                            {tool.category
                              .replace('-', ' ')
                              .split(' ')
                              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                              .join(' ')}
                          </p>
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;