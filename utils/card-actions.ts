export const cardActionStyles = {
  buy: { icon: 'i-heroicons-shopping-cart', color: 'success' },
  searchMarketplace: {
    icon: 'i-heroicons-magnifying-glass',
    color: 'primary',
    variant: 'solid',
  },
  addToDeck: { icon: 'i-lucide-library-big', color: 'info' },
  similar: { icon: 'i-mdi-cards-outline', color: 'neutral' },
  recommendations: { icon: 'i-lucide-box', color: 'primary' },
  popularForCommander: { icon: 'i-lucide-flame', color: 'error' },
  setCommander: { icon: 'i-lucide-crown', color: 'warning' },
  removeCommander: { icon: 'i-lucide-crown', color: 'error' },
  flip: { icon: 'i-heroicons-arrow-path', color: 'neutral' },
  printing: { icon: 'i-lucide-images', color: 'neutral' },
  feedback(submitted: boolean) {
    return {
      icon: 'i-lucide-thumbs-down',
      color: submitted ? 'error' : 'primary',
    } as const;
  },
  addToSearch(added: boolean) {
    return added
      ? ({ icon: 'i-lucide-check', color: 'success' } as const)
      : ({ icon: 'i-lucide-layers-plus', color: 'primary' } as const);
  },
} as const;

export const cardPageAction = {
  label: "Go To Card's Page",
  icon: 'i-lucide-arrow-up-right',
  variant: 'solid',
  color: 'primary',
} as const;

export const findSimilarAction = {
  label: 'Find Similar Cards',
  ...cardActionStyles.similar,
} as const;

export const suggestDecksAction = {
  label: 'Suggest Decks · Pro',
  icon: 'i-lucide-layers-2',
  color: 'warning',
} as const;

export interface CardAction {
  label: string;
  group?: 'copies' | 'board' | 'remove';
  icon?: string;
  variant?: 'outline' | 'ghost' | 'solid';
  to?: string;
  target?: string;
  rel?: string;
  disabled?: boolean;
  color?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'info'
    | 'warning'
    | 'error'
    | 'neutral';
  onSelect?: () => void;
}

export interface CardActionMenu {
  marketplace?: CardAction;
  addToDeck?: CardAction;
  recommendations?: CardAction;
  popular?: CardAction;
  similar?: CardAction;
  flip?: CardAction;
  list?: CardAction[];
  commander?: CardAction;
  cut?: CardAction;
  feedback?: CardAction;
  addToSearch?: CardAction;
}
