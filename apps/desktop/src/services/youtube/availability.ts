// Session-only: never blacklist transient network, device or client identity errors.
const unavailable = new Map<string, number>();
export function markUnavailable(videoId: string, code: number) {
  if ([100, 101, 150].includes(code)) unavailable.set(videoId, Date.now() + 15 * 60_000);
}
export function isUnavailable(videoId: string) {
  const until = unavailable.get(videoId);
  if (!until) return false;
  if (until <= Date.now()) { unavailable.delete(videoId); return false; }
  return true;
}
export function clearUnavailable() { unavailable.clear(); }
