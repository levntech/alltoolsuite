'use client';
import React from 'react';
import Seo from '../Seo';
import dynamic from 'next/dynamic';
import { tools } from '@/lib/config/index';


interface ToolLayoutProps {
  title: string;
  desc: string;
  children?: React.ReactNode;
  tool: typeof tools[number];
}


export default function ToolLayout({ title, desc, children, tool }: ToolLayoutProps) {
  

    return (
      <>
        {/* <Seo title={title} desc={desc} /> */}
        <div className="max-w-4xl mx-auto px-4 py-10">
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-gray-600">{desc}</p>
          <div className="mt-6">            
              {children}
          </div>
        </div>
      </>
    );
  }
