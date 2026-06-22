// Local development server for API endpoints
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env.local
const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const envContent = readFileSync(join(__dirname, '.env.local'), 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
  });
} catch (e) {}

// Import the chat handler
const chatModule = await import('./api/chat.js');
const chatHandler = chatModule.default;

// Import upload handler if exists
let uploadHandler;
try {
  const uploadModule = await import('./api/upload.js');
  uploadHandler = uploadModule.default;
} catch (e) {}

const server = createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  // Parse body for POST
  let body = '';
  if (req.method === 'POST') {
    for await (const chunk of req) body += chunk;
  }

  // Mock Vercel req/res interface
  const mockReq = {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: body ? JSON.parse(body) : undefined
  };

  const mockRes = {
    statusCode: 200,
    headers: {},
    setHeader(k, v) { this.headers[k] = v; res.setHeader(k, v); },
    status(code) { this.statusCode = code; return this; },
    json(data) { 
      res.writeHead(this.statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    },
    write(data) { res.write(data); },
    end() { res.end(); }
  };

  try {
    if (req.url === '/api/chat' && chatHandler) {
      await chatHandler(mockReq, mockRes);
    } else if (req.url === '/api/upload' && uploadHandler) {
      await uploadHandler(mockReq, mockRes);
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  } catch (err) {
    console.error('Server error:', err);
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message }));
  }
});

server.listen(3001, () => {
  console.log('✓ API server running at http://localhost:3001');
});
