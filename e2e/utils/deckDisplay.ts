import { expect, type Page } from '@playwright/test';
import {
  BACKEND,
  SUPABASE,
  FAKE_USER,
  fakeJwt,
  mockSupabaseAuth,
  gotoHydrated,
} from './mocks';

export const displayDeckId = '41000000-0000-4000-8000-000000000001';
export const destinationDeckId = '41000000-0000-4000-8000-000000000002';

export function displayImageUris(id: string, face = 'front') {
  const uri = (size: string) =>
    `https://cards.scryfall.io/${size}/${face}/4/2/${id}.jpg`;
  return {
    small: uri('small'),
    normal: uri('normal'),
    large: uri('large'),
    png: uri('png'),
    art_crop: uri('art_crop'),
    border_crop: uri('border_crop'),
  };
}

export function createDisplayCards(count = 3) {
  return Array.from({ length: count }, (_, index) => {
    const suffix = String(index + 1).padStart(12, '0');
    const id = `42000000-0000-4000-8000-${suffix}`;
    const oracleId = `43000000-0000-4000-8000-${suffix}`;
    const name =
      index === 0
        ? 'Tamiyo, Inquisitive Student // Tamiyo, Seasoned Scholar'
        : index === 1
          ? 'Sink into Stupor // Soporific Springs'
          : index === 2
            ? 'Island'
            : `Display Card ${String(index + 1).padStart(3, '0')}`;
    const type =
      index === 0
        ? 'Legendary Creature — Moonfolk Wizard'
        : index === 1
          ? 'Instant'
          : index === 2
            ? 'Basic Land — Island'
            : 'Creature — Wizard';
    const dual = index < 2;
    return {
      id,
      oracle_id: oracleId,
      name,
      object: 'card',
      layout: index === 0 ? 'transform' : index === 1 ? 'modal_dfc' : 'normal',
      lang: 'en',
      mana_cost: dual ? undefined : index === 2 ? '' : '{U}',
      cmc: index === 1 ? 3 : index === 2 ? 0 : 1,
      type_line: index === 1 ? 'Instant // Land' : type,
      colors: dual ? undefined : index === 2 ? [] : ['U'],
      color_identity: ['U'],
      keywords: [],
      legalities: { commander: 'legal', modern: 'legal' },
      oracle_text: '',
      rarity: 'common',
      set: 'test',
      set_name: 'Test',
      collector_number: String(index + 1),
      tcgplayer_id: index + 1,
      prices: { usd: '1.00', usd_foil: null, eur: null, tix: null },
      image_uris: dual ? undefined : displayImageUris(id),
      card_faces: dual
        ? [
            {
              object: 'card_face',
              name: name.split(' // ')[0],
              type_line: type,
              mana_cost: index === 0 ? '{U}' : '{1}{U}{U}',
              colors: ['U'],
              oracle_text: '',
              image_uris: displayImageUris(id),
            },
            {
              object: 'card_face',
              name: name.split(' // ')[1],
              type_line:
                index === 0 ? 'Legendary Planeswalker — Tamiyo' : 'Land',
              mana_cost: '',
              colors: index === 0 ? ['U'] : [],
              oracle_text: '',
              image_uris: displayImageUris(id, 'back'),
            },
          ]
        : undefined,
      games: ['paper'],
      finishes: ['nonfoil'],
      released_at: '2024-01-01',
      scryfall_uri: 'https://scryfall.com',
    };
  });
}

export type DisplayWrite = {
  listId: string;
  oracleIds: string[];
  board?: string;
};

/** Isolated display fixture: all card, deck, image and authenticated writes are mocked. */
export async function setupDeckDisplay(
  page: Page,
  options: {
    owner?: boolean;
    cardCount?: number;
    holdImages?: boolean;
    groupBy?: 'color' | 'colorIdentity' | 'type' | null;
    extraCards?: number;
    holdAddedCardData?: boolean;
  } = {},
) {
  const owner = options.owner ?? true;
  const cards = createDisplayCards(options.cardCount);
  const catalog = [
    ...cards,
    ...createDisplayCards(cards.length + (options.extraCards ?? 0)).slice(
      cards.length,
    ),
  ];
  let releaseAddedCardData = () => {};
  const addedCardDataGate = options.holdAddedCardData
    ? new Promise<void>((resolve) => {
        releaseAddedCardData = resolve;
      })
    : Promise.resolve();
  const writes: DisplayWrite[] = [];
  let releaseImages = () => {};
  const imageGate = options.holdImages
    ? new Promise<void>((resolve) => {
        releaseImages = resolve;
      })
    : Promise.resolve();

  await page.route('https://cards.scryfall.io/**', async (route) => {
    await imageGate;
    await route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="488" height="680"><rect width="488" height="680" fill="#204e68"/></svg>',
    });
  });
  await page.route(BACKEND + '/**', (route) => route.fulfill({ json: {} }));
  await page.route(SUPABASE + '/rest/v1/**', (route) =>
    route.fulfill({ json: [] }),
  );
  await mockSupabaseAuth(page);
  await page.route(SUPABASE + '/rest/v1/profiles**', (route) =>
    route.fulfill({
      json: {
        id: FAKE_USER.id,
        username: 'Display Tester',
        avatar_card_name: null,
      },
    }),
  );
  await page.addInitScript(
    ({ key, preferences }) => {
      if (localStorage.getItem(key) === null) {
        localStorage.setItem(key, JSON.stringify(preferences));
      }
    },
    {
      key: 'cm.deck-preferences.v1:' + displayDeckId,
      preferences: {
        deck_view: 'grid',
        deck_group_by: options.groupBy ?? null,
        deck_sort_by: 'name',
        deck_sort_direction: 'asc',
      },
    },
  );
  await page.addInitScript(
    ({ key, session }) => localStorage.setItem(key, JSON.stringify(session)),
    {
      key: 'sb-' + new URL(SUPABASE).hostname.split('.')[0] + '-auth-token',
      session: {
        access_token: fakeJwt(),
        refresh_token: 'fake',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: FAKE_USER,
      },
    },
  );

  const deck = {
    id: displayDeckId,
    name: owner ? 'My display deck' : 'Public display deck',
    description: '',
    format: 'Any',
    commanders: [],
    avatar_card_name: null,
    user_id: owner ? FAKE_USER.id : '44000000-0000-4000-8000-000000000001',
    username: owner ? 'Display Tester' : 'Another Player',
    color_ratios: { W: 0, U: 1, B: 0, R: 0, G: 0, C: 0 },
    visibility: owner ? 'private' : 'public',
    created_at: '2026-01-01',
    updated_at: null,
    like_count: 0,
    save_count: 0,
    view_count: 0,
    comment_count: 0,
  };
  const destinationDeck = {
    ...deck,
    id: destinationDeckId,
    name: 'Destination deck',
    user_id: FAKE_USER.id,
    username: 'Display Tester',
    visibility: 'private',
  };
  const items = cards.map((card, index) => ({
    id: card.oracle_id,
    list_id: displayDeckId,
    oracle_id: card.oracle_id,
    num_copies: index === 0 ? 2 : 1,
    board: 'Mainboard',
    is_commander: false,
  }));
  await page.route(BACKEND + '/bulkdata/card-names.min.json', (route) =>
    route.fulfill({ json: catalog.map((card) => card.name) }),
  );
  await page.route(
    BACKEND + '/bulkdata/card-name-to-oracle-id.min.json',
    (route) =>
      route.fulfill({
        json: Object.fromEntries(
          catalog.map((card) => [card.name.toLowerCase(), card.oracle_id]),
        ),
      }),
  );
  await page.route(BACKEND + '/bulkdata/commanders.min.json', (route) =>
    route.fulfill({ json: [] }),
  );
  await page.route(
    BACKEND + '/supabase/card-lists/mine/' + displayDeckId,
    (route) =>
      owner
        ? route.fulfill({ json: { decklist: deck } })
        : route.fulfill({ status: 404, json: {} }),
  );
  await page.route(BACKEND + '/supabase/card-lists/mine/search**', (route) =>
    route.fulfill({ json: { decklists: [destinationDeck] } }),
  );
  await page.route(
    BACKEND + '/supabase/card-lists/view/' + displayDeckId,
    (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ json: { view_count: 1 } });
      }
      return owner
        ? route.fulfill({ status: 404, json: {} })
        : route.fulfill({
            json: {
              decklist: deck,
              items,
              owner: {
                id: deck.user_id,
                username: deck.username,
                avatar_card_name: null,
                is_featured: false,
              },
            },
          });
    },
  );
  await page.route(SUPABASE + '/rest/v1/card_list_items**', (route) => {
    const listId = new URL(route.request().url()).searchParams.get('list_id');
    return route.fulfill({
      json: listId === 'eq.' + displayDeckId ? items : [],
    });
  });
  await page.route(BACKEND + '/cards/cards-by-oracle-ids', async (route) => {
    const requested = route.request().postDataJSON().oracleIds as string[];
    if (requested.some((id) => !cards.some((card) => card.oracle_id === id))) {
      await addedCardDataGate;
    }
    return route.fulfill({
      json: catalog.filter((card) => requested.includes(card.oracle_id)),
    });
  });
  await page.route(
    BACKEND + '/supabase/card-lists/add-cards-by-oracle-id',
    (route) => {
      const write = route.request().postDataJSON() as DisplayWrite;
      writes.push(write);
      if (write.listId === displayDeckId) {
        for (const oracleId of write.oracleIds) {
          const board = write.board ?? 'Mainboard';
          const existing = items.find(
            (item) => item.oracle_id === oracleId && item.board === board,
          );
          if (existing) existing.num_copies++;
          else
            items.push({
              id: oracleId,
              list_id: displayDeckId,
              oracle_id: oracleId,
              num_copies: 1,
              board,
              is_commander: false,
            });
        }
      }
      return route.fulfill({
        json: {
          addedCount: write.oracleIds.length,
          updatedCount: 0,
          invalidOracleIds: [],
        },
      });
    },
  );
  await gotoHydrated(page, '/about');
  await page.evaluate((path) => {
    const root = document.getElementById('__nuxt') as unknown as {
      __vue_app__: {
        config: {
          globalProperties: {
            $router: { push: (path: string) => Promise<unknown> };
          };
        };
      };
    };
    return root.__vue_app__.config.globalProperties.$router.push(path);
  }, '/lists/' + displayDeckId);
  await expect(page.locator('[aria-label="Deck view"]')).toBeEnabled();
  await expect(page.locator('.list-card')).toHaveCount(cards.length);

  return {
    cards,
    catalog,
    deck,
    items,
    writes,
    releaseImages,
    releaseAddedCardData,
  };
}
