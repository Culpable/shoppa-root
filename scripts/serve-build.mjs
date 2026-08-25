import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const host = '127.0.0.1';
const portValue = process.env.PLAYWRIGHT_PORT ?? '4321';
const port = Number(portValue);
const dist = resolve(fileURLToPath(new URL('../dist/', import.meta.url)));

if (!/^\d+$/.test(portValue) || !Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error('PLAYWRIGHT_PORT must be an integer between 1 and 65535.');
}

const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml; charset=utf-8'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.webp', 'image/webp'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
  ['.xml', 'application/xml; charset=utf-8'],
]);

function resolveRequestPath(requestURL) {
  const pathname = decodeURIComponent(new URL(requestURL, `http://${host}:${port}`).pathname);
  const candidate = resolve(dist, `.${pathname}`);
  if (candidate !== dist && !candidate.startsWith(`${dist}${sep}`)) return undefined;
  return candidate;
}

async function resolveStaticFile(requestURL) {
  const candidate = resolveRequestPath(requestURL);
  if (!candidate) return undefined;

  try {
    const candidateStat = await stat(candidate);
    if (candidateStat.isFile()) return { path: candidate, size: candidateStat.size };
    if (!candidateStat.isDirectory()) return undefined;

    const indexPath = resolve(candidate, 'index.html');
    const indexStat = await stat(indexPath);
    return indexStat.isFile() ? { path: indexPath, size: indexStat.size } : undefined;
  } catch (error) {
    if (error?.code === 'ENOENT' || error?.code === 'ENOTDIR') return undefined;
    throw error;
  }
}

function sendFile(response, requestMethod, file, status) {
  response.writeHead(status, {
    'Content-Length': file.size,
    'Content-Type': contentTypes.get(extname(file.path).toLowerCase()) ?? 'application/octet-stream',
  });
  if (requestMethod === 'HEAD') {
    response.end();
    return;
  }

  const stream = createReadStream(file.path);
  stream.on('error', () => response.destroy());
  stream.pipe(response);
}

const server = createServer(async (request, response) => {
  try {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { Allow: 'GET, HEAD' });
      response.end();
      return;
    }

    const file = await resolveStaticFile(request.url ?? '/');
    if (file) {
      sendFile(response, request.method, file, 200);
      return;
    }

    // GitHub Pages returns the repository's built 404 document with status 404.
    // Match that combined contract so browser tests cannot pass by checking the
    // status on one response and the Shoppa recovery content on another.
    const notFound = await resolveStaticFile('/404.html');
    if (!notFound) throw new Error('Build output is missing dist/404.html.');
    sendFile(response, request.method, notFound, 404);
  } catch (error) {
    console.error(error);
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Static test server error.');
  }
});

server.listen(port, host);

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
    server.closeAllConnections();
  });
}
