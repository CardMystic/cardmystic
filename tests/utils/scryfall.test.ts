import { describe, it, expect } from 'vitest';
import { getCardImageUrl } from '~/utils/scryfall';
import type { ScryfallCard } from '~/models/cardModel';

const card = (image_uris: Record<string, string> | undefined) =>
  ({ image_uris }) as unknown as ScryfallCard;

const dualFaced = (
  faces: Array<{ image_uris?: Record<string, string> }>,
): ScryfallCard => ({ card_faces: faces }) as unknown as ScryfallCard;

describe('getCardImageUrl', () => {
  it('defaults to the normal Scryfall variant', () => {
    const url = getCardImageUrl(card({ small: 'S', normal: 'N', large: 'L' }));
    expect(url).toBe('N');
  });

  it('returns the small variant when size="small" is requested', () => {
    const url = getCardImageUrl(
      card({ small: 'S', normal: 'N', large: 'L' }),
      false,
      'small',
    );
    expect(url).toBe('S');
  });

  it('returns the large variant when size="large" is requested', () => {
    const url = getCardImageUrl(
      card({ small: 'S', normal: 'N', large: 'L' }),
      false,
      'large',
    );
    expect(url).toBe('L');
  });

  it('falls back to the next-best size when the requested one is missing', () => {
    // small requested but only normal exists → normal
    expect(getCardImageUrl(card({ normal: 'N' }), false, 'small')).toBe('N');
    // large requested but only small exists → small
    expect(getCardImageUrl(card({ small: 'S' }), false, 'large')).toBe('S');
  });

  it('uses the back face when isFlipped is true on dual-faced cards', () => {
    const dfc = dualFaced([
      { image_uris: { normal: 'FRONT' } },
      { image_uris: { normal: 'BACK' } },
    ]);
    expect(getCardImageUrl(dfc, false)).toBe('FRONT');
    expect(getCardImageUrl(dfc, true)).toBe('BACK');
  });

  it('respects the requested size on dual-faced cards', () => {
    const dfc = dualFaced([
      { image_uris: { small: 'fs', normal: 'fn' } },
      { image_uris: { small: 'bs', normal: 'bn' } },
    ]);
    expect(getCardImageUrl(dfc, false, 'small')).toBe('fs');
    expect(getCardImageUrl(dfc, true, 'small')).toBe('bs');
  });

  it('returns "" when no image_uris are present anywhere', () => {
    expect(getCardImageUrl(card(undefined))).toBe('');
  });
});
