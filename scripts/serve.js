'use strict';

/**
 * Servidor estático mínimo para previsualizar /dist localmente.
 * Uso: npm run serve  (después de npm run build)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');
const PORT = process.env.PORT || 4000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
};

if (!fs.existsSync(DIST)) {
  console.error('No existe /dist. Corré "npm run build" primero.');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  let filePath = path.join(DIST, urlPath);

  // Evita path traversal fuera de /dist.
  if (!filePath.startsWith(DIST)) {
    res.writeHead(400);
    res.end('Bad request');
    return;
  }

  if (urlPath.endsWith('/')) {
    filePath = path.join(filePath, 'index.html');
  }

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        const notFoundPath = path.join(DIST, '404.html');
        fs.readFile(notFoundPath, (nfErr, nfData) => {
          res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(nfErr ? 'Not found' : nfData);
        });
        return;
      }
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log(`[serve] http://localhost:${PORT}`);
});
