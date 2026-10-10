// In-memory storage for store tests; no browser profile or disk is touched.
const data = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  getItem: (key: string) => data.get(key) ?? null,
  setItem: (key: string, value: string) => { data.set(key, value); },
  removeItem: (key: string) => { data.delete(key); },
  clear: () => data.clear(),
  key: (index: number) => [...data.keys()][index] ?? null,
  get length() { return data.size; },
} satisfies Storage });
Object.defineProperty(globalThis, 'window', { configurable: true, value: { localStorage: globalThis.localStorage } });
