"use client";

import { useEffect, useState } from "react";
import type { WordSearch } from "../../models/searchModel";
import { Filters } from "./Filters";
import { SearchBar } from "./SearchBar";

interface SearchInterfaceProps {
  onSearch: (searchData: WordSearch) => void;
  initialQuery?: string;
  onRedirect?: (searchData: WordSearch) => void;
}

export function SearchInterface({
  onSearch,
  initialQuery = "",
  onRedirect,
}: SearchInterfaceProps) {
  const [query, setQuery] = useState(initialQuery);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<WordSearch["filters"]>({
    selectedCardTypes: [],
    selectedColorFilterOption: "Contains At Least",
    selectedColors: {
      White: false,
      Blue: false,
      Black: false,
      Red: false,
      Green: false,
    },
    selectedRarities: {},
    selectedCMCOption: "Equal To",
    selectedPowerOption: "Equal To",
    selectedToughnessOption: "Equal To",
    selectedCMC: "",
    selectedPower: "",
    selectedToughness: "",
    selectedCardFormats: [],
  });

  // Update query when initialQuery changes
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSearch = () => {
    const searchData: WordSearch = {
      query,
      limit: 10,
      filters,
      exclude_card_data: false,
    };

    if (onRedirect) {
      onRedirect(searchData);
    } else {
      onSearch(searchData);
    }
  };

  const handleEnterKeySearch = () => {
    // On Enter key, prioritize redirect if available, otherwise do regular search
    const searchData: WordSearch = {
      query,
      limit: 10,
      filters,
      exclude_card_data: false,
    };

    if (onRedirect) {
      onRedirect(searchData);
    } else {
      onSearch(searchData);
    }
  };

  // Automatically trigger search when query changes (debounced in real implementation)
  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
    // You might want to add debouncing here in a real implementation
    if (newQuery.trim()) {
      const searchData: WordSearch = {
        query: newQuery,
        limit: 10,
        filters,
        exclude_card_data: false,
      };
      onSearch(searchData);
    }
  };

  const handleFiltersChange = (newFilters: WordSearch["filters"]) => {
    setFilters(newFilters);
    // Auto-search when filters change if there's a query
    if (query.trim()) {
      const searchData: WordSearch = {
        query,
        limit: 10,
        filters: newFilters,
        exclude_card_data: false,
      };
      onSearch(searchData);
    }
  };

  return (
    <div className="w-full space-y-0">
      <SearchBar
        query={query}
        onQueryChange={handleQueryChange}
        onFiltersToggle={() => setShowFilters(!showFilters)}
        onSearch={handleEnterKeySearch}
        showFilters={showFilters}
      />
      <Filters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        isVisible={showFilters}
      />
    </div>
  );
}
