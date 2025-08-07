import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Card } from '@/components/ui';
import LightRays from '@/components/ui/LightRays';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Background LightRays */}
      <div className="absolute inset-0">
        <LightRays
          raysOrigin="center"
          raysColor="#4508a1"
          raysSpeed={0.4}
          lightSpread={0.7}
          rayLength={2.0}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0.05}
          distortion={0.02}
        />
      </div>

      <div className="relative z-20">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Logo */}
          <Link to="/" className="flex justify-center items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-purple-300/20">
              <img src="/miniatura.webp" alt="BookFlow" className="w-8 h-8 rounded-lg" />
            </div>
            <span className="text-3xl font-bold text-white tracking-tight">BookFlow</span>
          </Link>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl py-8 px-6">
            <Outlet />
          </div>

          {/* Back to home */}
          <div className="mt-6 text-center">
            <Link 
              to="/" 
              className="text-sm text-purple-200 hover:text-white transition-colors inline-flex items-center space-x-2 group"
            >
              <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver al inicio</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Gradient overlay for better contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 pointer-events-none z-10"></div>
    </div>
  );
};