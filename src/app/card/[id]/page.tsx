"use client";

import { ChevronLeftIcon, LinkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ManaCost } from "@/components/card/ManaCost";
import { Badge } from "@/components/catalyst/badge";
import { Button } from "@/components/catalyst/button";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "@/components/catalyst/description-list";
import { Heading } from "@/components/catalyst/heading";
import { Text } from "@/components/catalyst/text";
import type { ScryfallCard } from "@/models/cardModel";

export default function CardPage() {
  const params = useParams();
  const cardId = params?.id as string;
  const [card, setCard] = useState<ScryfallCard>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [searchScore, setSearchScore] = useState<string | null>(null);

  useEffect(() => {
    const fetchCard = async () => {
      if (!cardId) return;

      setLoading(true);
      setError(undefined);

      try {
        // Check for stored score
        if (typeof window !== "undefined") {
          const storedScore = localStorage.getItem(`card-score-${cardId}`);
          if (storedScore) {
            setSearchScore(storedScore);
            // Clean up the stored score after retrieving it
            localStorage.removeItem(`card-score-${cardId}`);
          }
        }

        // Fetch card from Scryfall API
        const response = await fetch(
          `https://api.scryfall.com/cards/${cardId}`,
          { cache: "force-cache" },
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch card: ${response.status} ${response.statusText}`,
          );
        }

        const cardData = (await response.json()) as ScryfallCard;
        setCard(cardData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred while fetching the card",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCard();
  }, [cardId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
        <Text className="text-lg">Loading card...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <Text className="text-lg text-red-600 dark:text-red-400 mb-4">
            {error}
          </Text>
          <Link href="/">
            <Button color="blue">Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <Text className="text-lg text-zinc-600 dark:text-zinc-400 mb-4">
            Card not found
          </Text>
          <Link href="/">
            <Button color="blue">Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const imageUrl =
    card.image_uris?.large ||
    card.image_uris?.normal ||
    card.card_faces?.[0]?.image_uris?.large;
  const rarity = card.rarity;
  const rarityColors = {
    common: "zinc",
    uncommon: "yellow",
    rare: "blue",
    mythic: "red",
  } as const;

  const getLegalityColor = (legality: string) => {
    switch (legality) {
      case "legal":
        return "green";
      case "not_legal":
        return "red";
      case "restricted":
        return "yellow";
      case "banned":
        return "red";
      default:
        return "zinc";
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            color="light"
            className="mb-4"
            onClick={() => window.history.back()}
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Back
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card Image */}
          <div className="flex justify-center">
            <div className="relative">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={card.name}
                  className="rounded-2xl shadow-2xl max-w-full h-auto"
                  style={{ maxHeight: "600px" }}
                />
              ) : (
                <div className="w-80 h-96 bg-zinc-200 dark:bg-zinc-700 rounded-2xl flex items-center justify-center shadow-2xl">
                  <Text className="text-zinc-500">No Image Available</Text>
                </div>
              )}
            </div>
          </div>

          {/* Card Details */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Heading level={1} className="text-2xl lg:text-3xl">
                  {card.name}
                </Heading>
                {card.mana_cost && (
                  <ManaCost cost={card.mana_cost} size="large" />
                )}
                {searchScore && (
                  <Badge color="blue" className="text-sm font-semibold">
                    {searchScore}% Match
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Text className="text-lg text-zinc-600 dark:text-zinc-400">
                  {card.type_line}
                </Text>
                <Badge
                  color={
                    rarityColors[rarity as keyof typeof rarityColors] || "zinc"
                  }
                  className="capitalize"
                >
                  {rarity}
                </Badge>
              </div>

              {/* Set Information */}
              <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                {card.set_name} ({card.set.toUpperCase()}) • #
                {card.collector_number}
              </Text>
            </div>

            {/* Oracle Text */}
            {card.oracle_text && (
              <div>
                <Heading level={3} className="text-lg mb-2">
                  Oracle Text
                </Heading>
                <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                  <Text className="whitespace-pre-line leading-relaxed">
                    {card.oracle_text}
                  </Text>
                </div>
              </div>
            )}

            {/* Power/Toughness/Loyalty */}
            {(card.power || card.toughness || card.loyalty) && (
              <div>
                <Heading level={3} className="text-lg mb-2">
                  Stats
                </Heading>
                <div className="flex gap-4">
                  {card.power && card.toughness && (
                    <div className="bg-white dark:bg-zinc-800 rounded-lg px-4 py-2 border border-zinc-200 dark:border-zinc-700">
                      <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                        Power/Toughness
                      </Text>
                      <Text className="text-lg font-bold">
                        {card.power}/{card.toughness}
                      </Text>
                    </div>
                  )}
                  {card.loyalty && (
                    <div className="bg-white dark:bg-zinc-800 rounded-lg px-4 py-2 border border-zinc-200 dark:border-zinc-700">
                      <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                        Loyalty
                      </Text>
                      <Text className="text-lg font-bold">{card.loyalty}</Text>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additional Info */}
            <DescriptionList>
              <DescriptionTerm>Mana Value</DescriptionTerm>
              <DescriptionDetails>{card.cmc}</DescriptionDetails>

              {card.colors && card.colors.length > 0 && (
                <>
                  <DescriptionTerm>Colors</DescriptionTerm>
                  <DescriptionDetails>
                    {card.colors.join(", ")}
                  </DescriptionDetails>
                </>
              )}

              {card.artist && (
                <>
                  <DescriptionTerm>Artist</DescriptionTerm>
                  <DescriptionDetails>{card.artist}</DescriptionDetails>
                </>
              )}

              <DescriptionTerm>Released</DescriptionTerm>
              <DescriptionDetails>
                {new Date(card.released_at).toLocaleDateString()}
              </DescriptionDetails>
            </DescriptionList>

            {/* Legalities */}
            {card.legalities && (
              <div>
                <Heading level={3} className="text-lg mb-3">
                  Format Legality
                </Heading>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(card.legalities).map(([format, legality]) => (
                    <div
                      key={format}
                      className="flex items-center justify-between p-2 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700"
                    >
                      <Text className="text-sm font-medium capitalize">
                        {format.replace(/([A-Z])/g, " $1").trim()}
                      </Text>
                      <Badge
                        color={getLegalityColor(legality)}
                        className="text-xs capitalize"
                      >
                        {legality.replace("_", " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* External Links */}
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
              <div className="flex gap-3">
                <a
                  href={card.scryfall_uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <LinkIcon className="w-4 h-4" />
                  <Text className="text-sm">View on Scryfall</Text>
                </a>
                {card.purchase_uris?.tcgplayer && (
                  <a
                    href={card.purchase_uris.tcgplayer}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <LinkIcon className="w-4 h-4" />
                    <Text className="text-sm">Buy on TCGPlayer</Text>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
