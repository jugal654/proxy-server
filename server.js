const http = require('http');
const { createProxyServer } = require('http-proxy');

const proxy = createProxyServer({
  target: 'http://slkbullion.com:10001',
  ws: true,
  changeOrigin: true
});

proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err.message);
  if (!res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
  }
  res.end('Proxy error');
});

const server = http.createServer((req, res) => {
  proxy.web(req, res);
});

server.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head);
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Proxy running on port ${PORT}`);
});