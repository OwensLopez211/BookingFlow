import { useState, useEffect, useCallback } from 'react';

// Configuration for better UX
const LOADING_CONFIG = {
  MIN_LOADING_TIME: 1200, // Minimum time to show loading screen (avoid flash)
  MAX_LOADING_TIME: 5000, // Maximum time to prevent infinite loading
  INITIAL_DELAY: 100, // Small delay to avoid flash on fast networks
} as const;

export const useAppLoading = () => {
  const [isLoading, setIsLoading] = useState(true);
  
  // Memoized callback to complete loading
  const completeLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const initializeApp = async () => {
      const startTime = Date.now();

      try {
        // Wait for critical resources in parallel
        await Promise.allSettled([
          // Wait for fonts to be ready (non-blocking)
          document.fonts.ready.catch(() => {
            console.warn('Fonts not loaded completely, continuing...');
          }),
          
          // Wait for DOM to be fully interactive
          new Promise<void>((resolve) => {
            if (document.readyState === 'complete') {
              resolve();
            } else {
              window.addEventListener('load', () => resolve(), { once: true });
            }
          }),

          // Simulate any critical async initialization
          new Promise(resolve => setTimeout(resolve, LOADING_CONFIG.INITIAL_DELAY)),
        ]);

        // Ensure minimum loading time for smooth UX
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, LOADING_CONFIG.MIN_LOADING_TIME - elapsed);

        if (remainingTime > 0) {
          timeoutId = setTimeout(() => {
            if (isMounted) {
              completeLoading();
            }
          }, remainingTime);
        } else {
          if (isMounted) {
            completeLoading();
          }
        }

      } catch (error) {
        console.error('Error during app initialization:', error);
        // Still complete loading even if there's an error
        if (isMounted) {
          completeLoading();
        }
      }
    };

    // Safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn('Loading took too long, forcing completion');
        completeLoading();
      }
    }, LOADING_CONFIG.MAX_LOADING_TIME);

    initializeApp();

    // Cleanup function
    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      clearTimeout(safetyTimeout);
    };
  }, [completeLoading]);

  return { 
    isLoading,
    // Expose method to manually complete loading if needed
    completeLoading: useCallback(() => {
      if (isLoading) {
        completeLoading();
      }
    }, [isLoading, completeLoading])
  };
};