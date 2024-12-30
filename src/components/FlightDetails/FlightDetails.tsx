'use client';

import { StateVector } from '@/types/opensky';
import { useEffect, useState } from 'react';
import { openSkyService } from '@/services/opensky';

interface FlightDetailsProps {
  aircraft: StateVector;
  onClose: () => void;
  isTracked: boolean;
  onToggleTracking: () => void;
}

interface FlightInfo {
  route?: string;
  aircraft_type?: string;
  operator?: string;
  status: 'En vol' | 'Au sol';
  speed: string;
  altitude: string;
  heading: string;
}

export function FlightDetails({ aircraft, onClose, isTracked, onToggleTracking }: FlightDetailsProps) {
  const [flightInfo, setFlightInfo] = useState<FlightInfo>({
    status: aircraft.on_ground ? 'Au sol' : 'En vol',
    speed: `${Math.round((aircraft.velocity || 0) * 3.6)} km/h`, // Conversion m/s en km/h
    altitude: `${Math.round(aircraft.geo_altitude || 0)} m`,
    heading: `${Math.round(aircraft.true_track || 0)}°`,
  });

  useEffect(() => {
    if (aircraft.time_position) {
      openSkyService.getTrack(aircraft.icao24, aircraft.time_position)
        .then(track => {
          if (track) {
            setFlightInfo(prev => ({
              ...prev,
              route: `${track.estDepartureAirport || 'N/A'} → ${track.estArrivalAirport || 'N/A'}`,
            }));
          }
        })
        .catch(console.error);
    }
  }, [aircraft]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-lg w-full mx-4 relative">
        {/* Bouton fermer */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          title="Fermer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* En-tête */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            {aircraft.callsign || 'N/A'}
          </h2>
          <div className="flex items-center space-x-2">
            <p className="text-green-500">
              {aircraft.icao24.toUpperCase()}
            </p>
            {isTracked && (
              <span className="px-2 py-0.5 bg-yellow-600 text-white text-xs rounded-full">
                Suivi actif
              </span>
            )}
          </div>
        </div>

        {/* Informations principales */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="text-gray-400 text-sm">Statut</h3>
            <p className="text-white font-medium">{flightInfo.status}</p>
          </div>
          <div>
            <h3 className="text-gray-400 text-sm">Pays d'origine</h3>
            <p className="text-white font-medium">{aircraft.origin_country}</p>
          </div>
          <div>
            <h3 className="text-gray-400 text-sm">Vitesse</h3>
            <p className="text-white font-medium">{flightInfo.speed}</p>
          </div>
          <div>
            <h3 className="text-gray-400 text-sm">Altitude</h3>
            <p className="text-white font-medium">{flightInfo.altitude}</p>
          </div>
          <div>
            <h3 className="text-gray-400 text-sm">Direction</h3>
            <p className="text-white font-medium">{flightInfo.heading}</p>
          </div>
          {flightInfo.route && (
            <div className="col-span-2">
              <h3 className="text-gray-400 text-sm">Route</h3>
              <p className="text-white font-medium">{flightInfo.route}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Fermer
          </button>
          <button
            onClick={onToggleTracking}
            className={`px-4 py-2 ${
              isTracked ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'
            } text-white rounded transition-colors`}
          >
            {isTracked ? 'Arrêter le suivi' : 'Suivre'}
          </button>
        </div>
      </div>
    </div>
  );
} 