'use client';

     import { useState, useEffect, use } from 'react';
     import { motion } from 'framer-motion';
     import { useParams } from 'next/navigation';
     import Header from '@/components/Header';
     import Card from '@/components/Card';
     import { categories } from '@/lib/data';
     import { trackEvent } from '@/lib/analytics';

     export default function CategoryPage() {
        console.log( useParams() );
       const { category } = useParams<{ category: string}>();
       const [searchQuery, setSearchQuery] = useState('');
       const [isScrolled, setIsScrolled] = useState(false);

       // Decode category and construct path (e.g., 'seo-tools' -> '/seo-tools')
       const categoryPath = `/${Array.isArray(category) ? category[0] : category || ''}`;
       const categoryData = categories.find((c) => c.path === categoryPath);
       const filteredTools = categoryData?.tools.filter((tool) =>
         tool.title.toLowerCase().includes(searchQuery.toLowerCase()),
       ) || [];
       useEffect(() => {
         if (categoryData) {
           trackEvent('category_view', { title: categoryData.title });
         }
         const handleScroll = () => setIsScrolled(window.scrollY > 100);
         window.addEventListener('scroll', handleScroll);
         return () => window.removeEventListener('scroll', handleScroll);
       }, [categoryData]);

       if (!categoryData) {
         return <p className="text-center py-10">Category not found.</p>;
       }

       return (
         <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ duration: 0.5 }}
         >
           <Header isScrolled={isScrolled} onSearch={setSearchQuery} />
           <section className="py-16 px-4 max-w-7xl mx-auto text-center bg-gradient-to-r from-blue-100 to-purple-100 dark:from-gray-800 dark:to-gray-900">
             <h1 className="text-3xl md:text-4xl font-bold mb-4">{categoryData.title}</h1>
             <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
               {categoryData.desc}
             </p>
           </section>
           <section className="py-8 px-4 max-w-7xl mx-auto">
             <h2 className="text-2xl font-bold mb-4">Available Tools</h2>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
               {filteredTools.length > 0 ? (
                 filteredTools.map((tool) => (
                   <Card
                     key={tool.title}
                     icon={tool.icon}
                     title={tool.title}
                     desc={categoryData.desc}
                     path={tool.path}
                     isTool
                     category={categoryData.title}
                     iconColor={categoryData.color}
                   />
                 ))
               ) : (
                 <p className="text-center text-gray-600 dark:text-gray-400 col-span-3">
                   No tools found. Try a different search!
                 </p>
               )}
             </div>
           </section>
         </motion.div>
       );
     }