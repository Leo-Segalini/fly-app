'use client';

import { StateVector } from '@/types/opensky';
import { flightAnalyticsService } from '@/services/flightAnalytics';
import { useState, useCallback } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import { CSSTransition } from 'react-transition-group';

interface FlightSearchProps {
  flights: StateVector[];
  onFlightFound: (flight: StateVector) => void;
}

export function FlightSearch({ flights, onFlightFound }: FlightSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) {
      setError('Veuillez entrer un numéro de vol');
      return;
    }

    const flight = flightAnalyticsService.findFlightByCallsign(searchQuery, flights);
    if (flight) {
      setError(null);
      onFlightFound(flight);
      setIsExpanded(false);
    } else {
      setError('Vol non trouvé');
    }
  }, [searchQuery, flights, onFlightFound]);

  return (
    <div className="absolute top-4 left-4 z-[1000]">
      <div className={`glass-panel transition-all duration-300 ${isExpanded ? 'w-72' : 'w-12'}`}>
        <div className="relative flex items-center p-2">
          {!isExpanded && (
            <button
              onClick={() => setIsExpanded(true)}
              className="w-8 h-8 flex items-center justify-center text-primary hover:text-primary-dark transition-colors"
              title="Ouvrir la recherche"
              aria-label="Ouvrir la recherche de vol"
            >
              <FiSearch size={20} />
            </button>
          )}

          <CSSTransition
            in={isExpanded}
            timeout={300}
            classNames="fade"
            unmountOnExit
          >
            <div className="flex-1 flex items-center space-x-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setError(null);
                  }}
                  placeholder="Rechercher un vol..."
                  className="w-full bg-transparent border-b border-primary/30 focus:border-primary px-2 py-1 outline-none text-foreground placeholder-foreground/50"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
                {error && (
                  <p className="absolute left-2 top-full mt-1 text-xs text-secondary">
                    {error}
                  </p>
                )}
              </div>
              <button
                onClick={handleSearch}
                className="primary-button !p-2"
                title="Rechercher"
              >
                <FiSearch size={16} />
              </button>
              <button
                onClick={() => {
                  setIsExpanded(false);
                  setSearchQuery('');
                  setError(null);
                }}
                className="secondary-button !p-2"
                title="Fermer"
              >
                <FiX size={16} />
              </button>
            </div>
          </CSSTransition>
        </div>
      </div>
    </div>
  );
} 