# Phase 4: Platform Polish & Production Ready

> Final polish with production configuration, teams, Docker image management

---

## 📋 What's New in Phase 4

| Feature | Description |
|---------|-------------|
| **Teams System** | Create/join teams, team leaderboard |
| **Docker Image Manager** | Admin can manage available Docker images |
| **Production Config** | Environment variables, production mode |
| **Improved UI** | Modern dark theme with animations |
| **Better Stats** | Comprehensive admin dashboard |
| **Lab Filtering** | Filter by difficulty |

---

## 🚀 Setup for Production

### 1. Environment Variables

```bash
# Create .env file
cat > .env << 'EOF'
PORT=3001
JWT_SECRET=your-super-secret-key-change-this
NODE_ENV=production
EOF
```

### 2. Run in Production

```bash
# Install dependencies
npm install

# Start server
node index.js

# Or use PM2 for production
npm install -g pm2
pm2 start index.js --name blue-team-lab
```

### 3. Docker Setup (Optional)

```bash
# Create isolated network
docker network create blue-team-network

# Run with Docker
docker run -d -p 3001:3001 -p 8080:8080 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v $(pwd)/blue-team.db:/data/blue-team.db \
  --network blue-team-network \
  blue-team-platform
```

---

## 👥 Teams Feature

### Create Team
```javascript
POST /api/teams
{
  "name": "Blue Team Thailand",
  "description": "We love blue team!"
}
```

### Join Team
```javascript
POST /api/teams/:id/join
```

### Team Leaderboard
Teams compete together, points are combined!

---

## 🐳 Docker Image Manager

### Available Images
| Name | Image | Category |
|------|-------|----------|
| DVWA | sagikazarmark/dvwa | Web |
| OWASP Juice Shop | bkimminich/juice-shop | Web |
| Metasploitable | rapid7/metasploitable3 | Pentest |
| Kali Linux | kalilinux/kali-rolling | Pentest |

### Add Custom Image
```javascript
POST /api/admin/docker-images
{
  "name": "My Custom Lab",
  "image": "my-image:latest",
  "description": "Custom vulnerable app",
  "category": "blue"
}
```

---

## ⚙️ Production Checklist

- [ ] Change JWT_SECRET
- [ ] Set NODE_ENV=production
- [ ] Use reverse proxy (Nginx)
- [ ] Enable SSL/HTTPS
- [ ] Setup backups for database
- [ ] Configure firewall
- [ ] Setup monitoring

---

## 📊 Complete Feature List (All Phases)

| Feature | Phase |
|---------|-------|
| Web Terminal | 1 |
| User Auth | 2 |
| Lab System | 2 |
| Points/Leaderboard | 2 |
| Docker Isolation | 2 |
| Achievements | 3 |
| Admin Dashboard | 3 |
| Real-time Events | 3 |
| Teams | 4 |
| Docker Manager | 4 |
| Production Config | 4 |
| Modern UI | 4 |

---

## 🔧 API Summary

### Public
```
GET  /api/labs              - List labs
GET  /api/users/leaderboard - Leaderboard
GET  /api/teams            - Teams
GET  /api/health            - Health check
```

### Authenticated
```
POST /api/auth/register     - Register
POST /api/auth/login       - Login
GET  /api/auth/me           - My profile
PUT  /api/auth/profile     - Update profile
GET  /api/labs/progress    - My progress
POST /api/labs/:id/flag   - Submit flag
POST /api/terminals        - Create terminal
DELETE /api/terminals/:id  - Delete terminal
POST /api/teams           - Create team
POST /api/teams/:id/join  - Join team
```

### Admin
```
GET  /api/admin/stats      - Dashboard stats
GET  /api/admin/labs      - All labs
POST /api/admin/labs       - Create lab
PUT  /api/admin/labs/:id   - Update lab
DELETE /api/admin/labs/:id - Delete lab
GET  /api/admin/docker-images
POST /api/admin/docker-images
DELETE /api/admin/docker-images/:id
```

---

## 🎯 Platform Complete!

Your Blue Team Lab Platform is ready!

```
🌐 http://localhost:3001
💻 ws://localhost:8080
📊 API: http://localhost:3001/api
```

---

**Phase:** 4/4 - Complete!
**Version:** 4.0.0

**Back to:** [Main Guide](../BLUE-TEAM-PLATFORM-GUIDE.md)