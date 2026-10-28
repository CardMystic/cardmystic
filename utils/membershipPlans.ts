export const membershipTierLabels = {
  normal: 'Free',
  enhanced: 'Enhanced',
} as const;

export const membershipPlans = [
  {
    tier: 'enhanced' as const,
    name: 'Enhanced',
    price: 4.99,
    available: 'enhancedAvailable' as const,
  },
];

export const enhancedTopUpPrice = 4.99;
