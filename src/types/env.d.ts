declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_APP_ENV: 'development' | 'test' | 'production'
    NEXT_PUBLIC_APP_URL: string
    NEXT_PUBLIC_OPENSKY_API_URL: string
    OPENSKY_USERNAME: string
    OPENSKY_PASSWORD: string
    NEXT_PUBLIC_MAP_CENTER_LAT: string
    NEXT_PUBLIC_MAP_CENTER_LNG: string
    NEXT_PUBLIC_MAP_DEFAULT_ZOOM: string
    CACHE_TTL: string
  }
} 