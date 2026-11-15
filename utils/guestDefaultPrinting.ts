import { z } from 'zod';

const guestPrinting = z.object({
  printingId: z.guid(),
  finish: z.enum(['nonfoil', 'foil', 'etched']),
});
type GuestPrinting = z.infer<typeof guestPrinting>;

const prefix = 'cardmystic-guest-deck-printing:';
function storageKey(name: string) {
  return prefix + name.trim().toLowerCase();
}

export function guestDefaultPrintingNames(): string[] {
  try {
    return Object.keys(localStorage)
      .filter((key) => key.startsWith(prefix))
      .map((key) => key.slice(prefix.length));
  } catch {
    return [];
  }
}

export function readGuestDefaultPrinting(
  name: string,
): GuestPrinting | undefined {
  try {
    const value = localStorage.getItem(storageKey(name));
    return value ? guestPrinting.parse(JSON.parse(value)) : undefined;
  } catch {
    return undefined;
  }
}

export function saveGuestDefaultPrinting(
  name: string,
  printing: GuestPrinting | null,
) {
  if (printing)
    localStorage.setItem(storageKey(name), JSON.stringify(printing));
  else localStorage.removeItem(storageKey(name));
}
