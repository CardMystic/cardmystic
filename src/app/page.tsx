"use client";

import { Button } from "@/components/catalyst/button";
import { Input } from "@/components/catalyst/input";
import { SearchInterface } from "@/components/search";
import type { WordSearch } from "@/models/searchModel";
import {
  ChatBubbleLeftRightIcon,
  CurrencyDollarIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

export default function Home() {
  const [searchResults, setSearchResults] = useState<WordSearch | null>(null);

  const handleSearch = (searchData: WordSearch) => {
    console.log("Search triggered:", searchData);
    setSearchResults(searchData);
    // Here you would typically make an API call to your backend
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
