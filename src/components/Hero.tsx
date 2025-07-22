import SearchBar from "./SearchBar";

interface HeroProps {
    onSearch: (query: string) => void;
  }

  const Hero: React.FC<HeroProps> = ({ onSearch }) => (
    <section className="text-center py-16 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-gray-800 dark:to-gray-900">
      <h1 className="text-4xl md:text-5xl font-bold mb-4">All Your Online Tools in One Place</h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto mb-6">
        Free, fast, and beautiful tools for creators, developers, and marketers.
      </p>
      {/* <input
        type="text"
        placeholder="Search 100+ tools..."
        className="w-full max-w-md p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        onChange={(e) => onSearch(e.target.value)}
        aria-label="Search tools"
      /> */}

      <SearchBar/>

    </section>
  );

  export default Hero;