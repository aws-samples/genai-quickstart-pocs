'use client'

import React from 'react';
import TopNavBar from '@/components/TopNavBar';
// import Box from "@cloudscape-design/components/box";


export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <TopNavBar />
      <div>{children}</div>
    </div>
  );
}