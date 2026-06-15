const express = require('express');
const WebSocket = require('ws');
const pty = require('node-pty');
const { v4: uuidv4 } = require('uuid');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3001;

// Store all terminals
const terminals = new Map();

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', terminals: terminals.size });
});

// Get terminal info
app.get('/api/terminals', (req, res) => {
  const list = [];
  terminals.forEach((term, id) => {
    list.push({
      id,
      user: term.user,
      created: term.created,
      status: term.status
    });
  });
  res.json(list);
});

// Create new terminal
app.post('/api/terminals', express.json(), (req, res) => {
  const { user = 'anonymous', shell = 'bash', cols = 80, rows = 30 } = req.body;

  const termId = uuidv4();

  // Determine shell based on OS
  const shellToUse = os.platform() === 'win32' ? 'powershell.exe' : shell;

  // Create pseudo-terminal
  const term = pty.spawn(shellToUse, [], {
    name: 'xterm-256color',
    cols: parseInt(cols),
    rows: parseInt(rows),
    cwd: process.env.HOME || process.env.USERPROFILE || os.homedir(),
    env: {
      ...process.env,
      TERM: 'xterm-256color'
    }
  });

  terminals.set(termId, {
    pty: term,
    user,
    shell: shellToUse,
    created: new Date().toISOString(),
    status: 'active'
  });

  console.log(`[+] Terminal created: ${termId} for user: ${user}`);

  res.json({
    id: termId,
    shell: shellToUse,
    message: 'Terminal created successfully'
  });
});

// Get specific terminal
app.get('/api/terminals/:id', (req, res) => {
  const { id } = req.params;
  if (!terminals.has(id)) {
    return res.status(404).json({ error: 'Terminal not found' });
  }
  const term = terminals.get(id);
  res.json({
    id,
    user: term.user,
    shell: term.shell,
    created: term.created,
    status: term.status
  });
});

// Delete terminal
app.delete('/api/terminals/:id', (req, res) => {
  const { id } = req.params;
  if (!terminals.has(id)) {
    return res.status(404).json({ error: 'Terminal not found' });
  }

  const term = terminals.get(id);
  term.pty.kill();
  terminals.delete(id);

  console.log(`[-] Terminal deleted: ${id}`);
  res.json({ message: 'Terminal deleted successfully' });
});

// WebSocket server
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const termId = url.searchParams.get('id');

  console.log(`[+] WebSocket connected: ${termId}`);

  if (!termId || !terminals.has(termId)) {
    ws.close(1008, 'Terminal not found');
    return;
  }

  const term = terminals.get(termId);
  term.status = 'connected';
  term.ws = ws;

  // Send initial data
  ws.send('\x1b[32mWelcome to Blue Team Lab Platform!\x1b[0m\r\n');
  ws.send(`Shell: ${term.shell}\r\n`);
  ws.send('Type "help" for available commands\r\n\r\n');

  // Forward data from PTY to WebSocket
  term.pty.onData = (data) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  };

  // Handle incoming data from WebSocket
  ws.on('message', (message) => {
    if (term.pty) {
      term.pty.write(message.toString());
    }
  });

  // Handle disconnect
  ws.on('close', () => {
    console.log(`[-] WebSocket disconnected: ${termId}`);
    if (term.pty) {
      term.pty.kill();
    }
    terminals.delete(termId);
  });

  // Handle errors
  ws.on('error', (err) => {
    console.error(`[!] WebSocket error: ${termId}`, err.message);
  });
});

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║          Blue Team Lab Platform - Terminal Server            ║
╠═══════════════════════════════════════════════════════════════╣
║  HTTP Server:  http://localhost:${PORT}                         ║
║  WebSocket:    ws://localhost:8080                            ║
║  API Endpoints:                                               ║
║    POST   /api/terminals    - Create terminal                ║
║    GET    /api/terminals    - List terminals                 ║
║    GET    /api/terminals/:id - Get terminal info              ║
║    DELETE /api/terminals/:id - Delete terminal                ║
╚═══════════════════════════════════════════════════════════════╝
`);

app.listen(PORT, () => {
  console.log(`[+] Server running on port ${PORT}`);
});