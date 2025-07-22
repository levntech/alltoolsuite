'use client';

     import { motion } from 'framer-motion';
     import { useRouter } from 'next/navigation';
     import { FaStar } from 'react-icons/fa';
     import * as FaIcons from 'react-icons/fa';
     import { trackEvent } from '@/lib/analytics';
     import { useLocalStorage } from '@/lib/hooks';
     import { categories } from '@/lib/data';

     interface CardProps {
       icon: string;
       title: string;
       desc: string;
       path: string;
       isTool?: boolean;
       category?: string;
       iconColor?: string;
     }

     const Card: React.FC<CardProps> = ({ icon, title, desc, path, isTool, category, iconColor }) => {
       const router = useRouter();
       const [favorites, setFavorites] = useLocalStorage<string[]>('favorites', []);
       const Icon = (FaIcons as any)[icon] || FaStar;
       const defaultColor = iconColor || 'text-accent-blue';

       const handleClick = () => {
         trackEvent(isTool ? 'tool_click' : 'category_click', { title, category });
         router.push(path);
       };

       const toggleFavorite = (e: React.MouseEvent) => {
         e.stopPropagation();
         if (favorites.includes(title)) {
           setFavorites(favorites.filter((fav) => fav !== title));
         } else {
           setFavorites([...favorites, title]);
         }
         trackEvent('favorite_toggle', { title, action: favorites.includes(title) ? 'remove' : 'add' });
       };

       console.log('Card iconColor:', iconColor, 'Category:', category);

       return (
         <motion.div
           className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
           whileHover={{ scale: 1.05 }}
           onClick={handleClick}
           role="button"
           tabIndex={0}
           onKeyDown={(e) => e.key === 'Enter' && handleClick()}
           aria-label={`Navigate to ${title}`}
         >
           <div className="flex items-center justify-between">
             <Icon className={`text-4xl ${iconColor || defaultColor}`} />
             {isTool && (
               <FaStar
                 className={`text-2xl ${favorites.includes(title) ? 'text-yellow-400' : 'text-gray-400'}`}
                 onClick={toggleFavorite}
                 aria-label={`Toggle favorite for ${title}`}
               />
             )}
           </div>
           <h3 className="text-sm  font-semibold mt-4 md:text-lg">{title}</h3>
           <p className="text-sm text-gray-600  dark:text-gray-400">{desc}</p>
         </motion.div>
       );
     };

     export default Card;