import type { ScryfallCard } from '~/models/cardModel';
import type { Database } from '~/database.types';

export type Finish = 'nonfoil' | 'foil' | 'etched';
export type Printing = Database['public']['Tables']['card_printings']['Row'] & {
  card_printing_sets?: { name: string } | null;
};
export type PrintingChoice = {
  value: string;
  label: string;
  printing: Printing | null;
  finish: Finish | null;
};
export type PrintingSelection = {
  oracle_id: string;
  board: string;
  printing_id?: string | null;
  finish?: string | null;
};
export const finishLabels: Record<Finish, string> = {
  nonfoil: 'Nonfoil',
  foil: 'Foil',
  etched: 'Etched foil',
};
export function printingFinishes(printing: Printing): Finish[] {
  return (['nonfoil', 'foil', 'etched'] as const).filter(
    (_, index) => printing.finish_mask & (1 << index),
  );
}
export function printingPrice(
  printing: Printing,
  finish: string | null | undefined,
): string | null {
  const cents =
    finish === 'nonfoil'
      ? printing.usd_cents
      : finish === 'foil'
        ? printing.foil_cents
        : finish === 'etched'
          ? printing.etched_cents
          : null;
  return cents == null ? null : (cents / 100).toFixed(2);
}
export function printingImages(
  path: string,
): NonNullable<ScryfallCard['image_uris']> {
  const url = (size: string) =>
    `https://cards.scryfall.io/${size}/${size === 'png' ? path.replace('.jpg', '.png') : path}`;
  return {
    small: url('small'),
    normal: url('normal'),
    large: url('large'),
    png: url('png'),
    art_crop: url('art_crop'),
    border_crop: url('border_crop'),
  };
}
/** Keep rules/identity canonical; artwork and the selected finish's quote are printing-specific. */
export function withPrinting(
  card: ScryfallCard,
  selection: Omit<PrintingSelection, 'board'> & { board?: string },
  printing?: Printing,
): ScryfallCard {
  if (!selection.printing_id) return card;
  // Never present another printing's price while selected metadata is loading or unavailable.
  const prices = {
    usd: null,
    usd_foil: null,
    usd_etched: null,
    usd_estimate: null,
    eur: null,
    eur_foil: null,
    tix: null,
  };
  if (
    !printing ||
    printing.id !== selection.printing_id ||
    printing.oracle_id !== card.oracle_id
  )
    return {
      ...card,
      prices,
      image_uris: undefined,
      card_faces: card.card_faces?.map((face) => ({
        ...face,
        image_uris: undefined,
      })),
    };
  const paths = printing.image_paths;
  return {
    ...card,
    id: printing.id,
    selected_finish: selection.finish as Finish,
    set: printing.set_code,
    set_name:
      printing.card_printing_sets?.name ?? printing.set_code.toUpperCase(),
    collector_number: printing.collector_number,
    lang: printing.lang,
    released_at: printing.released_at,
    flavor_name: printing.flavor_name ?? undefined,
    finishes: printingFinishes(printing),
    tcgplayer_id: printing.tcgplayer_id ?? undefined,
    scryfall_uri: `https://scryfall.com/card/${printing.set_code}/${encodeURIComponent(printing.collector_number)}/${printing.lang}`,
    purchase_uris: printing.tcgplayer_id
      ? {
          tcgplayer: `https://www.tcgplayer.com/product/${printing.tcgplayer_id}`,
        }
      : {},
    prices: { ...prices, usd: printingPrice(printing, selection.finish) },
    image_uris:
      paths.length === 1 || !card.card_faces?.length
        ? printingImages(paths[0]!)
        : undefined,
    card_faces: card.card_faces?.map((face, index) => ({
      ...face,
      flavor_name: printing.flavor_name?.split(' // ')[index],
      image_uris:
        paths.length > 1 && paths[index]
          ? printingImages(paths[index]!)
          : undefined,
    })),
  };
}
