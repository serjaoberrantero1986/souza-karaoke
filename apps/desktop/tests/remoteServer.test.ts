import { createRequire } from 'node:module';
import type { Server } from 'node:http';
import { afterAll, beforeAll, expect, it, vi } from 'vitest';
const require = createRequire(import.meta.url);
const { startRemoteServer } = require('../electron/remote-server.cjs');
let server: Server; let origin: string; let participant: string; let operator: string;
const dispatch = vi.fn(async (data: { role: string }) => ({ role: data.role }));
beforeAll(async () => {
  const session = await startRemoteServer(dispatch, 0); server = session.server;
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('No port');
  origin = `http://127.0.0.1:${address.port}`;
  participant = new URL(session.info.links[0].participant).hash.slice(1);
  operator = new URL(session.info.links[0].operator).hash.slice(1);
  expect(session.info.links[0].participantQr).toMatch(/^data:image\/png/);
});
afterAll(async () => { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); });
function call(token: string, action: string, extraHeaders = {}) { return fetch(`${origin}/api`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, ...extraHeaders }, body: JSON.stringify({ action, deviceId: 'test-device-1234' }) }); }
it('exige token e reserva o início da fila ao operador', async () => {
  expect((await call('', 'state')).status).toBe(401);
  for (const action of ['start', 'skip', 'previous', 'confirmScore', 'queueRemove']) expect((await call(participant, action)).status).toBe(403);
  expect(await (await call(operator, 'skip')).json()).toEqual({ role: 'operator' });
  expect(await (await call(participant, 'state')).json()).toEqual({ role: 'participant' });
});
it('recusa origem externa e limita pesquisas repetidas', async () => {
  expect((await call(operator, 'state', { Origin: 'https://example.com' })).status).toBe(403);
  expect((await call(participant, 'search')).status).toBe(200);
  expect((await call(participant, 'search')).status).toBe(429);
});
it('serve tela mobile sem revelar tokens e recusa caminhos arbitrários', async () => {
  const html = await (await fetch(origin)).text();
  expect(html).toContain('viewport'); expect(html).not.toContain(operator);
  expect((await fetch(`${origin}/../main.cjs`)).status).toBe(404);
  expect((await fetch(`${origin}/?`)).status).toBe(200);
  expect((await fetch(`${origin}/?source=qr`)).headers.get('content-type')).toContain('text/html');
  expect((await fetch(`${origin}/remote.js?v=1`)).status).toBe(200);
});
it('mantém tokens válidos fornecidos e protege a edição da fila', async () => { const fixed = { participant: 'a'.repeat(48), operator: 'b'.repeat(48) }; const session = await startRemoteServer(dispatch, 0, fixed); const address = session.server.address(); if (!address || typeof address === 'string') throw new Error('No port'); const fixedOrigin = `http://127.0.0.1:${address.port}`; const invoke = (token: string, action: string) => fetch(`${fixedOrigin}/api`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ action, deviceId: 'fixed-device-1234', queueId: 'queue-1' }) }); expect(new URL(session.info.links[0].participant).hash).toBe(`#${fixed.participant}`); expect((await invoke(fixed.participant, 'queueRemove')).status).toBe(403); expect((await invoke(fixed.operator, 'queueRemove')).status).toBe(200); session.server.closeAllConnections(); await new Promise<void>(resolve => session.server.close(() => resolve())); });
