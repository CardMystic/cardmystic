// Plain-language summaries of Wizards' Commander bracket guidance:
// https://magic.wizards.com/en/news/announcements/commander-brackets-beta-update-october-21-2025
export const commanderBrackets = [
  {
    value: 1,
    name: 'Exhibition',
    description:
      'Theme and creativity come before power. Games leave plenty of time to show what your deck does.',
    classes:
      'bg-sky-100 text-sky-900 ring-sky-300 dark:bg-sky-950 dark:text-sky-200 dark:ring-sky-700',
  },
  {
    value: 2,
    name: 'Core',
    description:
      'Straightforward, relaxed games. Decks build toward visible win conditions that opponents have time to answer.',
    classes:
      'bg-teal-100 text-teal-900 ring-teal-300 dark:bg-teal-950 dark:text-teal-200 dark:ring-teal-700',
  },
  {
    value: 3,
    name: 'Upgraded',
    description:
      'Strong synergy and powerful cards. Decks can disrupt opponents and build toward a big winning turn.',
    classes:
      'bg-amber-100 text-amber-900 ring-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-700',
  },
  {
    value: 4,
    name: 'Optimized',
    description:
      'Fast, consistent, powerful decks with efficient threats and interaction, without focusing on the competitive Commander metagame.',
    classes:
      'bg-orange-100 text-orange-900 ring-orange-400 dark:bg-orange-950 dark:text-orange-200 dark:ring-orange-600',
  },
  {
    value: 5,
    name: 'cEDH',
    description:
      'Built for competitive Commander and winning as efficiently as possible. Games can end on any turn.',
    classes:
      'bg-red-100 text-red-900 ring-red-400 dark:bg-red-950 dark:text-red-200 dark:ring-red-600',
  },
] as const;

export const bracketOptions = [
  { label: 'Unknown', value: 0 },
  ...commanderBrackets.map(({ value, name }) => ({
    label: `Bracket ${value}: ${name}`,
    value,
  })),
];

export function commanderBracket(value?: number | null) {
  return commanderBrackets.find((bracket) => bracket.value === value);
}
