import { env } from '@/utils/env';
import { StateVector, StateVectorResponse, BoundingBox, FlightTrack } from '@/types/opensky';

// Bounding box par défaut pour la France
const FRANCE_BOUNDS: BoundingBox = {
  lamin: 41.2632185, // Latitude minimale
  lomin: -5.4534286, // Longitude minimale
  lamax: 51.268318,  // Latitude maximale
  lomax: 9.8678344   // Longitude maximale
};

class OpenSkyService {
  private baseUrl: string;
  private auth: string | null;
  private lastRequestTime: number = 0;
  private readonly minRequestInterval = 60000; // 60 secondes minimum entre les requêtes pour les utilisateurs non authentifiés
  private readonly authenticatedInterval = 15000; // 15 secondes pour les utilisateurs authentifiés
  private retryCount: number = 0;
  private readonly maxRetries: number = 3;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_OPENSKY_API_URL || 'https://opensky-network.org/api';
    const username = process.env.NEXT_PUBLIC_OPENSKY_USERNAME;
    const password = process.env.NEXT_PUBLIC_OPENSKY_PASSWORD;
    
    this.auth = username && password
      ? btoa(`${username}:${password}`)
      : null;
  }

  private getRequestInterval(): number {
    return this.auth ? this.authenticatedInterval : this.minRequestInterval;
  }

  private async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) return;

    this.isProcessingQueue = true;
    while (this.requestQueue.length > 0) {
      const request = this.requestQueue[0];
      try {
        await request();
      } catch (error) {
        console.error('Error processing queue:', error);
      }
      this.requestQueue.shift();
      if (this.requestQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.getRequestInterval()));
      }
    }
    this.isProcessingQueue = false;
  }

  private async waitForNextRequest() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const interval = this.getRequestInterval();
    
    if (timeSinceLastRequest < interval) {
      await new Promise(resolve => setTimeout(resolve, interval - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();
  }

  private async fetch<T>(endpoint: string, retryCount = 0): Promise<T> {
    try {
      await this.waitForNextRequest();

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (this.auth) {
        headers['Authorization'] = `Basic ${this.auth}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers,
        cache: 'no-store',
      });

      if (!response.ok) {
        if (response.status === 429 && retryCount < this.maxRetries) {
          const waitTime = this.getRequestInterval() * Math.pow(2, retryCount);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          return this.fetch(endpoint, retryCount + 1);
        }

        throw new Error(`OpenSky API error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      if (!data || (data as StateVectorResponse).states?.length === 0) {
        console.warn('No data available from OpenSky API');
        return data;
      }

      return data;
    } catch (error) {
      if (retryCount < this.maxRetries) {
        const waitTime = this.getRequestInterval() * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.fetch(endpoint, retryCount + 1);
      }

      console.error('OpenSky API request failed:', error);
      throw new Error('Failed to fetch data from OpenSky API. Please try again later.');
    }
  }

  private parseStateVector(state: (string | number | boolean | null)[]): StateVector {
    return {
      icao24: state[0] as string,
      callsign: state[1] as string | null,
      origin_country: state[2] as string,
      time_position: state[3] as number | null,
      last_contact: state[4] as number,
      longitude: state[5] as number | null,
      latitude: state[6] as number | null,
      baro_altitude: state[7] as number | null,
      on_ground: state[8] as boolean,
      velocity: state[9] as number | null,
      true_track: state[10] as number | null,
      vertical_rate: state[11] as number | null,
      sensors: state[12] as number[] | null,
      geo_altitude: state[13] as number | null,
      squawk: state[14] as string | null,
      spi: state[15] as boolean,
      position_source: state[16] as number,
      category: state[17] as number | null,
    };
  }

  async getAllStates(): Promise<StateVector[]> {
    return this.getStatesByBoundingBox(FRANCE_BOUNDS);
  }

  async getStatesByBoundingBox(box: BoundingBox = FRANCE_BOUNDS): Promise<StateVector[]> {
    return new Promise((resolve, reject) => {
      const request = async () => {
        try {
          const params = new URLSearchParams({
            lamin: box.lamin.toString(),
            lomin: box.lomin.toString(),
            lamax: box.lamax.toString(),
            lomax: box.lomax.toString(),
          });
          
          const response = await this.fetch<StateVectorResponse>(`/states/all?${params}`);
          resolve(response.states?.map(state => this.parseStateVector(state)) || []);
        } catch (error) {
          reject(error);
        }
      };

      this.requestQueue.push(request);
      this.processQueue();
    });
  }

  async getTrack(icao24: string, time: number): Promise<FlightTrack | null> {
    return new Promise((resolve, reject) => {
      const request = async () => {
        try {
          const response = await this.fetch<FlightTrack>(`/tracks/all?icao24=${icao24}&time=${time}`);
          resolve(response);
        } catch (error) {
          if ((error as Error).message.includes('404')) {
            resolve(null);
          } else {
            reject(error);
          }
        }
      };

      this.requestQueue.push(request);
      this.processQueue();
    });
  }
}

// Export a singleton instance
export const openSkyService = new OpenSkyService(); 