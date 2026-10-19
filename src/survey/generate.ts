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
  const comments = {
    positive: [
      "The practical examples made the topic easier to understand.",
      "The facilitator explained the steps clearly and answered my questions.",
      "I enjoyed working through a real-world example during the session.",
      "The exercises were useful and the session was well organised.",
    ],
    mixed: [
      "Some examples were useful, but I would like more time to practise.",
      "The session was a helpful introduction. A written recap would make it easier to revisit.",
      "I followed most of the session, but the final exercise felt rushed.",
      "The material was relevant, though a smaller group would help with questions.",
    ],
    negative: [
      "The pace was too fast for me. I needed more guided practice.",
      "I struggled to follow the exercise and would prefer simpler examples.",
      "There was too much material for one session. Please split it into shorter lessons.",
      "I needed more support during the exercises and clearer written instructions.",
    ],
  };
  return Array.from({ length: count }, (_, index) => {
    const track = tracks[Math.floor(random() * tracks.length)];
    const format = formats[Math.floor(random() * formats.length)];
    const satisfaction = rating();
    const confidence = rating();
    const bank = satisfaction === null || satisfaction === 3 ? comments.mixed : satisfaction >= 4 ? comments.positive : comments.negative;
    const feedback = bank[Math.floor(random() * bank.length)]
      + (confidence !== null && confidence <= 2 ? " I still need guidance to apply what I learned." : "")
      + (random() < 0.3 ? " A checklist or recording would help me practise afterward." : "");
    return { id: `GEN${String(index + 1).padStart(4, "0")}`, track, format, satisfaction, confidence, feedback };
  });
}
