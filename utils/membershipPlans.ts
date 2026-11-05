export const membershipTierLabels = {
  normal: 'Free',
  enhanced: 'CardMystic Pro',
} as const;

export const membershipPlans = [
  {
    tier: 'enhanced' as const,
    name: 'CardMystic Pro',
    price: 4.99,
    available: 'enhancedAvailable' as const,
  },
];

export const enhancedTopUpPrice = 4.99;
