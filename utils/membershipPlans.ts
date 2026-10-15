export const membershipTierLabels = {
  normal: 'Free',
  enhanced: 'Enhanced',
  pro: 'Pro',
  'pro-plus': 'Pro Plus',
} as const;

export const membershipPlans = [
  {
    enhancedSearches: 1000,
    tier: 'enhanced' as const,
    name: 'Enhanced',
    price: 7,
    available: 'enhancedAvailable' as const,
    description: 'Better matches near the top of your results.',
    features: ['Relevance reranking for your results'],
  },
];
