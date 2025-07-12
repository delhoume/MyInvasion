export class FlashFileParser {
  decodeString(input: string): string[];
  encodeString(input: string): string[];
  encode(tokens: string[]): string[];
  decode(tokens: string[]): string[];
  tokenize(input: string): string[];
}
