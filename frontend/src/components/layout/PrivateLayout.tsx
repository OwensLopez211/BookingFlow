import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { NavigationBar } from '@/components/navigation/NavigationBar';

export const PrivateLayout: React.FC = () => {
  const location = useLocation();
  const isSettingsPage = location.pathname === '/settings';
  
  return (
    <div className={`h-screen flex flex-col ${
      isSettingsPage 
        ? 'bg-gray-100' 
        : 'bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100'
    }`}>
      <NavigationBar />
      
      {/* Main Content - Takes remaining height */}
      <main className="flex-1 px-4 py-4 min-h-0">
        <Outlet />
      </main>
    </div>
  );
};