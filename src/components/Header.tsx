"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaBars, FaTools } from "react-icons/fa";
import ThemeToggle from "./ThemeToggle";
import Sidebar from "./Sidebar";
import SearchBar from "./SearchBar";

interface HeaderProps {
  isScrolled: boolean;
}

const Header: React.FC<HeaderProps> = ({ isScrolled }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <header
        className={`bg-primary-dark text-primary-light px-6 py-4 sticky top-0 z-50 flex items-center justify-between transition-all ${
          isScrolled ? "shadow-md" : ""
        }`}
      >
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => router.push("/")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && router.push("/")}
        >
          <FaTools className="text-accent-blue text-2xl" />
          <span className="text-xl font-bold">AIOToolSuite</span>
        </div>

        <SearchBar />
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <FaBars
            className="text-2xl md:hidden cursor-pointer"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open menu"
          />
        </div>
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      </header>
    </>
  );
};

export default Header;
