const express = require('express');
const WebSocket = require('ws');
const pty = require('node-pty');
const { v4: uuidv4 } = require('uuid');
const os = require('os');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const Docker = require('dockerode');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'blue-team-secret-key-change-in-production';

// Initialize database
const db = new Database('blue-team.db');

// Initialize Docker
let docker;
try {
  docker = new Docker({ socketPath: '/var/run/docker.sock' });
} catch (e) {
  console.log('[!] Docker not available:', e.message);
}

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    points INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS labs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    difficulty TEXT DEFAULT 'easy',
    category TEXT,
    points INTEGER DEFAULT 10,
    docker_image TEXT,
    flag TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_labs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    lab_id INTEGER NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    flag_submitted TEXT,
    completed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (lab_id) REFERENCES labs(id)
  );

  CREATE TABLE IF NOT EXISTS terminals (
    id TEXT PRIMARY KEY,
    user_id INTEGER,
    container_id TEXT,
    lab_id INTEGER,
    created DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Middleware
app.use(cors());
app.use(express.json());

// Auth middleware
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Store active terminals and containers
const terminals = new Map();
const containers = new Map();

// ============ AUTH ROUTES ============

// Register
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)');
    const result = stmt.run(username, email, hashedPassword);

    const token = jwt.sign({ id: result.lastInsertRowid, username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: result.lastInsertRowid, username, email, role: 'user', points: 0 }
    });
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      res.status(400).json({ error: 'Username or email already exists' });
    } else {
      res.status(500).json({ error: e.message });
    }
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    token,
    user: { id: user.id, username: user.username, email: user.email, role: user.role, points: user.points }
  });
});

// Get user info
app.get('/api/auth/me', auth, (req, res) => {
  const user = db.prepare('SELECT id, username, email, role, points, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

// ============ USER ROUTES ============

// Get leaderboard
app.get('/api/users/leaderboard', (req, res) => {
  const users = db.prepare('SELECT id, username, points, created_at FROM users ORDER BY points DESC LIMIT 20').all();
  res.json(users);
});

// ============ LABS ROUTES ============

// Get all labs
app.get('/api/labs', (req, res) => {
  const labs = db.prepare('SELECT * FROM labs ORDER BY difficulty, name').all();
  res.json(labs);
});

// Get single lab
app.get('/api/labs/:id', (req, res) => {
  const lab = db.prepare('SELECT * FROM labs WHERE id = ?').get(req.params.id);
  if (!lab) return res.status(404).json({ error: 'Lab not found' });
  res.json(lab);
});

// Create lab (admin only)
app.post('/api/labs', auth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  const { name, description, difficulty, category, points, docker_image, flag } = req.body;

  const stmt = db.prepare('INSERT INTO labs (name, description, difficulty, category, points, docker_image, flag) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const result = stmt.run(name, description, difficulty, category, points, docker_image, flag);

  res.json({ id: result.lastInsertRowid, message: 'Lab created' });
});

// Submit flag
app.post('/api/labs/:id/flag', auth, (req, res) => {
  const labId = req.params.id;
  const { flag } = req.body;

  const lab = db.prepare('SELECT * FROM labs WHERE id = ?').get(labId);
  if (!lab) return res.status(404).json({ error: 'Lab not found' });

  // Check if already completed
  const existing = db.prepare('SELECT * FROM user_labs WHERE user_id = ? AND lab_id = ? AND completed = 1')
    .get(req.user.id, labId);

  if (existing) {
    return res.json({ message: 'Lab already completed', points: 0 });
  }

  // Verify flag
  if (flag === lab.flag) {
    db.prepare('INSERT INTO user_labs (user_id, lab_id, completed, flag_submitted, completed_at) VALUES (?, ?, 1, ?, ?)')
      .run(req.user.id, labId, flag, new Date().toISOString());

    db.prepare('UPDATE users SET points = points + ? WHERE id = ?')
      .run(lab.points, req.user.id);

    res.json({ message: 'Correct! Points awarded!', points: lab.points });
  } else {
    res.json({ message: 'Incorrect flag', points: 0 });
  }
});

// Get user lab progress
app.get('/api/labs/progress', auth, (req, res) => {
  const progress = db.prepare(`
    SELECT ul.*, l.name, l.points, l.difficulty
    FROM user_labs ul
    JOIN labs l ON ul.lab_id = l.id
    WHERE ul.user_id = ?
  `).all(req.user.id);

  res.json(progress);
});

// ============ TERMINAL ROUTES ============

// Create terminal
app.post('/api/terminals', auth, async (req, res) => {
  const { labId, cols = 80, rows = 30 } = req.body;
  const termId = uuidv4();

  let container = null;

  // Try to start Docker container for the lab
  if (docker && labId) {
    const lab = db.prepare('SELECT * FROM labs WHERE id = ?').get(labId);
    if (lab && lab.docker_image) {
      try {
        container = await docker.pull(lab.docker_image);
        container = await docker.createContainer({
          Image: lab.docker_image,
          name: `blue-team-${termId}`,
          Tty: true,
          AttachStdin: true,
          AttachStdout: true,
          AttachStderr: true,
          Cmd: ['/bin/bash'],
          Env: ['FLAG=' + lab.flag],
          HostConfig: {
            NetworkMode: 'blue-team-network',
            Memory: 512 * 1024 * 1024,
            CpuQuota: 50000
          }
        });
        await container.start();
        containers.set(termId, container);
      } catch (e) {
        console.log('[!] Docker error:', e.message);
      }
    }
  }

  // Create PTY terminal
  const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-256color',
    cols: parseInt(cols),
    rows: parseInt(rows),
    cwd: os.homedir(),
    env: { ...process.env, TERM: 'xterm-256color', USER: req.user.username }
  });

  terminals.set(termId, {
    pty: ptyProcess,
    userId: req.user.id,
    containerId: container?.id,
    labId,
    created: new Date().toISOString()
  });

  // Save to database
  db.prepare('INSERT INTO terminals (id, user_id, container_id, lab_id) VALUES (?, ?, ?, ?)')
    .run(termId, req.user.id, container?.id, labId);

  res.json({
    id: termId,
    shell,
    hasContainer: !!container
  });
});

// Get terminals
app.get('/api/terminals', auth, (req, res) => {
  const userTerminals = db.prepare('SELECT * FROM terminals WHERE user_id = ?').all(req.user.id);
  res.json(userTerminals);
});

// Delete terminal
app.delete('/api/terminals/:id', auth, async (req, res) => {
  const { id } = req.params;

  const term = terminals.get(id);
  if (term) {
    term.pty.kill();
    terminals.delete(id);
  }

  // Stop and remove Docker container
  const container = containers.get(id);
  if (container) {
    try {
      await container.stop();
      await container.remove();
    } catch (e) {
      console.log('[!] Container cleanup error:', e.message);
    }
    containers.delete(id);
  }

  db.prepare('DELETE FROM terminals WHERE id = ?').run(id);

  res.json({ message: 'Terminal deleted' });
});

// ============ WEBSOCKET ============

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get('token');
  const termId = url.searchParams.get('id');

  if (!token || !termId) {
    ws.close(1008, 'Authentication required');
    return;
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (e) {
    ws.close(1008, 'Invalid token');
    return;
  }

  const term = terminals.get(termId);
  if (!term || term.userId !== decoded.id) {
    ws.close(1008, 'Terminal not found or access denied');
    return;
  }

  console.log(`[+] User ${decoded.username} connected to terminal ${termId}`);

  ws.send('\x1b[32m╔════════════════════════════════════════════════════╗\r\n');
  ws.send('\x1b[32m║     Blue Team Lab Platform - Interactive Terminal    ║\r\n');
  ws.send('\x1b[32m╚════════════════════════════════════════════════════╝\x1b[0m\r\n\r\n');

  if (term.containerId) {
    ws.send('\x1b[33m🐳 Docker Container Active\x1b[0m\r\n');
  }

  term.pty.onData = (data) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  };

  ws.on('message', (message) => {
    if (term.pty) {
      term.pty.write(message.toString());
    }
  });

  ws.on('close', () => {
    console.log(`[-] User ${decoded.username} disconnected`);
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
    labs: db.prepare('SELECT COUNT(*) as count FROM labs').get().count,
    docker: docker ? 'available' : 'unavailable'
  });
});

// Seed some labs
const seedLabs = () => {
  const count = db.prepare('SELECT COUNT(*) as count FROM labs').get().count;
  if (count === 0) {
    const labs = [
      { name: 'Log Analysis Basics', description: 'Analyze suspicious logs and find the attacker', difficulty: 'easy', category: 'blue', points: 10, docker_image: null, flag: 'BLUE{log_analyst_001}' },
      { name: 'Malware IOC Extraction', description: 'Extract IOCs from malware sample', difficulty: 'easy', category: 'blue', points: 15, docker_image: null, flag: 'BLUE{malware_ioc_002}' },
      { name: 'SIEM Query Practice', description: 'Write Splunk queries to detect attacks', difficulty: 'medium', category: 'blue', points: 20, docker_image: null, flag: 'BLUE{siem_queries_003}' },
      { name: 'Phishing Email Analysis', description: 'Analyze phishing email and extract indicators', difficulty: 'easy', category: 'blue', points: 10, docker_image: null, flag: 'BLUE{phishing_004}' },
      { name: 'Network Forensics', description: 'Analyze PCAP and identify C2 traffic', difficulty: 'medium', category: 'blue', points: 20, docker_image: null, flag: 'BLUE{network_005}' }
    ];

    const stmt = db.prepare('INSERT INTO labs (name, description, difficulty, category, points, docker_image, flag) VALUES (?, ?, ?, ?, ?, ?, ?)');
    labs.forEach(lab => stmt.run(lab.name, lab.description, lab.difficulty, lab.category, lab.points, lab.docker_image, lab.flag));

    console.log('[+] Seeded', labs.length, 'labs');
  }
};

seedLabs();

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║          Blue Team Lab Platform - Phase 2 Server            ║
╠═══════════════════════════════════════════════════════════════╣
║  HTTP Server:  http://localhost:${PORT}                         ║
║  WebSocket:    ws://localhost:8080                            ║
║                                                               ║
║  API Endpoints:                                               ║
║    POST   /api/auth/register  - Register new user           ║
║    POST   /api/auth/login     - Login                        ║
║    GET    /api/auth/me        - Get current user             ║
║    GET    /api/labs           - List all labs                ║
║    POST   /api/labs/:id/flag  - Submit flag                   ║
║    POST   /api/terminals      - Create terminal              ║
╚═══════════════════════════════════════════════════════════════╝
`);

app.listen(PORT, () => console.log(`[+] Server running on port ${PORT}`));