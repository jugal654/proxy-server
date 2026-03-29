 

const http = require('http');
const { createProxyServer } = require('http-proxy');
const axios = require('axios'); // Required for the Keep-Alive hack

// 1. Setup the Proxy Server with Render-compatible settings
const proxy = createProxyServer({
  target: 'http://slkbullion.com:10001',
  ws: true,
  changeOrigin: true,
  xfwd: true // Helps with Render's load balancer
});

// 2. Comprehensive Error Handling
proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err.message);
  
  if (res && !res.headersSent && typeof res.writeHead === 'function') {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Proxy error: Target server unreachable');
  }

  if (req.socket && req.socket.destroy) {
    req.socket.destroy();
  }
});

// 3. Create Server with Health Check
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }
  proxy.web(req, res);
});

// 4. Handle WebSocket Upgrades
server.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Proxy running on port ${PORT}`);
});

// --- SMART KEEP ALIVE HACK (IST TIME) ---
const RENDER_EXTERNAL_URL = 'https://your-app-name.onrender.com/health'; 

setInterval(async () => {
    try {
        const now = new Date();
        const options = { timeZone: 'Asia/Kolkata', hour12: false, weekday: 'long', hour: '2-digit' };
        const formatter = new Intl.DateTimeFormat('en-US', options);
        const parts = formatter.formatToParts(now);
        
        const day = parts.find(p => p.type === 'weekday').value; 
        const hour = parseInt(parts.find(p => p.type === 'hour').value); 

        // Schedule: Mon-Fri, 9 AM (9) to 11:59 PM (23)
        const isWeekday = !['Saturday', 'Sunday'].includes(day);
        const isWorkingHours = (hour >= 9 && hour <= 23); 

        if (isWeekday && isWorkingHours) {
            await axios.get(RENDER_EXTERNAL_URL);
            console.log(`[${day} ${hour}:00 IST] Ping Successful: Server Kept Awake`);
        } else {
            console.log(`[${day} ${hour}:00 IST] Market Closed: Saving Render hours`);
        }
    } catch (err) {
        console.log('Keep-Alive check performed (Server may be waking up)');
    }
}, 600000); // Runs every 10 minutes
