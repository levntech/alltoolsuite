'use client';

     import { ReactNode } from 'react';
     import { ThemeProvider } from 'next-themes';
     import ErrorBoundary from '../../components/ErrorBoundary';
     import Footer from '../../components/Footer';

     interface LayoutProps {
       children: ReactNode;
     }

     const SiteLayout: React.FC<LayoutProps> = ({ children }) => (
       <ThemeProvider attribute="class">
         <ErrorBoundary>
           <div className="flex flex-col min-h-screen">
             <main className="flex-grow">{children}</main>
             <Footer />
           </div>
         </ErrorBoundary>
       </ThemeProvider>
     );

     export default SiteLayout;