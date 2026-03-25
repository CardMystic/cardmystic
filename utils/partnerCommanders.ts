import type { PartnerCommanders } from '~/composables/useBulkData';

export type PartnerType =
  | 'partner'
  | 'chooseABackground'
  | 'background'
  | 'doctorsCompanion'
  | 'timeLordDoctor';

export function getPartnerType(
  commanderName: string,
  partnerData: PartnerCommanders,
): PartnerType | null {
  if (partnerData.partner.includes(commanderName)) return 'partner';
  if (partnerData.chooseABackground.includes(commanderName))
    return 'chooseABackground';
  if (partnerData.background.includes(commanderName)) return 'background';
  if (partnerData.doctorsCompanion.includes(commanderName))
    return 'doctorsCompanion';
  if (partnerData.timeLordDoctor.includes(commanderName))
    return 'timeLordDoctor';
  return null;
}

export function getValidPartners(
  partnerType: PartnerType,
  partnerData: PartnerCommanders,
): string[] {
  if (partnerType === 'partner') return partnerData.partner;
  if (partnerType === 'chooseABackground') return partnerData.background;
  if (partnerType === 'background') return partnerData.chooseABackground;
  if (partnerType === 'doctorsCompanion') return partnerData.timeLordDoctor;
  if (partnerType === 'timeLordDoctor') return partnerData.doctorsCompanion;
  return [];
}
