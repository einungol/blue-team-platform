# Phase 1: Basic Web Terminal Setup Guide

> สร้าง Web Terminal แบบ HackTheBox ด้วย xterm.js + node-pty + WebSocket

---

## 📋 Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Phase 1 Architecture                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐      ┌──────────────┐      ┌─────────────┐ │
│  │   Client    │ ───▶ │   Server     │ ───▶ │   PTY       │ │
│  │  xterm.js   │      │  Node.js     │      │  (Bash)     │ │
│  │  Browser    │      │  + WebSocket │      │             │ │
│  └─────────────┘      └──────────────┘      └─────────────┘ │
│        │                     │                     │          │
│        └─────────────────────┴─────────────────────┘          │
│                       WebSocket                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Project Structure

```
blue-team-platform/
├── server/
│   ├── index.js      # WebSocket server + REST API
│   └── package.json  # Node.js dependencies
├── client/
│   └── index.html    # Web terminal UI
└── PHASE1-SETUP-GUIDE.md
```

---

## 🚀 Quick Start

### 1. Prerequisites

**Windows:**
```powershell
# Install Node.js
# Download from: https://nodejs.org (LTS version)

# Verify installation
node --version  # Should be v18+
npm --version
```

**Ubuntu/Linux:**
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install build tools (required for node-pty)
sudo apt install build-essential python3
```

**macOS:**
```bash
# Install Node.js
brew install node

# Install build tools
xcode-select --install
```

---

### 2. Setup Server

```bash
# Create project directory
mkdir -p blue-team-platform/server
cd blue-team-platform/server

# Create package.json
npm init -y

# Install dependencies
npm install express ws node-pty uuid dotenv
```

### 3. Create Server File

```bash
# Create index.js (copy from server/index.js in this repo)
# Or create new file with content:

const express = require('express');
const WebSocket = require('ws');
const pty = require('node-pty');
const { v4: uuidv4 } = require('uuid');
const os = require('os');

const app = express();
const PORT = 3001;

const terminals = new Map();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/terminals', express.json(), (req, res) => {
  const { user = 'anonymous', shell = 'bash', cols = 80, rows = 30 } = req.body;
  const termId = uuidv4();
  const shellToUse = os.platform() === 'win32' ? 'powershell.exe' : shell;

  const term = pty.spawn(shellToUse, [], {
    name: 'xterm-256color',
    cols: parseInt(cols),
    rows: parseInt(rows),
    cwd: os.homedir(),
    env: { ...process.env, TERM: 'xterm-256color' }
  });

  terminals.set(termId, { pty: term, user, shell: shellToUse, created: new Date() });
  console.log(`[+] Terminal created: ${termId}`);

  res.json({ id: termId, shell: shellToUse });
});

app.delete('/api/terminals/:id', (req, res) => {
  const { id } = req.params;
  if (terminals.has(id)) {
    terminals.get(id).pty.kill();
    terminals.delete(id);
    res.json({ message: 'Deleted' });
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws, req) => {
  const termId = new URL(req.url, 'http://localhost').searchParams.get('id');
  if (!terminals.has(termId)) return ws.close(1008, 'Not found');

  const term = terminals.get(termId);
  term.pty.onData = (data) => ws.readyState === WebSocket.OPEN && ws.send(data));
  ws.on('message', (msg) => term.pty.write(msg.toString()));
  ws.on('close', () => { term.pty.kill(); terminals.delete(termId); });

  ws.send('\x1b[32mWelcome to Blue Team Lab!\x1b[0m\r\n');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

---

### 4. Create Client

```bash
# Create client directory
mkdir -p ../client

# Create index.html (copy from client/index.html in this repo)
# Or create minimal version:

cat > ../client/index.html << 'HTMLEOF'
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Blue Team Terminal</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.css"/>
  <style>
    body { background: #0a0a12; margin: 0; padding: 20px; }
    #terminal { height: 90vh; }
  </style>
</head>
<body>
  <div id="terminal"></div>
  <script src="https://cdn.jsdelivr.net/npm/xterm@5.3.0/lib/xterm.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/xterm-addon-fit@0.8.0/lib/xterm-addon-fit.min.js"></script>
  <script>
    const term = new Terminal();
    term.loadAddon(new FitAddon());
    term.open(document.getElementById('terminal'));
    new FitAddon().fit();

    fetch('http://localhost:3001/api/terminals', { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        const ws = new WebSocket(`ws://localhost:8080?id=${data.id}`);
        ws.onmessage = e => term.write(e.data);
        term.onData = d => ws.send(d);
      });
  </script>
</body>
</html>
HTMLEOF
```

---

### 5. Run the Platform

```bash
# Terminal 1: Start server
cd server
node index.js

# Terminal 2: Start client (or just open in browser)
# Open client/index.html in browser
```

### 6. Access

```
Browser: http://localhost:3001 (if serving static)
         Or open client/index.html directly

Server:  http://localhost:3001
WebSocket: ws://localhost:8080
```

---

## 🔧 Troubleshooting

### Error: node-pty failed to compile

**Windows:**
```powershell
# Install Visual Studio Build Tools
# https://visualstudio.microsoft.com/visual-cpp-build-tools/

# Then try again
npm install node-pty
```

**Linux:**
```bash
# Install build tools
sudo apt install build-essential python3

# For Ubuntu 22.04+
sudo apt install libnode-dev
```

### Error: Cannot find module 'node-pty'

```bash
# Rebuild node-pty
npm rebuild node-pty
```

### WebSocket connection failed

1. Check if port 8080 is free: `netstat -an | grep 8080`
2. Check server is running: `curl http://localhost:3001/api/health`
3. Check firewall: `sudo ufw allow 8080`

---

## 🎯 Next Steps

### What We Have:
- ✅ Web-based terminal in browser
- ✅ Multiple shell support (bash, PowerShell, zsh)
- ✅ REST API for terminal management
- ✅ WebSocket real-time communication

### What's Next (Phase 2):
- [ ] User authentication (login/register)
- [ ] Docker-based isolated containers
- [ ] Lab provisioning system
- [ ] Challenge management

---

## 📝 Complete File List

| File | Description |
|------|-------------|
| `server/index.js` | WebSocket + REST API server |
| `server/package.json` | Dependencies |
| `client/index.html` | Web terminal UI |
| `PHASE1-SETUP-GUIDE.md` | This guide |

---

## 🔗 Resources

- [xterm.js Documentation](https://xtermjs.org/)
- [node-pty GitHub](https://github.com/microsoft/node-pty)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

---

**Phase:** 1/4
**Status:** Ready to Deploy

**Back to:** [Main Guide](../BLUE-TEAM-PLATFORM-GUIDE.md)