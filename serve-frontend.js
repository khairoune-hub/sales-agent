#!/usr/bin/env node

/**
 * Simple development server for X Company Bio Products Frontend
 * Serves static files from the public/ directory
 */

import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = createServer(async (req, res) => {
    try {
        // Parse URL
        let filePath = req.url === '/' ? '/index.html' : req.url;
        
        // Remove query parameters
        filePath = filePath.split('?')[0];
        
        // Security: prevent directory traversal
        if (filePath.includes('..')) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }

        const fullPath = join(PUBLIC_DIR, filePath);
        const ext = extname(filePath);
        const contentType = mimeTypes[ext] || 'text/plain';

        // Add CORS headers for development
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        // Handle OPTIONS requests
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        // Read and serve file
        const data = await readFile(fullPath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);

        console.log(`✅ ${req.method} ${req.url} - 200`);

    } catch (error) {
        if (error.code === 'ENOENT') {
            // File not found
            res.writeHead(404);
            res.end(`
<!DOCTYPE html>
<html>
<head>
    <title>404 - Page Not Found</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { color: #f44336; }
        a { color: #4CAF50; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>404 - Page Not Found</h1>
    <p>The requested file <code>${req.url}</code> was not found.</p>
    <p><a href="/">← Return to Home</a></p>
    
    <hr>
    <h3>Available Pages:</h3>
    <ul style="list-style: none; padding: 0;">
        <li><a href="/">🏠 Home (index.html)</a></li>
        <li><a href="/admin.html">👨‍💼 Admin Interface</a></li>
        <li><a href="/chat.html">💬 Customer Chat</a></li>
    </ul>
</body>
</html>
            `);
            console.log(`❌ ${req.method} ${req.url} - 404`);
        } else {
            // Server error
            res.writeHead(500);
            res.end('Internal Server Error');
            console.error(`💥 ${req.method} ${req.url} - 500:`, error.message);
        }
    }
});

server.listen(PORT, () => {
    console.log(`
🌿 X Company Bio Products - Frontend Server

📂 Serving files from: ${PUBLIC_DIR}
🌐 Server running at: http://localhost:${PORT}

📄 Available pages:
   • http://localhost:${PORT}/           (Landing page)
   • http://localhost:${PORT}/admin.html (Admin interface)
   • http://localhost:${PORT}/chat.html  (Customer chat)

🔧 Backend API running on: http://localhost:8787

Press Ctrl+C to stop the server
`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down frontend server...');
    server.close(() => {
        console.log('✅ Frontend server stopped');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n👋 Shutting down frontend server...');
    server.close(() => {
        console.log('✅ Frontend server stopped');
        process.exit(0);
    });
}); 