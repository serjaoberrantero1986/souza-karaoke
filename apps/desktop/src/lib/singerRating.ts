export const singerLevels = [
  { score: 10, emoji: '🙈', label: 'Desafinado' },
  { score: 20, emoji: '😅', label: 'Aprendiz de Cantor' },
  { score: 30, emoji: '🚿', label: 'Cantor de Chuveiro' },
  { score: 40, emoji: '🎵', label: 'Calouro' },
  { score: 50, emoji: '🎤', label: 'Cantor Amador' },
  { score: 60, emoji: '🌟', label: 'Talento Promissor' },
  { score: 70, emoji: '🎶', label: 'Voz Afinada' },
  { score: 80, emoji: '🎙️', label: 'Grande Talento' },
  { score: 90, emoji: '🏆', label: 'Estrela do Palco' },
  { score: 100, emoji: '👑', label: 'Cantor Profissional' },
] as const;
export function singerLevel(score: number) { return singerLevels[Math.max(0, Math.min(9, Math.ceil(score / 10) - 1))]; }
