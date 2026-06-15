# Phase 3: Advanced Features

> Admin Dashboard, Achievements, Real-time Events, User Profiles

---

## 📋 What's New in Phase 3

| Feature | Description |
|---------|-------------|
| **Achievements System** | 8 achievement badges (Bronze/Silver/Gold) |
| **Admin Dashboard** | User management, lab CRUD, statistics |
| **Real-time Events** | Socket.IO for live updates |
| **User Profiles** | Avatar, bio, statistics |
| **Hints System** | In-lab hints for challenges |
| **Attempt Tracking** | Track failed attempts per lab |

---

## 🚀 Setup

### 1. Install Dependencies

```bash
cd server
npm install socket.io
```

### 2. Start Server

```bash
node index.js
```

### 3. Open Client

```
เปิด client/index.html ใน browser
```

---

## 🏆 Achievements

| Name | Description | Type |
|------|-------------|------|
| First Blood | Complete 1 lab | Bronze |
| Blue Analyst | Earn 50 points | Bronze |
| SOC Specialist | Earn 100 points | Silver |
| Threat Hunter | Earn 250 points | Silver |
| Detection Engineer | Earn 500 points | Gold |
| Lab Hunter | Complete 5 labs | Bronze |
| Lab Master | Complete 10 labs | Silver |
| Blue Legend | Complete 20 labs | Gold |

---

## 👨‍💻 Admin Features

### Access
Login with admin role to access admin panel.

### Stats Dashboard
- Total Users
- Total Labs
- Total Completions
- Active Terminals

### Lab Management
- Create new labs
- Edit existing labs
- Delete labs
- View all submissions

### API Endpoints
```
GET  /api/admin/stats     - Dashboard statistics
GET  /api/admin/users     - All users
GET  /api/admin/labs      - All labs
POST /api/admin/labs      - Create lab
PUT  /api/admin/labs/:id  - Update lab
DELETE /api/admin/labs/:id - Delete lab
GET  /api/admin/logs      - Admin activity logs
```

---

## 🔔 Real-time Events (Socket.IO)

### Server Events
```javascript
// When lab is completed
io.emit('lab_completed', { user_id, lab_id, points });

// When achievements earned
io.emit('achievements_earned', { user_id, achievements });

// When terminal created
io.emit('terminal_created', { user, lab_id });

// When lab created/updated
io.emit('lab_created', { id, name });
io.emit('lab_updated', { id });
```

### Client Usage
```javascript
const socket = io(API_URL);

socket.on('lab_completed', data => {
  console.log('Lab completed! Points:', data.points);
});

socket.on('achievements_earned', data => {
  console.log('New achievements:', data.achievements);
});
```

---

## 📊 User Profile

### Update Profile
```javascript
PUT /api/auth/profile
{
  "avatar": "🎯",
  "bio": "Aspiring SOC Analyst"
}
```

### Get User Profile
```javascript
GET /api/users/:id
// Returns: username, points, labs_completed, avatar, bio, achievements, completed_labs
```

---

## 🎮 Features Demo

### 1. Complete a Lab
- Find lab in catalog
- Click "Start Lab"
- Solve the challenge
- Submit flag
- Earn points + achievements

### 2. Check Achievements
- Go to Achievements tab
- See earned badges
- Progress toward next achievements

### 3. Admin Management
- Login as admin
- Go to Admin tab
- View stats
- Create/edit/delete labs

### 4. Real-time Updates
- Complete a lab
- Watch leaderboard update instantly
- See achievements notification

---

## 🔧 Configuration

### Database
- SQLite file: `blue-team.db`
- Auto-creates tables on first run
- Seeded with 8 labs and 8 achievements

### Docker (Optional)
- Create network: `docker network create blue-team-network`
- Container isolation per lab

### JWT
- Token expires in 7 days
- Secret: Change `JWT_SECRET` in production

---

## 📝 Next Steps

### Phase 4: Platform Polish
- [ ] Lab time limits
- [ ] Team challenges
- [ ] Discussion forums
- [ ] Email notifications
- [ ] Docker image manager
- [ ] Public/private labs

---

**Phase:** 3/4
**Status:** Complete

**Back to:** [Main Guide](../BLUE-TEAM-PLATFORM-GUIDE.md)