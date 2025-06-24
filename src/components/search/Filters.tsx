"use client";

import { ChevronDownIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import { Button } from "@/components/catalyst/button";
import { Checkbox, CheckboxField } from "@/components/catalyst/checkbox";

import { Field, FieldGroup } from "@/components/catalyst/fieldset";
import { Input } from "@/components/catalyst/input";
import { Select } from "@/components/catalyst/select";
import { Text } from "@/components/catalyst/text";
import { FormatFilter } from "@/components/search/FormatFilter";
import { CardRarity, CardType } from "@/models/cardModel";
import {
  type CardSearchFilters,
  CardSearchFiltersSchema,
  type ColorFilterOption,
  type ComparisonOperator,
} from "@/models/searchModel";

interface FiltersProps {
  filters: CardSearchFilters;
  onFiltersChange: (filters: CardSearchFilters) => void;
  isVisible: boolean;
}

const COLORS = [
  { key: "White", className: "ms ms-w ms-cost" },
  { key: "Blue", className: "ms ms-u ms-cost" },
  { key: "Black", className: "ms ms-b ms-cost" },
  { key: "Red", className: "ms ms-r ms-cost" },
  { key: "Green", className: "ms ms-g ms-cost" },
] as const;

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  sectionKey: string;
  expandedSections: Set<string>;
  onToggleSection: (section: string) => void;
}

const FilterSection = ({
  title,
  children,
  sectionKey,
  expandedSections,
  onToggleSection,
}: FilterSectionProps) => {
  const isExpanded = expandedSections.has(sectionKey);

  return (
    <div className="border-b border-zinc-200 dark:border-zinc-700">
      <button
        type="button"
        className="flex w-full items-center justify-between py-4 text-left"
        onClick={() => onToggleSection(sectionKey)}
      >
        <Text className="font-medium text-zinc-900 dark:text-zinc-100">
          {title}
        </Text>
        <ChevronDownIcon
          className={`h-5 w-5 text-zinc-500 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export function Filters({ filters, onFiltersChange, isVisible }: FiltersProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["colors"]),
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const updateFilters = (updates: Partial<CardSearchFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const clearAllFilters = () => {
    onFiltersChange(CardSearchFiltersSchema.parse({}));
  };

  const hasActiveFilters = () => {
    return (
      filters.selectedCardTypes.length > 0 ||
      Object.values(filters.selectedColors || {}).some(Boolean) ||
      Object.values(filters.selectedRarities || {}).some(Boolean) ||
      filters.selectedCMC !== "" ||
      filters.selectedPower !== "" ||
      filters.selectedToughness !== "" ||
      filters.selectedCardFormats.length > 0
    );
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="px-4 py-6">
            <div className="mb-4 flex items-center justify-between">
              <Text className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Advanced Filters
              </Text>
              <Button
                color="light"
                onClick={clearAllFilters}
                disabled={!hasActiveFilters()}
                className="text-sm"
              >
                <XMarkIcon data-slot="icon" />
                Clear All
              </Button>
            </div>

            <div className="space-y-0">
              {/* Card Types */}
              <FilterSection
                title="Card Types"
                sectionKey="cardTypes"
                expandedSections={expandedSections}
                onToggleSection={toggleSection}
              >
                <FieldGroup>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {CardType.options.map((type) => (
                      <CheckboxField key={type}>
                        <Checkbox
                          checked={filters.selectedCardTypes.includes(type)}
                          onChange={(checked) => {
                            const newTypes = checked
                              ? [...filters.selectedCardTypes, type]
                              : filters.selectedCardTypes.filter(
                                  (t) => t !== type,
                                );
                            updateFilters({ selectedCardTypes: newTypes });
                          }}
                        />
                        <Text>{type}</Text>
                      </CheckboxField>
                    ))}
                  </div>
                </FieldGroup>
              </FilterSection>

              {/* Colors */}
              <FilterSection
                title="Colors"
                sectionKey="colors"
                expandedSections={expandedSections}
                onToggleSection={toggleSection}
              >
                <FieldGroup>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-4 items-center">
                      {COLORS.map(({ key, className }) => (
                        <CheckboxField
                          key={key}
                          className="flex-row items-center gap-2"
                        >
                          <Checkbox
                            checked={
                              filters.selectedColors?.[
                                key as keyof typeof filters.selectedColors
                              ] || false
                            }
                            onChange={(checked) => {
                              updateFilters({
                                selectedColors: {
                                  White: false,
                                  Blue: false,
                                  Black: false,
                                  Red: false,
                                  Green: false,
                                  ...filters.selectedColors,
                                  [key]: checked,
                                },
                              });
                            }}
                          />
                          <span className={`${className} text-lg`} />
                          <Text className="font-medium">{key}</Text>
                        </CheckboxField>
                      ))}

                      {/* Colorless checkbox */}
                      <CheckboxField className="flex-row items-center gap-2">
                        <Checkbox
                          checked={false}
                          onChange={() => {
                            // Handle colorless selection if needed
                          }}
                        />
                        <span className="ms ms-c ms-cost text-lg" />
                        <Text className="font-medium">Colorless</Text>
                      </CheckboxField>
                    </div>

                    <div className="flex items-center gap-4">
                      <Select
                        value={filters.selectedColorFilterOption}
                        onChange={(e) =>
                          updateFilters({
                            selectedColorFilterOption: e.target
                              .value as ColorFilterOption,
                          })
                        }
                        className="w-48"
                      >
                        <option value="Match Exactly">
                          Exactly these colors
                        </option>
                        <option value="Contains At Least">Including</option>
                        <option value="Contains At Most">At most</option>
                      </Select>
                    </div>

                    <Text className="text-sm text-zinc-600 dark:text-zinc-400 italic">
                      "Including" means cards that are all the colors you
                      select, with or without any others. "At most" means cards
                      that have some or all of the colors you select, plus
                      colorless.
                    </Text>
                  </div>
                </FieldGroup>
              </FilterSection>

              {/* Rarity */}
              <FilterSection
                title="Rarity"
                sectionKey="rarity"
                expandedSections={expandedSections}
                onToggleSection={toggleSection}
              >
                <FieldGroup>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {CardRarity.options.map((rarity) => (
                      <CheckboxField key={rarity}>
                        <Checkbox
                          checked={
                            filters.selectedRarities?.[
                              rarity as keyof typeof filters.selectedRarities
                            ] || false
                          }
                          onChange={(checked) => {
                            updateFilters({
                              selectedRarities: {
                                ...filters.selectedRarities,
                                [rarity]: checked,
                              },
                            });
                          }}
                        />
                        <Text>{rarity}</Text>
                      </CheckboxField>
                    ))}
                  </div>
                </FieldGroup>
              </FilterSection>

              {/* Stats */}
              <FilterSection
                title="Card Stats"
                sectionKey="stats"
                expandedSections={expandedSections}
                onToggleSection={toggleSection}
              >
                <FieldGroup>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {/* CMC */}
                    <Field>
                      <Text className="mb-2 text-sm font-medium">
                        Converted Mana Cost
                      </Text>
                      <div className="space-y-2">
                        <Select
                          value={filters.selectedCMCOption}
                          onChange={(e) =>
                            updateFilters({
                              selectedCMCOption: e.target
                                .value as ComparisonOperator,
                            })
                          }
                        >
                          <option value="Equal To">Equal To</option>
                          <option value="Not Equal To">Not Equal To</option>
                          <option value="Greater Than">Greater Than</option>
                          <option value="Less Than">Less Than</option>
                        </Select>
                        <Input
                          type="number"
                          placeholder="CMC"
                          value={filters.selectedCMC}
                          onChange={(e) =>
                            updateFilters({ selectedCMC: e.target.value })
                          }
                          min="0"
                        />
                      </div>
                    </Field>

                    {/* Power */}
                    <Field>
                      <Text className="mb-2 text-sm font-medium">Power</Text>
                      <div className="space-y-2">
                        <Select
                          value={filters.selectedPowerOption}
                          onChange={(e) =>
                            updateFilters({
                              selectedPowerOption: e.target
                                .value as ComparisonOperator,
                            })
                          }
                        >
                          <option value="Equal To">Equal To</option>
                          <option value="Not Equal To">Not Equal To</option>
                          <option value="Greater Than">Greater Than</option>
                          <option value="Less Than">Less Than</option>
                        </Select>
                        <Input
                          type="number"
                          placeholder="Power"
                          value={filters.selectedPower}
                          onChange={(e) =>
                            updateFilters({ selectedPower: e.target.value })
                          }
                        />
                      </div>
                    </Field>

                    {/* Toughness */}
                    <Field>
                      <Text className="mb-2 text-sm font-medium">
                        Toughness
                      </Text>
                      <div className="space-y-2">
                        <Select
                          value={filters.selectedToughnessOption}
                          onChange={(e) =>
                            updateFilters({
                              selectedToughnessOption: e.target
                                .value as ComparisonOperator,
                            })
                          }
                        >
                          <option value="Equal To">Equal To</option>
                          <option value="Not Equal To">Not Equal To</option>
                          <option value="Greater Than">Greater Than</option>
                          <option value="Less Than">Less Than</option>
                        </Select>
                        <Input
                          type="number"
                          placeholder="Toughness"
                          value={filters.selectedToughness}
                          onChange={(e) =>
                            updateFilters({ selectedToughness: e.target.value })
                          }
                        />
                      </div>
                    </Field>
                  </div>
                </FieldGroup>
              </FilterSection>

              {/* Formats */}
              <FilterSection
                title="Format Legality"
                sectionKey="formats"
                expandedSections={expandedSections}
                onToggleSection={toggleSection}
              >
                <FormatFilter
                  selectedCardFormats={filters.selectedCardFormats}
                  onChange={(selectedCardFormats) =>
                    updateFilters({ selectedCardFormats })
                  }
                />
              </FilterSection>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
