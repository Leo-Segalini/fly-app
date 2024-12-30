'use client';

import { env } from '@/utils/env';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { StateVector } from '@/types/opensky';
import { AircraftMarker } from './AircraftMarker';
import { MapFilters } from './MapFilters';
import { FlightSearch } from '../FlightSearch/FlightSearch';
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { flightAnalyticsService } from '@/services/flightAnalytics';
import 'leaflet/dist/leaflet.css';

export interface MapProps {
  aircraft: StateVector[];
  center?: [number, number];
  zoom?: number;
  onBoundsChange?: (bounds: {
    lamin: number;
    lomin: number;
    lamax: number;
    lomax: number;
  }) => void;
}

// Component to handle map events
function MapEvents({ onBoundsChange }: { onBoundsChange?: MapProps['onBoundsChange'] }) {
  const map = useMap();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastUpdateRef = useRef<number>(Date.now());
  const MIN_UPDATE_INTERVAL = 15000; // 15 secondes minimum entre les mises à jour

  const debouncedBoundsChange = useCallback(() => {
    if (!onBoundsChange) return;

    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;

    if (timeSinceLastUpdate < MIN_UPDATE_INTERVAL) {
      // Si une mise à jour est déjà prévue, l'annuler
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Planifier une nouvelle mise à jour
      timeoutRef.current = setTimeout(() => {
        const bounds = map.getBounds();
        onBoundsChange({
          lamin: bounds.getSouth(),
          lomin: bounds.getWest(),
          lamax: bounds.getNorth(),
          lomax: bounds.getEast(),
        });
        lastUpdateRef.current = Date.now();
      }, MIN_UPDATE_INTERVAL - timeSinceLastUpdate);
      
      return;
    }

    // Si assez de temps s'est écoulé, mettre à jour immédiatement
    const bounds = map.getBounds();
    onBoundsChange({
      lamin: bounds.getSouth(),
      lomin: bounds.getWest(),
      lamax: bounds.getNorth(),
      lomax: bounds.getEast(),
    });
    lastUpdateRef.current = now;
  }, [map, onBoundsChange]);

  useEffect(() => {
    if (!onBoundsChange) return;

    map.on('moveend', debouncedBoundsChange);
    // Déclencher l'événement au montage pour obtenir les limites initiales
    debouncedBoundsChange();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      map.off('moveend', debouncedBoundsChange);
    };
  }, [map, onBoundsChange, debouncedBoundsChange]);

  return null;
}

// Styles globaux pour la carte
const mapStyles = `
  .leaflet-container {
    height: 100%;
    width: 100%;
    background: #1a1a1a;
  }
  .aircraft-icon {
    transition: transform 0.3s ease-in-out;
  }
  .aircraft-icon:hover {
    transform: scale(1.2);
    cursor: pointer;
  }
`;

// Injecter les styles globaux
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = mapStyles;
  document.head.appendChild(style);
}

// Coordonnées par défaut pour la France
const FRANCE_CENTER: [number, number] = [46.603354, 1.888334]; // Centre de la France
const FRANCE_ZOOM = 6;

export function Map({
  aircraft,
  center = FRANCE_CENTER,
  zoom = FRANCE_ZOOM,
  onBoundsChange,
}: MapProps) {
  const [filters, setFilters] = useState({
    minAltitude: undefined as number | undefined,
    maxAltitude: undefined as number | undefined,
  });
  const [selectedFlight, setSelectedFlight] = useState<StateVector | null>(null);
  const [proximityAlerts, setProximityAlerts] = useState<Array<{
    aircraft1: StateVector;
    aircraft2: StateVector;
    distance: number;
    verticalSeparation: number;
  }>>([]);
  const mapRef = useRef<L.Map | null>(null);

  // Filtrer les avions
  const filteredAircraft = useMemo(() => {
    return aircraft.filter((plane) => {
      if (!plane.latitude || !plane.longitude) return false;

      // Filtre par altitude
      const altitude = plane.geo_altitude || 0;
      if (filters.minAltitude !== undefined && altitude < filters.minAltitude) {
        return false;
      }
      if (filters.maxAltitude !== undefined && altitude > filters.maxAltitude) {
        return false;
      }

      return true;
    });
  }, [aircraft, filters]);

  // Vérifier les proximités et mettre à jour les statistiques
  useEffect(() => {
    filteredAircraft.forEach(plane => {
      flightAnalyticsService.updateStats(plane);
      const alerts = flightAnalyticsService.checkProximity(plane, filteredAircraft);
      if (alerts.length > 0) {
        setProximityAlerts(prev => [...prev, ...alerts]);
      }
    });

    // Nettoyer les alertes anciennes
    const currentTime = Date.now();
    setProximityAlerts(prev => 
      prev.filter(alert => currentTime - alert.timestamp < 5 * 60 * 1000)
    );
  }, [filteredAircraft]);

  // Gérer la sélection d'un vol
  const handleFlightFound = useCallback((flight: StateVector) => {
    setSelectedFlight(flight);
    if (mapRef.current && flight.latitude && flight.longitude) {
      mapRef.current.setView([flight.latitude, flight.longitude], 10);
    }
  }, []);

  return (
    <div className="w-full h-full relative" style={{ minHeight: '100vh' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full absolute inset-0"
        scrollWheelZoom={true}
        zoomControl={true}
        minZoom={3}
        maxZoom={18}
        worldCopyJump={true}
        preferCanvas={true}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents onBoundsChange={onBoundsChange} />
        {filteredAircraft.map((plane) => (
          <AircraftMarker
            key={plane.icao24}
            aircraft={plane}
            isHighlighted={selectedFlight?.icao24 === plane.icao24}
          />
        ))}
      </MapContainer>

      {/* Recherche de vol */}
      <FlightSearch
        flights={filteredAircraft}
        onFlightFound={handleFlightFound}
      />

      {/* Filtres */}
      <MapFilters onFilterChange={setFilters} />

      {/* Alertes de proximité */}
      {proximityAlerts.length > 0 && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-red-900 bg-opacity-90 p-4 rounded-lg shadow-lg max-w-md">
          <h3 className="text-white font-bold mb-2">
            Alertes de proximité ({proximityAlerts.length})
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {proximityAlerts.map((alert, index) => (
              <div
                key={`${alert.aircraft1.icao24}-${alert.aircraft2.icao24}-${index}`}
                className="text-white text-sm"
              >
                <p>
                  {alert.aircraft1.callsign || alert.aircraft1.icao24} et{' '}
                  {alert.aircraft2.callsign || alert.aircraft2.icao24}
                </p>
                <p className="text-red-300">
                  Distance: {Math.round(alert.distance / 1000)}km, Séparation verticale:{' '}
                  {Math.round(alert.verticalSeparation)}m
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 