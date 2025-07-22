'use client';

     import { useTheme } from 'next-themes';
     import { FaMoon, FaSun } from 'react-icons/fa';

     const ThemeToggle: React.FC = () => {
       const { theme, setTheme } = useTheme();

       return (
         <button
           className="p-2 rounded-full hover:bg-gray-700"
           onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
           aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
         >
           {theme === 'dark' ? <FaSun className="text-xl" /> : <FaMoon className="text-xl" />}
         </button>
       );
     };

     export default ThemeToggle;