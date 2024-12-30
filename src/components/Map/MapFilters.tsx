'use client';

import { useState, useCallback } from 'react';
import { FiFilter, FiX } from 'react-icons/fi';
import { CSSTransition } from 'react-transition-group';

interface MapFiltersProps {
  onFilterChange: (filters: {
    minAltitude?: number;
    maxAltitude?: number;
  }) => void;
}

export function MapFilters({ onFilterChange }: MapFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [minAltitude, setMinAltitude] = useState<string>('');
  const [maxAltitude, setMaxAltitude] = useState<string>('');

  const handleFilterChange = useCallback(() => {
    onFilterChange({
      minAltitude: minAltitude ? parseInt(minAltitude, 10) : undefined,
      maxAltitude: maxAltitude ? parseInt(maxAltitude, 10) : undefined,
    });
  }, [minAltitude, maxAltitude, onFilterChange]);

  const clearFilters = useCallback(() => {
    setMinAltitude('');
    setMaxAltitude('');
    onFilterChange({});
  }, [onFilterChange]);

  return (
    <div className="absolute top-4 right-4 z-[1000]">
      <div className={`glass-panel transition-all duration-300 ${isExpanded ? 'w-72' : 'w-12'}`}>
        <div className="relative flex items-center p-2">
          {!isExpanded && (
            <button
              onClick={() => setIsExpanded(true)}
              className="w-8 h-8 flex items-center justify-center text-primary hover:text-primary-dark transition-colors"
              title="Ouvrir les filtres"
              aria-label="Ouvrir les filtres"
            >
              <FiFilter size={20} />
            </button>
          )}

          <CSSTransition
            in={isExpanded}
            timeout={300}
            classNames="fade"
            unmountOnExit
          >
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">Filtres</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={clearFilters}
                    className="secondary-button !p-2"
                    title="Réinitialiser les filtres"
                  >
                    <FiX size={16} />
                  </button>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="secondary-button !p-2"
                    title="Fermer"
                  >
                    <FiX size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <label htmlFor="min-altitude" className="block text-xs text-foreground/70">
                    Altitude minimale (m)
                  </label>
                  <input
                    id="min-altitude"
                    type="number"
                    value={minAltitude}
                    onChange={(e) => {
                      setMinAltitude(e.target.value);
                      handleFilterChange();
                    }}
                    placeholder="0"
                    className="w-full bg-transparent border-b border-primary/30 focus:border-primary px-2 py-1 outline-none text-foreground placeholder-foreground/50 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="max-altitude" className="block text-xs text-foreground/70">
                    Altitude maximale (m)
                  </label>
                  <input
                    id="max-altitude"
                    type="number"
                    value={maxAltitude}
                    onChange={(e) => {
                      setMaxAltitude(e.target.value);
                      handleFilterChange();
                    }}
                    placeholder="12000"
                    className="w-full bg-transparent border-b border-primary/30 focus:border-primary px-2 py-1 outline-none text-foreground placeholder-foreground/50 text-sm"
                  />
                </div>
              </div>
            </div>
          </CSSTransition>
        </div>
      </div>
    </div>
  );
} 