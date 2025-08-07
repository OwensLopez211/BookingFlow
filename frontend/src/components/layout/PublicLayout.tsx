// layouts/PublicLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navigation } from '@/components/navigation/Navigation';
import Footer from '@/components/layout/Footer';

export const PublicLayout: React.FC = () => {
  return (
    <div className="bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <Navigation />
      
      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Modern Footer Component */}
      <Footer />
    </div>
  );
};