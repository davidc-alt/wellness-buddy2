import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');
const INDEX_HTML = path.join(DIST_DIR, 'index.html');

// Ensure dist directory exists; if not, build it automatically on startup
if (!fs.existsSync(INDEX_HTML)) {
  console.log('dist/index.html not found. Building project automatically...');
  try {
    execSync('npx vite build', { stdio: 'inherit' });
    console.log('Build completed successfully.');
  } catch (buildErr) {
    console.error('Failed to build Vite project:', buildErr);
  }
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  let safePath = path.normalize(req.url.split('?')[0]).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(DIST_DIR, safePath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = INDEX_HTML;
  }

  if (!fs.existsSync(filePath)) {
    filePath = INDEX_HTML;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error(`Error reading ${filePath}:`, err);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`500 Server Error: ${err.message}`);
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable'
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`WellnessBuddy 2.0 static server running on port ${PORT}`);
});
