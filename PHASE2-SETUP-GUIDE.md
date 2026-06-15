# Phase 2: User Management + Docker Integration

> สร้าง Platform ที่มี User Authentication และ Docker Isolation

---

## 📋 Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Phase 2 Architecture                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐     ┌──────────────┐     ┌─────────────┐ │
│  │   Client    │────▶│   Server     │────▶│  Database   │ │
│  │  (React/   │     │  (Express    │     │  (SQLite)   │ │
│  │   HTML)     │     │  + JWT Auth) │     │             │ │
│  └─────────────┘     └──────┬───────┘     └─────────────┘ │
│                               │                             │
│                        ┌──────┴───────┐                     │
│                        │              │                      │
│                   ┌────▼─────┐   ┌────▼──────┐               │
│                   │ WebSocket│   │  Docker   │               │
│                   │  Server  │   │   API     │               │
│                   └────┬─────┘   └────┬──────┘               │
│                        │              │                      │
│                   ┌────▼──────────────▼────┐                 │
│                   │    Isolation Layer      │                 │
│                   │  ┌────┐ ┌────┐ ┌────┐  │                 │
│                   │  │ Lab│ │ Lab│ │ Lab│  │                 │
│                   │  │Container│ │Container│ │                 │
│                   │  └────┘ └────┘ └────┘  │                 │
│                   └─────────────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗂️ What's New in Phase 2

| Feature | Description |
|---------|-------------|
| **User Authentication** | Register, Login, JWT tokens |
| **Database** | SQLite with users, labs, progress |
| **Labs System** | Challenge management, flags, points |
| **Leaderboard** | User rankings by points |
| **Docker Integration** | Isolated containers per lab |
| **Progress Tracking** | Track completed labs |

---

## 🚀 Setup

### 1. Update Dependencies

```bash
cd server
npm install better-sqlite3 bcryptjs jsonwebtoken dockerode cors
```

### 2. Start Server

```bash
cd server
node index.js
```

### 3. Open Client

```
เปิด client/index.html ใน browser
```

---

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/register     - สมัครสมาชิก
POST   /api/auth/login        - เข้าสู่ระบบ
GET    /api/auth/me          - ข้อมูล user ปัจจุบัน
```

### Labs
```
GET    /api/labs             - รายชื่อ labs ทั้งหมด
GET    /api/labs/:id         - รายละเอียด lab
POST   /api/labs             - สร้าง lab ใหม่ (admin)
POST   /api/labs/:id/flag    - ส่ง flag
GET    /api/labs/progress    - ความก้าวหน้าของ user
```

### Terminal
```
POST   /api/terminals        - สร้าง terminal ใหม่
GET    /api/terminals        - รายชื่อ terminals
DELETE /api/terminals/:id    - ลบ terminal
```

### Users
```
GET    /api/users/leaderboard - ตารางอันดับ
```

---

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  password TEXT,
  role TEXT DEFAULT 'user',
  points INTEGER DEFAULT 0
);
```

### Labs Table
```sql
CREATE TABLE labs (
  id INTEGER PRIMARY KEY,
  name TEXT,
  description TEXT,
  difficulty TEXT,
  category TEXT,
  points INTEGER,
  docker_image TEXT,
  flag TEXT
);
```

### User Labs (Progress)
```sql
CREATE TABLE user_labs (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  lab_id INTEGER,
  completed BOOLEAN,
  flag_submitted TEXT,
  completed_at DATETIME
);
```

---

## 🐳 Docker Integration

### Docker Network Setup
```bash
# Create isolated network for labs
docker network create blue-team-network
```

### Container Limits
```javascript
HostConfig: {
  NetworkMode: 'blue-team-network',
  Memory: 512 * 1024 * 1024,  // 512MB limit
  CpuQuota: 50000              // 50% CPU limit
}
```

### Example Lab with Docker
```javascript
const lab = {
  name: 'SQL Injection Challenge',
  docker_image: 'bkimminich/juice-shop',
  flag: 'BLUE{sql_injection_001}'
};
```

---

## 🎮 How to Use

### 1. Register
```
1. เปิด client/index.html
2. กด "Create an account"
3. กรอก username, email, password
4. กด "Create Account"
```

### 2. Start Lab
```
1. เลือก Lab จาก catalog
2. กด "Start Lab"
3. Terminal จะเปิดขึ้นมาพร้อม Docker container
4. แก้โจทย์เพื่อหา flag
```

### 3. Submit Flag
```
1. กดปุ่ม "Submit Flag" หรือใช้ command ใน terminal
2. กรอก flag ใน modal
3. ถ้าถูกต้องจะได้ points
4. อัปเดต leaderboard
```

---

## 🎯 Features Demo

### User Points System
- ทุก lab มี points ตาม difficulty
- Easy: 10 pts, Medium: 20 pts, Hard: 30 pts
- Points สะสมใน profile

### Leaderboard
- แสดงอันดับ user ทั้งหมด
- เรียงตาม points จากมากไปน้อย

### Progress Tracking
- บันทึกว่า lab ไหนทำแล้ว
- ไม่ให้ submit ซ้ำ

### Docker Isolation
- แต่ละ lab มี container แยก
- Resource limits (RAM, CPU)
- Network isolation

---

## 🔧 Troubleshooting

### Docker not available
```
[!] Docker not available: ...
```
**Solution:** Docker daemon ไม่ได้รัน หรือ permission ไม่ถูกต้อง

### Database locked
```
Error: SQLITE_BUSY: database locked
```
**Solution:** ปิด processes อื่นที่ใช้ database หรือลบไฟล์ .db แล้วรันใหม่

### WebSocket connection failed
```
Failed to connect to WebSocket
```
**Solution:** ตรวจสอบว่า port 8080 ว่าง

---

## 📝 Next Steps

### Phase 3: Advanced Features
- [ ] Real-time lab status
- [ ] Lab categories
- [ ] User profiles
- [ ] Docker image management
- [ ] Challenge hints
- [ ] Timed challenges

### Phase 4: Platform Polish
- [ ] Admin dashboard
- [ ] Lab creation UI
- [ ] User statistics
- [ ] Achievement badges
- [ ] Email notifications

---

**Phase:** 2/4
**Status:** Ready to Test

**Back to:** [Main Guide](../BLUE-TEAM-PLATFORM-GUIDE.md)