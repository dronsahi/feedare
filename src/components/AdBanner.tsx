import { useEffect, useState } from 'react';
import { getAdUnitId } from '@/config/admob';

export function AdBanner() {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
  
  useEffect(() => {
    // Simulate ad loading for web preview
    const timer = setTimeout(() => {
      setAdLoaded(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  if (adError) {
    return null;
  }

  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 bg-card border-t border-border">
      <div className="h-14 flex items-center justify-center max-w-lg mx-auto">
        {adLoaded ? (
          <div className="w-full h-full bg-muted/50 flex items-center justify-center text-xs text-muted-foreground">
            <span>Banner Ad • {getAdUnitId('banner').slice(-8)}</span>
          </div>
        ) : (
          <div className="w-full h-full bg-muted/30 animate-pulse" />
        )}
      </div>
    </div>
  );
}
