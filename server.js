
const http = require('http');
const { createProxyServer } = require('http-proxy');
const axios = require('axios'); // Required for the Keep-Alive hack

// 1. Setup the Proxy Server
const proxy = createProxyServer({
  target: 'http://slkbullion.com:10001',
  ws: true,
  changeOrigin: true
});

// 2. Error Handling for the Proxy
proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err.message);
  if (res && !res.headersSent && res.writeHead) {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Proxy error: Target server unreachable');
  }
});

// 3. Create the Main Server
const server = http.createServer((req, res) => {
  // Add a simple health check endpoint for the Keep-Alive ping
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }

  // Forward all other requests to the proxy
  proxy.web(req, res);
});

// 4. Handle WebSocket Upgrades
server.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head);
});

// 5. Start the Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Proxy running on port ${PORT}`);
  console.log(`Keep-Alive Schedule: Mon-Fri, 09:00 to 00:00 IST`);
});

// --- SMART KEEP ALIVE HACK (IST TIME) ---
// IMPORTANT: Replace the URL below with your actual Render URL
const RENDER_EXTERNAL_URL = 'https://your-app-name.onrender.com/health'; 

setInterval(async () => {
    try {
        // Get current time in India (IST)
        const now = new Date();
        const options = { timeZone: 'Asia/Kolkata', hour12: false, weekday: 'long', hour: '2-digit' };
        const formatter = new Intl.DateTimeFormat('en-US', options);
        const parts = formatter.formatToParts(now);
        
        const day = parts.find(p => p.type === 'weekday').value; // e.g., "Monday"
        const hour = parseInt(parts.find(p => p.type === 'hour').value); // 0-23 format

        // Logic: Monday to Friday, 9:00 AM (9) to 11:59 PM (23)
        const isWeekday = !['Saturday', 'Sunday'].includes(day);
        const isWorkingHours = (hour >= 9 && hour <= 23); 

        if (isWeekday && isWorkingHours) {
            await axios.get(RENDER_EXTERNAL_URL);
            console.log(`[${day} ${hour}:00 IST] Ping Successful: Server Kept Awake`);
        } else {
            console.log(`[${day} ${hour}:00 IST] Outside window: Allowing server to sleep to save hours`);
        }
    } catch (err) {
        // Log error but don't crash the server
        console.error('Keep-Alive Ping failed:', err.message);
    }
}, 600000); // Check every 10 minutes (600,000ms)
