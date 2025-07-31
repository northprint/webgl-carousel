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
  
  let filePath = '.' + req.url;
  
  if (filePath === './') {
    filePath = './demos/index.html';
  } else if (req.url.startsWith('/dist/')) {
    // Handle dist files - already correct path
    filePath = '.' + req.url;
  } else if (req.url.startsWith('../dist/')) {
    // Handle relative dist paths from demos
    filePath = './dist/' + req.url.substring(8);
  } else {
    // Other files are in demos directory
    filePath = './demos' + req.url;
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`E2E test server running at http://localhost:${PORT}/`);
});