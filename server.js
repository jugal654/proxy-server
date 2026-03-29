const http = require('http');
const { createProxyServer } = require('http-proxy');

const proxy = createProxyServer({
  target: 'http://slkbullion.com:10001',
  ws: true
});

const server = http.createServer((req, res) => {
  proxy.web(req, res);
});

server.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head);
});

server.listen(process.env.PORT || 3000, () => {
  console.log('Proxy server running');
});