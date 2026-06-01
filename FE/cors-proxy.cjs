// CORS Proxy Server - CommonJS format
// Bypass CORS restrictions for development

const express = require('express');
const cors = require('cors');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const app = express();
const PORT = 8080;

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// Proxy endpoint
app.all('/proxy', async (req, res) => {
    try {
        // Get target URL from query parameter
        const targetUrl = req.query.url;

        if (!targetUrl) {
            return res.status(400).json({ error: 'Missing url parameter' });
        }

        console.log(`📡 Proxying ${req.method} request to: ${targetUrl}`);

        const url = new URL(targetUrl);
        const protocol = url.protocol === 'https:' ? https : http;

        // Prepare request options
        const options = {
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname + url.search,
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'CORS-Proxy/1.0'
            }
        };

        // Make request
        const proxyReq = protocol.request(options, (proxyRes) => {
            let data = '';

            proxyRes.on('data', (chunk) => {
                data += chunk;
            });

            proxyRes.on('end', () => {
                console.log(`✅ Response status: ${proxyRes.statusCode}`);

                // Forward response with CORS headers
                res.status(proxyRes.statusCode);
                res.set('Content-Type', 'application/json');
                res.set('Access-Control-Allow-Origin', '*');
                res.send(data);
            });
        });

        proxyReq.on('error', (error) => {
            console.error('❌ Proxy request error:', error);
            res.status(500).json({ error: error.message });
        });

        // Send request body if present
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            proxyReq.write(JSON.stringify(req.body));
        }

        proxyReq.end();

    } catch (error) {
        console.error('❌ Proxy error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 CORS Proxy running on http://localhost:${PORT}`);
    console.log(`📝 Usage: http://localhost:${PORT}/proxy?url=[TARGET_URL]`);
    console.log(`\n💡 Example:`);
    console.log(`   http://localhost:${PORT}/proxy?url=https://api.example.com/endpoint`);
    console.log(`\n🔧 To use in frontend:`);
    console.log(`   Uncomment PROXY URLs in src/services/AI/aiService.jsx`);
});
