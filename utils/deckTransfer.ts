export type TransferBoard = 'Mainboard' | 'Sideboard' | 'Considering';
export interface TransferCard {
  name: string;
  quantity: number;
  board: TransferBoard;
  commander?: boolean;
  arena?: boolean;
  mtgo?: boolean;
}
export type DeckExportFormat = 'text' | 'arena' | 'mtgo' | 'csv';
const header = (s: string) => s.trim().toLowerCase().replace(/[ _-]/g, '');
const boardFor = (s: string): TransferBoard =>
  /sideboard|companion|^sb$/i.test(s)
    ? 'Sideboard'
    : /considering|maybeboard/i.test(s)
      ? 'Considering'
      : 'Mainboard';
function quantity(raw: string) {
  const count = Number(raw || '1');
  if (!Number.isInteger(count) || count < 1 || count > 100)
    throw new Error('Each card quantity must be a whole number from 1 to 100.');
  return count;
}
function cleanName(raw: string) {
  return raw
    .replace(/\s*#!.*$/, '')
    .replace(/\s*\*F\*\s*$/i, '')
    .replace(/\s*\([A-Z0-9]+\)\s*[\w-]+\s*$/i, '')
    .trim();
}
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [],
    field = '',
    quoted = false;
  const input = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === '"') {
      if (quoted && input[i + 1] === '"') {
        field += '"';
        i++;
      } else if (quoted || field.length === 0) quoted = !quoted;
      else throw new Error('Invalid CSV quoting.');
    } else if (!quoted && (char === ',' || char === '\n' || char === '\r')) {
      row.push(field);
      field = '';
      if (char !== ',') {
        if (row.some((value) => value.trim())) rows.push(row);
        row = [];
        if (char === '\r' && input[i + 1] === '\n') i++;
      }
    } else field += char;
  }
  if (quoted) throw new Error('The CSV has an unclosed quote.');
  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}
export function parseDeckImport(
  text: string,
  format: 'text' | 'csv',
): TransferCard[] {
  if (text.length > 5_000_000)
    throw new Error('Import files must be under 5 MB.');
  const cards: TransferCard[] = [];
  if (format === 'csv') {
    const [columns = [], ...rows] = parseCsv(text);
    const fields = columns.map(header);
    const index = (names: string[]) =>
      fields.findIndex((field) => names.includes(field));
    const nameIndex = index(['name', 'cardname', 'card']);
    const countIndex = index(['quantity', 'qty', 'count', 'amount']);
    const boardIndex = index(['board', 'section', 'category', 'categories']);
    const commanderIndex = index(['commander', 'iscommander']);
    if (nameIndex < 0)
      throw new Error(
        'CSV needs a Name or Card Name column. Quantity/Count and Board columns are optional.',
      );
    for (const row of rows) {
      const name = cleanName(row[nameIndex] ?? '');
      if (!name) throw new Error('A CSV row has no card name.');
      cards.push({
        name,
        quantity: quantity(countIndex < 0 ? '1' : row[countIndex]),
        board: boardFor(row[boardIndex] ?? ''),
        commander:
          /^(true|1|yes)$/i.test(row[commanderIndex] ?? '') ||
          /commander/i.test(row[boardIndex] ?? ''),
      });
    }
  } else {
    let board: TransferBoard = 'Mainboard',
      commander = false,
      sawCards = false,
      separated = false;
    for (const raw of text.replace(/^\uFEFF/, '').split(/\r?\n/)) {
      let line = raw.trim();
      if (!line) {
        if (sawCards) separated = true;
        continue;
      }
      if (
        /^\/\//.test(line) ||
        /^#/.test(line) ||
        /^About$|^Name\s/i.test(line)
      )
        continue;
      if (
        /^(deck|mainboard|sideboard|considering|maybeboard|commander|companion)\s*:?(?:\s*\(\d+\))?$/i.test(
          line,
        )
      ) {
        board = boardFor(line);
        commander = /^commander/i.test(line);
        separated = false;
        continue;
      }
      if (/^SB:\s*/i.test(line)) {
        board = 'Sideboard';
        commander = false;
        line = line.replace(/^SB:\s*/i, '');
      } else if (separated && sawCards && !commander) board = 'Sideboard';
      separated = false;
      const match = /^(\d+)x?\s+(.+)$/i.exec(line);
      const name = cleanName(match?.[2] ?? line);
      if (!name) throw new Error('A card name is missing.');
      cards.push({
        name,
        quantity: quantity(match?.[1] ?? '1'),
        board,
        commander,
      });
      sawCards = true;
    }
  }
  if (!cards.length) throw new Error('No cards found in that import.');
  if (cards.length > 50_000)
    throw new Error('Import at most 50,000 card entries at a time.');
  const merged = new Map<string, TransferCard>();
  for (const card of cards) {
    const key = `${card.board}:${card.name.toLowerCase()}`;
    const old = merged.get(key);
    const combined = (old?.quantity ?? 0) + card.quantity;
    if (combined > 100)
      throw new Error(`More than 100 copies of ${card.name}.`);
    merged.set(key, {
      ...card,
      quantity: combined,
      commander: old?.commander || card.commander,
    });
  }
  return [...merged.values()];
}
const csvCell = (s: string) => `"${s.replace(/"/g, '""')}"`;
export function exportDeck(
  cards: TransferCard[],
  format: DeckExportFormat,
): string {
  if (format === 'csv')
    return [
      'Name,Quantity,Board,Commander',
      ...cards.map((card) =>
        [csvCell(card.name), card.quantity, card.board, !!card.commander].join(
          ',',
        ),
      ),
    ].join('\r\n');
  const line = (card: TransferCard) =>
    `${card.quantity} ${format === 'arena' ? card.name.split(' // ')[0] : card.name}`;
  const main = cards.filter((card) => card.board === 'Mainboard');
  const side = cards.filter((card) => card.board === 'Sideboard');
  if (format === 'mtgo')
    return [
      ...main.map(line),
      ...(side.length ? ['', ...side.map(line)] : []),
    ].join('\n');
  if (format === 'arena')
    return [
      ...(main.some((card) => card.commander)
        ? ['Commander', ...main.filter((card) => card.commander).map(line), '']
        : []),
      'Deck',
      ...main.filter((card) => !card.commander).map(line),
      ...(side.length ? ['', 'Sideboard', ...side.map(line)] : []),
    ].join('\n');
  return (['Mainboard', 'Sideboard', 'Considering'] as const)
    .flatMap((board) => {
      const rows = cards.filter((card) => card.board === board);
      return rows.length ? [board, ...rows.map(line), ''] : [];
    })
    .join('\n')
    .trim();
}
