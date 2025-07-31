const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8888;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  console.log('Request:', req.url);
  
  let filePath;
  
  if (req.url === '/') {
    filePath = './demos/index.html';
  } else if (req.url.startsWith('/dist/')) {
    // Direct dist requests
    filePath = '.' + req.url;
  } else {
    // Everything else from demos
    filePath = './demos' + req.url;
  }
  
  // Resolve relative paths
  filePath = path.normalize(filePath);
  console.log('Resolved file path:', filePath);

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      console.log('Error reading file:', error.code, filePath);
      if (error.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server error: ' + error.code);
      }
    } else {
      console.log('Serving file:', filePath, 'with type:', contentType);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`E2E test server (debug) running at http://localhost:${PORT}/`);
});