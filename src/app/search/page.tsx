"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Heading } from "../../components/catalyst/heading";
import { Text } from "../../components/catalyst/text";
import { SearchInterface } from "../../components/search";
import type { Card as CardType } from "../../models/cardModel";
import type { WordSearch } from "../../models/searchModel";

interface SearchResult {
  cards: CardType[];
  total: number;
  page: number;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [searchData, setSearchData] = useState<WordSearch>({
    query: "",
    limit: 10,
    filters: {
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
    },
    exclude_card_data: false,
  });
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Parse query parameters on component mount
  useEffect(() => {
    const query = searchParams.get("q") || "";
    const limit = Number.parseInt(searchParams.get("limit") || "10");

    if (query) {
      const initialSearchData: WordSearch = {
        query,
        limit,
        filters: {
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
        },
        exclude_card_data: false,
      };
      setSearchData(initialSearchData);
      performSearch(initialSearchData);
    }
  }, [searchParams]);

  const performSearch = async (data: WordSearch) => {
    if (!data.query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(
          `Search failed: ${response.status} ${response.statusText}`,
        );
      }

      const responseData = await response.json();
      const cards = responseData as CardType[];
      setSearchResult({
        cards,
        total: cards.length,
        page: 1,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while searching",
      );
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (newSearchData: WordSearch) => {
    setSearchData(newSearchData);
    performSearch(newSearchData);

    // Update URL with search parameters
    const url = new URL(window.location.href);
    url.searchParams.set("q", newSearchData.query);
    url.searchParams.set("limit", newSearchData.limit.toString());
    window.history.pushState({}, "", url.toString());
  };

  const handleQueryChange = (query: string) => {
    const newSearchData = { ...searchData, query };
    setSearchData(newSearchData);

    if (query.trim()) {
      performSearch(newSearchData);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Heading level={1} className="mb-2">
            CardMystic Search
          </Heading>
          <Text className="text-zinc-600 dark:text-zinc-400">
            Find Magic: The Gathering cards with our AI-powered search
          </Text>
        </div>

        {/* Search Interface */}
        <div className="mb-8">
          <SearchInterface
            onSearch={handleSearch}
            initialQuery={searchData.query}
          />
        </div>

        {/* Results */}
        {loading && (
          <div className="text-center py-12">
            <Text className="text-lg">Searching...</Text>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <Text className="text-lg text-red-600 dark:text-red-400">
              {error}
            </Text>
          </div>
        )}

        {searchResult && !loading && (
          <div>
            {/* Results Header */}
            <div className="mb-6">
              <Text className="text-lg font-semibold">
                Found {searchResult.total} cards
                {searchData.query && ` for "${searchData.query}"`}
              </Text>
            </div>

            {/* Card Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {searchResult.cards.map((card) => (
                <CardDisplay key={card.card_data.id} card={card} />
              ))}
            </div>

            {searchResult.cards.length === 0 && (
              <div className="text-center py-12">
                <Text className="text-lg text-zinc-600 dark:text-zinc-400">
                  No cards found. Try adjusting your search or filters.
                </Text>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface CardDisplayProps {
  card: CardType;
}

function CardDisplay({ card }: CardDisplayProps) {
  const cardData = card.card_data;
  const imageUrl =
    cardData.image_uris?.normal || cardData.card_faces?.[0]?.image_uris?.normal;
  const score = card.score ? card.score.toFixed(0) : null;

  return (
    <div className="group relative bg-white dark:bg-zinc-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden">
      {/* Card Image */}
      <div className="aspect-[5/7] relative overflow-hidden bg-zinc-100 dark:bg-zinc-700">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={cardData.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Text className="text-zinc-400">No Image</Text>
          </div>
        )}

        {/* Score Badge */}
        {score && (
          <div className="absolute bottom-2 right-2 bg-black/75 text-white px-2 py-1 rounded text-sm font-semibold">
            {score}%
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className="p-4">
        <div className="mb-2">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
            {cardData.name} - {cardData.mana_cost}
          </h3>
        </div>
      </div>
    </div>
  );
}
