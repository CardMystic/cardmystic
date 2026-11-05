import { describe, expect, it } from 'vitest';
import type { ScryfallCard } from '~/models/cardModel';
import {
  createPlaytest,
  playtestAction,
  playtestZones,
  zoneOf,
  type PlaytestAction,
  type PlaytestState,
} from '~/utils/playtest';
import { usePlaytest } from '~/composables/usePlaytest';

const card = (name: string, type: string, extra = {}) =>
  ({ name, type_line: type, ...extra }) as ScryfallCard;
const entries = [
  { card: card('Island', 'Basic Land — Island'), quantity: 12 },
  { card: card('Negate', 'Instant'), quantity: 2 },
  { card: card('Bear', 'Creature — Bear'), quantity: 2 },
  {
    card: card('Commander', 'Legendary Creature'),
    quantity: 1,
    commander: true,
  },
];
function game() {
  const setup = createPlaytest(entries, 'Commander', () => 0.4);
  let state = setup.state;
  const act = (action: PlaytestAction) =>
    (state = playtestAction(state, action, setup.definitions, () => 0.4));
  return {
    get state() {
      return state;
    },
    definitions: setup.definitions,
    act,
  };
}
function invariant(state: PlaytestState) {
  const ids = playtestZones.flatMap((zone) => state.zones[zone]);
  expect(new Set(ids).size).toBe(ids.length);
  expect([...ids].sort()).toEqual(Object.keys(state.cards).sort());
}

describe('solo playtest state', () => {
  it('creates separate copies, keeps commanders outside the library and never edits the deck', () => {
    const before = JSON.stringify(entries);
    const g = game();
    expect(g.state.zones.hand).toHaveLength(7);
    expect(g.state.zones.library).toHaveLength(9);
    expect(g.state.zones.command).toHaveLength(1);
    expect(g.state.life).toBe(40);
    const id = g.state.zones.hand[0];
    g.act({ type: 'move', id, to: 'battlefield' });
    const snapshot = JSON.stringify(g.state);
    const previous = g.state;
    g.act({ type: 'tap', id });
    g.act({ type: 'counter', id, name: '+1/+1', delta: 2 });
    expect(JSON.stringify(previous)).toBe(snapshot);
    expect(
      Object.values(g.state.cards).filter((item) => item.tapped),
    ).toHaveLength(1);
    expect(JSON.stringify(entries)).toBe(before);
    invariant(g.state);
  });
  it('starts ready to play and can redraw the hand without a keep step', () => {
    const g = game();
    g.act({ type: 'draw', count: 1 });
    expect(g.state.zones.hand).toHaveLength(8);
    g.act({ type: 'mulligan' });
    expect(g.state.zones.hand).toHaveLength(7);
    expect(g.state.zones.library).toHaveLength(9);
    const id = g.state.zones.hand[0];
    g.act({ type: 'move', id, to: 'library-bottom' });
    expect(g.state.zones.library.at(-1)).toBe(id);
    expect(g.state.zones.hand).toHaveLength(6);
    invariant(g.state);
  });
  it('plays cards directly onto the battlefield and tracks commander casts', () => {
    const g = game();
    const spell = Object.values(g.state.cards).find(
      (item) => g.definitions[item.definition].name === 'Negate',
    )!.id;
    g.act({ type: 'move', id: spell, to: 'hand' });
    g.act({ type: 'play', id: spell });
    expect(zoneOf(g.state, spell)).toBe('battlefield');
    g.act({ type: 'copy', id: spell });
    const copy = g.state.zones.battlefield.at(-1)!;
    g.act({ type: 'move', id: copy, to: 'graveyard' });
    expect(g.state.cards[copy]).toBeUndefined();
    g.act({ type: 'move', id: spell, to: 'graveyard' });
    expect(zoneOf(g.state, spell)).toBe('graveyard');
    const commander = g.state.zones.command[0];
    g.act({ type: 'play', id: commander });
    expect(zoneOf(g.state, commander)).toBe('battlefield');
    expect(g.state.cards[commander].casts).toBe(1);
    g.act({ type: 'move', id: commander, to: 'command' });
    g.act({ type: 'move', id: commander, to: 'battlefield' });
    expect(g.state.cards[commander].casts).toBe(2);
    invariant(g.state);
  });
  it('plays a modal land face and resets transient state on zone changes', () => {
    const setup = createPlaytest(
      [
        {
          card: card('Spell // Land', 'Instant // Land', {
            card_faces: [
              { name: 'Spell', type_line: 'Instant' },
              { name: 'Land', type_line: 'Land' },
            ],
          }),
          quantity: 1,
        },
      ],
      'Modern',
    );
    let state = setup.state;
    const id = state.zones.hand[0];
    const act = (action: PlaytestAction) =>
      (state = playtestAction(state, action, setup.definitions));
    act({ type: 'flip', id });
    act({ type: 'play', id });
    expect(zoneOf(state, id)).toBe('battlefield');
    expect(state.cards[id].face).toBe(1);
    expect(state.landDrops).toBe(1);
    act({ type: 'counter', id, name: 'charge', delta: 2 });
    act({ type: 'tap', id });
    act({ type: 'move', id, to: 'hand' });
    expect(state.cards[id]).toMatchObject({
      face: 0,
      tapped: false,
      counters: {},
    });
    // Dragging preserves the chosen face just like clicking Play.
    act({ type: 'flip', id });
    act({ type: 'move', id, to: 'battlefield', position: { x: 0.4, y: 0.2 } });
    expect(state.cards[id].face).toBe(1);
    expect(state.landDrops).toBe(2);
  });
  it('tracks land drops without enforcing a limit, resets each turn and restores the count with undo', () => {
    const g = usePlaytest();
    g.start(entries, 'Commander');
    const lands = Object.values(g.state.value!.cards).filter((item) =>
      g.definitions.value[item.definition].type_line.includes('Land'),
    );
    expect(g.state.value!.landDrops).toBe(0);
    for (const land of lands.slice(0, 2)) {
      g.act({ type: 'move', id: land.id, to: 'hand' });
      g.act({ type: 'move', id: land.id, to: 'battlefield' });
    }
    expect(g.state.value!.landDrops).toBe(2);
    g.act({
      type: 'move',
      id: lands[0].id,
      to: 'battlefield',
      position: { x: 0.6, y: 0.2 },
    });
    g.act({ type: 'copy', id: lands[0].id });
    expect(g.state.value!.landDrops).toBe(2);
    g.act({ type: 'next-turn', draw: false });
    expect(g.state.value!.landDrops).toBe(0);
    g.undo();
    expect(g.state.value!.landDrops).toBe(2);
    g.redo();
    expect(g.state.value!.landDrops).toBe(0);
    // Fetching a land from the library is not another land drop.
    g.act({ type: 'move', id: lands[2].id, to: 'library' });
    g.act({ type: 'move', id: lands[2].id, to: 'battlefield' });
    g.act({ type: 'play', id: g.state.value!.zones.command[0] });
    expect(g.state.value!.landDrops).toBe(0);
    g.act({ type: 'move', id: lands[2].id, to: 'exile' });
    g.act({ type: 'play', id: lands[2].id });
    expect(g.state.value!.landDrops).toBe(1);
  });
  it('creates tokens and copies, then removes only tokens that leave play', () => {
    const g = game();
    g.act({
      type: 'token',
      token: {
        name: 'Soldier',
        type: 'Creature — Soldier',
        power: '1',
        toughness: '1',
        text: '',
      },
      count: 3,
    });
    expect(g.state.zones.battlefield).toHaveLength(3);
    const token = g.state.zones.battlefield[0];
    g.act({ type: 'copy', id: token });
    expect(g.state.zones.battlefield).toHaveLength(4);
    g.act({ type: 'move', id: token, to: 'graveyard' });
    expect(g.state.cards[token]).toBeUndefined();
    expect(g.state.zones.graveyard).toHaveLength(0);
    expect(
      Object.values(g.state.cards).filter((item) => !item.token),
    ).toHaveLength(17);
    invariant(g.state);
  });
  it('draws and mills only available cards; next turn untaps, clears mana and draws once', () => {
    const g = game();
    const id = g.state.zones.hand[0];
    g.act({ type: 'move', id, to: 'battlefield' });
    g.act({ type: 'tap', id });
    g.act({ type: 'mana', color: 'U', delta: 3 });
    const before = g.state.zones.library.length;
    g.act({ type: 'next-turn', draw: false });
    expect(g.state.zones.library).toHaveLength(before);
    expect(g.state.turn).toBe(2);
    g.act({ type: 'next-turn' });
    expect(g.state.turn).toBe(3);
    expect(g.state.cards[id].tapped).toBe(false);
    expect(g.state.mana.U).toBe(0);
    expect(g.state.zones.library).toHaveLength(before - 1);
    g.act({ type: 'mill', count: 100 });
    expect(g.state.zones.library).toHaveLength(0);
    const empty = g.state;
    g.act({ type: 'draw', count: 1 });
    expect(g.state).toBe(empty);
    invariant(g.state);
  });
  it('keeps scry top/bottom ordering and refuses command-zone moves for ordinary cards', () => {
    const g = game();
    const [first, second] = g.state.zones.library;
    g.act({ type: 'move', id: first, to: 'library-bottom' });
    expect(g.state.zones.library[0]).toBe(second);
    expect(g.state.zones.library.at(-1)).toBe(first);
    g.act({ type: 'move', id: first, to: 'library' });
    expect(g.state.zones.library[0]).toBe(first);
    const snapshot = g.state;
    g.act({ type: 'move', id: first, to: 'command' });
    expect(g.state).toBe(snapshot);
    invariant(g.state);
  });
  it('undoes and redoes token removal and random draws without rerolling, then clears redo on a new action', () => {
    const g = usePlaytest();
    g.start(entries, 'Commander');
    const before = g.state.value;
    g.act({ type: 'draw', count: 2 });
    const drawn = g.state.value;
    g.undo();
    expect(g.state.value).toBe(before);
    g.redo();
    expect(g.state.value).toBe(drawn);
    g.act({ type: 'copy', id: g.state.value!.zones.hand[0] });
    const id = g.state.value!.zones.battlefield[0];
    g.act({ type: 'move', id, to: 'exile' });
    expect(g.state.value!.cards[id]).toBeUndefined();
    g.undo();
    expect(g.state.value!.cards[id]).toBeDefined();
    g.act({ type: 'player', field: 'life', delta: -1 });
    expect(g.canRedo.value).toBe(false);
  });
  it('places and repositions cards without changing their state, and undo restores coordinates and pile order', () => {
    const g = usePlaytest();
    g.start(entries, 'Commander');
    const [first, second] = g.state.value!.zones.hand;
    g.act({
      type: 'move',
      id: first,
      to: 'battlefield',
      position: { x: 0.25, y: 0.7 },
    });
    g.act({ type: 'tap', id: first });
    g.act({ type: 'counter', id: first, name: 'charge', delta: 2 });
    const before = g.state.value;
    g.act({
      type: 'move',
      id: first,
      to: 'battlefield',
      position: { x: 5, y: -1 },
    });
    expect(g.state.value!.cards[first]).toMatchObject({
      position: { x: 1, y: 0 },
      tapped: true,
      counters: { charge: 2 },
    });
    g.undo();
    expect(g.state.value).toBe(before);
    g.act({ type: 'move', id: first, to: 'graveyard' });
    g.act({ type: 'move', id: second, to: 'graveyard' });
    expect(g.state.value!.zones.graveyard.at(-1)).toBe(second);
    g.act({
      type: 'move',
      id: second,
      to: 'battlefield',
      position: { x: 0.4, y: 0.8 },
    });
    expect(g.state.value!.zones.graveyard.at(-1)).toBe(first);
    g.undo();
    expect(g.state.value!.zones.graveyard.at(-1)).toBe(second);
    invariant(g.state.value!);
  });
});
