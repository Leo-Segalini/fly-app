import { StateVector } from '@/types/opensky';

interface FlightStats {
  averageSpeed: number;
  averageAltitude: number;
  minAltitude: number;
  maxAltitude: number;
  distanceTraveled: number;
  flightTime: number;
}

interface ProximityAlert {
  aircraft1: StateVector;
  aircraft2: StateVector;
  distance: number;
  verticalSeparation: number;
  timestamp: number;
}

class FlightAnalyticsService {
  private readonly PROXIMITY_THRESHOLD = 5000; // 5km en mètres
  private readonly VERTICAL_THRESHOLD = 300; // 300m de séparation verticale
  private flightStats: Map<string, FlightStats> = new Map();
  private proximityAlerts: ProximityAlert[] = [];
  private lastPositions: Map<string, {
    position: [number, number];
    altitude: number;
    timestamp: number;
  }> = new Map();

  // Calculer la distance entre deux points en mètres
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // Rayon de la Terre en mètres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Mettre à jour les statistiques d'un vol
  updateStats(flight: StateVector) {
    if (!flight.latitude || !flight.longitude || !flight.time_position) return;

    const icao24 = flight.icao24;
    const currentStats = this.flightStats.get(icao24) || {
      averageSpeed: 0,
      averageAltitude: 0,
      minAltitude: flight.geo_altitude || 0,
      maxAltitude: flight.geo_altitude || 0,
      distanceTraveled: 0,
      flightTime: 0,
    };

    const lastPosition = this.lastPositions.get(icao24);
    if (lastPosition) {
      // Calculer la distance parcourue
      const distance = this.calculateDistance(
        lastPosition.position[0],
        lastPosition.position[1],
        flight.latitude,
        flight.longitude
      );

      const timeDiff = flight.time_position - lastPosition.timestamp;
      
      // Mettre à jour les statistiques
      currentStats.distanceTraveled += distance;
      currentStats.flightTime += timeDiff;
      currentStats.averageSpeed = currentStats.distanceTraveled / currentStats.flightTime;
      
      if (flight.geo_altitude !== null) {
        currentStats.minAltitude = Math.min(currentStats.minAltitude, flight.geo_altitude);
        currentStats.maxAltitude = Math.max(currentStats.maxAltitude, flight.geo_altitude);
        currentStats.averageAltitude = (currentStats.minAltitude + currentStats.maxAltitude) / 2;
      }
    }

    // Sauvegarder la position actuelle
    this.lastPositions.set(icao24, {
      position: [flight.latitude, flight.longitude],
      altitude: flight.geo_altitude || 0,
      timestamp: flight.time_position,
    });

    this.flightStats.set(icao24, currentStats);
  }

  // Vérifier la proximité avec d'autres avions
  checkProximity(currentFlight: StateVector, allFlights: StateVector[]): ProximityAlert[] {
    if (!currentFlight.latitude || !currentFlight.longitude || !currentFlight.geo_altitude) return [];

    const alerts: ProximityAlert[] = [];
    const currentTime = Date.now();

    for (const otherFlight of allFlights) {
      if (
        otherFlight.icao24 === currentFlight.icao24 ||
        !otherFlight.latitude ||
        !otherFlight.longitude ||
        !otherFlight.geo_altitude
      ) continue;

      const distance = this.calculateDistance(
        currentFlight.latitude,
        currentFlight.longitude,
        otherFlight.latitude,
        otherFlight.longitude
      );

      const verticalSeparation = Math.abs(currentFlight.geo_altitude - otherFlight.geo_altitude);

      if (distance < this.PROXIMITY_THRESHOLD && verticalSeparation < this.VERTICAL_THRESHOLD) {
        const alert: ProximityAlert = {
          aircraft1: currentFlight,
          aircraft2: otherFlight,
          distance,
          verticalSeparation,
          timestamp: currentTime,
        };
        alerts.push(alert);
        this.proximityAlerts.push(alert);
      }
    }

    // Nettoyer les anciennes alertes (plus de 5 minutes)
    this.proximityAlerts = this.proximityAlerts.filter(
      alert => currentTime - alert.timestamp < 5 * 60 * 1000
    );

    return alerts;
  }

  // Obtenir les statistiques d'un vol
  getFlightStats(icao24: string): FlightStats | null {
    return this.flightStats.get(icao24) || null;
  }

  // Obtenir les alertes de proximité récentes
  getRecentProximityAlerts(): ProximityAlert[] {
    return this.proximityAlerts;
  }

  // Rechercher un vol par son numéro de vol (callsign)
  findFlightByCallsign(callsign: string, flights: StateVector[]): StateVector | null {
    const normalizedCallsign = callsign.trim().toUpperCase();
    return flights.find(flight => flight.callsign?.trim().toUpperCase() === normalizedCallsign) || null;
  }

  // Nettoyer les données anciennes
  cleanup() {
    const currentTime = Date.now();
    const maxAge = 15 * 60 * 1000; // 15 minutes

    for (const [icao24, data] of this.lastPositions.entries()) {
      if (currentTime - data.timestamp * 1000 > maxAge) {
        this.lastPositions.delete(icao24);
        this.flightStats.delete(icao24);
      }
    }
  }
}

// Export a singleton instance
export const flightAnalyticsService = new FlightAnalyticsService(); 