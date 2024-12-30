'use client';

import { FlightTrack } from '@/types/opensky';
import { Polyline, Circle } from 'react-leaflet';
import { LatLng } from 'leaflet';

interface FlightPathProps {
  track: FlightTrack;
  predictedPath?: Array<{
    latitude: number;
    longitude: number;
    time: number;
  }>;
}

export function FlightPath({ track, predictedPath }: FlightPathProps) {
  // Convertir le chemin en points pour Leaflet
  const pathPoints = track.path.map(point => [point.latitude, point.longitude] as [number, number]);
  
  // Points prédits si disponibles
  const predictedPoints = predictedPath?.map(point => [point.latitude, point.longitude] as [number, number]) || [];

  return (
    <>
      {/* Trajectoire passée */}
      <Polyline
        positions={pathPoints}
        pathOptions={{
          color: '#00ff00',
          weight: 2,
          opacity: 0.8,
          dashArray: '5, 5',
        }}
      />

      {/* Points de passage */}
      {pathPoints.map(([lat, lng], index) => (
        <Circle
          key={`waypoint-${index}`}
          center={[lat, lng]}
          radius={100}
          pathOptions={{
            color: '#00ff00',
            fillColor: '#00ff00',
            fillOpacity: 0.3,
          }}
        />
      ))}

      {/* Trajectoire prédite */}
      {predictedPoints.length > 0 && (
        <Polyline
          positions={predictedPoints}
          pathOptions={{
            color: '#ffff00',
            weight: 2,
            opacity: 0.6,
            dashArray: '10, 10',
          }}
        />
      )}

      {/* Points de passage prédits */}
      {predictedPoints.map(([lat, lng], index) => (
        <Circle
          key={`predicted-${index}`}
          center={[lat, lng]}
          radius={100}
          pathOptions={{
            color: '#ffff00',
            fillColor: '#ffff00',
            fillOpacity: 0.2,
          }}
        />
      ))}
    </>
  );
} 