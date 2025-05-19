// Custom server.js wrapper for standalone Next.js server
const http = require('http');
const { join } = require('path');
const { parse } = require('url');
const fs = require('fs');

// Get Next.js server path from standalone output
const nextServerPath = join(__dirname, 'server.js');

// Log startup details
console.log('Starting custom standalone server');
console.log(`Node version: ${process.version}`);
console.log(`Server path: ${nextServerPath}`);
console.log(`PORT env: ${process.env.PORT || '8080 (default)'}`);

// Create a simple health check handler
const healthCheck = (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
};

try {
  // Import the Next.js server
  const next = require('next');
  const app = next({ dev: false, dir: __dirname });
  const handle = app.getRequestHandler();

  app.prepare().then(() => {
    const server = http.createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      const { pathname } = parsedUrl;

      // Handle health check endpoints
      if (pathname === '/health.txt' || pathname === '/health' || pathname === '/api/health') {
        healthCheck(req, res);
        return;
      }

      // Let Next.js handle all other routes
      handle(req, res, parsedUrl);
    });

    const port = process.env.PORT || 8080;
    server.listen(port, (err) => {
      if (err) throw err;
      console.log(`> Ready on port ${port}`);
    });
  });
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
} 