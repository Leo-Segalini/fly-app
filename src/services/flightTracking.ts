import { FlightTrack, StateVector } from '@/types/opensky';

interface PredictedPosition {
  latitude: number;
  longitude: number;
  time: number;
  altitude?: number;
}

class FlightTrackingService {
  private trackedFlights: Map<string, {
    lastUpdate: number;
    positions: Array<{
      latitude: number;
      longitude: number;
      altitude: number;
      time: number;
      velocity: number;
      heading: number;
    }>;
  }> = new Map();

  // Ajouter une nouvelle position à un vol suivi
  addPosition(flight: StateVector) {
    if (!flight.latitude || !flight.longitude || !flight.time_position) return;

    const icao24 = flight.icao24;
    const currentTime = Date.now();
    const position = {
      latitude: flight.latitude,
      longitude: flight.longitude,
      altitude: flight.geo_altitude || 0,
      time: flight.time_position,
      velocity: flight.velocity || 0,
      heading: flight.true_track || 0,
    };

    if (!this.trackedFlights.has(icao24)) {
      this.trackedFlights.set(icao24, {
        lastUpdate: currentTime,
        positions: [position],
      });
    } else {
      const flightData = this.trackedFlights.get(icao24)!;
      flightData.positions.push(position);
      flightData.lastUpdate = currentTime;

      // Garder seulement les 100 dernières positions
      if (flightData.positions.length > 100) {
        flightData.positions = flightData.positions.slice(-100);
      }
    }
  }

  // Obtenir la trajectoire d'un vol
  getFlightPath(icao24: string): Array<{
    latitude: number;
    longitude: number;
    time: number;
  }> {
    const flightData = this.trackedFlights.get(icao24);
    return flightData?.positions || [];
  }

  // Prédire les positions futures (15 minutes)
  predictPositions(flight: StateVector, minutes: number = 15): PredictedPosition[] {
    if (!flight.latitude || !flight.longitude || !flight.velocity || !flight.true_track) {
      return [];
    }

    const predictions: PredictedPosition[] = [];
    const timeStep = minutes * 60 / 10; // 10 points sur la période
    const velocity = flight.velocity; // m/s
    const heading = (flight.true_track * Math.PI) / 180; // conversion en radians

    for (let i = 1; i <= 10; i++) {
      const time = (flight.time_position || Date.now() / 1000) + i * timeStep;
      const distance = velocity * i * timeStep; // distance en mètres

      // Calcul des nouvelles coordonnées
      const R = 6371000; // Rayon de la Terre en mètres
      const lat1 = (flight.latitude * Math.PI) / 180;
      const lon1 = (flight.longitude * Math.PI) / 180;

      const lat2 = Math.asin(
        Math.sin(lat1) * Math.cos(distance / R) +
        Math.cos(lat1) * Math.sin(distance / R) * Math.cos(heading)
      );

      const lon2 = lon1 + Math.atan2(
        Math.sin(heading) * Math.sin(distance / R) * Math.cos(lat1),
        Math.cos(distance / R) - Math.sin(lat1) * Math.sin(lat2)
      );

      predictions.push({
        latitude: (lat2 * 180) / Math.PI,
        longitude: (lon2 * 180) / Math.PI,
        time,
        altitude: flight.geo_altitude,
      });
    }

    return predictions;
  }

  // Vérifier si un vol est actuellement suivi
  isTracked(icao24: string): boolean {
    return this.trackedFlights.has(icao24);
  }

  // Arrêter le suivi d'un vol
  stopTracking(icao24: string) {
    this.trackedFlights.delete(icao24);
  }

  // Nettoyer les vols qui n'ont pas été mis à jour depuis plus de 15 minutes
  cleanup() {
    const currentTime = Date.now();
    const maxAge = 15 * 60 * 1000; // 15 minutes

    for (const [icao24, data] of this.trackedFlights.entries()) {
      if (currentTime - data.lastUpdate > maxAge) {
        this.trackedFlights.delete(icao24);
      }
    }
  }
}

// Export a singleton instance
export const flightTrackingService = new FlightTrackingService(); 