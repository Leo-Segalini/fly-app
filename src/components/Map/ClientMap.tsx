'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Import Map component dynamically with no SSR
const Map = dynamic(() => import('./Map').then(mod => mod.Map), {
  ssr: false, // Disable server-side rendering
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-900" style={{ minHeight: '100vh' }}>
      <div className="text-green-500">Chargement de la carte...</div>
    </div>
  ),
});

// Re-export the Map component props type
export type { MapProps } from './Map';

// Export the ClientMap component
export function ClientMap(props: React.ComponentProps<typeof Map>) {
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);

  // Initialize Leaflet on the client side
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Import Leaflet dynamically
    Promise.all([
      import('leaflet/dist/leaflet.css'),
      import('leaflet').then(L => {
        // Fix Leaflet icons
        delete (L as any).Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: '/marker-icon-2x.png',
          iconUrl: '/marker-icon.png',
          shadowUrl: '/marker-shadow.png',
        });
        return L;
      })
    ]).then(() => {
      setIsLeafletLoaded(true);
    });
  }, []);

  if (!isLeafletLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900" style={{ minHeight: '100vh' }}>
        <div className="text-green-500">Chargement de Leaflet...</div>
      </div>
    );
  }

  return <Map {...props} />;
} 