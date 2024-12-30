'use client';

import { ClientMap } from '@/components/Map/ClientMap';
import { openSkyService } from '@/services/opensky';
import { StateVector } from '@/types/opensky';
import { useEffect, useState, useCallback, useRef } from 'react';

const UPDATE_INTERVAL = 30000; // 30 seconds
const ERROR_RETRY_DELAY = 5000; // 5 seconds

export default function Home() {
  const [aircraft, setAircraft] = useState<StateVector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const lastBoundsRef = useRef<{
    lamin: number;
    lomin: number;
    lamax: number;
    lomax: number;
  } | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  // Function to fetch aircraft data
  const fetchAircraft = useCallback(async (bounds?: {
    lamin: number;
    lomin: number;
    lamax: number;
    lomax: number;
  }) => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;

    // Si la mise à jour est trop récente et que les bounds n'ont pas changé, ignorer
    if (
      timeSinceLastUpdate < UPDATE_INTERVAL &&
      bounds &&
      lastBoundsRef.current &&
      JSON.stringify(bounds) === JSON.stringify(lastBoundsRef.current)
    ) {
      return;
    }

    try {
      setLoading(true);
      const data = bounds
        ? await openSkyService.getStatesByBoundingBox(bounds)
        : await openSkyService.getAllStates();
      
      if (data.length === 0) {
        throw new Error('Aucun avion trouvé dans la zone');
      }

      setAircraft(data);
      setError(null);
      setRetryCount(0);
      lastUpdateRef.current = now;
      if (bounds) {
        lastBoundsRef.current = bounds;
      }
    } catch (err) {
      console.error('Error fetching aircraft data:', err);
      setError((err as Error).message || 'Erreur lors de la récupération des données des avions');
      
      // Retry logic
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchAircraft(bounds);
        }, ERROR_RETRY_DELAY * Math.pow(2, retryCount)); // Exponential backoff
      }
    } finally {
      setLoading(false);
    }
  }, [retryCount]);

  // Initial fetch and periodic updates
  useEffect(() => {
    fetchAircraft();
    
    const interval = setInterval(() => {
      if (lastBoundsRef.current) {
        fetchAircraft(lastBoundsRef.current);
      } else {
        fetchAircraft();
      }
    }, UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchAircraft]);

  return (
    <main className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="bg-gray-900 text-white p-4">
        <h1 className="text-2xl font-bold">Fly App</h1>
        <p className="text-sm text-gray-400">
          {loading
            ? 'Chargement des données...'
            : `${aircraft.length} avions en vol`}
        </p>
      </header>

      {/* Map Container */}
      <div className="flex-1 relative">
        {error && (
          <div className="absolute top-4 left-4 bg-red-500 text-white p-4 rounded-lg z-50 max-w-md">
            <p className="font-bold">Erreur</p>
            <p>{error}</p>
            {retryCount > 0 && retryCount < 3 && (
              <p className="text-sm mt-2">Tentative de reconnexion ({retryCount}/3)...</p>
            )}
          </div>
        )}
        <ClientMap
          aircraft={aircraft}
          onBoundsChange={fetchAircraft}
        />
      </div>
    </main>
  );
}
