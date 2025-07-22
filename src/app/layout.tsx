import './globals.css';
     import { ReactNode } from 'react';

     export const metadata = {
       title: 'AIOToolSuite - All Your Online Tools',
       description: '100+ free online tools for SEO, image editing, PDF utilities, video processing, and more.',
     };

     interface RootLayoutProps {
       children: ReactNode;
     }

     export default function RootLayout({ children }: RootLayoutProps) {
       return (
         <html lang="en">
           <body>{children}</body>
         </html>
       );
     }