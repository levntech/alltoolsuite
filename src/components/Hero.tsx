import SearchBar from "./SearchBar";

interface HeroProps {
  // onSearch: (query: string) => void;
}

const Hero: React.FC<HeroProps> = () => {
  return (
    <section className="text-center py-16 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-gray-800 dark:to-gray-900">
      <h1 className="text-4xl md:text-5xl font-bold mb-4">
        All Your Online Tools in One Place
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto mb-6">
        Free, fast, and beautiful tools for creators, developers, and marketers.
      </p>

      <SearchBar />
    </section>
  );
};

export default Hero;
