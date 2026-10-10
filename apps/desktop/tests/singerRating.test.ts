import { expect, it } from 'vitest';
import { singerLevel, singerLevels } from '../src/lib/singerRating';
it('classifica limites inclusivos de dez níveis sem saltar faixas', () => {
  expect(singerLevels).toHaveLength(10);
  for (let i = 0; i < 10; i++) { expect(singerLevel(i * 10 + 1)).toBe(singerLevels[i]); expect(singerLevel((i + 1) * 10)).toBe(singerLevels[i]); }
  expect(singerLevel(0)).toBe(singerLevels[0]); expect(singerLevel(100)).toBe(singerLevels[9]);
});
