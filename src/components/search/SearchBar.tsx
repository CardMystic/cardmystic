"use client";

import {
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Button } from "../catalyst/button";
import { Input, InputGroup } from "../catalyst/input";

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onFiltersToggle: () => void;
  showFilters: boolean;
}

const searchExamples: string[] = [
  "Blue creatures with flash",
  "Green creatures with trample and power 4 or greater",
  "White creatures that gain life",
  "Black creatures that sacrifice other creatures",
  "Red hasty creatures under 3 mana",
  "White board wipes",
  "Blue counterspells that cost 2 mana",
  "Black removal spells that exile",
  "Red burn spells that hit players",
  "Green ramp spells under 3 mana",
  "Artifacts that tap for mana",
  "Enchantments that draw cards",
  "Cards that put +1/+1 counters on creatures",
  "Instants and sorceries that cost X mana",
  "Standard legal red aggro cards",
  "Modern playable artifact creatures",
  "Pioneer legal graveyard hate",
  "Cards that care about artifacts entering the battlefield",
  "Creatures that get bigger when other creatures die",
  "Spells that let you cast cards from your graveyard",
];

export function SearchBar({
  query,
  onQueryChange,
  onFiltersToggle,
  showFilters,
}: SearchBarProps) {
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentExampleIndex(
        (prevIndex) => (prevIndex + 1) % searchExamples.length,
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex gap-3">
      <div className="flex-1 relative">
        <InputGroup>
          <MagnifyingGlassIcon data-slot="icon" />
          <Input
            type="search"
            placeholder={
              query !== "" || isFocused
                ? "Search for Magic: The Gathering cards..."
                : ""
            }
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="relative"
          />
          {query === "" && !isFocused && (
            <div className="absolute inset-0 pointer-events-none flex items-center">
              <div className="ml-10 sm:ml-8 flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentExampleIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{
                      duration: 0.5,
                      ease: "easeInOut",
                    }}
                    className="text-zinc-500 dark:text-zinc-400 text-base/6 sm:text-sm/6 truncate"
                  >
                    {searchExamples[currentExampleIndex]}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          )}
        </InputGroup>
      </div>
      <Button
        color={showFilters ? "blue" : "light"}
        onClick={onFiltersToggle}
        aria-label="Toggle filters"
      >
        <AdjustmentsHorizontalIcon data-slot="icon" />
        Filters
      </Button>
    </div>
  );
}
