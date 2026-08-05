import { describe, it, expect } from 'vitest';
import {
  getAffiliateLink,
  getMassEntryAffiliateLink,
  generateTCGPlayerSearchUrl,
} from '~/utils/tcgPlayer';

const PARTNER_PREFIX = 'https://partner.tcgplayer.com/Z6vBoK?u=';

const unwrapPartnerUrl = (url: string) => {
  expect(url.startsWith(PARTNER_PREFIX)).toBe(true);
  return decodeURIComponent(url.slice(PARTNER_PREFIX.length));
};

// ---------------------------------------------------------------------------
// getAffiliateLink
// ---------------------------------------------------------------------------
describe('getAffiliateLink', () => {
  it('wraps the product URL in the partner redirect', () => {
    const url = getAffiliateLink(12345);
    expect(unwrapPartnerUrl(url)).toBe(
      'https://www.tcgplayer.com/product/12345',
    );
  });

  it('accepts string ids', () => {
    const url = getAffiliateLink('98765');
    expect(unwrapPartnerUrl(url)).toBe(
      'https://www.tcgplayer.com/product/98765',
    );
  });

  it('returns empty string for missing ids', () => {
    expect(getAffiliateLink('')).toBe('');
    expect(getAffiliateLink(0)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// getMassEntryAffiliateLink
// ---------------------------------------------------------------------------
describe('getMassEntryAffiliateLink', () => {
  it('returns empty string for empty input', () => {
    expect(getMassEntryAffiliateLink([])).toBe('');
    expect(getMassEntryAffiliateLink(undefined as unknown as string[])).toBe(
      '',
    );
  });

  it('defaults quantity to 1 and joins names with +', () => {
    const inner = unwrapPartnerUrl(getMassEntryAffiliateLink(['Sol Ring']));
    expect(inner).toBe('https://www.tcgplayer.com/massentry?c=1+Sol+Ring');
  });

  it('honors a leading quantity', () => {
    const inner = unwrapPartnerUrl(
      getMassEntryAffiliateLink(['4 Lightning Bolt']),
    );
    expect(inner).toBe(
      'https://www.tcgplayer.com/massentry?c=4+Lightning+Bolt',
    );
  });

  it('separates multiple cards with || (encoded)', () => {
    const url = getMassEntryAffiliateLink(['Sol Ring', '2 Counterspell']);
    // The || separator must survive as %7C%7C inside the wrapped URL.
    expect(url).toContain(encodeURIComponent('%7C%7C'));
    const inner = unwrapPartnerUrl(url);
    expect(inner).toBe(
      'https://www.tcgplayer.com/massentry?c=1+Sol+Ring%7C%7C2+Counterspell',
    );
  });

  it('encodes punctuation but keeps + as the word separator', () => {
    const inner = unwrapPartnerUrl(getMassEntryAffiliateLink(["Urza's Saga"]));
    // encodeURIComponent leaves apostrophes intact; spaces become '+'.
    expect(inner).toBe("https://www.tcgplayer.com/massentry?c=1+Urza's+Saga");
    const comma = unwrapPartnerUrl(
      getMassEntryAffiliateLink(['Krenko, Mob Boss']),
    );
    expect(comma).toBe(
      'https://www.tcgplayer.com/massentry?c=1+Krenko%2C+Mob+Boss',
    );
  });
});

// ---------------------------------------------------------------------------
// generateTCGPlayerSearchUrl
// ---------------------------------------------------------------------------
describe('generateTCGPlayerSearchUrl', () => {
  it('builds an encoded search URL', () => {
    expect(generateTCGPlayerSearchUrl('Sol Ring')).toBe(
      'https://www.tcgplayer.com/search/magic/product?q=Sol%20Ring',
    );
  });
});
