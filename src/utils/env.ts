export const env = {
  isProduction: process.env.NEXT_PUBLIC_APP_ENV === 'production',
  isDevelopment: process.env.NEXT_PUBLIC_APP_ENV === 'development',
  isTest: process.env.NEXT_PUBLIC_APP_ENV === 'test',

  app: {
    env: process.env.NEXT_PUBLIC_APP_ENV,
    url: process.env.NEXT_PUBLIC_APP_URL,
  },

  api: {
    url: process.env.NEXT_PUBLIC_OPENSKY_API_URL,
    credentials: {
      username: process.env.OPENSKY_USERNAME,
      password: process.env.OPENSKY_PASSWORD,
    },
  },

  map: {
    center: {
      lat: parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LAT),
      lng: parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LNG),
    },
    defaultZoom: parseInt(process.env.NEXT_PUBLIC_MAP_DEFAULT_ZOOM, 10),
  },

  cache: {
    ttl: parseInt(process.env.CACHE_TTL, 10),
  },
} as const;

// Validation function to ensure all required environment variables are set
export function validateEnv(): void {
  const requiredVars = [
    'NEXT_PUBLIC_APP_ENV',
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_OPENSKY_API_URL',
    'NEXT_PUBLIC_MAP_CENTER_LAT',
    'NEXT_PUBLIC_MAP_CENTER_LNG',
    'NEXT_PUBLIC_MAP_DEFAULT_ZOOM',
    'CACHE_TTL',
  ];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }
} 