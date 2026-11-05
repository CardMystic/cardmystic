import type { ScryfallCard } from '~/models/cardModel';
import type { AnalysisCard } from '~/utils/deckAnalysis';

export const playtestZones = [
  'library',
  'hand',
  'battlefield',
  'graveyard',
  'exile',
  'command',
] as const;
export type PlaytestZone = (typeof playtestZones)[number];
export type Destination = PlaytestZone | 'library-bottom';
export const manaColors = ['W', 'U', 'B', 'R', 'G', 'C'] as const;
export type ManaColor = (typeof manaColors)[number];
export interface FieldPosition {
  x: number;
  y: number;
}
export interface FieldLayout {
  columns: number;
  rows: number;
}
export interface PlaytestDrag {
  id: string;
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  width: number;
  phase: 'move' | 'end' | 'cancel';
}
export interface TokenDetails {
  name: string;
  type: string;
  power: string;
  toughness: string;
  text: string;
}
export interface PlaytestCard {
  id: string;
  definition: string;
  commander: boolean;
  casts: number;
  token: TokenDetails | null;
  tapped: boolean;
  face: number;
  faceDown: boolean;
  counters: Record<string, number>;
  position: FieldPosition;
}
export interface PlaytestState {
  cards: Record<string, PlaytestCard>;
  zones: Record<PlaytestZone, string[]>;
  life: number;
  poison: number;
  energy: number;
  mana: Record<ManaColor, number>;
  turn: number;
  landDrops: number;
  mulligans: number;
  nextId: number;
  log: string[];
}
export type PlaytestAction = (
  | { type: 'draw' | 'mill'; count: number }
  | {
      type: 'shuffle' | 'mulligan' | 'untap' | 'clear-mana';
    }
  | { type: 'next-turn'; draw?: boolean }
  | { type: 'move'; id: string; to: Destination; position?: FieldPosition }
  | { type: 'play'; id: string; position?: FieldPosition }
  | { type: 'tap' | 'flip' | 'face-down' | 'copy'; id: string }
  | { type: 'counter'; id: string; name: string; delta: number }
  | { type: 'player'; field: 'life' | 'poison' | 'energy'; delta: number }
  | { type: 'mana'; color: ManaColor; delta: number }
  | { type: 'token'; token: TokenDetails; count: number }
  | { type: 'roll'; sides: number }
) & { layout?: FieldLayout };

export type CardDefinitions = Record<string, ScryfallCard>;
const emptyMana = (): Record<ManaColor, number> => ({
  W: 0,
  U: 0,
  B: 0,
  R: 0,
  G: 0,
  C: 0,
});
const bounded = (n: number, min: number, max: number) =>
  Number.isFinite(n) ? Math.max(min, Math.min(max, Math.trunc(n))) : min;
export function shuffle<T>(cards: T[], random = Math.random): T[] {
  const result = [...cards];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.max(0, Math.floor(random() * (i + 1))));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function startingLife(format: string): number {
  return ['Commander', 'Pauper Commander', 'Predh'].includes(format)
    ? 40
    : format.includes('Brawl')
      ? 25
      : 20;
}
export function zoneOf(
  state: PlaytestState,
  id: string,
): PlaytestZone | undefined {
  return playtestZones.find((zone) => state.zones[zone].includes(id));
}
export function cardName(
  card: PlaytestCard,
  definitions: CardDefinitions,
): string {
  return (
    card.token?.name ??
    definitions[card.definition]?.card_faces?.[card.face]?.name ??
    definitions[card.definition]?.name ??
    'Card'
  );
}
export function cardType(
  card: PlaytestCard,
  definitions: CardDefinitions,
): string {
  if (card.faceDown) return 'Creature';
  return (
    card.token?.type ??
    definitions[card.definition]?.card_faces?.[card.face]?.type_line ??
    definitions[card.definition]?.type_line ??
    ''
  );
}
function nextPosition(
  state: PlaytestState,
  layout: FieldLayout = { columns: 5, rows: 3 },
): FieldPosition {
  const columns = bounded(layout.columns, 1, 20),
    rows = bounded(layout.rows, 1, 20);
  for (let index = 0; index < columns * rows; index++) {
    const position = {
      x: columns > 1 ? (index % columns) / (columns - 1) : 0,
      y: rows > 1 ? Math.floor(index / columns) / (rows - 1) : 0,
    };
    if (
      !state.zones.battlefield.some(
        (id) =>
          Math.hypot(
            state.cards[id].position.x - position.x,
            state.cards[id].position.y - position.y,
          ) < 0.08,
      )
    )
      return position;
  }
  return { x: 0.5, y: 0.5 };
}
const clampPosition = (position: FieldPosition): FieldPosition => ({
  x: Number.isFinite(position.x) ? Math.max(0, Math.min(1, position.x)) : 0,
  y: Number.isFinite(position.y) ? Math.max(0, Math.min(1, position.y)) : 0,
});
export function createPlaytest(
  entries: AnalysisCard[],
  format = 'Commander',
  random = Math.random,
) {
  const definitions: CardDefinitions = {};
  const state: PlaytestState = {
    cards: {},
    zones: {
      library: [],
      hand: [],
      battlefield: [],
      graveyard: [],
      exile: [],
      command: [],
    },
    life: startingLife(format),
    poison: 0,
    energy: 0,
    mana: emptyMana(),
    turn: 1,
    landDrops: 0,
    mulligans: 0,
    nextId: 0,
    log: ['Drew an opening hand.'],
  };
  for (const [index, entry] of entries.entries()) {
    definitions[String(index)] = entry.card;
    for (let copy = 0; copy < bounded(entry.quantity, 0, 100); copy++) {
      if (state.nextId >= 1000)
        throw new Error('Playtesting supports decks up to 1,000 cards.');
      const id = `card-${state.nextId++}`;
      const card: PlaytestCard = {
        id,
        definition: String(index),
        commander: !!entry.commander,
        casts: 0,
        token: null,
        tapped: false,
        face: 0,
        faceDown: false,
        counters: {},
        position: { x: 0, y: 0 },
      };
      state.cards[id] = card;
      state.zones[entry.commander ? 'command' : 'library'].push(id);
    }
  }
  state.zones.library = shuffle(state.zones.library, random);
  state.zones.hand = state.zones.library.splice(0, 7);
  return { state, definitions };
}

/** Manual solo game state. Nothing here writes to a saved deck or enforces card rules. */
export function playtestAction(
  previous: PlaytestState,
  action: PlaytestAction,
  definitions: CardDefinitions,
  random = Math.random,
): PlaytestState {
  const state: PlaytestState = {
    ...previous,
    cards: { ...previous.cards },
    mana: { ...previous.mana },
    log: [...previous.log],
    zones: Object.fromEntries(
      playtestZones.map((zone) => [zone, [...previous.zones[zone]]]),
    ) as PlaytestState['zones'],
  };
  const log = (message: string) => {
    state.log = [...state.log.slice(-49), message];
  };
  const edit = (id: string) => {
    const card = state.cards[id];
    if (!card) return undefined;
    return (state.cards[id] = { ...card, counters: { ...card.counters } });
  };
  function move(id: string, target: Destination, position?: FieldPosition) {
    const from = zoneOf(state, id);
    const to = target === 'library-bottom' ? 'library' : target;
    const card = edit(id);
    if (!from || !card || !playtestZones.includes(to)) return false;
    if (from === to && to !== 'library') {
      if (to !== 'battlefield' || !position) return false;
      card.position = clampPosition(position);
      state.zones.battlefield = [
        ...state.zones.battlefield.filter((value) => value !== id),
        id,
      ];
      log(`Repositioned ${cardName(card, definitions)}.`);
      return true;
    }
    if (to === 'command' && !card.commander) return false;
    if (
      to === 'battlefield' &&
      (from === 'hand' || action.type === 'play') &&
      !card.token &&
      /\bLand\b/.test(cardType(card, definitions))
    )
      state.landDrops++;
    state.zones[from] = state.zones[from].filter((value) => value !== id);
    if (card.token && to !== 'battlefield') {
      delete state.cards[id];
      log(`${cardName(card, definitions)} token left play.`);
      return true;
    }
    if (from !== to) {
      card.tapped = false;
      card.counters = {};
      if (to !== 'battlefield') {
        card.faceDown = false;
        card.face = 0;
      }
      if (from === 'command' && to === 'battlefield') card.casts++;
    }
    if (to === 'battlefield')
      card.position = clampPosition(
        position ?? nextPosition(state, action.layout),
      );
    if (target === 'library') state.zones.library.unshift(id);
    else state.zones[to].push(id);
    log(
      `Moved ${cardName(card, definitions)} to ${target === 'library' ? 'the top of the library' : target === 'library-bottom' ? 'the bottom of the library' : to}.`,
    );
    return true;
  }
  const draw = (count: number, destination: 'hand' | 'graveyard') => {
    const ids = state.zones.library.slice(0, bounded(count, 0, 1000));
    for (const id of ids) move(id, destination);
    return ids.length;
  };
  switch (action.type) {
    case 'draw':
    case 'mill': {
      const n = draw(
        action.count,
        action.type === 'draw' ? 'hand' : 'graveyard',
      );
      if (!n) return previous;
      log(
        `${action.type === 'draw' ? 'Drew' : 'Milled'} ${n} card${n === 1 ? '' : 's'}.`,
      );
      break;
    }
    case 'shuffle':
      state.zones.library = shuffle(state.zones.library, random);
      log('Shuffled the library.');
      break;
    case 'mulligan':
      if (!state.zones.hand.length && !state.zones.library.length)
        return previous;
      state.zones.library = shuffle(
        [...state.zones.library, ...state.zones.hand],
        random,
      );
      state.zones.hand = [];
      draw(7, 'hand');
      state.mulligans++;
      log(
        `Redrew ${state.zones.hand.length} cards. Put any mulligan cards on the bottom manually.`,
      );
      break;
    case 'move':
      if (!move(action.id, action.to, action.position)) return previous;
      break;
    case 'play': {
      const card = state.cards[action.id],
        zone = zoneOf(state, action.id);
      if (!card || !zone || zone === 'battlefield' || zone === 'library')
        return previous;
      move(action.id, 'battlefield', action.position);
      break;
    }
    case 'tap': {
      if (zoneOf(state, action.id) !== 'battlefield') return previous;
      const card = edit(action.id)!;
      card.tapped = !card.tapped;
      log(
        `${card.tapped ? 'Tapped' : 'Untapped'} ${cardName(card, definitions)}.`,
      );
      break;
    }
    case 'untap':
    case 'next-turn':
      for (const id of state.zones.battlefield) edit(id)!.tapped = false;
      if (action.type === 'next-turn') {
        state.turn++;
        state.landDrops = 0;
        state.mana = emptyMana();
        const count = action.draw === false ? 0 : draw(1, 'hand');
        log(
          `Turn ${state.turn}: untapped all, cleared mana, ${count ? 'drew a card' : action.draw === false ? 'draw skipped' : 'library empty'}.`,
        );
      } else log('Untapped all permanents.');
      break;
    case 'flip':
    case 'face-down': {
      const card = edit(action.id);
      if (!card) return previous;
      if (action.type === 'flip') {
        if ((definitions[card.definition]?.card_faces?.length ?? 0) < 2)
          return previous;
        card.face = card.face ? 0 : 1;
      } else card.faceDown = !card.faceDown;
      log(`Changed the face of ${cardName(card, definitions)}.`);
      break;
    }
    case 'counter': {
      const name = action.name.trim().slice(0, 40);
      const card = edit(action.id);
      if (
        !card ||
        !name ||
        ['__proto__', 'constructor', 'prototype'].includes(name) ||
        !Number.isFinite(action.delta)
      )
        return previous;
      const count = bounded((card.counters[name] ?? 0) + action.delta, 0, 9999);
      if (count) card.counters[name] = count;
      else delete card.counters[name];
      log(`${cardName(card, definitions)}: ${count} ${name} counters.`);
      break;
    }
    case 'player':
      state[action.field] = bounded(
        state[action.field] + action.delta,
        action.field === 'life' ? -9999 : 0,
        9999,
      );
      log(`${action.field}: ${state[action.field]}.`);
      break;
    case 'mana':
      state.mana[action.color] = bounded(
        state.mana[action.color] + action.delta,
        0,
        999,
      );
      break;
    case 'clear-mana':
      state.mana = emptyMana();
      break;
    case 'token':
    case 'copy': {
      if (Object.keys(state.cards).length >= 1500) return previous;
      const source =
        action.type === 'copy' ? state.cards[action.id] : undefined;
      if (action.type === 'copy' && !source) return previous;
      const count = action.type === 'token' ? bounded(action.count, 1, 100) : 1;
      for (
        let n = 0;
        n < count && Object.keys(state.cards).length < 1500;
        n++
      ) {
        const id = `token-${state.nextId++}`;
        const token =
          action.type === 'token'
            ? {
                ...action.token,
                name: action.token.name.trim().slice(0, 100) || 'Token',
              }
            : (source!.token ?? {
                name: cardName(source!, definitions),
                type: cardType(source!, definitions),
                power: '',
                toughness: '',
                text: '',
              });
        const card: PlaytestCard = {
          id,
          definition: source?.definition ?? '',
          token,
          commander: false,
          casts: 0,
          face: source?.face ?? 0,
          faceDown: source?.faceDown ?? false,
          tapped: false,
          counters: {},
          position: nextPosition(state, action.layout),
        };
        state.cards[id] = card;
        state.zones.battlefield.push(id);
      }
      log(
        action.type === 'copy'
          ? `Created a token copy of ${cardName(source!, definitions)}.`
          : `Created ${count} ${action.token.name || 'Token'} token(s).`,
      );
      break;
    }
    case 'roll': {
      const sides = bounded(action.sides, 2, 100);
      const result =
        1 + Math.min(sides - 1, Math.max(0, Math.floor(random() * sides)));
      log(
        sides === 2
          ? `Coin flip: ${result === 1 ? 'heads' : 'tails'}.`
          : `Rolled a d${sides}: ${result}.`,
      );
      break;
    }
  }
  return state;
}
