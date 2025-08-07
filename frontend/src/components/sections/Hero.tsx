import Spline from '@splinetool/react-spline';
import { useEffect, useRef } from 'react';

export const Hero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let targetScrollY = window.pageYOffset;
    let currentScrollY = window.pageYOffset;
    let animationId: number;

    const lerp = (start: number, end: number, factor: number) => {
      return start + (end - start) * factor;
    };

    const smoothScrollAnimation = () => {
      currentScrollY = lerp(currentScrollY, targetScrollY, 0.08);
      
      if (Math.abs(targetScrollY - currentScrollY) > 0.1) {
        window.scrollTo(0, currentScrollY);
        animationId = requestAnimationFrame(smoothScrollAnimation);
      } else {
        window.scrollTo(0, targetScrollY);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Acumular el scroll objetivo de manera suave
      targetScrollY += e.deltaY * 0.3;
      targetScrollY = Math.max(0, Math.min(targetScrollY, document.documentElement.scrollHeight - window.innerHeight));
      
      // Cancelar animación anterior si existe
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      
      // Iniciar nueva animación suave
      smoothScrollAnimation();
    };

    // Sincronizar con scroll externo (scrollbar, etc.)
    const handleScroll = () => {
      targetScrollY = window.pageYOffset;
      currentScrollY = window.pageYOffset;
    };

    container.addEventListener('wheel', handleWheel, { capture: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('wheel', handleWheel, { capture: true });
      window.removeEventListener('scroll', handleScroll);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-[80vh] overflow-hidden">
      <Spline
        scene="https://prod.spline.design/UVjxCRYAHrpw6D28/scene.splinecode"
      />
    </div>
  );
};

