const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const initSqlJs = require('sql.js');
const fs = require('fs');
const roomsContent = require('./content/rooms');
const interactiveLabs = require('./content/interactive-labs');
const learningPaths = require('./content/paths');

const app = express();
const server = http.createServer(app);

// CORS: allow the deployed frontend origin (comma-separated list) or all in dev.
const ALLOWED_ORIGINS = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
  : '*';

const io = new Server(server, { cors: { origin: ALLOWED_ORIGINS } });
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'blue-team-secret-key-change-in-production';
// On ephemeral hosts (Render free tier) the disk is wiped on restart; default to
// a writable temp path so the app still runs and re-seeds its content.
const DB_PATH = process.env.DB_PATH || './blue-team.db';

// Initialize SQL.js
let db;

async function initDB() {
  const SQL = await initSqlJs();

  try {
    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }
  } catch (e) {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      points INTEGER DEFAULT 0,
      labs_completed INTEGER DEFAULT 0,
      avatar TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      team_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      leader_id INTEGER,
      points INTEGER DEFAULT 0,
      members_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
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
      is_public INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS user_labs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      lab_id INTEGER NOT NULL,
      completed INTEGER DEFAULT 0,
      flag_submitted TEXT,
      attempts INTEGER DEFAULT 0,
      time_spent INTEGER DEFAULT 0,
      completed_at TEXT,
      UNIQUE(user_id, lab_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      points_required INTEGER DEFAULT 0,
      labs_required INTEGER DEFAULT 0,
      badge_type TEXT DEFAULT 'bronze'
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS user_achievements (
      user_id INTEGER NOT NULL,
      achievement_id INTEGER NOT NULL,
      earned_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, achievement_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS docker_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      image TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'blue',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS terminals (
      id TEXT PRIMARY KEY,
      user_id INTEGER,
      container_id TEXT,
      lab_id INTEGER,
      status TEXT DEFAULT 'active',
      created TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Per-question progress for the Rooms system (THM-style)
  db.run(`
    CREATE TABLE IF NOT EXISTS room_progress (
      user_id INTEGER NOT NULL,
      room_id INTEGER NOT NULL,
      question_id TEXT NOT NULL,
      points INTEGER DEFAULT 0,
      answered_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, room_id, question_id)
    )
  `);

  // Seed data
  seedData();
  saveDB();
}

function saveDB() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function query(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    if (params.length > 0) stmt.bind(params);

    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  } catch (e) {
    console.error('Query error:', e);
    return [];
  }
}

function run(sql, params = []) {
  try {
    db.run(sql, params);
    // IMPORTANT: read last_insert_rowid() BEFORE saveDB(), because
    // db.export() (inside saveDB) resets last_insert_rowid() back to 0.
    const lastInsertRowid = db.exec("SELECT last_insert_rowid()")[0]?.values[0]?.[0] || 0;
    saveDB();
    return { lastInsertRowid };
  } catch (e) {
    console.error('Run error:', e);
    return { lastInsertRowid: 0 };
  }
}

function getOne(sql, params = []) {
  const results = query(sql, params);
  return results[0] || null;
}

/**
 * Award any achievements the user now qualifies for.
 * Thresholds: points_required (>= user.points) OR labs_required (>= user.labs_completed).
 * Idempotent — INSERT OR IGNORE prevents duplicates.
 * Returns the list of newly earned achievements.
 */
function checkAchievements(userId) {
  const user = getOne('SELECT points, labs_completed FROM users WHERE id = ?', [userId]);
  if (!user) return [];

  const earnedIds = query('SELECT achievement_id FROM user_achievements WHERE user_id = ?', [userId])
    .map((r) => r.achievement_id);

  const all = query('SELECT * FROM achievements');
  const newly = [];

  for (const a of all) {
    if (earnedIds.includes(a.id)) continue;
    const meetsPoints = a.points_required > 0 && user.points >= a.points_required;
    const meetsLabs = a.labs_required > 0 && user.labs_completed >= a.labs_required;
    if (meetsPoints || meetsLabs) {
      run('INSERT OR IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)', [userId, a.id]);
      newly.push(a);
    }
  }

  if (newly.length) {
    io.emit('achievement_earned', {
      user_id: userId,
      achievements: newly.map((a) => ({ name: a.name, icon: a.icon, badge_type: a.badge_type })),
    });
  }
  return newly;
}

function seedData() {
  const achievements = query('SELECT COUNT(*) as count FROM achievements');
  if (achievements[0]?.count === 0) {
    const achList = [
      { name: 'First Blood', description: 'Complete your first lab', icon: '🎯', points_required: 0, labs_required: 1, badge_type: 'bronze' },
      { name: 'Blue Analyst', description: 'Earn 50 points', icon: '🔵', points_required: 50, labs_required: 0, badge_type: 'bronze' },
      { name: 'SOC Specialist', description: 'Earn 100 points', icon: '🛡️', points_required: 100, labs_required: 0, badge_type: 'silver' },
      { name: 'Threat Hunter', description: 'Earn 250 points', icon: '🎯', points_required: 250, labs_required: 0, badge_type: 'silver' },
      { name: 'Detection Engineer', description: 'Earn 500 points', icon: '🔍', points_required: 500, labs_required: 0, badge_type: 'gold' },
      { name: 'Lab Hunter', description: 'Complete 5 labs', icon: '🏆', points_required: 0, labs_required: 5, badge_type: 'bronze' },
      { name: 'Lab Master', description: 'Complete 10 labs', icon: '👑', points_required: 0, labs_required: 10, badge_type: 'silver' },
      { name: 'Blue Team Legend', description: 'Complete 20 labs', icon: '⭐', points_required: 0, labs_required: 20, badge_type: 'gold' }
    ];
    achList.forEach(a => run('INSERT INTO achievements (name, description, icon, points_required, labs_required, badge_type) VALUES (?, ?, ?, ?, ?, ?)', [a.name, a.description, a.icon, a.points_required, a.labs_required, a.badge_type]));
  }

  const labs = query('SELECT COUNT(*) as count FROM labs');
  if (labs[0]?.count === 0) {
    const labList = [
      { name: 'Log Analysis Basics', description: 'Analyze suspicious logs and find the attacker IP', difficulty: 'easy', category: 'blue', points: 10, flag: 'BLUE{log_analyst_001}', hint: 'Look for failed login attempts with Event ID 4625' },
      { name: 'Malware IOC Extraction', description: 'Extract IOCs (IP, Domain, Hash) from malware sample', difficulty: 'easy', category: 'blue', points: 15, flag: 'BLUE{malware_ioc_002}', hint: 'Check network connections in sandbox' },
      { name: 'SIEM Query Practice', description: 'Write Splunk queries to detect brute force attack', difficulty: 'medium', category: 'blue', points: 20, flag: 'BLUE{siem_queries_003}', hint: 'Use stats and where clauses' },
      { name: 'Phishing Email Analysis', description: 'Analyze phishing email and extract malicious URLs', difficulty: 'easy', category: 'blue', points: 10, flag: 'BLUE{phishing_004}', hint: 'Check email headers and links' },
      { name: 'Network Forensics', description: 'Analyze PCAP and identify C2 beacon traffic', difficulty: 'medium', category: 'blue', points: 20, flag: 'BLUE{network_005}', hint: 'Look for periodic connections with same size' },
      { name: 'YARA Rule Writing', description: 'Create YARA rule to detect the malware', difficulty: 'medium', category: 'blue', points: 25, flag: 'BLUE{yara_rule_006}', hint: 'Look for unique strings in the binary' },
      { name: 'Incident Response', description: 'Respond to a ransomware incident step by step', difficulty: 'hard', category: 'blue', points: 30, flag: 'BLUE{ir_response_007}', hint: 'Follow IR lifecycle: Contain, Eradicate, Recover' },
      { name: 'Memory Forensics', description: 'Analyze memory dump and find hidden process', difficulty: 'hard', category: 'blue', points: 35, flag: 'BLUE{memory_008}', hint: 'Use volatility psscan to find hidden processes' }
    ];
    labList.forEach(l => run('INSERT INTO labs (name, description, difficulty, category, points, flag, hint) VALUES (?, ?, ?, ?, ?, ?, ?)', [l.name, l.description, l.difficulty, l.category, l.points, l.flag, l.hint]));
  }

  const images = query('SELECT COUNT(*) as count FROM docker_images');
  if (images[0]?.count === 0) {
    const imgList = [
      { name: 'DVWA', image: 'sagikazarmark/dvwa', description: 'Damn Vulnerable Web Application', category: 'web' },
      { name: 'OWASP Juice Shop', image: 'bkimminich/juice-shop', description: 'Modern web app security training', category: 'web' },
      { name: 'Metasploitable', image: 'rapid7/metasploitable3', description: 'Vulnerable Linux VM', category: 'pentest' },
      { name: 'Kali Linux', image: 'kalilinux/kali-rolling', description: 'Penetration Testing Linux', category: 'pentest' }
    ];
    imgList.forEach(i => run('INSERT INTO docker_images (name, image, description, category) VALUES (?, ?, ?, ?)', [i.name, i.image, i.description, i.category]));
  }
}

// Middleware — lightweight CORS (no extra dependency)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS === '*') {
    res.header('Access-Control-Allow-Origin', '*');
  } else if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  }
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.json());

// Health / root — friendly JSON so hitting the API root doesn't 404
app.get('/', (req, res) => {
  res.json({ name: 'Blue Team Platform API', status: 'ok', version: '5.0.0' });
});

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

// ============ AUTH ============
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword]);
    const token = jwt.sign({ id: result.lastInsertRowid, username, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: result.lastInsertRowid, username, email, role: 'user', points: 0, labs_completed: 0 } });
  } catch (e) {
    res.status(400).json({ error: 'Username or email exists' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = getOne('SELECT * FROM users WHERE username = ?', [username]);
  if (!user || !await bcrypt.compare(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role, points: user.points, labs_completed: user.labs_completed, avatar: user.avatar, bio: user.bio, team_id: user.team_id } });
});

app.get('/api/auth/me', auth, (req, res) => {
  const user = getOne('SELECT id, username, email, role, points, labs_completed, avatar, bio, team_id, created_at FROM users WHERE id = ?', [req.user.id]);
  const achievements = query('SELECT a.* FROM achievements a JOIN user_achievements ua ON a.id = ua.achievement_id WHERE ua.user_id = ?', [req.user.id]);
  res.json({ ...user, achievements });
});

app.put('/api/auth/profile', auth, (req, res) => {
  const { avatar, bio } = req.body;
  run('UPDATE users SET avatar = COALESCE(?, avatar), bio = COALESCE(?, bio) WHERE id = ?', [avatar, bio, req.user.id]);
  res.json({ message: 'Profile updated' });
});

// ============ TEAMS ============
app.post('/api/teams', auth, (req, res) => {
  const { name, description } = req.body;
  try {
    const result = run('INSERT INTO teams (name, description, leader_id) VALUES (?, ?, ?)', [name, description, req.user.id]);
    run('UPDATE users SET team_id = ? WHERE id = ?', [result.lastInsertRowid, req.user.id]);
    res.json({ id: result.lastInsertRowid, message: 'Team created' });
  } catch (e) { res.status(400).json({ error: 'Team name exists' }); }
});

app.get('/api/teams', (req, res) => {
  const teams = query('SELECT t.*, u.username as leader_name FROM teams t JOIN users u ON t.leader_id = u.id ORDER BY points DESC');
  res.json(teams);
});

app.post('/api/teams/:id/join', auth, (req, res) => {
  const team = getOne('SELECT * FROM teams WHERE id = ?', [req.params.id]);
  if (!team) return res.status(404).json({ error: 'Team not found' });
  run('UPDATE users SET team_id = ? WHERE id = ?', [req.params.id, req.user.id]);
  run('UPDATE teams SET members_count = members_count + 1 WHERE id = ?', [req.params.id]);
  res.json({ message: 'Joined team' });
});

// ============ ADMIN ============
app.get('/api/admin/stats', auth, admin, (req, res) => {
  const users = query('SELECT COUNT(*) as count FROM users')[0]?.count || 0;
  const labs = query('SELECT COUNT(*) as count FROM labs')[0]?.count || 0;
  const completions = query('SELECT COUNT(*) as count FROM user_labs WHERE completed = 1')[0]?.count || 0;
  const terminals = query('SELECT COUNT(*) as count FROM terminals WHERE status = ?', ['active'])[0]?.count || 0;
  const teams = query('SELECT COUNT(*) as count FROM teams')[0]?.count || 0;
  res.json({ users, labs, completions, active_terminals: terminals, teams });
});

app.get('/api/admin/labs', auth, admin, (req, res) => res.json(query('SELECT * FROM labs ORDER BY id')));
app.get('/api/admin/docker-images', auth, admin, (req, res) => res.json(query('SELECT * FROM docker_images')));

app.post('/api/admin/docker-images', auth, admin, (req, res) => {
  const { name, image, description, category } = req.body;
  const result = run('INSERT INTO docker_images (name, image, description, category) VALUES (?, ?, ?, ?)', [name, image, description, category]);
  res.json({ id: result.lastInsertRowid });
});

app.delete('/api/admin/docker-images/:id', auth, admin, (req, res) => {
  run('DELETE FROM docker_images WHERE id = ?', [req.params.id]);
  res.json({ message: 'Deleted' });
});

app.post('/api/admin/labs', auth, admin, (req, res) => {
  const { name, description, difficulty, category, points, docker_image, flag, hint, is_public } = req.body;
  const result = run('INSERT INTO labs (name, description, difficulty, category, points, docker_image, flag, hint, is_public) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [name, description, difficulty, category, points, docker_image, flag, hint, is_public ? 1 : 0]);
  io.emit('lab_created', { id: result.lastInsertRowid, name });
  res.json({ id: result.lastInsertRowid });
});

app.put('/api/admin/labs/:id', auth, admin, (req, res) => {
  const { name, description, difficulty, category, points, flag, hint, is_public } = req.body;
  run('UPDATE labs SET name = ?, description = ?, difficulty = ?, category = ?, points = ?, flag = ?, hint = ?, is_public = ? WHERE id = ?', [name, description, difficulty, category, points, flag, hint, is_public ? 1 : 0, req.params.id]);
  res.json({ message: 'Updated' });
});

app.delete('/api/admin/labs/:id', auth, admin, (req, res) => {
  run('DELETE FROM labs WHERE id = ?', [req.params.id]);
  run('DELETE FROM user_labs WHERE lab_id = ?', [req.params.id]);
  res.json({ message: 'Deleted' });
});

// ============ LABS ============
app.get('/api/labs', (req, res) => {
  const { category, difficulty, search } = req.query;
  let sql = 'SELECT * FROM labs WHERE is_public = 1';
  const params = [];
  if (category) { sql += ' AND category = ?'; params.push(category); }
  if (difficulty) { sql += ' AND difficulty = ?'; params.push(difficulty); }
  if (search) {
    sql += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  sql += ' ORDER BY difficulty, points';
  res.json(query(sql, params));
});

app.get('/api/labs/:id', (req, res) => {
  const lab = getOne('SELECT * FROM labs WHERE id = ?', [req.params.id]);
  if (!lab) return res.status(404).json({ error: 'Lab not found' });
  res.json(lab);
});

app.post('/api/labs/:id/flag', auth, (req, res) => {
  const { flag, time_spent = 0 } = req.body;
  const lab = getOne('SELECT * FROM labs WHERE id = ?', [req.params.id]);
  if (!lab) return res.status(404).json({ error: 'Lab not found' });

  const existing = getOne('SELECT * FROM user_labs WHERE user_id = ? AND lab_id = ? AND completed = 1', [req.user.id, req.params.id]);
  if (existing) return res.json({ message: 'Already completed', points: 0 });

  const user_lab = getOne('SELECT attempts FROM user_labs WHERE user_id = ? AND lab_id = ?', [req.user.id, req.params.id]);
  const attempts = (user_lab?.attempts || 0) + 1;

  if (flag === lab.flag) {
    run('INSERT OR REPLACE INTO user_labs (user_id, lab_id, completed, flag_submitted, attempts, time_spent, completed_at) VALUES (?, ?, 1, ?, ?, ?, ?)', [req.user.id, req.params.id, flag, attempts, time_spent, new Date().toISOString()]);
    run('UPDATE users SET points = points + ?, labs_completed = labs_completed + 1 WHERE id = ?', [lab.points, req.user.id]);

    const user = getOne('SELECT team_id FROM users WHERE id = ?', [req.user.id]);
    if (user?.team_id) run('UPDATE teams SET points = points + ? WHERE id = ?', [lab.points, user.team_id]);

    io.emit('lab_completed', { user_id: req.user.id, username: req.user.username, lab_id: req.params.id, points: lab.points, lab_name: lab.name });
    res.json({ message: 'Correct! Well done!', points: lab.points });
  } else {
    run('INSERT OR IGNORE INTO user_labs (user_id, lab_id, attempts) VALUES (?, ?, ?)', [req.user.id, req.params.id, attempts]);
    run('UPDATE user_labs SET attempts = attempts + 1, time_spent = time_spent + ? WHERE user_id = ? AND lab_id = ?', [time_spent, req.user.id, req.params.id]);
    res.json({ message: 'Incorrect flag', attempts });
  }
});

app.get('/api/labs/progress', auth, (req, res) => {
  const progress = query('SELECT ul.*, l.name, l.points, l.difficulty, l.category FROM user_labs ul JOIN labs l ON ul.lab_id = l.id WHERE ul.user_id = ?', [req.user.id]);
  res.json(progress);
});

// Real-time events (room/lab completions broadcast to connected clients)
io.on('connection', (socket) => {});

// ============ ROOMS (THM-style playable content) ============

// List all rooms as summary cards. If authenticated, include the user's progress.
app.get('/api/rooms', (req, res) => {
  const summaries = roomsContent.rooms.map(roomsContent.toSummary);

  // Optional auth: attach progress if a valid token is present
  const token = req.headers.authorization?.split(' ')[1];
  let userId = null;
  if (token) {
    try { userId = jwt.verify(token, JWT_SECRET).id; } catch { /* ignore */ }
  }

  if (userId) {
    summaries.forEach((s) => {
      const done = query(
        'SELECT COUNT(*) as c, COALESCE(SUM(points),0) as p FROM room_progress WHERE user_id = ? AND room_id = ?',
        [userId, s.id]
      )[0] || { c: 0, p: 0 };
      s.solvedQuestions = done.c;
      s.earnedPoints = done.p;
      s.completed = done.c >= s.totalQuestions;
    });
  }

  res.json(summaries);
});

// Get a single room's full content (answers stripped). Includes user's solved questions.
app.get('/api/rooms/:id', (req, res) => {
  const room = roomsContent.getRoomById(req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const publicRoom = roomsContent.toPublicRoom(room);

  const token = req.headers.authorization?.split(' ')[1];
  let userId = null;
  if (token) {
    try { userId = jwt.verify(token, JWT_SECRET).id; } catch { /* ignore */ }
  }

  if (userId) {
    const solved = query(
      'SELECT question_id, points FROM room_progress WHERE user_id = ? AND room_id = ?',
      [userId, room.id]
    );
    publicRoom.solved = solved.map((s) => s.question_id);
    publicRoom.earnedPoints = solved.reduce((sum, s) => sum + (s.points || 0), 0);
  } else {
    publicRoom.solved = [];
    publicRoom.earnedPoints = 0;
  }

  res.json(publicRoom);
});

// Submit an answer to a single question. Server checks correctness.
app.post('/api/rooms/:id/answer', auth, (req, res) => {
  const { questionId, answer } = req.body;
  const room = roomsContent.getRoomById(req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const question = roomsContent.findQuestion(room, questionId);
  if (!question) return res.status(404).json({ error: 'Question not found' });

  // Already solved? Idempotent, no double points.
  const already = getOne(
    'SELECT 1 FROM room_progress WHERE user_id = ? AND room_id = ? AND question_id = ?',
    [req.user.id, room.id, questionId]
  );
  if (already) {
    return res.json({ correct: true, alreadySolved: true, points: 0 });
  }

  const correct = roomsContent.checkAnswer(question, answer);
  if (!correct) {
    return res.json({ correct: false });
  }

  // Record progress + award points
  run(
    'INSERT OR IGNORE INTO room_progress (user_id, room_id, question_id, points) VALUES (?, ?, ?, ?)',
    [req.user.id, room.id, questionId, question.points]
  );
  run('UPDATE users SET points = points + ? WHERE id = ?', [question.points, req.user.id]);

  // Check if the whole room is now complete -> count as a completed lab
  const solvedCount = query(
    'SELECT COUNT(*) as c FROM room_progress WHERE user_id = ? AND room_id = ?',
    [req.user.id, room.id]
  )[0]?.c || 0;

  let roomCompleted = false;
  if (solvedCount >= room.totalQuestions) {
    roomCompleted = true;
    run('UPDATE users SET labs_completed = labs_completed + 1 WHERE id = ?', [req.user.id]);
    const user = getOne('SELECT team_id FROM users WHERE id = ?', [req.user.id]);
    if (user?.team_id) run('UPDATE teams SET points = points + ? WHERE id = ?', [room.totalPoints, user.team_id]);
    io.emit('room_completed', { user_id: req.user.id, username: req.user.username, room_id: room.id, room_title: room.title });
  }

  // Award any achievements unlocked by the new points / completion
  const newlyEarned = checkAchievements(req.user.id);

  res.json({
    correct: true,
    points: question.points,
    roomCompleted,
    newlyEarned: newlyEarned.map((a) => ({ name: a.name, icon: a.icon, description: a.description, badge_type: a.badge_type })),
  });
});

// All achievements with the current user's earned status
app.get('/api/achievements', (req, res) => {
  const all = query('SELECT * FROM achievements ORDER BY badge_type, points_required, labs_required');

  const token = req.headers.authorization?.split(' ')[1];
  let userId = null;
  if (token) {
    try { userId = jwt.verify(token, JWT_SECRET).id; } catch { /* ignore */ }
  }

  let earnedIds = [];
  if (userId) {
    earnedIds = query('SELECT achievement_id, earned_at FROM user_achievements WHERE user_id = ?', [userId]);
  }
  const earnedMap = Object.fromEntries(earnedIds.map((e) => [e.achievement_id, e.earned_at]));

  res.json(all.map((a) => ({
    ...a,
    earned: a.id in earnedMap,
    earned_at: earnedMap[a.id] || null,
  })));
});

// ============ INTERACTIVE LABS (simulated terminal) ============
app.get('/api/interactive', (req, res) => {
  const summaries = interactiveLabs.labs.map(interactiveLabs.toSummary);

  const token = req.headers.authorization?.split(' ')[1];
  let userId = null;
  if (token) { try { userId = jwt.verify(token, JWT_SECRET).id; } catch { /* ignore */ } }

  if (userId) {
    summaries.forEach((s) => {
      const done = getOne(
        'SELECT 1 FROM room_progress WHERE user_id = ? AND room_id = ? AND question_id = ?',
        [userId, 1000 + s.id, 'flag']
      );
      s.completed = !!done;
    });
  }
  res.json(summaries);
});

app.get('/api/interactive/:id', (req, res) => {
  const lab = interactiveLabs.getLabById(req.params.id);
  if (!lab) return res.status(404).json({ error: 'Lab not found' });
  res.json(interactiveLabs.toPublic(lab));
});

// Run a command against the lab's virtual filesystem (safe, read-only, no host access)
app.post('/api/interactive/:id/exec', auth, (req, res) => {
  const lab = interactiveLabs.getLabById(req.params.id);
  if (!lab) return res.status(404).json({ error: 'Lab not found' });
  const { command } = req.body;
  if (typeof command !== 'string' || command.length > 500) {
    return res.status(400).json({ error: 'Invalid command' });
  }
  const output = interactiveLabs.execCommand(lab, command);
  res.json({ output });
});

// Submit the flag for an interactive lab
app.post('/api/interactive/:id/flag', auth, (req, res) => {
  const lab = interactiveLabs.getLabById(req.params.id);
  if (!lab) return res.status(404).json({ error: 'Lab not found' });
  const { flag } = req.body;

  const roomKey = 1000 + lab.id; // namespace interactive labs in room_progress
  const already = getOne(
    'SELECT 1 FROM room_progress WHERE user_id = ? AND room_id = ? AND question_id = ?',
    [req.user.id, roomKey, 'flag']
  );
  if (already) return res.json({ correct: true, alreadySolved: true, points: 0 });

  if (String(flag || '').trim() !== lab.flag) {
    return res.json({ correct: false });
  }

  run('INSERT OR IGNORE INTO room_progress (user_id, room_id, question_id, points) VALUES (?, ?, ?, ?)',
    [req.user.id, roomKey, 'flag', lab.points]);
  run('UPDATE users SET points = points + ?, labs_completed = labs_completed + 1 WHERE id = ?', [lab.points, req.user.id]);
  const newlyEarned = checkAchievements(req.user.id);
  io.emit('interactive_completed', { user_id: req.user.id, username: req.user.username, lab_id: lab.id, lab_title: lab.title });

  res.json({
    correct: true,
    points: lab.points,
    newlyEarned: newlyEarned.map((a) => ({ name: a.name, icon: a.icon, description: a.description, badge_type: a.badge_type })),
  });
});

// ============ LEARNING PATHS ============
// Resolve a step (room or lab) to a display object with completion status.
function resolveStep(step, roomSolved, labSolved) {
  if (step.kind === 'room') {
    const room = roomsContent.getRoomById(step.ref);
    if (!room) return null;
    return {
      kind: 'room',
      id: room.id,
      href: `/rooms/${room.id}`,
      title: room.title,
      difficulty: room.difficulty,
      points: room.totalPoints,
      tags: room.tags,
      completed: (roomSolved[room.id] || 0) >= room.totalQuestions,
      progress: room.totalQuestions
        ? Math.round(((roomSolved[room.id] || 0) / room.totalQuestions) * 100)
        : 0,
    };
  }
  const lab = interactiveLabs.getLabById(step.ref);
  if (!lab) return null;
  return {
    kind: 'lab',
    id: lab.id,
    href: `/interactive/${lab.id}`,
    title: lab.title,
    difficulty: lab.difficulty,
    points: lab.points,
    tags: lab.tags,
    completed: !!labSolved[lab.id],
    progress: labSolved[lab.id] ? 100 : 0,
  };
}

app.get('/api/paths', (req, res) => {
  // Build lookup of the user's solved counts (rooms) and completed labs.
  const token = req.headers.authorization?.split(' ')[1];
  let userId = null;
  if (token) { try { userId = jwt.verify(token, JWT_SECRET).id; } catch { /* ignore */ } }

  const roomSolved = {};   // roomId -> solved question count
  const labSolved = {};    // labId -> boolean
  if (userId) {
    query('SELECT room_id, COUNT(*) as c FROM room_progress WHERE user_id = ? GROUP BY room_id', [userId])
      .forEach((r) => {
        if (r.room_id >= 1000) labSolved[r.room_id - 1000] = true;
        else roomSolved[r.room_id] = r.c;
      });
  }

  const result = learningPaths.paths.map((p) => {
    const steps = p.steps.map((s) => resolveStep(s, roomSolved, labSolved)).filter(Boolean);
    const done = steps.filter((s) => s.completed).length;
    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      description: p.description,
      icon: p.icon,
      level: p.level,
      totalSteps: steps.length,
      completedSteps: done,
      progress: steps.length ? Math.round((done / steps.length) * 100) : 0,
      steps,
    };
  });

  res.json(result);
});

app.get('/api/users/leaderboard', (req, res) => {
  res.json(query('SELECT id, username, points, labs_completed, avatar, team_id FROM users ORDER BY points DESC LIMIT 50'));
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '5.0.0' });
});

// Start
initDB().then(() => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║             Blue Team Platform - API Server                   ║
╠═══════════════════════════════════════════════════════════════╣
║  Version: 5.0.0                                                ║
║  Port: ${PORT}                                                     ║
╚═══════════════════════════════════════════════════════════════╝
`);
  // Bind 0.0.0.0 so cloud platforms (Render) can route to it.
  server.listen(PORT, '0.0.0.0', () => console.log(`[+] Server running on port ${PORT}`));
}).catch(e => {
  console.error('Failed to initialize DB:', e);
  process.exit(1);
});