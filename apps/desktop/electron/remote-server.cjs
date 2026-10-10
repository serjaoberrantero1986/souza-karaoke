const http = require('node:http');
const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const QRCode = require('qrcode');

async function startRemoteServer(dispatch, port = 17844, savedTokens) {
  const validToken = value => typeof value === 'string' && /^[a-f0-9]{48}$/.test(value);
  const tokens = savedTokens && validToken(savedTokens.participant) && validToken(savedTokens.operator) ? savedTokens : { participant: randomBytes(24).toString('hex'), operator: randomBytes(24).toString('hex') };
  const interfaces = Object.entries(os.networkInterfaces()).flatMap(([name, values]) => (values || []).filter(x => x.family === 'IPv4' && !x.internal && !x.address.startsWith('169.254.')).map(x => ({ name, address: x.address })));
  const rank = name => /wi-?fi|wireless|wlan/i.test(name) ? 0 : /virtual|vethernet|vpn|docker|vmware|vbox/i.test(name) ? 2 : 1;
  interfaces.sort((a, b) => rank(a.name) - rank(b.name));
  const hosts = [...new Set(interfaces.map(x => x.address))];
  const limits = new Map();
  const devices = new Map();
  const server = http.createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data: https://i.ytimg.com; frame-ancestors 'none'");
    const reply = (code, data) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(data)); };
    const allowedHosts = ['127.0.0.1', ...hosts].map(h => `${h}:${server.address().port}`);
    if (!allowedHosts.includes(req.headers.host)) return reply(403, { error: 'Endereço não permitido.' });
    if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) return reply(403, { error: 'Origem não permitida.' });
    const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;
    if (req.method === 'GET' && ['/', '/remote.js', '/remote.css'].includes(pathname)) {
      const file = pathname === '/' ? 'remote.html' : pathname.slice(1);
      res.writeHead(200, { 'Content-Type': file.endsWith('.html') ? 'text/html; charset=utf-8' : file.endsWith('.js') ? 'text/javascript; charset=utf-8' : 'text/css; charset=utf-8' });
      return res.end(fs.readFileSync(path.join(__dirname, 'remote', file)));
    }
    if (pathname !== '/api' || req.method !== 'POST') return reply(404, { error: 'Não encontrado.' });
    const token = req.headers.authorization?.replace(/^Bearer /, '');
    const role = Object.keys(tokens).find(key => tokens[key] === token);
    if (!role) return reply(401, { error: 'Sessão encerrada. Leia o QR novamente.' });
    let body = '';
    try {
      for await (const chunk of req) { body += chunk; if (body.length > 5_600_000) { reply(413, { error: 'Pedido muito grande.' }); return; } }
      const data = JSON.parse(body);
      if (!['state', 'theme', 'search', 'add', 'pause', 'resume', 'skip', 'previous', 'confirmScore', 'restart', 'back', 'pitchUp', 'pitchDown', 'pitchReset', 'start', 'react', 'photo', 'queueRemove', 'queueUp', 'queueDown'].includes(data.action)) return reply(400, { error: 'Comando inválido.' });
      if (role !== 'operator' && ['start', 'skip', 'previous', 'confirmScore', 'queueRemove', 'queueUp', 'queueDown'].includes(data.action)) return reply(403, { error: 'Comando exclusivo do operador.' });
      if (['search', 'add'].includes(data.action)) {
        const key = `${req.socket.remoteAddress}:${data.action}`;
        const now = Date.now();
        if (now - (limits.get(key) || 0) < (data.action === 'search' ? 3000 : 5000)) return reply(429, { error: 'Aguarde alguns segundos antes de tentar novamente.' });
        if (limits.size > 1000) limits.clear();
        limits.set(key, now);
      }
      const deviceId = String(data.deviceId || '').slice(0, 80);
      if (!/^[a-zA-Z0-9-]{8,80}$/.test(deviceId)) return reply(400, { error: 'Identificação do aparelho inválida. Reabra o controle.' });
      const seenNow = Date.now(); devices.set(deviceId, seenNow); for (const [id, seenAt] of devices) if (seenNow - seenAt > 15000) devices.delete(id);
      reply(200, await dispatch({ action: data.action, score: data.score, query: String(data.query || '').slice(0, 160), trackId: String(data.trackId || '').slice(0, 80), queueId: String(data.queueId || '').slice(0, 80), name: String(data.name || '').trim().slice(0, 40), deviceId, reaction: String(data.reaction || '').slice(0, 20), photoDataUrl: data.action === 'photo' ? String(data.photoDataUrl || '') : '', pin: String(data.pin || '').slice(0, 8), connectedCount: devices.size, role }));
    } catch (error) { reply(400, { error: error.message || 'Não foi possível concluir.' }); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '0.0.0.0', resolve); });
  const actualPort = server.address().port;
  const addresses = hosts.length ? hosts : ['127.0.0.1'];
  const links = await Promise.all(addresses.map(async host => {
    const participant = `http://${host}:${actualPort}/#${tokens.participant}`;
    const operator = `http://${host}:${actualPort}/#${tokens.operator}`;
    return { host, name: interfaces.find(x => x.address === host)?.name || 'Somente este computador', participant, operator, participantQr: await QRCode.toDataURL(participant, { width: 480, margin: 4 }), operatorQr: await QRCode.toDataURL(operator, { width: 480, margin: 4 }) };
  }));
  return { server, info: { links } };
}
module.exports = { startRemoteServer };
