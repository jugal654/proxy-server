const http = require('http');
const { createProxyServer } = require('http-proxy');
const axios = require('axios');

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
  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }

  // Forward all other requests
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

// --- ROBUST KEEP ALIVE HACK (IST TIME) ---
// IMPORTANT: Ensure this matches your actual Render service URL
const RENDER_EXTERNAL_URL = 'https://your-app-name.onrender.com/health'; 

setInterval(async () => {
    try {
        const now = new Date();
        
        // Generate a localized string for India: "Monday, 14"
        const istString = now.toLocaleString("en-US", {
            timeZone: "Asia/Kolkata",
            weekday: "long",
            hour: "numeric",
            hour12: false
        });

        // Parse the day and hour from the string
        const [day, hourStr] = istString.split(', ');
        const hour = parseInt(hourStr);

        const isWeekday = !['Saturday', 'Sunday'].includes(day);
        // Logic: 09:00 (9) to 11:59 PM (23)
        const isWorkingHours = (hour >= 9 && hour <= 23); 

        if (isWeekday && isWorkingHours) {
            await axios.get(RENDER_EXTERNAL_URL);
            console.log(`[Keep-Alive] ${day} ${hour}:00 IST - Ping successful.`);
        } else {
            console.log(`[Keep-Alive] ${day} ${hour}:00 IST - Outside window. Sleeping to save hours.`);
        }
    } catch (err) {
        console.error('[Keep-Alive] Error:', err.message);
    }
}, 300000); // Trigger every 5 minutes to ensure Render doesn't spin down
