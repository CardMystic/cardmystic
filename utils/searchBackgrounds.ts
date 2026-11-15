import lilianaArt from '~/assets/images/search-backgrounds/liliana-of-the-veil.webp';
import urzaArt from '~/assets/images/search-backgrounds/urza-lord-high-artificer.webp';
import brainstormArt from '~/assets/images/search-backgrounds/brainstorm.webp';
import kaaliaArt from '~/assets/images/search-backgrounds/kaalia.webp';

// Bundled art crops get content-hashed URLs and the existing immutable /_nuxt
// cache policy. Selecting a search never needs a card or Scryfall API lookup.
const brainstorm = { name: 'Brainstorm', src: brainstormArt };
const kaalia = { name: 'Kaalia of the Vast', src: kaaliaArt };
// Align each face within the banner. The viewport-width offset is its height
// from the top of the scaled artwork. Clamp the crop to the image edges.
const liliana = {
  name: 'Liliana of the Veil',
  src: lilianaArt,
  position: '75% clamp(100%, calc(32cqh - 15vw), 0px)',
};
const urza = {
  name: 'Urza, Lord High Artificer',
  src: urzaArt,
  position: '50% clamp(100%, calc(46cqh - 21vw), 0px)',
};

export const searchBackgrounds = {
  decklists: liliana,
  users: liliana,
  articles: liliana,
  roles: urza,
  themes: urza,
  sets: urza,
  smart: brainstorm,
  similarity: brainstorm,
  commander: brainstorm,
  keyword: brainstorm,
  recommend: brainstorm,
  'popular-cards': kaalia,
  'popular-commanders': kaalia,
  'popular-by-commander': kaalia,
  'popular-by-card': kaalia,
} as const;

export type SearchBackgroundType = keyof typeof searchBackgrounds;
