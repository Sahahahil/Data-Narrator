import * as React from 'react';
import { createContext, useContext, useState, useCallback, useMemo } from 'react';

interface FilterState {
  dimension: string | null;
  value: string | number | null;
  label: string | null;
}

interface FilterContextType {
  filter: FilterState;
  setFilter: (dimension: string, value: string | number, label: string) => void;
  clearFilter: () => void;
  isFiltered: boolean;
}

// Default no-op context for components used outside FilterProvider
const defaultContext: FilterContextType = {
  filter: { dimension: null, value: null, label: null },
  setFilter: () => {},
  clearFilter: () => {},
  isFiltered: false,
};

const FilterContext = createContext<FilterContextType>(defaultContext);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [filter, setFilterState] = useState<FilterState>({
    dimension: null,
    value: null,
    label: null,
  });

  const setFilter = useCallback((dimension: string, value: string | number, label: string) => {
    setFilterState({ dimension, value, label });
  }, []);

  const clearFilter = useCallback(() => {
    setFilterState({ dimension: null, value: null, label: null });
  }, []);

  const isFiltered = filter.dimension !== null && filter.value !== null;

  const value = useMemo(
    () => ({
      filter,
      setFilter,
      clearFilter,
      isFiltered,
    }),
    [filter, setFilter, clearFilter, isFiltered]
  );

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilter() {
  return useContext(FilterContext);
}

// Helper to apply filter to data
export function applyFilter<T extends Record<string, unknown>>(
  data: T[],
  filter: FilterState
): T[] {
  const { dimension, value } = filter;
  if (!dimension || value === null) return data;
  return data.filter(row => row[dimension] === value);
}