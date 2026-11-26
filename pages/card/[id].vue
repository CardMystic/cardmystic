<template>
  <div class="page-wrapper flex flex-col items-center w-full">
    <LazyCardActionsModal
      v-if="showCardActions && modalCard"
      v-model:open="showCardActions"
      :card="modalCard"
      :actions="cardActions"
      board="Card details"
      :suggest-decks="suggestDecksOnOpen"
    />
    <LazyAddToDeckModal
      v-if="showAddToDeckModal && currentPrinting"
      v-model:open="showAddToDeckModal"
      :oracle-ids="[currentPrinting.oracle_id]"
    />
    <div class="card-detail-background-region w-full">
      <div
        v-if="printingResolved && cardArtUrl && card && !pending && !error"
        class="card-page-background-mask"
        aria-hidden="true"
      >
        <img
          :src="cardArtUrl"
          class="card-page-background"
          alt=""
          decoding="async"
          fetchpriority="low"
        />
      </div>
      <NavigationBreadcrumbs />
      <!-- Navigation tabs (client-only: depends on sessionStorage state) -->
      <ClientOnly>
        <div class="card-page-nav w-full px-4 pt-4">
          <SearchTabs
            v-if="cardOrigin === 'search'"
            :card-active="true"
            @select="navigateToSearch"
          />
          <ExploreTabs
            v-else
            :stats-type="lastExploreType"
            :card-active="true"
            @select="navigateToExplore"
          />
        </div>
        <template #fallback>
          <div class="card-page-nav w-full px-4 pt-4" aria-hidden="true">
            <div
              class="mx-auto flex h-13 w-full max-w-5xl gap-2 mb-4 py-1 lg:h-11 lg:py-0"
            >
              <USkeleton
                v-for="i in 6"
                :key="i"
                class="min-w-0 flex-1 rounded-full"
              />
            </div>
          </div>
        </template>
      </ClientOnly>
      <CardDetailsSkeleton v-if="pending || (!card && !error)" />

      <div v-else-if="error && !pending" class="text-center py-20">
        <UIcon
          v-if="isNotFound"
          name="i-heroicons-magnifying-glass"
          class="w-16 h-16 text-gray-400 mx-auto mb-4"
        />
        <UIcon
          v-else
          name="i-heroicons-exclamation-circle"
          class="w-12 h-12 text-red-500 mx-auto mb-4"
        />
        <h2 v-if="isNotFound" class="text-2xl font-bold text-white mb-2">
          Card Not Found
        </h2>
        <h2 v-else-if="isBadRequest" class="text-2xl font-bold text-white mb-2">
          Invalid Request
        </h2>
        <p v-if="isNotFound" class="mt-4 text-gray-300 max-w-150">
          We apologize, it seems the card with id:
          <strong>{{ oracleIdParam }}</strong> doesn't exist. If you believe
          this is a mistake, please contact us at
          <strong>thecardmystic@gmail.com</strong>.
        </p>
        <p v-else class="mt-4 text-gray-300 max-w-150">{{ errorMessage }}</p>
        <UButton to="/search/all/smart" color="primary" class="mt-6"
          >Back to Search</UButton
        >
      </div>

      <div
        v-else-if="card"
        class="card-detail-section w-full max-w-320 mx-auto grid grid-cols-1 lg:grid-cols-[clamp(300px,32%,420px)_minmax(0,1fr)] gap-2 items-stretch"
      >
        <!-- Left: Card Image -->
        <div
          class="card-detail-art flex min-w-0 flex-col items-center lg:items-start"
        >
          <div class="card-image-container">
            <div
              class="card-glow"
              :class="`glow-${card.rarity?.toLowerCase() || 'common'}`"
            ></div>
            <!-- Single image that changes based on flip state -->
            <button
              type="button"
              :disabled="!printingResolved"
              class="relative z-1 block rounded-2xl cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
              :aria-label="`Options for ${currentPrinting?.name || card.name}`"
              aria-haspopup="dialog"
              :aria-expanded="showCardActions"
              @click="openCardActions(false)"
            >
              <picture>
                <source media="(scripting: none)" :srcset="cardImageUrl" />
                <img
                  :src="printingResolved ? cardImageUrl : undefined"
                  width="500"
                  height="700"
                  class="card-image w-60 h-84 lg:w-full lg:h-auto aspect-[5/7] rounded-2xl object-contain"
                  :class="{ 'bg-elevated': !printingResolved }"
                  @error="printingResolved && handleImageError($event)"
                  :alt="printingResolved ? 'Card image' : ''"
                />
              </picture>
            </button>

            <LazyCardOverlayButtons
              v-if="currentPrinting"
              :card="currentPrinting"
            />
          </div>

          <div class="card-detail-controls w-full max-w-60 lg:max-w-none">
            <!-- Flip Button for Dual-Faced Cards -->
            <UButton
              v-if="isDualFaced"
              variant="solid"
              class="mt-2 flip-btn"
              v-bind="cardActionStyles.flip"
              size="lg"
              @click="flipCard"
            >
              Flip
            </UButton>

            <div class="mt-2 w-full max-w-75 lg:max-w-none">
              <ClientOnly>
                <CardDetailsPrintingSelect
                  v-if="currentPrinting"
                  :card="card"
                  :current="currentPrinting"
                  @select="selectedPrinting = $event"
                />
                <template #fallback>
                  <USkeleton class="h-8 w-full rounded" />
                </template>
              </ClientOnly>
            </div>

            <!-- Action Buttons + TCGPlayer - Desktop only -->
            <div
              class="mt-2 hidden lg:flex flex-row gap-2 w-full max-w-75 lg:max-w-none items-center"
            >
              <UButton
                v-if="currentPrinting && currentPrinting.tcgplayer_id"
                :to="getAffiliateLink(currentPrinting.tcgplayer_id)"
                external
                variant="solid"
                class="tcgplayer-btn flex-1"
                v-bind="cardActionStyles.buy"
                size="lg"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Buy on TCGPlayer"
              >
                Buy {{ tcgPriceLabel }}
              </UButton>
              <UButton
                v-else-if="card.name"
                :to="generateTCGPlayerSearchUrl(card.name)"
                external
                variant="solid"
                class="tcgplayer-btn flex-1"
                v-bind="cardActionStyles.searchMarketplace"
                size="lg"
                aria-label="Search on TCGPlayer"
              >
                Search on TCGPlayer
              </UButton>
              <UTooltip
                v-if="isCommander"
                text="Get Deck Recommendations for this Commander"
              >
                <UButton
                  variant="solid"
                  v-bind="cardActionStyles.recommendations"
                  size="lg"
                  :to="recommendationsSearchLink"
                  no-prefetch
                  @click="saveRecommendationsSearch"
                  class="cursor-pointer"
                  :aria-label="`Recommended cards for ${card.name}`"
                />
              </UTooltip>
              <UTooltip
                v-if="isCommander"
                text="Popular Cards for this Commander"
              >
                <UButton
                  variant="solid"
                  v-bind="cardActionStyles.popularForCommander"
                  size="lg"
                  :to="popularSearchLink"
                  no-prefetch
                  @click="savePopularSearch"
                  class="cursor-pointer"
                  :aria-label="`Popular cards for ${card.name}`"
                />
              </UTooltip>
              <UTooltip text="Find similar cards">
                <UButton
                  variant="solid"
                  v-bind="cardActionStyles.similar"
                  size="lg"
                  :to="similarSearchLink"
                  no-prefetch
                  @click="saveSimilarSearch"
                  class="cursor-pointer"
                  :aria-label="`Cards similar to ${card.name}`"
                />
              </UTooltip>
            </div>

            <!-- Price Information - Desktop only -->
            <UCard
              v-if="currentPrinting && currentPrinting.prices && hasPrices"
              class="price-card mt-2 hidden lg:block w-full max-w-75 lg:max-w-none"
              :ui="{ body: 'p-4 sm:p-4' }"
            >
              <div class="price-header">
                <UIcon
                  name="i-heroicons-currency-dollar"
                  class="w-6 h-6 text-green-500 mr-2"
                />
                <h3 class="price-title">Current Prices</h3>
              </div>

              <div class="price-list">
                <div
                  v-if="
                    currentPrinting.prices.usd ||
                    currentPrinting.prices.usd_foil
                  "
                  class="price-item"
                >
                  <span class="currency-label">USD:</span>
                  <span class="price-value">
                    <span
                      v-if="currentPrinting.prices.usd"
                      class="text-green-500"
                      >$</span
                    >{{ currentPrinting.prices.usd }}
                    <span
                      v-if="currentPrinting.prices.usd_foil"
                      class="foil-value ml-2"
                    >
                      <span class="dark:text-yellow-300 text-yellow-500">
                        <span
                          v-if="currentPrinting.prices.usd"
                          class="text-green-500"
                          >$</span
                        >{{ currentPrinting.prices.usd_foil }}
                        <span class="text-sm">(Foil)</span>
                      </span>
                    </span>
                  </span>
                </div>

                <div
                  v-if="
                    currentPrinting.prices.eur ||
                    currentPrinting.prices.eur_foil
                  "
                  class="price-item"
                >
                  <span class="currency-label">EUR:</span>
                  <span class="price-value">
                    <span
                      v-if="currentPrinting.prices.eur"
                      class="text-green-500"
                      >€</span
                    >{{ currentPrinting.prices.eur }}
                    <span
                      v-if="currentPrinting.prices.eur_foil"
                      class="foil-value ml-2"
                    >
                      <span class="dark:text-yellow-300 text-yellow-500">
                        <span
                          v-if="currentPrinting.prices.usd"
                          class="text-green-500"
                          >€</span
                        >{{ currentPrinting.prices.eur_foil }}
                        <span class="text-sm">(Foil)</span>
                      </span>
                    </span>
                  </span>
                </div>

                <div v-if="currentPrinting.prices.tix" class="price-item">
                  <span class="currency-label">MTGO Tix:</span>
                  <span class="price-value">{{
                    currentPrinting.prices.tix
                  }}</span>
                </div>
              </div>
            </UCard>
            <CardDiscussionButton
              :card="card"
              class="mt-2 hidden lg:flex w-full max-w-75 lg:max-w-none"
            />
            <UButton
              v-bind="suggestDecksAction"
              variant="outline"
              block
              class="mt-2 hidden lg:flex w-full max-w-75 lg:max-w-none"
              @click="openCardActions(true)"
            />
          </div>
        </div>

        <!-- Card text, strategy, and legalities share the remaining width. -->
        <div class="card-detail-info min-w-0 px-4 lg:px-0">
          <div class="flex min-w-0 w-full flex-col gap-2">
            <UCard
              class="card-details-card"
              :ui="{ body: 'px-0 py-4 sm:px-0 sm:py-4 lg:px-4' }"
            >
              <h2 class="card-title flex flex-row">
                <span class="card-title-text">{{ currentName }}</span>
                <span v-if="currentManaCost">
                  <ManaCost :manaCost="currentManaCost" class="ml-2" />
                </span>
              </h2>
              <div class="set-rarity-info">
                <NuxtLink
                  v-if="currentPrinting?.set"
                  :to="`/sets/${currentPrinting.set.toLowerCase()}`"
                  no-prefetch
                  class="set-name hover:underline focus-visible:outline-2 focus-visible:outline-primary"
                >
                  {{
                    currentPrinting.set_name ||
                    currentPrinting.set.toUpperCase()
                  }}
                </NuxtLink>
                <span v-else-if="currentPrinting?.set_name" class="set-name">{{
                  currentPrinting.set_name
                }}</span>
                <RarityBadge
                  v-if="currentPrinting?.rarity"
                  :rarity="currentPrinting.rarity"
                  size="medium"
                />
                <UTooltip
                  v-if="card.game_changer"
                  text="Is a Commander Game Changer"
                >
                  <NuxtLink
                    to="/roles/game-changers"
                    no-prefetch
                    class="rounded hover:underline"
                    ><UBadge size="xl" color="primary" variant="subtle"
                      >Game Changer</UBadge
                    ></NuxtLink
                  >
                </UTooltip>
              </div>
              <p class="card-type">
                {{ currentTypeLine }}
              </p>

              <!-- Mobile toggle button -->
              <UButton
                class="lg:hidden mt-2 w-full"
                variant="ghost"
                color="neutral"
                size="sm"
                :icon="
                  showMobileDetails
                    ? 'i-heroicons-chevron-up'
                    : 'i-heroicons-chevron-down'
                "
                @click="
                  () => {
                    showMobileDetails = !showMobileDetails;
                  }
                "
              >
                {{
                  showMobileDetails ? 'Hide Card Details' : 'Show Card Details'
                }}
              </UButton>

              <div
                v-if="currentOracleText"
                class="oracle-section"
                :class="{ 'hidden lg:block': !showMobileDetails }"
              >
                <div class="oracle-text">
                  <template
                    v-for="(part, index) in formattedOracleText"
                    :key="index"
                  >
                    <template v-if="typeof part === 'string'">{{
                      part
                    }}</template>
                    <component v-else :is="part" />
                  </template>
                </div>

                <div
                  class="stats-container"
                  v-if="currentPower && currentToughness"
                >
                  <div class="power-toughness">
                    Power / Toughness:
                    <span class="stats"
                      >{{ currentPower }}/{{ currentToughness }}</span
                    >
                  </div>
                </div>

                <div v-if="currentPrinting?.artist" class="artist-info">
                  <span class="artist-label">Illustrated by </span>
                  <strong class="artist-name">{{
                    currentPrinting.artist
                  }}</strong>
                </div>
              </div>
            </UCard>

            <!-- Action Buttons + TCGPlayer - Mobile only -->
            <div class="flex flex-row gap-2 mt-0 mb-0 lg:hidden items-center">
              <UButton
                v-if="currentPrinting && currentPrinting.tcgplayer_id"
                :to="getAffiliateLink(currentPrinting.tcgplayer_id)"
                external
                variant="solid"
                class="tcgplayer-btn flex-1"
                v-bind="cardActionStyles.buy"
                size="lg"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Buy on TCGPlayer"
              >
                Buy {{ tcgPriceLabel }}
              </UButton>
              <UButton
                v-else-if="card.name"
                :to="generateTCGPlayerSearchUrl(card.name)"
                external
                variant="solid"
                class="tcgplayer-btn flex-1"
                v-bind="cardActionStyles.searchMarketplace"
                size="lg"
                aria-label="Search on TCGPlayer"
              >
                Search on TCGPlayer
              </UButton>
              <UTooltip
                v-if="isCommander"
                text="Get Deck Recommendations for this Commander"
              >
                <UButton
                  variant="solid"
                  v-bind="cardActionStyles.recommendations"
                  size="lg"
                  :to="recommendationsSearchLink"
                  no-prefetch
                  @click="saveRecommendationsSearch"
                  class="cursor-pointer"
                  :aria-label="`Recommended cards for ${card.name}`"
                />
              </UTooltip>
              <UTooltip
                v-if="isCommander"
                text="Popular Cards for this Commander"
              >
                <UButton
                  variant="solid"
                  v-bind="cardActionStyles.popularForCommander"
                  size="lg"
                  :to="popularSearchLink"
                  no-prefetch
                  @click="savePopularSearch"
                  class="cursor-pointer"
                  :aria-label="`Popular cards for ${card.name}`"
                />
              </UTooltip>
              <UTooltip text="Find similar cards">
                <UButton
                  variant="solid"
                  v-bind="cardActionStyles.similar"
                  size="lg"
                  :to="similarSearchLink"
                  no-prefetch
                  @click="saveSimilarSearch"
                  class="cursor-pointer"
                  :aria-label="`Cards similar to ${card.name}`"
                />
              </UTooltip>
            </div>

            <!-- Price Information - Mobile only -->
            <UCard
              v-if="currentPrinting && currentPrinting.prices && hasPrices"
              class="price-card lg:hidden"
              :ui="{ body: 'px-0 py-4 sm:px-0 sm:py-4' }"
              :class="{ hidden: !showMobileDetails }"
            >
              <div class="price-header">
                <UIcon
                  name="i-heroicons-currency-dollar"
                  class="w-6 h-6 text-green-500 mr-2"
                />
                <h4 class="price-title">Current Prices</h4>
              </div>

              <div class="price-list">
                <div
                  v-if="
                    currentPrinting.prices.usd ||
                    currentPrinting.prices.usd_foil
                  "
                  class="price-item"
                >
                  <span class="currency-label">USD:</span>
                  <span class="price-value">
                    <span
                      v-if="currentPrinting.prices.usd"
                      class="text-green-500"
                      >$</span
                    >{{ currentPrinting.prices.usd }}
                    <span
                      v-if="currentPrinting.prices.usd_foil"
                      class="foil-value ml-2"
                    >
                      <span class="dark:text-yellow-300 text-yellow-500">
                        <span
                          v-if="currentPrinting.prices.usd"
                          class="text-green-500"
                          >$</span
                        >{{ currentPrinting.prices.usd_foil }}
                        <span class="text-sm">(Foil)</span>
                      </span>
                    </span>
                  </span>
                </div>

                <div
                  v-if="
                    currentPrinting.prices.eur ||
                    currentPrinting.prices.eur_foil
                  "
                  class="price-item"
                >
                  <span class="currency-label">EUR:</span>
                  <span class="price-value">
                    <span
                      v-if="currentPrinting.prices.eur"
                      class="text-green-500"
                      >€</span
                    >{{ currentPrinting.prices.eur }}
                    <span
                      v-if="currentPrinting.prices.eur_foil"
                      class="foil-value ml-2"
                    >
                      <span class="dark:text-yellow-300 text-yellow-500">
                        <span
                          v-if="currentPrinting.prices.usd"
                          class="text-green-500"
                          >€</span
                        >{{ currentPrinting.prices.eur_foil }}
                        <span class="text-sm">(Foil)</span>
                      </span>
                    </span>
                  </span>
                </div>

                <div v-if="currentPrinting.prices.tix" class="price-item">
                  <span class="currency-label">MTGO Tix:</span>
                  <span class="price-value">{{
                    currentPrinting.prices.tix
                  }}</span>
                </div>
              </div>
            </UCard>

            <CardDiscussionButton :card="card" class="lg:hidden" />
            <UButton
              v-bind="suggestDecksAction"
              variant="outline"
              block
              class="lg:hidden"
              @click="openCardActions(true)"
            />

            <div class="card-detail-secondary">
              <UCard
                class="legalities-card"
                :ui="{ body: 'px-0 py-4 sm:px-0 sm:py-4 lg:px-4' }"
                :class="{ 'hidden lg:block': !showMobileDetails }"
              >
                <div class="legalities-header">
                  <UIcon
                    name="i-heroicons-scale"
                    class="w-6 h-6 text-primary mr-2"
                  />
                  <h3 class="legalities-title">Legalities</h3>
                </div>

                <div class="legalities-grid">
                  <div
                    v-for="(format, name) in legalities"
                    :key="name"
                    class="legality-item"
                  >
                    <UBadge
                      class="legality-chip"
                      :color="getLegalityColor(format)"
                      variant="solid"
                      size="xs"
                    >
                      {{ format }}
                    </UBadge>
                    <span class="format-name">{{
                      standardizeFormatName(name)
                    }}</span>
                  </div>
                </div>
              </UCard>
              <LlmStrategyPanel v-if="hasLlmContent" :llm="llmDetails!" />
            </div>
            <CardPersonalTags :oracle-id="card.oracle_id" />
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="card && !pending && !error"
      class="card-results mt-8 w-full min-w-0 lg:mt-12"
    >
      <!-- Commander vs Non-commander searches: wrapped in ClientOnly because isCommander
             depends on TanStack Query data that may differ between SSR and client hydration -->
      <ClientOnly>
        <CardDetailsResultsSkeleton
          v-if="!isCommanderReady || commandersLoading"
          :tab-count="commandersSet?.has(card.name) ? 4 : 2"
        />
        <div v-else-if="card && isCommander" class="w-full mb-12">
          <SearchTypeChips
            :active-value="activeCommanderTab"
            :items="cardTabs"
            class="mx-auto w-full max-w-5xl"
            @select="activeCommanderTab = $event"
          />
          <KeepAlive>
            <LazyCardRecommendations
              v-if="activeCommanderTab === 'recommended'"
              :key="card.oracle_id"
              :commander="card.name"
            />
          </KeepAlive>

          <div v-if="activeCommanderTab === 'popular'">
            <CardDetailsSearch
              v-model="searchDrafts.popular"
              kind="popular"
              :card-name="card.name"
              :loading="isPopularCardsFetching"
              @submit="appliedSearches.popular = $event"
            />
            <SearchResults
              default-group-by="type"
              :is-loading="isPopularCardsEffectivelyLoading"
              :is-fetching="isPopularCardsFetching"
              :error="popularCardsError"
              @retry="refetchPopularCards()"
              :search-results="popularCards ?? undefined"
              :reranking-enabled="route.query.useRerank !== 'false'"
              :query-param="cardName ?? null"
              :hide-thumbs-down-button="true"
              empty-title="No matching cards"
              empty-description="Try changing your search or filters."
            />
          </div>

          <div v-if="activeCommanderTab === 'similar'">
            <CardDetailsSearch
              v-model="searchDrafts.similar"
              kind="similar"
              :card-name="card.name"
              :loading="isSimilarCardsFetching"
              @submit="appliedSearches.similar = $event"
            />
            <SearchResults
              :is-loading="isSimilarCardsEffectivelyLoading"
              :is-fetching="isSimilarCardsFetching"
              :error="similarCardsError"
              @retry="refetchSimilarCards()"
              :search-results="filteredSimilarCards"
              :query-param="cardName ?? null"
              :hide-thumbs-down-button="true"
              empty-title="No matching cards"
              empty-description="Try changing your search or filters."
              :is-similarity-search="true"
              :reranking-enabled="route.query.useRerank !== 'false'"
              hide-searched-card
            />
          </div>

          <div v-if="activeCommanderTab === 'popular-commanders'">
            <CardDetailsSearch
              v-model="searchDrafts['popular-commanders']"
              kind="popular-commanders"
              :card-name="card.name"
              :loading="isPopularCommandersFetching"
              @submit="appliedSearches['popular-commanders'] = $event"
            />
            <SearchResults
              :is-loading="isPopularCommandersEffectivelyLoading"
              :is-fetching="isPopularCommandersFetching"
              :error="popularCommandersError"
              @retry="refetchPopularCommanders()"
              :search-results="popularCommandersForCard ?? undefined"
              :reranking-enabled="route.query.useRerank !== 'false'"
              :query-param="cardName ?? null"
              :hide-thumbs-down-button="true"
              empty-title="No matching commanders"
              empty-description="Try changing your search or filters."
            />
          </div>
        </div>

        <!-- Non-commander: Popular Commanders + Similar Cards -->
        <div v-else-if="card" class="w-full mb-12">
          <SearchTypeChips
            :active-value="activeNonCommanderTab"
            :items="nonCommanderTabs"
            class="mx-auto w-full max-w-5xl"
            @select="activeNonCommanderTab = $event"
          />
          <div v-if="activeNonCommanderTab === 'popular-commanders'">
            <CardDetailsSearch
              v-model="searchDrafts['popular-commanders']"
              kind="popular-commanders"
              :card-name="card.name"
              :loading="isPopularCommandersFetching"
              @submit="appliedSearches['popular-commanders'] = $event"
            />
            <SearchResults
              :is-loading="isPopularCommandersEffectivelyLoading"
              :is-fetching="isPopularCommandersFetching"
              :error="popularCommandersError"
              @retry="refetchPopularCommanders()"
              :search-results="popularCommandersForCard ?? undefined"
              :reranking-enabled="route.query.useRerank !== 'false'"
              :query-param="cardName ?? null"
              :hide-thumbs-down-button="true"
              empty-title="No matching commanders"
              empty-description="Try changing your search or filters."
            />
          </div>

          <div v-if="activeNonCommanderTab === 'similar'">
            <CardDetailsSearch
              v-model="searchDrafts.similar"
              kind="similar"
              :card-name="card.name"
              :loading="isSimilarCardsFetching"
              @submit="appliedSearches.similar = $event"
            />
            <SearchResults
              :is-loading="isSimilarCardsEffectivelyLoading"
              :is-fetching="isSimilarCardsFetching"
              :error="similarCardsError"
              @retry="refetchSimilarCards()"
              :search-results="filteredSimilarCards"
              :query-param="cardName ?? null"
              :hide-thumbs-down-button="true"
              empty-title="No matching cards"
              empty-description="Try changing your search or filters."
              :is-similarity-search="true"
              :reranking-enabled="route.query.useRerank !== 'false'"
              hide-searched-card
            />
          </div>
        </div>
        <template #fallback>
          <CardDetailsResultsSkeleton
            :tab-count="commandersSet?.has(card.name) ? 4 : 2"
          />
        </template>
      </ClientOnly>
    </div>
  </div>
  <BackToTop />
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import type { CardFormatType, ScryfallCard, Card } from '~/models/cardModel';
import type { LlmCardAttributes } from '~/models/llmModel';
import {
  PopularByCommanderRequestSchema,
  PopularCommandersForCardRequestSchema,
} from '~/models/deckStatsModel';
import {
  getAffiliateLink,
  generateTCGPlayerSearchUrl,
} from '@/utils/tcgPlayer';
import {
  getCardImageUrl,
  getCardArtUrl,
  formatsToIgnore,
  getLegalityColor,
  standardizeFormatName,
} from '@/utils/scryfall';
import {
  cardActionStyles,
  findSimilarAction,
  suggestDecksAction,
  type CardActionMenu,
} from '~/utils/card-actions';
import { getUsdPrice } from '~/utils/cardPrice';
import { safeJsonLd } from '~/utils/safeJsonLd';
import { getSearchLink } from '~/utils/searchLinks';
import {
  SimilaritySearchSchema,
  type CardDetailsSearchState,
} from '~/models/searchModel';

definePageMeta({ breadcrumbsInPage: true });

const route = useRoute();
const router = useRouter();
const isFlipped = ref(false);
const showMobileDetails = ref(false);
const showCardActions = ref(false);
const suggestDecksOnOpen = ref(false);
function openCardActions(suggestDecks: boolean) {
  suggestDecksOnOpen.value = suggestDecks;
  showCardActions.value = true;
}
const showAddToDeckModal = ref(false);
const selectedPrinting = shallowRef<ScryfallCard | null>(null);

// Nuxt keys this page by its card path. Keep each instance bound to that card
// while an asynchronous destination (which may also have an id param) loads.
const pageOracleId = String(route.params.id || '');
const oracleIdParam = computed(() => pageOracleId);
const { saveCardViewMutation } = useCardHistory();
const { lastCard, setLastOpenedCard } = useLastOpenedCard();
const { searchType, getPath, restoreSearchQuery } = useSearchType();

// Determine origin: was the user on a search or explore page before?
const cardOrigin = computed(() => lastCard.value?.origin ?? 'search');
const lastExploreType = ref<
  | 'popular-cards'
  | 'popular-commanders'
  | 'popular-by-commander'
  | 'popular-by-card'
>('popular-cards');

// Detect origin from referring route on mount
onMounted(() => {
  const referrer = router.options.history.state?.back as string | undefined;
  if (referrer) {
    if (referrer.startsWith('/popular-cards'))
      lastExploreType.value = 'popular-cards';
    else if (referrer.startsWith('/popular-commanders'))
      lastExploreType.value = 'popular-commanders';
    else if (referrer.startsWith('/popular-by-commander'))
      lastExploreType.value = 'popular-by-commander';
    else if (referrer.startsWith('/popular-by-card'))
      lastExploreType.value = 'popular-by-card';
  }
});

function navigateToSearch(
  type: 'smart' | 'similarity' | 'commander' | 'keyword' | 'recommend',
) {
  const saved = restoreSearchQuery(type);
  // Strip limit from restored queries — each page applies its own default/cap
  if (saved) delete saved.limit;
  router.push({ path: getPath(type), query: saved ?? undefined });
}

function navigateToExplore(
  type:
    | 'popular-cards'
    | 'popular-commanders'
    | 'popular-by-commander'
    | 'popular-by-card',
) {
  const saved = restoreSearchQuery(type);
  router.push({ path: `/${type}/all`, query: saved ?? undefined });
}

const { card, llm, error, pending, ready } = useCardDetails(oracleIdParam);
await ready;
const { setCardLabel } = useNavigationTrail();
onMounted(() => {
  watch(
    card,
    (value) => {
      if (value?.oracle_id && value.name)
        setCardLabel(value.oracle_id, value.name);
    },
    { immediate: true },
  );
});

if (import.meta.server && error.value) {
  const status = error.value.status ?? 502;
  setResponseStatus(
    useRequestEvent()!,
    status >= 400 && status <= 599 ? status : 502,
  );
}

if (card.value && card.value.oracle_id !== oracleIdParam.value) {
  await navigateTo(
    {
      path: `/card/${card.value.oracle_id}`,
      query: route.query,
      hash: route.hash,
    },
    { redirectCode: 301, replace: true },
  );
}

const llmDetails = computed<LlmCardAttributes | null>(
  () => llm.value?.llm ?? null,
);

const hasLlmContent = computed(() => {
  const l = llmDetails.value;
  if (!l) return false;
  const hasPower = l.power_level > 0;
  const hasStrategy = [
    l.strategy_rankings.aggro,
    l.strategy_rankings.midrange,
    l.strategy_rankings.control,
    l.strategy_rankings.combo,
  ].some((v) => v > 0);
  const hasSummary = !!l.long_summary?.trim();
  const hasBadges =
    (l.roles?.length ?? 0) > 0 ||
    (l.themes?.length ?? 0) > 0 ||
    (l.community_sentiment?.length ?? 0) > 0;
  return hasPower || hasStrategy || hasSummary || hasBadges;
});

// Check if error is a 404 Not Found
const isNotFound = computed(() => {
  if (!error.value) return false;
  const err = error.value as any;
  return (
    err?.statusCode === 404 ||
    err?.status === 404 ||
    err?.data?.statusCode === 404
  );
});

// Check if error is a 400 Bad Request and get its message
const isBadRequest = computed(() => {
  if (!error.value) return false;
  const err = error.value as any;
  return (
    err?.statusCode === 400 ||
    err?.status === 400 ||
    err?.data?.statusCode === 400
  );
});

const errorMessage = computed(() => {
  if (!error.value) return '';
  const err = error.value as any;
  return err?.data?.message || err?.message || 'An error occurred';
});

const canonicalUrl = computed(() =>
  card.value
    ? `https://cardmystic.com/card/${card.value.oracle_id}`
    : undefined,
);
// Dynamic SEO meta based on card data
useSeoMeta({
  robots: () => (card.value ? 'index, follow' : 'noindex, follow'),
  ogUrl: () => canonicalUrl.value,
  title: () =>
    card.value
      ? `${card.value.name} (MTG) - CardMystic`
      : 'MTG Card Details | CardMystic',
  description: () => {
    if (!card.value) return 'Explore Magic: The Gathering cards on CardMystic';
    const oracle =
      card.value.oracle_text || card.value.card_faces?.[0]?.oracle_text || '';
    const type = card.value.type_line || '';
    const base = `${card.value.name} | ${type} | ${oracle.slice(0, 100)}${oracle.length > 100 ? '...' : ''}`;
    return `${base} Find similar cards and deck recommendations.`;
  },
  ogTitle: () =>
    card.value
      ? `${card.value.name} (MTG) - CardMystic`
      : 'MTG Card Details | CardMystic',
  ogDescription: () =>
    card.value
      ? `View ${card.value.name}, a ${card.value.type_line || 'Magic: The Gathering card'}, with similar cards, deck recommendations, oracle text, and deckbuilding tools on CardMystic.`
      : 'View Magic: The Gathering card details with similar cards, deck recommendations, and deckbuilding tools on CardMystic.',
  ogType: 'website',
  ogImage: () =>
    card.value?.image_uris?.normal ||
    card.value?.card_faces?.[0]?.image_uris?.normal ||
    'https://cardmystic.com/cardmystic_preview.png',
  ogImageAlt: () =>
    card.value
      ? `${card.value.name} MTG card artwork`
      : 'CardMystic Magic: The Gathering card search',
  twitterCard: 'summary_large_image',
  twitterTitle: () =>
    card.value
      ? `${card.value.name} | MTG Card`
      : 'MTG Card Details | CardMystic',

  twitterDescription: () =>
    card.value
      ? `View ${card.value.name} with similar cards, deck recommendations, oracle text, and deckbuilding tools on CardMystic.`
      : 'Search and explore Magic: The Gathering cards with similar cards and deck recommendations on CardMystic.',

  twitterImage: () =>
    card.value?.image_uris?.normal ||
    card.value?.card_faces?.[0]?.image_uris?.normal ||
    'https://cardmystic.com/cardmystic_preview.png',
});

// Add JSON-LD structured data for better SEO and rich snippets
useHead(() => ({
  link: canonicalUrl.value
    ? [{ rel: 'canonical', href: canonicalUrl.value }]
    : [],
  script: card.value
    ? [
        {
          type: 'application/ld+json',
          innerHTML: () => {
            if (!card.value) return '';
            return safeJsonLd({
              '@context': 'https://schema.org',
              '@type': 'WebPage',
              name: card.value.name,
              description:
                card.value.oracle_text ||
                card.value.card_faces?.[0]?.oracle_text ||
                '',
              image:
                card.value?.image_uris?.normal ||
                card.value?.card_faces?.[0]?.image_uris?.normal ||
                'https://cardmystic.com/cardmystic_preview.png',
              url: canonicalUrl.value,
              brand: {
                '@type': 'Brand',
                name: 'Magic: The Gathering',
              },
              manufacturer: {
                '@type': 'Organization',
                name: 'Wizards of the Coast',
              },
              category: card.value.type_line || 'Trading Card',
            });
          },
        },
      ]
    : [],
}));

// Save card view to history when card is loaded.
// Deferred to onMounted so lastCard stays null during hydration (matches SSR).
onMounted(() => {
  watch(
    card,
    (newCard) => {
      if (newCard?.oracle_id) {
        saveCardViewMutation.mutate(newCard.oracle_id);
        // Detect origin from route history
        const referrer = router.options.history.state?.back as
          string | undefined;
        const origin =
          referrer &&
          (referrer.startsWith('/popular-cards') ||
            referrer.startsWith('/popular-commanders') ||
            referrer.startsWith('/popular-by-commander') ||
            referrer.startsWith('/popular-by-card'))
            ? ('explore' as const)
            : ('search' as const);
        setLastOpenedCard(newCard.oracle_id, newCard.name, origin);
      }
    },
    { immediate: true },
  );
});

// Keep the selected printing independent of catalog pagination and filtering.
const printingResolved = computed(
  () =>
    !!selectedPrinting.value &&
    selectedPrinting.value.oracle_id === card.value?.oracle_id,
);
const currentPrinting = computed(() =>
  printingResolved.value ? selectedPrinting.value : card.value,
);
const modalCard = computed<Card | null>(() =>
  currentPrinting.value
    ? {
        card_name: currentPrinting.value.name,
        card_data: currentPrinting.value,
      }
    : null,
);
const cardActions = computed<CardActionMenu>(() => {
  const data = currentPrinting.value;
  if (!data) return {};
  const price = getUsdPrice(data.prices);
  const menu: CardActionMenu = {
    addToDeck: {
      label: 'Add to Deck',
      ...cardActionStyles.addToDeck,
      onSelect: () => {
        showAddToDeckModal.value = true;
      },
    },
  };
  if (isDualFaced.value) {
    menu.flip = {
      label: isFlipped.value ? 'Show Front Face' : 'Show Back Face',
      ...cardActionStyles.flip,
      onSelect: flipCard,
    };
  }
  menu.marketplace = {
    label: data.tcgplayer_id
      ? price
        ? `Buy on TCGPlayer · $${price}`
        : 'Buy on TCGPlayer'
      : 'Search on TCGPlayer',
    ...(data.tcgplayer_id
      ? cardActionStyles.buy
      : cardActionStyles.searchMarketplace),
    to: data.tcgplayer_id
      ? getAffiliateLink(data.tcgplayer_id)
      : generateTCGPlayerSearchUrl(data.name),
    target: '_blank',
    rel: 'noopener noreferrer',
  };
  menu.similar = {
    ...findSimilarAction,
    to: router.resolve(similarSearchLink.value).href,
    onSelect: saveSimilarSearch,
  };
  return menu;
});

const cardArtUrl = computed(() =>
  currentPrinting.value
    ? getCardArtUrl(currentPrinting.value, isFlipped.value)
    : '',
);

// image URL that updates when currentPrinting or isFlipped change
const cardImageUrl = computed(() => {
  const printingData = currentPrinting.value;
  if (!printingData) return '';
  return getCardImageUrl(printingData as ScryfallCard, isFlipped.value);
});

const { setPageInfo } = usePageInfo();
watchEffect(() => {
  if (card.value) {
    setPageInfo({
      page_url: route.fullPath,
      page_name: card.value?.name || 'Card',
      card_name: card.value?.name || '',
      labels: ['card details'],
    });
  }
});

const legalities = computed(() => {
  if (!card.value?.legalities) return {};
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(card.value.legalities)) {
    const format = key.charAt(0).toUpperCase() + key.slice(1);
    if (!formatsToIgnore.includes(format as CardFormatType)) {
      result[format] = (value as string).toUpperCase().replaceAll('_', ' '); // normalize casing
    }
  }
  return result;
});

const hasPrices = computed(() => {
  if (!currentPrinting.value?.prices) return false;
  const prices = currentPrinting.value.prices;
  return (
    prices.usd || prices.usd_foil || prices.eur || prices.eur_foil || prices.tix
  );
});

const tcgPriceLabel = computed(() => {
  const price =
    currentPrinting.value?.prices?.usd ||
    currentPrinting.value?.prices?.usd_foil;
  return price ? `($${price})` : '';
});

// Computed properties for current face data using current printing
const currentFace = computed(() => {
  const cardData = currentPrinting.value;
  if (!cardData) return null;

  // If it's a dual-faced card, return the appropriate face
  if (isDualFaced.value && cardData.card_faces) {
    return isFlipped.value ? cardData.card_faces[1] : cardData.card_faces[0];
  }

  // For single-faced cards, return the card itself
  return cardData;
});

const currentManaCost = computed(() => {
  if (!currentFace.value) return '';
  return currentFace.value.mana_cost || '';
});

const currentOracleText = computed(() => {
  if (!currentFace.value) return '';
  return currentFace.value.oracle_text || '';
});

const currentTypeLine = computed(() => {
  if (!currentFace.value) return '';
  return currentFace.value.type_line || '';
});

const currentName = computed(() => {
  if (!currentFace.value) return '';

  // For dual-faced cards, show the face name
  if (isDualFaced.value && 'name' in currentFace.value) {
    return currentFace.value.name;
  }

  // For single-faced cards, show the card name
  return currentPrinting.value?.name || '';
});

const currentPower = computed(() => {
  if (!currentFace.value) return '';
  return currentFace.value.power || '';
});

const currentToughness = computed(() => {
  if (!currentFace.value) return '';
  return currentFace.value.toughness || '';
});

const formattedOracleText = computed(() => {
  return formatSymbols(currentOracleText.value);
});

const isDualFaced = computed(() => {
  const cardData = currentPrinting.value || card.value;
  const isDualFacedCard =
    cardData?.card_faces && cardData.card_faces.length >= 2;
  return isDualFacedCard;
});

function handleImageError(event: Event) {
  console.warn('Card image failed to load:', event);
}

function flipCard() {
  isFlipped.value = !isFlipped.value;
}

const { saveSearchQuery } = useSearchType();
const { saveSearchMutation } = useSearchHistory();

// Tab activation tracking - only fetch data for tabs the user has viewed
const activeCommanderTab = ref('recommended');
const activeNonCommanderTab = ref('similar');
const activatedTabs = reactive(new Set<string>());

const similarSearchLink = computed(() =>
  getSearchLink({
    platform: 'all',
    searchType: 'similarity',
    query: card.value?.name ?? '',
  }),
);
const recommendationsSearchLink = computed(() =>
  getSearchLink({
    platform: 'all',
    searchType: 'recommend',
    query: card.value?.name ?? '',
  }),
);
const popularSearchLink = computed(() =>
  getSearchLink({
    platform: 'all',
    searchType: 'popular-by-commander',
    query: card.value?.name ?? '',
  }),
);

function saveSimilarSearch() {
  if (!card.value) return;

  const queryParams = {
    card_name: card.value.name,
  };

  saveSearchQuery('similarity', queryParams);
}

function saveRecommendationsSearch() {
  const commanderName = card.value?.name;
  if (!commanderName) return;
  const queryParams = { commander: commanderName };
  saveSearchQuery('recommend', queryParams);
  queueMicrotask(() => {
    saveSearchMutation.mutate({
      query: commanderName,
      searchType: 'recommend',
      filters: { commander: commanderName },
    });
  });
}

function savePopularSearch() {
  if (!card.value?.name) return;
  const queryParams = { commander: card.value.name };
  saveSearchQuery('popular-by-commander', queryParams);
}

// Keep draft filters separate from requests and preserve them between tabs.
function emptyCardSearch(): CardDetailsSearchState {
  return { query: '', filters: {} };
}
const searchDrafts = reactive({
  popular: emptyCardSearch(),
  similar: emptyCardSearch(),
  'popular-commanders': emptyCardSearch(),
});
const appliedSearches = reactive({
  popular: emptyCardSearch(),
  similar: emptyCardSearch(),
  'popular-commanders': emptyCardSearch(),
});

const cardName = computed(() => card.value?.name);
const similarityRequest = computed(() => {
  if (!activatedTabs.has('similar') || !cardName.value) return undefined;
  return SimilaritySearchSchema.parse({
    card_name: cardName.value,
    limit: 100,
    filters: appliedSearches.similar.filters,
    useRerank: route.query.useRerank !== 'false',
  });
});
const {
  searchResults: similarCards,
  isLoading: isSimilarCardsLoading,
  error: similarCardsError,
  isFetching: isSimilarCardsFetching,
  refetch: refetchSimilarCards,
} = useSimilaritySearch(similarityRequest);

const isSimilarCardsEffectivelyLoading = computed(() => {
  if (!activatedTabs.has('similar')) return false;
  if (similarCardsError.value) return false;
  return (
    isSimilarCardsLoading.value || (!similarCards.value && !!cardName.value)
  );
});

// Filter out the currently viewed card from similar cards.
// Do not rely on API ordering; exclude by ID and fallback by exact name.
const filteredSimilarCards = computed(() => {
  if (!similarCards.value?.length) return undefined;

  const currentCardId = card.value?.id;
  const currentCardName = card.value?.name?.toLowerCase();

  const filtered = similarCards.value.filter((result) => {
    const resultId = result.card_data?.id;
    if (currentCardId && resultId === currentCardId) {
      return false;
    }

    const resultName = (
      result.card_data?.name ||
      result.card_name ||
      ''
    ).toLowerCase();
    if (currentCardName && resultName === currentCardName) {
      return false;
    }

    return true;
  });

  return filtered.length ? filtered : undefined;
});

// Commander detection — deferred to post-mount so SSR and client hydration both start as false,
// avoiding mismatch when commandersSet loads from TanStack Query localStorage cache on client.
const { data: commandersSet, isLoading: commandersLoading } =
  useCommandersSet();
const isCommanderReady = ref(false);
const isCommander = computed(() => {
  if (!isCommanderReady.value) return false;
  if (!card.value?.name || !commandersSet.value) return false;
  return commandersSet.value.has(card.value.name);
});

onMounted(() => {
  isCommanderReady.value = true;
});

watch(
  [
    isCommanderReady,
    commandersLoading,
    isCommander,
    activeCommanderTab,
    activeNonCommanderTab,
  ],
  () => {
    if (!isCommanderReady.value || commandersLoading.value) return;
    activatedTabs.add(
      isCommander.value
        ? activeCommanderTab.value
        : activeNonCommanderTab.value,
    );
  },
  { immediate: true },
);

const cardTabs = [
  {
    value: 'recommended',
    label: 'Deck Recommendations',
    ...cardActionStyles.recommendations,
  },
  {
    value: 'popular',
    label: 'Popular Cards As Commander',
    ...cardActionStyles.popularForCommander,
  },
  {
    value: 'similar',
    label: 'Similar To This Card',
    icon: 'i-mdi-cards-outline',
  },
  {
    value: 'popular-commanders',
    label: 'Popular Commanders As 99',
    icon: 'i-lucide-crown',
  },
];
const nonCommanderTabs = [
  {
    value: 'similar',
    label: 'Similar To This Card',
    icon: 'i-mdi-cards-outline',
  },
  {
    value: 'popular-commanders',
    label: 'Popular Commanders As 99',
    icon: 'i-lucide-crown',
  },
];

const popularByCommanderRequest = computed(() => {
  if (!activatedTabs.has('popular')) return undefined;
  if (!isCommander.value || !card.value?.name) return undefined;
  return PopularByCommanderRequestSchema.parse({
    commanders: [card.value.name],
    limit: 200,
    query: appliedSearches.popular.query || undefined,
    filters: appliedSearches.popular.filters,
    useRerank: route.query.useRerank !== 'false',
  });
});

const {
  searchResults: popularCards,
  isLoading: isPopularCardsLoading,
  error: popularCardsError,
  isFetching: isPopularCardsFetching,
  refetch: refetchPopularCards,
} = usePopularByCommander(popularByCommanderRequest);

const isPopularCardsEffectivelyLoading = computed(() => {
  if (!activatedTabs.has('popular')) return false;
  if (popularCardsError.value) return false;
  return (
    isPopularCardsLoading.value || (!popularCards.value && isCommander.value)
  );
});

const popularCommandersForCardRequest = computed(() => {
  if (!activatedTabs.has('popular-commanders')) return undefined;
  if (!card.value?.name) return undefined;
  return PopularCommandersForCardRequestSchema.parse({
    card_name: card.value.name,
    query: appliedSearches['popular-commanders'].query || undefined,
    filters: appliedSearches['popular-commanders'].filters,
    useRerank: route.query.useRerank !== 'false',
  });
});

const {
  searchResults: popularCommandersForCard,
  isLoading: isPopularCommandersLoading,
  error: popularCommandersError,
  isFetching: isPopularCommandersFetching,
  refetch: refetchPopularCommanders,
} = usePopularCommandersForCard(popularCommandersForCardRequest);

const isPopularCommandersEffectivelyLoading = computed(() => {
  if (!activatedTabs.has('popular-commanders')) return false;
  if (popularCommandersError.value) return false;
  return (
    isPopularCommandersLoading.value ||
    (!popularCommandersForCard.value && !!card.value?.name)
  );
});
</script>

<style scoped lang="sass">
.card-detail-background-region
  --card-search-chips-height: 52px
  position: relative
  isolation: isolate

.card-detail-section
  padding-bottom: 32px

.card-page-background-mask
  position: absolute
  top: 0
  left: 50%
  transform: translateX(-50%)
  z-index: -1
  width: 100vw
  // Finish the fade halfway through the gap below the search chips.
  height: calc(100% + var(--card-search-chips-height) + 8px)
  pointer-events: none
  mask-image: linear-gradient(to bottom, black calc(100% - 160px), transparent)

.card-page-background
  width: 100%
  max-width: none
  height: 100%
  transform: scale(1.06)
  filter: blur(16px)
  object-fit: cover
  object-position: center 30%
  opacity: 0.45

.dark .card-page-background
  opacity: 0.22

@media (min-width: 1024px)
  .card-detail-background-region
    --card-search-chips-height: 44px
  .card-detail-section
    padding-bottom: 40px

@media (min-width: 1024px)
  .card-detail-art .card-image-container
    display: block
    width: calc(100% + 20px)
  .card-detail-art .card-image-container > button
    width: 100%

.card-image-container
  position: relative
  display: inline-block
  overflow: visible
  padding: 10px
  margin: -10px

.card-glow
  position: absolute
  top: 5px
  left: 5px
  right: 5px
  bottom: 5px
  border-radius: 25px
  filter: blur(15px)
  z-index: 0

// Rarity-based glow colors
.glow-common
  background: linear-gradient(45deg, rgba(44, 44, 44, 0.3), rgba(66, 66, 66, 0.3), rgba(88, 88, 88, 0.3))
  animation: glowPulse 4s ease-in-out infinite alternate

.glow-uncommon
  background: linear-gradient(45deg, rgba(192, 192, 192, 0.3), rgba(169, 169, 169, 0.3), rgba(211, 211, 211, 0.3))
  animation: glowPulse 4s ease-in-out infinite alternate

.glow-rare
  background: linear-gradient(45deg, rgba(255, 215, 0, 0.4), rgba(255, 176, 0, 0.4), rgba(255, 193, 7, 0.4))
  animation: glowPulseRare 3s ease-in-out infinite alternate

.glow-mythic
  background: linear-gradient(45deg, rgba(255, 140, 0, 0.5), rgba(255, 107, 53, 0.5), rgba(255, 69, 0, 0.5))
  animation: glowPulseMythic 2.5s ease-in-out infinite alternate

.card-image
  border-radius: 20px !important
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2)
  position: relative
  z-index: 1
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1) // <-- added transition
  transform-origin: center center // <-- ensure smooth centered scaling

// Scale image slightly on hover of the container
.card-image-container:hover .card-image
  transform: scale(1.03)

// Card Details Card Styling (header + description combined)
.card-details-card
  border-radius: 0
  border: 0
  position: relative
  background: transparent
  box-shadow: none

.card-title
  font-size: 2.2rem
  font-weight: 700
  margin-bottom: 4px
  @media (max-width: 1023px)
    font-size: 1.6rem

.card-title-text
  margin-right: 8px
  text-shadow: 0 4px 8px rgba(147, 114, 255, 0.3)

.set-rarity-info
  display: flex
  gap: 16px
  align-items: center
  margin-bottom: 8px

.set-name
  font-size: 0.9rem
  font-weight: 400
  margin: 0
  font-style: italic

.card-type
  font-size: 1.1rem
  font-weight: 500
  margin: 0

// Oracle Section (within combined card details card)
.oracle-section
  margin-top: 12px
  padding-top: 12px
  border-top: 1px solid rgba(147, 114, 255, 0.2)

.oracle-text
  font-size: 0.95rem
  line-height: 1.2
  margin-bottom: 12px

  br
    display: block
    content: ""
    margin-top: 0.5em

// Stats and Artist Info
.stats-container
  margin-top: 12px

.power-toughness
  font-size: 0.95rem
  font-weight: 600

.stats
  font-weight: 700
  font-size: 1rem

.artist-info
  margin-top: 12px
  padding-top: 12px
  border-top: 1px solid rgba(147, 114, 255, 0.2)

.artist-label
  font-size: 0.9rem

.artist-name
  font-size: 1rem

// Keep the details header at its natural height; the lower panels fill the
// remaining height beside the card image, prices, and deck suggestions.
.card-detail-info
  container: card-info / inline-size

.card-detail-secondary
  display: grid
  flex: 1
  gap: 8px
  grid-template-columns: minmax(0, 1fr)
  align-items: stretch

@container card-info (min-width: 600px)
  .card-detail-secondary:has(> :nth-child(2))
    grid-template-columns: repeat(2, minmax(0, 1fr))

  .legalities-grid
    grid-template-columns: repeat(2, minmax(0, max-content))
    column-gap: 20px

// Legalities Card
.legalities-card
  border-radius: 0
  border: 0
  position: relative
  margin-bottom: 0
  background: transparent
  box-shadow: none

.legalities-header
  display: flex
  align-items: center
  margin-bottom: 8px

.legalities-title
  font-size: 1.3rem
  font-weight: 600
  margin: 0

// Column count follows the panel width, including when strategy content
// shares the row on desktop.
.legalities-grid
  display: grid
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 11rem), 1fr))
  gap: 4px 8px
  padding: 4px

// Legality Items
.legality-item
  display: flex
  align-items: center
  gap: 6px
  min-width: 0

.legality-chip
  flex-shrink: 0
  font-size: 0.5625rem !important
  font-weight: 600
  min-width: 4.85rem
  text-transform: uppercase
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3)
  justify-content: center
  @media (max-width: 768px)
    font-size: 0.5rem !important
    min-width: 71.2px

.format-name
  min-width: 0
  overflow-wrap: anywhere
  font-size: 0.6875rem
  font-weight: bold
  text-align: left
  @media (max-width: 768px)
    font-size: 0.625rem

// Price Card Styling
.price-card
  border-radius: 0
  border: 0
  position: relative
  margin-bottom: 8px
  background: transparent
  box-shadow: none

.price-header
  display: flex
  align-items: center
  margin-bottom: 8px

.price-title
  font-size: 1.3rem
  font-weight: 600

.price-list
  display: flex
  flex-direction: column
  gap: 8px

.price-item
  display: flex
  justify-content: space-between
  align-items: center
  padding: 0px

.currency-label
  font-size: 0.9rem
  font-weight: 500

.price-value
  font-size: 1rem
  font-weight: 700

// Flip Button Styling
.flip-btn
  width: 100%
  max-width: 280px
  font-weight: 600
  text-transform: none
  letter-spacing: 0.5px
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3)

  &:hover
    box-shadow: 0 6px 16px rgba(33, 150, 243, 0.5)
    transform: translateY(-2px)

// Price Card Mobile Styling
@media (max-width: 1023px)
  .price-card
    max-width: none !important
    width: 100%

.printing-select
  width: 100%
  min-width: 280px

// TCGPlayer Button Styling
.tcgplayer-btn
  width: 100%
  max-width: 280px
  font-weight: 600
  text-transform: none
  letter-spacing: 0.5px
  box-shadow: 0 4px 12px rgba(147, 114, 255, 0.3)

  &:hover
    box-shadow: 0 6px 16px rgba(147, 114, 255, 0.5)
    transform: translateY(-2px)

@media (max-width: 1023px)
  .tcgplayer-btn
    max-width: none !important

@keyframes glowPulse
  0%
    opacity: 0.7
    transform: scale(1)
  100%
    opacity: 0.9
    transform: scale(1.02)

@keyframes glowPulseRare
  0%
    opacity: 0.7
    transform: scale(1)
  100%
    opacity: 0.9
    transform: scale(1.02)

@keyframes glowPulseMythic
  0%
    opacity: 0.8
    transform: scale(1)
  100%
    opacity: 1.0
    transform: scale(1.04)

// Card detail page layout
.page-wrapper
  position: relative
  min-height: 100vh

// Card page navigation tabs
.card-page-nav
  position: relative
  z-index: 20
</style>
