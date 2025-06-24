"use client";

import { useEffect, useState } from "react";

import { Filters } from "@/components/search/Filters";
import { SearchBar } from "@/components/search/SearchBar";
import {
  type CardSearchFilters,
  CardSearchFiltersSchema,
  type WordSearch,
} from "@/models/searchModel";

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
  const [filters, setFilters] = useState<CardSearchFilters>(
    CardSearchFiltersSchema.parse({}), // Initialize with default filters
  );

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

  const handleFiltersChange = (newFilters: CardSearchFilters) => {
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
