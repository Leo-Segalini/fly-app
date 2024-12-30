export interface StateVector {
  icao24: string;          // Unique ICAO 24-bit address of the transponder
  callsign: string | null; // Callsign of the vehicle
  origin_country: string;  // Country name inferred from the ICAO 24-bit address
  time_position: number | null;   // Unix timestamp for the last position update
  last_contact: number;    // Unix timestamp for the last update in general
  longitude: number | null;      // WGS-84 longitude in decimal degrees
  latitude: number | null;       // WGS-84 latitude in decimal degrees
  baro_altitude: number | null;  // Barometric altitude in meters
  on_ground: boolean;     // Boolean value which indicates if the position was retrieved from a surface position report
  velocity: number | null;       // Velocity over ground in m/s
  true_track: number | null;     // True track in decimal degrees clockwise from north
  vertical_rate: number | null;  // Vertical rate in m/s
  sensors: number[] | null;      // IDs of the receivers which contributed to this state vector
  geo_altitude: number | null;   // Geometric altitude in meters
  squawk: string | null;  // The transponder code aka Squawk
  spi: boolean;          // Whether flight status indicates special purpose indicator
  position_source: number; // Origin of this state's position
  category: number | null; // Aircraft category
}

export interface StateVectorResponse {
  time: number;           // Unix timestamp for the validity period of states
  states: (string | number | boolean | null)[][]; // Raw state vectors that need to be parsed
}

export interface BoundingBox {
  lamin: number;  // Latitude minimale
  lomin: number;  // Longitude minimale
  lamax: number;  // Latitude maximale
  lomax: number;  // Longitude maximale
}

export interface FlightTrack {
  icao24: string;
  callsign?: string;
  startTime: number;
  endTime: number;
  path: Array<{
    time: number;
    latitude: number;
    longitude: number;
    altitude: number;
    velocity: number;
    heading: number;
  }>;
  airport?: string;
  estDepartureAirport?: string;
  estArrivalAirport?: string;
}

export interface FlightInfo {
  route?: string;
  aircraft_type?: string;
  operator?: string;
  status: 'En vol' | 'Au sol';
  speed: string;
  altitude: string;
  heading: string;
  track?: FlightTrack;
} 