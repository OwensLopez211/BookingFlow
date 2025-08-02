import React, { useState, useEffect } from 'react';
import Spline from '@splinetool/react-spline';

export const Hero: React.FC = () => {
  const [loaded, setLoaded] = useState(false);
  const [scale, setScale] = useState(1);

  const handleSplineLoad = () => {
    setLoaded(true);
  };

  useEffect(() => {
    const calculateScale = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const originalWidth = 1694;
      const originalHeight = 1142;
      
      const scaleX = viewportWidth / originalWidth;
      const scaleY = viewportHeight / originalHeight;
      
      const newScale = Math.min(scaleX, scaleY);
      setScale(newScale);
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    
    return () => window.removeEventListener('resize', calculateScale);
  }, []);

  return (
    <div className="relative bg-black w-full h-screen overflow-hidden flex items-center justify-center">
      <div 
        className={`relative transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ 
          width: '1694px', 
          height: '1142px',
          transform: `scale(${scale})`,
          transformOrigin: 'center center'
        }}
      >
        <Spline 
          scene="https://prod.spline.design/Xrv8rX-CdhGrY5DK/scene.splinecode"
          onLoad={handleSplineLoad}
          style={{ 
            width: '100%', 
            height: '100%',
            imageRendering: 'crisp-edges',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale'
          }}
        />
      </div>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  );
};
