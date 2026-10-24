const http = require('node:http');
const fs = require('node:fs/promises');
const fsStream = require('node:fs');
const path = require('node:path');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };

// Static renderer only, bound to loopback. A stable HTTP origin lets Chromium send
// the real Referer required by YouTube, and retains localStorage between launches.
async function startRendererServer(root, port = 17843) {
  const base = path.resolve(root);
  let mediaDirectory = ''; let allowedMedia = new Set(); let studioDirectory = ''; let allowedStudio = new Set();
  const server = http.createServer(async (request, response) => {
    if (request.headers.host !== `127.0.0.1:${server.address().port}` || !['GET', 'HEAD'].includes(request.method)) { response.writeHead(403); response.end(); return; }
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
      if (pathname.startsWith('/__media/') || pathname.startsWith('/__studio/')) {
        const studio = pathname.startsWith('/__studio/'); const prefix = studio ? '/__studio/' : '/__media/'; const directory = studio ? studioDirectory : mediaDirectory; const allowed = studio ? allowedStudio : allowedMedia;
        if (!directory) { response.writeHead(404); response.end(); return; }
        const relativeMedia = Buffer.from(pathname.slice(prefix.length), 'base64url').toString('utf8'); const filename = path.resolve(directory, relativeMedia); const within = path.relative(directory, filename);
        if (!relativeMedia || !allowed.has(relativeMedia) || within.startsWith('..') || path.isAbsolute(within) || !/\.(mp4|webm|ogv|ogg|mp3|wav|m4a|flac)$/i.test(filename)) { response.writeHead(404); response.end(); return; }
        const realMedia = process.platform === 'win32' ? filename : await fs.realpath(filename); const realWithin = path.relative(directory, realMedia); if (realWithin.startsWith('..') || path.isAbsolute(realWithin)) { response.writeHead(404); response.end(); return; }
        const stat = await fs.stat(realMedia); const range = request.headers.range; const types = { '.mp4': 'video/mp4', '.webm': 'video/webm', '.ogv': 'video/ogg', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4' }; const contentType = types[path.extname(realMedia).toLowerCase()] || 'application/octet-stream';
        const cors = studio ? { 'Access-Control-Allow-Origin': 'http://127.0.0.1:5173' } : {};
        if (range) { const match = /^bytes=(\d+)-(\d*)$/.exec(range); if (!match) { response.writeHead(416); response.end(); return; } const start = Number(match[1]); const end = match[2] ? Math.min(Number(match[2]), stat.size - 1) : stat.size - 1; if (start > end || start >= stat.size) { response.writeHead(416, { 'Content-Range': `bytes */${stat.size}` }); response.end(); return; } response.writeHead(206, { 'Content-Type': contentType, 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Content-Length': end - start + 1, ...cors }); if (request.method === 'HEAD') { response.end(); return; } fsStream.createReadStream(realMedia, { start, end }).pipe(response); return; }
        response.writeHead(200, { 'Content-Type': contentType, 'Accept-Ranges': 'bytes', 'Content-Length': stat.size, ...cors }); if (request.method === 'HEAD') { response.end(); return; } fsStream.createReadStream(realMedia).pipe(response); return;
      }
      const filename = path.resolve(base, `.${pathname === '/' ? '/index.html' : pathname}`);
      const relative = path.relative(base, filename);
      if (relative.startsWith('..') || path.isAbsolute(relative) || !mime[path.extname(filename)]) { response.writeHead(404); response.end(); return; }
      const real = await fs.realpath(filename);
      const realRelative = path.relative(base, real);
      if (realRelative.startsWith('..') || path.isAbsolute(realRelative)) { response.writeHead(404); response.end(); return; }
      const data = await fs.readFile(real);
      response.writeHead(200, { 'Content-Type': mime[path.extname(filename)], 'Referrer-Policy': 'strict-origin-when-cross-origin', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' });
      response.end(request.method === 'HEAD' ? undefined : data);
    } catch { response.writeHead(404); response.end(); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  server.setMediaDirectory = (directory, files = []) => { mediaDirectory = directory ? fsStream.realpathSync(path.resolve(directory)) : ''; allowedMedia = new Set(files); };
  server.setStudioDirectory = (directory, files = []) => { studioDirectory = directory ? fsStream.realpathSync(path.resolve(directory)) : ''; allowedStudio = new Set(files); };
  return server;
}
module.exports = { startRendererServer };
