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
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'blue-team-secret-key-change-in-production';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Database
const db = new Database(IS_PRODUCTION ? '/data/blue-team.db' : 'blue-team.db');

// Docker
let docker;
try {
  docker = new Docker({ socketPath: IS_PRODUCTION ? '/var/run/docker.sock' : '/var/run/docker.sock' });
} catch (e) {
  console.log('[!] Docker not available');
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
    team_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    leader_id INTEGER,
    points INTEGER DEFAULT 0,
    members_count INTEGER DEFAULT 0,
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
    is_public BOOLEAN DEFAULT 1,
    tags TEXT,
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
    PRIMARY KEY (user_id, achievement_id)
  );

  CREATE TABLE IF NOT EXISTS docker_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    image TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'blue',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS terminals (
    id TEXT PRIMARY KEY,
    user_id INTEGER,
    container_id TEXT,
    lab_id INTEGER,
    status TEXT DEFAULT 'active',
    created DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed data
const seedData = () => {
  if (db.prepare('SELECT COUNT(*) FROM achievements').get().count === 0) {
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
    achievements.forEach(a => db.prepare('INSERT INTO achievements (name, description, icon, points_required, labs_required, badge_type) VALUES (?, ?, ?, ?, ?, ?)').run(a.name, a.description, a.icon, a.points_required, a.labs_required, a.badge_type));
  }

  if (db.prepare('SELECT COUNT(*) FROM labs').get().count === 0) {
    const labs = [
      { name: 'Log Analysis Basics', description: 'Analyze suspicious logs and find the attacker IP', difficulty: 'easy', category: 'blue', points: 10, flag: 'BLUE{log_analyst_001}', hint: 'Look for failed login attempts with Event ID 4625' },
      { name: 'Malware IOC Extraction', description: 'Extract IOCs (IP, Domain, Hash) from malware sample', difficulty: 'easy', category: 'blue', points: 15, flag: 'BLUE{malware_ioc_002}', hint: 'Check network connections in sandbox' },
      { name: 'SIEM Query Practice', description: 'Write Splunk queries to detect brute force attack', difficulty: 'medium', category: 'blue', points: 20, flag: 'BLUE{siem_queries_003}', hint: 'Use stats and where clauses' },
      { name: 'Phishing Email Analysis', description: 'Analyze phishing email and extract malicious URLs', difficulty: 'easy', category: 'blue', points: 10, flag: 'BLUE{phishing_004}', hint: 'Check email headers and links' },
      { name: 'Network Forensics', description: 'Analyze PCAP and identify C2 beacon traffic', difficulty: 'medium', category: 'blue', points: 20, flag: 'BLUE{network_005}', hint: 'Look for periodic connections with same size' },
      { name: 'YARA Rule Writing', description: 'Create YARA rule to detect the malware', difficulty: 'medium', category: 'blue', points: 25, flag: 'BLUE{yara_rule_006}', hint: 'Look for unique strings in the binary' },
      { name: 'Incident Response', description: 'Respond to a ransomware incident step by step', difficulty: 'hard', category: 'blue', points: 30, flag: 'BLUE{ir_response_007}', hint: 'Follow IR lifecycle: Contain, Eradicate, Recover' },
      { name: 'Memory Forensics', description: 'Analyze memory dump and find hidden process', difficulty: 'hard', category: 'blue', points: 35, flag: 'BLUE{memory_008}', hint: 'Use volatility psscan to find hidden processes' }
    ];
    labs.forEach(l => db.prepare('INSERT INTO labs (name, description, difficulty, category, points, flag, hint) VALUES (?, ?, ?, ?, ?, ?, ?)').run(l.name, l.description, l.difficulty, l.category, l.points, l.flag, l.hint));
  }

  if (db.prepare('SELECT COUNT(*) FROM docker_images').get().count === 0) {
    const images = [
      { name: 'DVWA', image: 'sagikazarmark/dvwa', description: 'Damn Vulnerable Web Application', category: 'web' },
      { name: 'OWASP Juice Shop', image: 'bkimminich/juice-shop', description: 'Modern web app security training', category: 'web' },
      { name: 'Metasploitable', image: 'rapid7/metasploitable3', description: 'Vulnerable Linux VM', category: 'pentest' },
      { name: 'Windows Server 2019', image: 'mcr.microsoft.com/windows/servercore:ltsc2019', description: 'Windows Server Core', category: 'windows' },
      { name: 'Kali Linux', image: 'kalilinux/kali-rolling', description: 'Penetration Testing Linux', category: 'pentest' }
    ];
    images.forEach(i => db.prepare('INSERT INTO docker_images (name, image, description, category) VALUES (?, ?, ?, ?)').run(i.name, i.image, i.description, i.category));
  }
};
seedData();

// Middleware
app.use(cors());
app.use(express.json());

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
};

const admin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
};

const terminals = new Map();
const containers = new Map();

// ============ AUTH ============
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)').run(username, email, hashedPassword);
    const token = jwt.sign({ id: result.lastInsertRowid, username, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: result.lastInsertRowid, username, email, role: 'user', points: 0, labs_completed: 0 } });
  } catch (e) {
    res.status(400).json({ error: 'Username or email exists' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !await bcrypt.compare(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role, points: user.points, labs_completed: user.labs_completed, avatar: user.avatar, bio: user.bio, team_id: user.team_id } });
});

app.get('/api/auth/me', auth, (req, res) => {
  const user = db.prepare('SELECT id, username, email, role, points, labs_completed, avatar, bio, team_id, created_at FROM users WHERE id = ?').get(req.user.id);
  const achievements = db.prepare('SELECT a.* FROM achievements a JOIN user_achievements ua ON a.id = ua.achievement_id WHERE ua.user_id = ?').all(req.user.id);
  res.json({ ...user, achievements });
});

app.put('/api/auth/profile', auth, (req, res) => {
  const { avatar, bio } = req.body;
  db.prepare('UPDATE users SET avatar = COALESCE(?, avatar), bio = COALESCE(?, bio) WHERE id = ?').run(avatar, bio, req.user.id);
  res.json({ message: 'Profile updated' });
});

// ============ TEAMS ============
app.post('/api/teams', auth, (req, res) => {
  const { name, description } = req.body;
  try {
    const result = db.prepare('INSERT INTO teams (name, description, leader_id) VALUES (?, ?, ?)').run(name, description, req.user.id);
    db.prepare('UPDATE users SET team_id = ? WHERE id = ?').run(result.lastInsertRowid, req.user.id);
    res.json({ id: result.lastInsertRowid, message: 'Team created' });
  } catch (e) { res.status(400).json({ error: 'Team name exists' }); }
});

app.get('/api/teams', (req, res) => {
  const teams = db.prepare('SELECT t.*, u.username as leader_name FROM teams t JOIN users u ON t.leader_id = u.id ORDER BY points DESC').all();
  res.json(teams);
});

app.get('/api/teams/:id', (req, res) => {
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(req.params.id);
  const members = db.prepare('SELECT id, username, points, labs_completed FROM users WHERE team_id = ?').all(req.params.id);
  res.json({ ...team, members });
});

app.post('/api/teams/:id/join', auth, (req, res) => {
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(req.params.id);
  if (!team) return res.status(404).json({ error: 'Team not found' });
  db.prepare('UPDATE users SET team_id = ? WHERE id = ?').run(req.params.id, req.user.id);
  db.prepare('UPDATE teams SET members_count = members_count + 1 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Joined team' });
});

// ============ ADMIN ============
app.get('/api/admin/stats', auth, admin, (req, res) => {
  const users = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const labs = db.prepare('SELECT COUNT(*) as count FROM labs').get().count;
  const completions = db.prepare('SELECT COUNT(*) as count FROM user_labs WHERE completed = 1').get().count;
  const terminals = db.prepare('SELECT COUNT(*) as count FROM terminals WHERE status = ?').get('active').count;
  const teams = db.prepare('SELECT COUNT(*) as count FROM teams').get().count;
  res.json({ users, labs, completions, active_terminals: terminals, teams });
});

app.get('/api/admin/labs', auth, admin, (req, res) => res.json(db.prepare('SELECT * FROM labs ORDER BY id').all()));
app.get('/api/admin/docker-images', auth, admin, (req, res) => res.json(db.prepare('SELECT * FROM docker_images').all()));

app.post('/api/admin/docker-images', auth, admin, (req, res) => {
  const { name, image, description, category } = req.body;
  const result = db.prepare('INSERT INTO docker_images (name, image, description, category) VALUES (?, ?, ?, ?)').run(name, image, description, category);
  res.json({ id: result.lastInsertRowid });
});

app.delete('/api/admin/docker-images/:id', auth, admin, (req, res) => {
  db.prepare('DELETE FROM docker_images WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

app.post('/api/admin/labs', auth, admin, (req, res) => {
  const { name, description, difficulty, category, points, docker_image, flag, hint, is_public, tags } = req.body;
  const result = db.prepare('INSERT INTO labs (name, description, difficulty, category, points, docker_image, flag, hint, is_public, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(name, description, difficulty, category, points, docker_image, flag, hint, is_public ? 1 : 0, tags);
  io.emit('lab_created', { id: result.lastInsertRowid, name });
  res.json({ id: result.lastInsertRowid });
});

app.put('/api/admin/labs/:id', auth, admin, (req, res) => {
  const { name, description, difficulty, category, points, flag, hint, is_public, tags } = req.body;
  db.prepare('UPDATE labs SET name = ?, description = ?, difficulty = ?, category = ?, points = ?, flag = ?, hint = ?, is_public = ?, tags = ? WHERE id = ?').run(name, description, difficulty, category, points, flag, hint, is_public ? 1 : 0, tags, req.params.id);
  io.emit('lab_updated', { id: req.params.id });
  res.json({ message: 'Updated' });
});

app.delete('/api/admin/labs/:id', auth, admin, (req, res) => {
  db.prepare('DELETE FROM labs WHERE id = ?').run(req.params.id);
  db.prepare('DELETE FROM user_labs WHERE lab_id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

// ============ LABS ============
app.get('/api/labs', (req, res) => {
  const { category, difficulty, search } = req.query;
  let query = 'SELECT * FROM labs WHERE is_public = 1';
  if (category) query += ` AND category = '${category}'`;
  if (difficulty) query += ` AND difficulty = '${difficulty}'`;
  if (search) query += ` AND (name LIKE '%${search}%' OR description LIKE '%${search}%')`;
  query += ' ORDER BY difficulty, points';
  res.json(db.prepare(query).all());
});

app.get('/api/labs/:id', (req, res) => {
  const lab = db.prepare('SELECT * FROM labs WHERE id = ?').get(req.params.id);
  if (!lab) return res.status(404).json({ error: 'Lab not found' });
  res.json(lab);
});

app.post('/api/labs/:id/flag', auth, (req, res) => {
  const { flag, time_spent = 0 } = req.body;
  const lab = db.prepare('SELECT * FROM labs WHERE id = ?').get(req.params.id);
  if (!lab) return res.status(404).json({ error: 'Lab not found' });

  const existing = db.prepare('SELECT * FROM user_labs WHERE user_id = ? AND lab_id = ? AND completed = 1').get(req.user.id, req.params.id);
  if (existing) return res.json({ message: 'Already completed', points: 0 });

  const user_lab = db.prepare('SELECT attempts FROM user_labs WHERE user_id = ? AND lab_id = ?').get(req.user.id, req.params.id);
  const attempts = (user_lab?.attempts || 0) + 1;

  if (flag === lab.flag) {
    db.prepare('INSERT OR REPLACE INTO user_labs (user_id, lab_id, completed, flag_submitted, attempts, time_spent, completed_at) VALUES (?, ?, 1, ?, ?, ?, ?)').run(req.user.id, req.params.id, flag, attempts, time_spent, new Date().toISOString());
    db.prepare('UPDATE users SET points = points + ?, labs_completed = labs_completed + 1 WHERE id = ?').run(lab.points, req.user.id);

    // Team points
    const user = db.prepare('SELECT team_id FROM users WHERE id = ?').get(req.user.id);
    if (user.team_id) db.prepare('UPDATE teams SET points = points + ? WHERE id = ?').run(lab.points, user.team_id);

    checkAchievements(req.user.id);
    io.emit('lab_completed', { user_id: req.user.id, username: req.user.username, lab_id: req.params.id, points: lab.points, lab_name: lab.name });
    res.json({ message: 'Correct! Well done!', points: lab.points });
  } else {
    db.prepare('INSERT OR IGNORE INTO user_labs (user_id, lab_id, attempts) VALUES (?, ?, ?)').run(req.user.id, req.params.id, attempts);
    db.prepare('UPDATE user_labs SET attempts = attempts + 1, time_spent = time_spent + ? WHERE user_id = ? AND lab_id = ?').run(time_spent, req.user.id, req.params.id);
    res.json({ message: 'Incorrect flag', attempts });
  }
});

app.get('/api/labs/progress', auth, (req, res) => {
  const progress = db.prepare('SELECT ul.*, l.name, l.points, l.difficulty, l.category FROM user_labs ul JOIN labs l ON ul.lab_id = l.id WHERE ul.user_id = ?').all(req.user.id);
  res.json(progress);
});

function checkAchievements(userId) {
  const user = db.prepare('SELECT points, labs_completed FROM users WHERE id = ?').get(userId);
  const achievements = db.prepare('SELECT * FROM achievements WHERE id NOT IN (SELECT achievement_id FROM user_achievements WHERE user_id = ?)').all(userId);
  achievements.forEach(a => {
    if ((a.points_required > 0 && user.points >= a.points_required) || (a.labs_required > 0 && user.labs_completed >= a.labs_required)) {
      db.prepare('INSERT OR IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)').run(userId, a.id);
    }
  });
}

// ============ TERMINALS ============
app.post('/api/terminals', auth, async (req, res) => {
  const { labId, cols = 80, rows = 30 } = req.body;
  const termId = uuidv4();
  let container = null;

  if (docker && labId) {
    const lab = db.prepare('SELECT * FROM labs WHERE id = ?').get(labId);
    if (lab?.docker_image) {
      try {
        container = await docker.createContainer({
          Image: lab.docker_image, name: `blue-team-${termId}`, Tty: true,
          AttachStdin: true, AttachStdout: true, AttachStderr: true,
          Cmd: ['/bin/bash'], Env: ['FLAG=' + lab.flag],
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

  terminals.set(termId, { pty: ptyProcess, userId: req.user.id, containerId: container?.id, labId });
  db.prepare('INSERT INTO terminals (id, user_id, container_id, lab_id) VALUES (?, ?, ?, ?)').run(termId, req.user.id, container?.id, labId);
  io.emit('terminal_created', { user: req.user.username, lab_id: labId });
  res.json({ id: termId, shell, hasContainer: !!container });
});

app.delete('/api/terminals/:id', auth, async (req, res) => {
  const term = terminals.get(req.params.id);
  if (term) { term.pty.kill(); terminals.delete(req.params.id); }
  const container = containers.get(req.params.id);
  if (container) { try { await container.stop(); await container.remove(); } catch {} containers.delete(req.params.id); }
  db.prepare('DELETE FROM terminals WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

// ============ WEBSOCKET ============
const wss = new WebSocket.Server({ port: 8080 });
wss.on('connection', (ws, req) => {
  const url = new URL(req.url, 'http://localhost');
  const token = url.searchParams.get('token'), termId = url.searchParams.get('id');
  if (!token || !termId) return ws.close(1008);
  let decoded;
  try { decoded = jwt.verify(token, JWT_SECRET); } catch { return ws.close(1008); }
  const term = terminals.get(termId);
  if (!term || term.userId !== decoded.id) return ws.close(1008);

  console.log(`[+] ${decoded.username} connected`);
  ws.send('\x1b[32m╔═══════════════════════════════════════════════════╗\r\n║      Blue Team Lab Platform - Interactive Terminal       ║\r\n╚═══════════════════════════════════════════════════╝\x1b[0m\r\n\r\n');
  term.pty.onData = (data) => { if (ws.readyState === WebSocket.OPEN) ws.send(data); };
  ws.on('message', (msg) => term.pty.write(msg.toString()));
  ws.on('close', () => console.log(`[-] ${decoded.username} disconnected`));
});

// Socket.IO
io.on('connection', (socket) => {
  socket.on('disconnect', () => {});
});

app.get('/api/users/leaderboard', (req, res) => {
  res.json(db.prepare('SELECT id, username, points, labs_completed, avatar, team_id FROM users ORDER BY points DESC LIMIT 50').all());
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '4.0.0', production: IS_PRODUCTION, docker: docker ? 'available' : 'unavailable' });
});

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║        Blue Team Lab Platform - Phase 4 (Production)       ║
╠═══════════════════════════════════════════════════════════════╣
║  Version: 4.0.0 (Production Ready                         ║
║  Port: ${PORT}                                                 ║
║  Mode: ${IS_PRODUCTION ? 'PRODUCTION' : 'DEVELOPMENT'}                                  ║
╚═══════════════════════════════════════════════════════════════╝
`);

app.listen(PORT, () => console.log(`[+] Server running on port ${PORT}`));