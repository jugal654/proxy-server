const http = require('http');
const { createProxyServer } = require('http-proxy');

const proxy = createProxyServer({
  target: 'http://slkbullion.com:10001',
  ws: true,
  changeOrigin: true
});

proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err);
});

const server = http.createServer((req, res) => {
  proxy.web(req, res);
});

// 🔥 VERY IMPORTANT (WebSocket fix)
server.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head);
});

server.listen(process.env.PORT || 3000, () => {
  console.log('Proxy server running');
});