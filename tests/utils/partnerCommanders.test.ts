import { describe, it, expect } from 'vitest';
import { getPartnerType, getValidPartners } from '~/utils/partnerCommanders';
import type { PartnerCommanders } from '~/composables/useBulkData';

const partnerData: PartnerCommanders = {
  partner: ['Thrasios, Triton Hero', 'Tymna the Weaver'],
  chooseABackground: ['Wilson, Refined Grizzly'],
  background: ['Raised by Giants'],
  doctorsCompanion: ['Clara Oswald'],
  timeLordDoctor: ['The Tenth Doctor'],
};

// ---------------------------------------------------------------------------
// getPartnerType
// ---------------------------------------------------------------------------
describe('getPartnerType', () => {
  it('classifies each partner mechanic', () => {
    expect(getPartnerType('Thrasios, Triton Hero', partnerData)).toBe(
      'partner',
    );
    expect(getPartnerType('Wilson, Refined Grizzly', partnerData)).toBe(
      'chooseABackground',
    );
    expect(getPartnerType('Raised by Giants', partnerData)).toBe('background');
    expect(getPartnerType('Clara Oswald', partnerData)).toBe(
      'doctorsCompanion',
    );
    expect(getPartnerType('The Tenth Doctor', partnerData)).toBe(
      'timeLordDoctor',
    );
  });

  it('returns null for non-partner commanders', () => {
    expect(getPartnerType('Krenko, Mob Boss', partnerData)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getValidPartners — pairings must be complementary, not same-type
// ---------------------------------------------------------------------------
describe('getValidPartners', () => {
  it('partner pairs with other partner commanders', () => {
    expect(getValidPartners('partner', partnerData)).toEqual(
      partnerData.partner,
    );
  });

  it('choose-a-background pairs with backgrounds (and vice versa)', () => {
    expect(getValidPartners('chooseABackground', partnerData)).toEqual(
      partnerData.background,
    );
    expect(getValidPartners('background', partnerData)).toEqual(
      partnerData.chooseABackground,
    );
  });

  it("doctor's companion pairs with doctors (and vice versa)", () => {
    expect(getValidPartners('doctorsCompanion', partnerData)).toEqual(
      partnerData.timeLordDoctor,
    );
    expect(getValidPartners('timeLordDoctor', partnerData)).toEqual(
      partnerData.doctorsCompanion,
    );
  });
});
