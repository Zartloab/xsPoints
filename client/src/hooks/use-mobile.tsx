import { useState, useEffect } from 'react';

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Function to check if the screen width is mobile size
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Set on initial load
    checkMobile();

    // Add event listener
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

export function usePreferredLayout() {
  const isMobile = useIsMobile();
  const [preferMobile, setPreferMobile] = useState(() => {
    // Check if user has a preference stored
    const storedPreference = localStorage.getItem('preferMobileLayout');
    return storedPreference ? JSON.parse(storedPreference) : false;
  });

  // Effect to persist preference
  useEffect(() => {
    localStorage.setItem('preferMobileLayout', JSON.stringify(preferMobile));
  }, [preferMobile]);

  // Function to toggle preference
  const toggleLayoutPreference = () => {
    setPreferMobile((prev: boolean) => !prev);
  };

  // Use mobile layout if device is mobile or user prefers mobile layout
  const useMobileLayout = isMobile || preferMobile;

  return {
    isMobile,
    preferMobile,
    useMobileLayout,
    toggleLayoutPreference
  };
}