import type { ResponseRow } from "./data";

// Seeded generation makes each fictional dataset reproducible for testing.
export function generateResponses(count: number, seed: number): ResponseRow[] {
  if (!Number.isInteger(count) || count < 10 || count > 1000)
    throw new RangeError("Choose a whole number from 10 to 1,000 responses.");
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff)
    throw new RangeError("Seed must be an unsigned 32-bit integer.");
  let state = seed;
  const random = () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  const tracks = ["Websites", "Automations", "Data"] as const;
  const formats = ["Online", "In person"] as const;
  const rating = () => (random() < 0.1 ? null : Math.floor(random() * 5) + 1);
  return Array.from({ length: count }, (_, index) => ({
    id: `GEN${String(index + 1).padStart(4, "0")}`,
    track: tracks[Math.floor(random() * tracks.length)],
    format: formats[Math.floor(random() * formats.length)],
    satisfaction: rating(),
    confidence: rating(),
  }));
}
