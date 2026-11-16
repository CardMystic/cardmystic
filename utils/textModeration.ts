// The database migration embeds this same pattern for writes through every API.
// Keep identity words in targeted phrases only. Standalone terms use word boundaries.
const words = [
  'fuck',
  'fucks',
  'fucker',
  'fuckers',
  'fucking',
  'fucked',
  'fuckwit',
  'fuckhead',
  'motherfucker',
  'motherfuckers',
  'motherfucking',
  'bullshit',
  'shit',
  'shits',
  'shitty',
  'shitting',
  'shithead',
  'horseshit',
  'asshole',
  'assholes',
  'asshat',
  'bitch',
  'bitches',
  'bitching',
  'bastard',
  'bastards',
  'dickhead',
  'dickheads',
  'dick',
  'dicks',
  'cock',
  'cocksucker',
  'cunt',
  'cunts',
  'twat',
  'wanker',
  'ass',
  'asses',
  'arse',
  'arsehole',
  'bollocks',
  'douchebag',
  'dipshit',
  'jackass',
  'dumbass',
  'piss',
  'pissed',
  'pussy',
  'goddamn',
  'goddammit',
  'dammit',
  'damn',
  'damned',
  'faggot',
  'faggots',
  'fag',
  'fags',
  'nigger',
  'niggers',
  'nigga',
  'niggas',
  'kike',
  'kikes',
  'spic',
  'spics',
  'chink',
  'chinks',
  'tranny',
  'trannies',
  'retard',
  'retarded',
  'retards',
  'wetback',
  'wetbacks',
  'beaner',
  'beaners',
];
const lookalikes: Record<string, string> = {
  a: '4@',
  e: '3',
  i: '1!',
  o: '0',
  s: '5$',
  t: '7',
  u: 'ü',
};
const separator = '[._\u200b\u200c\u200d\ufeff-]?';
function term(word: string) {
  return [...word]
    .map((letter) => {
      const fullWidth = String.fromCharCode(letter.charCodeAt(0) + 0xfee0);
      return `[${letter}${fullWidth}${lookalikes[letter] ?? ''}]`;
    })
    .join(separator);
}
const groups =
  '(?:jews|muslims|christians|hindus|immigrants|refugees|arabs|asians|blacks|whites|latinos|latinas|gays|lesbians|women|men|(?:black|white|asian|jewish|muslim|gay|queer|trans|transgender|disabled) +(?:people|players))';
const targeted = [
  `(?:kill|exterminate|gas|lynch) +(?:all +(?:the +)?|the +)?${groups}`,
  `(?:i|we) +hate +(?:all +(?:the +)?)?${groups}`,
  `(?:all +)?${groups} +(?:(?:should|must) +(?:all +)?(?:die|be +killed)|are +(?:all +)?(?:vermin|subhuman|parasites))`,
  'heil +hitler',
  'white +power',
  'go +back +to +your +country',
];
export const userTextPattern = `(?:${[...targeted.map((phrase) => phrase.replaceAll(' +', '\\s+')), ...words.map(term)].join('|')})`;
const matches = new RegExp(
  `(?<![\\p{L}\\p{N}])${userTextPattern}(?![\\p{L}\\p{N}])`,
  'giu',
);

export function censorUserText(text: string): string {
  return text.replace(matches, '•••');
}
