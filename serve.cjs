// Run the static site locally with: node serve.cjs
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const port = Number(process.env.PORT) || 8000;
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

http.createServer((request, response) => {
  let pathname;
  let url;
  try {
    url = new URL(request.url, 'http://localhost');
    pathname = decodeURIComponent(url.pathname);
  }
  catch { response.writeHead(400).end('Bad request'); return; }
  // Firebase Authentication authorizes localhost, not the numeric loopback host.
  if (request.headers.host?.split(':')[0] === '127.0.0.1') {
    url.searchParams.delete('demo');
    response.writeHead(302, { Location: `http://localhost:${port}${url.pathname}${url.search}` }).end();
    return;
  }
  if (pathname.split('/').some((part) => part.startsWith('.'))) {
    response.writeHead(404).end('Not found');
    return;
  }
  let file = path.resolve(root, `.${pathname}`);
  if (file !== root && !file.startsWith(root + path.sep)) {
    response.writeHead(403).end('Forbidden');
    return;
  }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  fs.createReadStream(file)
    .on('error', () => { if (!response.headersSent) response.writeHead(404); response.end('Not found'); })
    .once('open', () => response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' }))
    .pipe(response);
}).listen(port, '127.0.0.1', () => console.log(`Local site: http://127.0.0.1:${port}/`));
