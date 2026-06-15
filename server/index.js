const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
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
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'blue-team-secret-key-change-in-production';

// Initialize database
const db = new Database('blue-team.db');

// Initialize Docker
let docker;
try {
  docker = new Docker({ socketPath: '/var/run/docker.sock' });
  docker.ping();
  console.log('[+] Docker available');
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
    labs_completed INTEGER DEFAULT 0,
    avatar TEXT DEFAULT 'default',
    bio TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS labs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    difficulty TEXT DEFAULT 'easy',
    category TEXT DEFAULT 'blue',
    points INTEGER DEFAULT 10,
    docker_image TEXT,
    flag TEXT NOT NULL,
    hint TEXT,
    flag_hash TEXT,
    time_limit INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_labs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    lab_id INTEGER NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    flag_submitted TEXT,
    attempts INTEGER DEFAULT 0,
    time_spent INTEGER DEFAULT 0,
    completed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (lab_id) REFERENCES labs(id),
    UNIQUE(user_id, lab_id)
  );

  CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    points_required INTEGER DEFAULT 0,
    labs_required INTEGER DEFAULT 0,
    badge_type TEXT DEFAULT 'bronze'
  );

  CREATE TABLE IF NOT EXISTS user_achievements (
    user_id INTEGER NOT NULL,
    achievement_id INTEGER NOT NULL,
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, achievement_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (achievement_id) REFERENCES achievements(id)
  );

  CREATE TABLE IF NOT EXISTS terminals (
    id TEXT PRIMARY KEY,
    user_id INTEGER,
    container_id TEXT,
    lab_id INTEGER,
    status TEXT DEFAULT 'active',
    created DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS admin_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER,
    action TEXT,
    target TEXT,
    created DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed achievements
const seedAchievements = () => {
  const count = db.prepare('SELECT COUNT(*) as count FROM achievements').get().count;
  if (count === 0) {
    const achievements = [
      { name: 'First Blood', description: 'Complete your first lab', icon: '🎯', points_required: 0, labs_required: 1, badge_type: 'bronze' },
      { name: 'Blue Analyst', description: 'Earn 50 points', icon: '🔵', points_required: 50, labs_required: 0, badge_type: 'bronze' },
      { name: 'SOC Specialist', description: 'Earn 100 points', icon: '🛡️', points_required: 100, labs_required: 0, badge_type: 'silver' },
      { name: 'Threat Hunter', description: 'Earn 250 points', icon: '🎯', points_required: 250, labs_required: 0, badge_type: 'silver' },
      { name: 'Detection Engineer', description: 'Earn 500 points', icon: '🔍', points_required: 500, labs_required: 0, badge_type: 'gold' },
      { name: 'Lab Hunter', description: 'Complete 5 labs', icon: '🏆', points_required: 0, labs_required: 5, badge_type: 'bronze' },
      { name: 'Lab Master', description: 'Complete 10 labs', icon: '👑', points_required: 0, labs_required: 10, badge_type: 'silver' },
      { name: 'Blue Team Legend', description: 'Complete 20 labs', icon: '⭐', points_required: 0, labs_required: 20, badge_type: 'gold' }
    ];
    const stmt = db.prepare('INSERT INTO achievements (name, description, icon, points_required, labs_required, badge_type) VALUES (?, ?, ?, ?, ?, ?)');
    achievements.forEach(a => stmt.run(a.name, a.description, a.icon, a.points_required, a.labs_required, a.badge_type));
    console.log('[+] Seeded achievements');
  }
};
seedAchievements();

// Seed labs
const seedLabs = () => {
  const count = db.prepare('SELECT COUNT(*) as count FROM labs').get().count;
  if (count === 0) {
    const labs = [
      { name: 'Log Analysis Basics', description: 'Analyze suspicious logs and find the attacker IP', difficulty: 'easy', category: 'blue', points: 10, flag: 'BLUE{log_analyst_001}', hint: 'Look for failed login attempts' },
      { name: 'Malware IOC Extraction', description: 'Extract IOCs (IP, Domain, Hash) from malware sample', difficulty: 'easy', category: 'blue', points: 15, flag: 'BLUE{malware_ioc_002}', hint: 'Check network connections in sandbox' },
      { name: 'SIEM Query Practice', description: 'Write Splunk queries to detect brute force attack', difficulty: 'medium', category: 'blue', points: 20, flag: 'BLUE{siem_queries_003}', hint: 'Use stats and where clauses' },
      { name: 'Phishing Email Analysis', description: 'Analyze phishing email and extract malicious URLs', difficulty: 'easy', category: 'blue', points: 10, flag: 'BLUE{phishing_004}', hint: 'Check email headers and links' },
      { name: 'Network Forensics', description: 'Analyze PCAP and identify C2 beacon traffic', difficulty: 'medium', category: 'blue', points: 20, flag: 'BLUE{network_005}', hint: 'Look for periodic connections' },
      { name: 'YARA Rule Writing', description: 'Create YARA rule to detect the malware', difficulty: 'medium', category: 'blue', points: 25, flag: 'BLUE{yara_rule_006}', hint: 'Look for unique strings' },
      { name: 'Incident Response', description: 'Respond to a ransomware incident', difficulty: 'hard', category: 'blue', points: 30, flag: 'BLUE{ir_response_007}', hint: 'Follow IR lifecycle' },
      { name: 'Memory Forensics', description: 'Analyze memory dump and find hidden process', difficulty: 'hard', category: 'blue', points: 35, flag: 'BLUE{memory_008}', hint: 'Use volatility psscan' }
    ];
    const stmt = db.prepare('INSERT INTO labs (name, description, difficulty, category, points, flag, hint) VALUES (?, ?, ?, ?, ?, ?, ?)');
    labs.forEach(l => stmt.run(l.name, l.description, l.difficulty, l.category, l.points, l.flag, l.hint));
    console.log('[+] Seeded labs');
  }
};
seedLabs();

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

// Admin middleware
const admin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  next();
};

// Store active terminals
const terminals = new Map();
const containers = new Map();

// ============ AUTH ROUTES ============

app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields required' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)');
    const result = stmt.run(username, email, hashedPassword);
    const token = jwt.sign({ id: result.lastInsertRowid, username, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: result.lastInsertRowid, username, email, role: 'user', points: 0, labs_completed: 0 } });
  } catch (e) {
    if (e.message.includes('UNIQUE')) res.status(400).json({ error: 'Username or email exists' });
    else res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role, points: user.points, labs_completed: user.labs_completed, avatar: user.avatar, bio: user.bio } });
});

app.get('/api/auth/me', auth, (req, res) => {
  const user = db.prepare('SELECT id, username, email, role, points, labs_completed, avatar, bio, created_at FROM users WHERE id = ?').get(req.user.id);
  const achievements = db.prepare('SELECT a.* FROM achievements a JOIN user_achievements ua ON a.id = ua.achievement_id WHERE ua.user_id = ?').all(req.user.id);
  res.json({ ...user, achievements });
});

app.put('/api/auth/profile', auth, (req, res) => {
  const { avatar, bio } = req.body;
  db.prepare('UPDATE users SET avatar = COALESCE(?, avatar), bio = COALESCE(?, bio) WHERE id = ?').run(avatar, bio, req.user.id);
  res.json({ message: 'Profile updated' });
});

// ============ ADMIN ROUTES ============

app.get('/api/admin/users', auth, admin, (req, res) => {
  const users = db.prepare('SELECT id, username, email, role, points, labs_completed, created_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

app.get('/api/admin/labs', auth, admin, (req, res) => {
  const labs = db.prepare('SELECT * FROM labs ORDER BY id').all();
  res.json(labs);
});

app.post('/api/admin/labs', auth, admin, (req, res) => {
  const { name, description, difficulty, category, points, docker_image, flag, hint } = req.body;
  const stmt = db.prepare('INSERT INTO labs (name, description, difficulty, category, points, docker_image, flag, hint) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const result = stmt.run(name, description, difficulty, category, points, docker_image, flag, hint);
  db.prepare('INSERT INTO admin_logs (admin_id, action, target) VALUES (?, ?, ?)').run(req.user.id, 'create_lab', result.lastInsertRowid);
  io.emit('lab_created', { id: result.lastInsertRowid, name });
  res.json({ id: result.lastInsertRowid, message: 'Lab created' });
});

app.put('/api/admin/labs/:id', auth, admin, (req, res) => {
  const { name, description, difficulty, category, points, flag, hint } = req.body;
  db.prepare('UPDATE labs SET name = ?, description = ?, difficulty = ?, category = ?, points = ?, flag = ?, hint = ? WHERE id = ?')
    .run(name, description, difficulty, category, points, flag, hint, req.params.id);
  io.emit('lab_updated', { id: req.params.id });
  res.json({ message: 'Lab updated' });
});

app.delete('/api/admin/labs/:id', auth, admin, (req, res) => {
  db.prepare('DELETE FROM labs WHERE id = ?').run(req.params.id);
  db.prepare('DELETE FROM user_labs WHERE lab_id = ?').run(req.params.id);
  res.json({ message: 'Lab deleted' });
});

app.get('/api/admin/stats', auth, admin, (req, res) => {
  const users = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const labs = db.prepare('SELECT COUNT(*) as count FROM labs').get().count;
  const completions = db.prepare('SELECT COUNT(*) as count FROM user_labs WHERE completed = 1').get().count;
  const active_terminals = db.prepare('SELECT COUNT(*) as count FROM terminals WHERE status = ?').get('active').count;
  res.json({ users, labs, completions, active_terminals });
});

app.get('/api/admin/logs', auth, admin, (req, res) => {
  const logs = db.prepare('SELECT al.*, u.username FROM admin_logs al JOIN users u ON al.admin_id = u.id ORDER BY al.created_at DESC LIMIT 50').all();
  res.json(logs);
});

// ============ USER ROUTES ============

app.get('/api/users/leaderboard', (req, res) => {
  const users = db.prepare('SELECT id, username, points, labs_completed, avatar FROM users ORDER BY points DESC LIMIT 50').all();
  res.json(users);
});

app.get('/api/users/:id', (req, res) => {
  const user = db.prepare('SELECT id, username, points, labs_completed, avatar, bio, created_at FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const achievements = db.prepare('SELECT a.* FROM achievements a JOIN user_achievements ua ON a.id = ua.achievement_id WHERE ua.user_id = ?').all(user.id);
  const completed_labs = db.prepare(`
    SELECT l.*, ul.completed_at, ul.time_spent
    FROM user_labs ul
    JOIN labs l ON ul.lab_id = l.id
    WHERE ul.user_id = ? AND ul.completed = 1
  `).all(user.id);
  res.json({ ...user, achievements, completed_labs });
});

// ============ LABS ROUTES ============

app.get('/api/labs', (req, res) => {
  const { category, difficulty } = req.query;
  let query = 'SELECT * FROM labs WHERE 1=1';
  if (category) query += ` AND category = '${category}'`;
  if (difficulty) query += ` AND difficulty = '${difficulty}'`;
  query += ' ORDER BY difficulty, points';
  const labs = db.prepare(query).all();
  res.json(labs);
});

app.get('/api/labs/:id', (req, res) => {
  const lab = db.prepare('SELECT * FROM labs WHERE id = ?').get(req.params.id);
  if (!lab) return res.status(404).json({ error: 'Lab not found' });
  res.json(lab);
});

app.post('/api/labs/:id/flag', auth, (req, res) => {
  const labId = req.params.id;
  const { flag, time_spent = 0 } = req.body;
  const lab = db.prepare('SELECT * FROM labs WHERE id = ?').get(labId);
  if (!lab) return res.status(404).json({ error: 'Lab not found' });

  const existing = db.prepare('SELECT * FROM user_labs WHERE user_id = ? AND lab_id = ? AND completed = 1').get(req.user.id, labId);
  if (existing) return res.json({ message: 'Lab already completed', points: 0 });

  const user_lab = db.prepare('SELECT * FROM user_labs WHERE user_id = ? AND lab_id = ?').get(req.user.id, labId);
  const attempts = (user_lab?.attempts || 0) + 1;

  if (lab.max_attempts && attempts > lab.max_attempts) {
    return res.status(400).json({ error: 'Max attempts exceeded' });
  }

  if (flag === lab.flag) {
    if (!user_lab) {
      db.prepare('INSERT INTO user_labs (user_id, lab_id, completed, flag_submitted, attempts, time_spent, completed_at) VALUES (?, ?, 1, ?, ?, ?, ?)')
        .run(req.user.id, labId, flag, attempts, time_spent, new Date().toISOString());
    } else {
      db.prepare('UPDATE user_labs SET completed = 1, flag_submitted = ?, attempts = ?, time_spent = ?, completed_at = ? WHERE user_id = ? AND lab_id = ?')
        .run(flag, attempts, time_spent, new Date().toISOString(), req.user.id, labId);
    }

    db.prepare('UPDATE users SET points = points + ?, labs_completed = labs_completed + 1 WHERE id = ?').run(lab.points, req.user.id);

    // Check achievements
    checkAchievements(req.user.id);

    io.emit('lab_completed', { user_id: req.user.id, lab_id: labId, points: lab.points });
    res.json({ message: 'Correct! Well done!', points: lab.points });
  } else {
    if (!user_lab) {
      db.prepare('INSERT INTO user_labs (user_id, lab_id, attempts, time_spent) VALUES (?, ?, ?, ?)').run(req.user.id, labId, attempts, time_spent);
    } else {
      db.prepare('UPDATE user_labs SET attempts = attempts + 1, time_spent = time_spent + ? WHERE user_id = ? AND lab_id = ?').run(time_spent, req.user.id, labId);
    }
    res.json({ message: 'Incorrect flag', attempts });
  }
});

app.get('/api/labs/progress', auth, (req, res) => {
  const progress = db.prepare(`
    SELECT ul.*, l.name, l.points, l.difficulty, l.category
    FROM user_labs ul
    JOIN labs l ON ul.lab_id = l.id
    WHERE ul.user_id = ?
  `).all(req.user.id);
  res.json(progress);
});

function checkAchievements(userId) {
  const user = db.prepare('SELECT points, labs_completed FROM users WHERE id = ?').get(userId);
  const achievements = db.prepare('SELECT * FROM achievements WHERE id NOT IN (SELECT achievement_id FROM user_achievements WHERE user_id = ?)').all(userId);

  const earned = [];
  achievements.forEach(a => {
    if ((a.points_required > 0 && user.points >= a.points_required) || (a.labs_required > 0 && user.labs_completed >= a.labs_required)) {
      db.prepare('INSERT OR IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)').run(userId, a.id);
      earned.push(a);
    }
  });

  if (earned.length > 0) {
    io.emit('achievements_earned', { user_id: userId, achievements: earned });
  }
}

// ============ TERMINAL ROUTES ============

app.post('/api/terminals', auth, async (req, res) => {
  const { labId, cols = 80, rows = 30 } = req.body;
  const termId = uuidv4();

  let container = null;
  if (docker && labId) {
    const lab = db.prepare('SELECT * FROM labs WHERE id = ?').get(labId);
    if (lab?.docker_image) {
      try {
        container = await docker.createContainer({
          Image: lab.docker_image,
          name: `blue-team-${termId}`,
          Tty: true,
          AttachStdin: true,
          AttachStdout: true,
          AttachStderr: true,
          Cmd: ['/bin/bash'],
          Env: ['FLAG=' + lab.flag],
          HostConfig: { NetworkMode: 'blue-team-network', Memory: 512 * 1024 * 1024, CpuQuota: 50000 }
        });
        await container.start();
        containers.set(termId, container);
      } catch (e) { console.log('[!] Docker:', e.message); }
    }
  }

  const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-256color', cols: parseInt(cols), rows: parseInt(rows),
    cwd: os.homedir(), env: { ...process.env, TERM: 'xterm-256color', USER: req.user.username }
  });

  terminals.set(termId, { pty: ptyProcess, userId: req.user.id, containerId: container?.id, labId, created: new Date().toISOString() });
  db.prepare('INSERT INTO terminals (id, user_id, container_id, lab_id) VALUES (?, ?, ?, ?)').run(termId, req.user.id, container?.id, labId);

  io.emit('terminal_created', { user: req.user.username, lab_id: labId });
  res.json({ id: termId, shell, hasContainer: !!container });
});

app.delete('/api/terminals/:id', auth, async (req, res) => {
  const term = terminals.get(req.params.id);
  if (term) { term.pty.kill(); terminals.delete(req.params.id); }
  const container = containers.get(req.params.id);
  if (container) { try { await container.stop(); await container.remove(); } catch (e) {} containers.delete(req.params.id); }
  db.prepare('DELETE FROM terminals WHERE id = ?').run(req.params.id);
  res.json({ message: 'Terminal deleted' });
});

// ============ WEBSOCKET ============

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, 'http://localhost');
  const token = url.searchParams.get('token');
  const termId = url.searchParams.get('id');

  if (!token || !termId) return ws.close(1008, 'Auth required');
  let decoded;
  try { decoded = jwt.verify(token, JWT_SECRET); } catch (e) { return ws.close(1008, 'Invalid token'); }

  const term = terminals.get(termId);
  if (!term || term.userId !== decoded.id) return ws.close(1008, 'Access denied');

  console.log(`[+] ${decoded.username} connected`);

  ws.send('\x1b[32m╔═══════════════════════════════════════════════════════════╗\r\n');
  ws.send('\x1b[32m║      Blue Team Lab Platform - Interactive Terminal         ║\r\n');
  ws.send('\x1b[32m╚═══════════════════════════════════════════════════════════╝\x1b[0m\r\n\r\n');
  if (term.labId) {
    const lab = db.prepare('SELECT name, hint FROM labs WHERE id = ?').get(term.labId);
    if (lab) ws.send(`\x1b[33m📌 Lab: ${lab.name}\x1b[0m\r\n`);
  }
  ws.send('Type "hint" for a hint, "submit FLAG" to submit flag\r\n\r\n');

  term.pty.onData = (data) => { if (ws.readyState === WebSocket.OPEN) ws.send(data); };
  ws.on('message', (msg) => {
    const data = msg.toString();
    if (data === 'hint') {
      const lab = db.prepare('SELECT hint FROM labs WHERE id = ?').get(term.labId);
      ws.send(lab?.hint ? `\x1b[33m💡 Hint: ${lab.hint}\x1b[0m\r\n` : '\x1b[31mNo hint available\x1b[0m\r\n');
    } else {
      term.pty.write(data);
    }
  });
  ws.on('close', () => { console.log(`[-] ${decoded.username} disconnected`); });
});

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  console.log('[+] Socket connected:', socket.id);
  socket.on('disconnect', () => console.log('[-] Socket disconnected'));
});

// Health check
app.get('/api/health', (req, res) => {
  const users = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const labs = db.prepare('SELECT COUNT(*) as count FROM labs').get().count;
  const terminals = db.prepare('SELECT COUNT(*) as count FROM terminals').get().count;
  res.json({ status: 'ok', users, labs, active_terminals: terminals, docker: docker ? 'available' : 'unavailable' });
});

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║          Blue Team Lab Platform - Phase 3 Server              ║
╠═══════════════════════════════════════════════════════════════╣
║  HTTP Server:  http://localhost:${PORT}                          ║
║  WebSocket:    ws://localhost:8080                              ║
║  Socket.IO:   :3001 (CORS enabled)                             ║
╚═══════════════════════════════════════════════════════════════╝
`);

app.listen(PORT, () => console.log(`[+] Server running on port ${PORT}`));