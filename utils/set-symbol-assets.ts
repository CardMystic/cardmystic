import codes from './set-symbol-codes.json';
import { setSymbol } from './set-symbols';

const symbolCodes: Readonly<Record<string, string>> = codes;

export function setSymbolAsset(setCode: string):
  | {
      glyph?: string;
      svg?: string;
    }
  | undefined {
  const code = setCode.toLowerCase();
  const symbol = Object.hasOwn(symbolCodes, code) ? symbolCodes[code] : code;
  const glyph = setSymbol(symbol);
  if (glyph) return { glyph };
  if (Object.hasOwn(symbolCodes, code))
    return { svg: `/images/set-symbols/${symbol}.svg` };
}
