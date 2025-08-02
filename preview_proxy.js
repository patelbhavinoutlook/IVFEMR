const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = 3001;
const BACKEND_URL = 'http://localhost:5000';

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Proxy API requests to backend
  if (url.pathname.startsWith('/api/') || url.pathname === '/health') {
    const backendReq = http.request(
      `${BACKEND_URL}${url.pathname}${url.search}`,
      {
        method: req.method,
        headers: {
          ...req.headers,
          host: 'localhost:5000'
        }
      },
      (backendRes) => {
        res.writeHead(backendRes.statusCode, backendRes.headers);
        backendRes.pipe(res);
      }
    );

    backendReq.on('error', (err) => {
      console.error('Backend request error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Backend service unavailable' }));
    });

    req.pipe(backendReq);
    return;
  }

  // Serve static files
  let filePath = url.pathname === '/' ? '/preview.html' : url.pathname;
  filePath = path.join(__dirname, filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 Not Found</h1>');
      return;
    }

    const ext = path.extname(filePath);
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml'
    };

    const contentType = mimeTypes[ext] || 'text/plain';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`🌐 FertyFlow Preview Server running on http://localhost:${PORT}`);
  console.log(`📱 Backend API proxy: ${BACKEND_URL}`);
  console.log(`🎯 Open http://localhost:${PORT} to view the preview`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Preview server shutting down...');
  server.close(() => {
    process.exit(0);
  });
});