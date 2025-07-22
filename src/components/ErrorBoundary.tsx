'use client';

import { useState, useEffect } from 'react';
import { ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode;
}

const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Caught error:', error);
      setHasError(true);
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold text-red-600">Something went wrong.</h2>
        <p className="mt-2">Please try refreshing the page or contact support.</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default ErrorBoundary;