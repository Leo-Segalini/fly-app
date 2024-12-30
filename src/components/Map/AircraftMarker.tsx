'use client';

import { StateVector } from '@/types/opensky';
import { Marker, Popup } from 'react-leaflet';
import { useMemo, useEffect, useState } from 'react';
import type { Icon, DivIcon } from 'leaflet';
import { FlightDetails } from '../FlightDetails/FlightDetails';
import { FlightPath } from './FlightPath';
import { flightTrackingService } from '@/services/flightTracking';
import { flightAnalyticsService } from '@/services/flightAnalytics';

interface AircraftMarkerProps {
  aircraft: StateVector;
  isHighlighted?: boolean;
}

export function AircraftMarker({ aircraft, isHighlighted = false }: AircraftMarkerProps) {
  const [icon, setIcon] = useState<DivIcon | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isTracked, setIsTracked] = useState(false);
  const [stats, setStats] = useState<{
    averageSpeed: number;
    averageAltitude: number;
    distanceTraveled: number;
    flightTime: number;
  } | null>(null);
  const [predictedPath, setPredictedPath] = useState<Array<{
    latitude: number;
    longitude: number;
    time: number;
  }>>([]);

  // Créer l'icône de l'avion
  useEffect(() => {
    import('leaflet').then((L) => {
      const newIcon = L.divIcon({
        className: `aircraft-icon ${isTracked ? 'tracked' : ''} ${isHighlighted ? 'highlighted' : ''}`,
        html: `<div style="transform: rotate(${aircraft.true_track || 0}deg)">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path fill="${isHighlighted ? '#ff0000' : isTracked ? '#ffff00' : '#00ff00'}" d="M22 16v-2l-8.5-5V3.5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5V9L2 14v2l8.5-2.5V19L8 20.5V22l4-1l4 1v-1.5L13.5 19v-5.5L22 16z"/>
          </svg>
        </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      setIcon(newIcon);
    });
  }, [aircraft.true_track, isTracked, isHighlighted]);

  // Gérer le suivi du vol et les statistiques
  useEffect(() => {
    if (isTracked) {
      // Ajouter la position actuelle
      flightTrackingService.addPosition(aircraft);
      
      // Calculer les prédictions
      const predictions = flightTrackingService.predictPositions(aircraft);
      setPredictedPath(predictions);

      // Obtenir les statistiques
      const flightStats = flightAnalyticsService.getFlightStats(aircraft.icao24);
      if (flightStats) {
        setStats({
          averageSpeed: flightStats.averageSpeed,
          averageAltitude: flightStats.averageAltitude,
          distanceTraveled: flightStats.distanceTraveled,
          flightTime: flightStats.flightTime,
        });
      }
    }
  }, [aircraft, isTracked]);

  // Vérifier si l'avion est déjà suivi au chargement
  useEffect(() => {
    setIsTracked(flightTrackingService.isTracked(aircraft.icao24));
  }, [aircraft.icao24]);

  const toggleTracking = () => {
    if (isTracked) {
      flightTrackingService.stopTracking(aircraft.icao24);
      setPredictedPath([]);
      setStats(null);
    } else {
      flightTrackingService.addPosition(aircraft);
      const predictions = flightTrackingService.predictPositions(aircraft);
      setPredictedPath(predictions);
    }
    setIsTracked(!isTracked);
  };

  if (!aircraft.latitude || !aircraft.longitude || !icon) return null;

  return (
    <>
      <Marker
        position={[aircraft.latitude, aircraft.longitude]}
        icon={icon}
        eventHandlers={{
          click: () => setShowDetails(true),
        }}
      >
        <Popup>
          <div className="p-2">
            <h3 className="font-bold">{aircraft.callsign || 'N/A'}</h3>
            <p>Altitude: {Math.round(aircraft.geo_altitude || 0)} m</p>
            <p>Vitesse: {Math.round((aircraft.velocity || 0) * 3.6)} km/h</p>
            <p>Direction: {Math.round(aircraft.true_track || 0)}°</p>

            {stats && (
              <div className="mt-2 pt-2 border-t border-gray-700">
                <h4 className="font-semibold text-sm mb-1">Statistiques</h4>
                <p className="text-sm">Vitesse moyenne: {Math.round(stats.averageSpeed * 3.6)} km/h</p>
                <p className="text-sm">Altitude moyenne: {Math.round(stats.averageAltitude)} m</p>
                <p className="text-sm">Distance: {Math.round(stats.distanceTraveled / 1000)} km</p>
                <p className="text-sm">Durée: {Math.round(stats.flightTime / 60)} min</p>
              </div>
            )}

            <div className="flex space-x-2 mt-2">
              <button
                onClick={() => setShowDetails(true)}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-500 transition-colors"
              >
                Plus de détails
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTracking();
                }}
                className={`px-3 py-1 ${
                  isTracked ? 'bg-red-600 hover:bg-red-500' : 'bg-yellow-600 hover:bg-yellow-500'
                } text-white rounded text-sm transition-colors`}
              >
                {isTracked ? 'Arrêter le suivi' : 'Suivre'}
              </button>
            </div>
          </div>
        </Popup>
      </Marker>

      {isTracked && (
        <FlightPath
          track={{
            icao24: aircraft.icao24,
            path: flightTrackingService.getFlightPath(aircraft.icao24),
            startTime: 0,
            endTime: 0,
          }}
          predictedPath={predictedPath}
        />
      )}

      {showDetails && (
        <FlightDetails
          aircraft={aircraft}
          onClose={() => setShowDetails(false)}
          isTracked={isTracked}
          onToggleTracking={toggleTracking}
        />
      )}
    </>
  );
} 