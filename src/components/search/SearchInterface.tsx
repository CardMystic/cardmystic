"use client";

import { useEffect, useState } from "react";
import type { WordSearch } from "../../models/searchModel";
import { Filters } from "./Filters";
import { SearchBar } from "./SearchBar";

interface SearchInterfaceProps {
  onSearch: (searchData: WordSearch) => void;
  initialQuery?: string;
}

export function SearchInterface({
  onSearch,
  initialQuery = "",
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

    onSearch(searchData);
  };

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
  };

  const handleFiltersChange = (newFilters: WordSearch["filters"]) => {
    setFilters(newFilters);
  };

  return (
    <div className="w-full space-y-0">
      <SearchBar
        query={query}
        onQueryChange={handleQueryChange}
        onFiltersToggle={() => setShowFilters(!showFilters)}
        onSearch={handleSearch}
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
