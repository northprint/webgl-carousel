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
  
  // Default to index.html
  let filePath = req.url === '/' ? '/demos/index.html' : req.url;
  
  // Remove query strings
  filePath = filePath.split('?')[0];
  
  // Prepend current directory
  filePath = '.' + filePath;
  
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        console.log('404:', filePath);
        res.writeHead(404);
        res.end('File not found: ' + req.url);
      } else {
        res.writeHead(500);
        res.end('Server error: ' + error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`E2E test server running at http://localhost:${PORT}/`);
  console.log('Serving from:', process.cwd());
});