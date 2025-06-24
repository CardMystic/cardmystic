"use client";

import { SearchInterface } from "@/components/search";
import type { WordSearch } from "@/models/searchModel";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const handleSearch = (searchData: WordSearch) => {
    // Build URL with query parameters
    const params = new URLSearchParams({
      q: searchData.query,
      limit: searchData.limit.toString(),
    });

    if (searchData.filters) {
      // Add filters as URL parameters if they have values
      if (searchData.filters.selectedCardTypes.length > 0) {
        params.set("cardTypes", searchData.filters.selectedCardTypes.join(","));
      }

      if (
        searchData.filters.selectedColorFilterOption !== "Contains At Least"
      ) {
        params.set("colorFilter", searchData.filters.selectedColorFilterOption);
      }

      const selectedColors = Object.entries(
        searchData.filters.selectedColors || {},
      )
        .filter(([_, selected]) => selected)
        .map(([color, _]) => color);
      if (selectedColors.length > 0) {
        params.set("colors", selectedColors.join(","));
      }

      if (searchData.filters.selectedCMC) {
        params.set("cmc", searchData.filters.selectedCMC);
        params.set("cmcOp", searchData.filters.selectedCMCOption);
      }

      if (searchData.filters.selectedPower) {
        params.set("power", searchData.filters.selectedPower);
        params.set("powerOp", searchData.filters.selectedPowerOption);
      }

      if (searchData.filters.selectedToughness) {
        params.set("toughness", searchData.filters.selectedToughness);
        params.set("toughnessOp", searchData.filters.selectedToughnessOption);
      }
    }

    router.push(`/search?${params.toString()}`);
  };
  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      {/* Logo */}
      <div className="mb-4">
        <img
          src="/logo.png"
          alt="CardMystic Logo"
          className="mx-auto"
          style={{ width: 220 }}
        />
      </div>
      {/* Title and Subtitle */}
      <h1 className="text-5xl font-extrabold text-purple-400 mb-2">
        CardMystic
      </h1>
      <div className="text-lg italic text-purple-300 mb-1">
        A.I. Search Engine{" "}
        <span className="not-italic text-white">for Magic: The Gathering</span>
      </div>

      {/* Search Input */}
      <SearchInterface onSearch={handleSearch} />
    </div>
  );
}
