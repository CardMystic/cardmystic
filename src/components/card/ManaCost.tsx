import React from "react";

interface ManaCostProps {
  cost?: string;
  className?: string;
  size?: "small" | "medium" | "large";
}

export function ManaCost({
  cost,
  className = "",
  size = "medium",
}: ManaCostProps) {
  if (!cost) {
    return null;
  }

  // Parse mana cost string and extract mana symbols
  // MTG mana costs are typically in format like "{2}{U}{B}" or "{X}{R}{R}"
  const manaSymbols = cost.match(/\{[^}]+\}/g) || [];

  const sizeClasses = {
    small: "text-sm",
    medium: "text-base",
    large: "text-lg",
  };

  return (
    <div
      className={`flex items-center gap-0.5 ${sizeClasses[size]} ${className}`}
    >
      {manaSymbols.map((symbol, index) => {
        // Remove the curly braces from the symbol
        const cleanSymbol = symbol.replace(/[{}]/g, "").toLowerCase();

        // Use a unique key based on the cleaned symbol and its position
        return (
          <i
            // biome-ignore lint/suspicious/noArrayIndexKey: Using index as key is acceptable here since symbols are static
            key={`${cleanSymbol}-${index}`}
            className={`ms ms-${cleanSymbol} ms-cost inline-block`}
          />
        );
      })}
    </div>
  );
}
