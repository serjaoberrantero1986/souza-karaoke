import type { AppTheme } from '../types/settings';
export const programName = (theme: AppTheme) => theme.programName?.trim() || 'Meu Karaokê';
export function welcomeStyle(theme: AppTheme) {
  const color = (value: string | undefined, fallback: string) => /^#[\da-f]{6}$/i.test(value || '') ? value! : fallback;
  const opacity = Math.max(0, Math.min(100, theme.messageOpacity ?? 85));
  const rgba = (value: string) => `${value}${Math.round(opacity * 2.55).toString(16).padStart(2, '0')}`;
  const first = rgba(color(theme.messageColor, '#111827'));
  const second = rgba(color(theme.messageColorEnd, '#312e81'));
  return { background: theme.messageGradient ? `linear-gradient(135deg, ${first}, ${second})` : first, color: color(theme.messageText, '#ffffff') };
}
