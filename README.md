# 🛡️ Blue Team Platform

> A self-hosted, TryHackMe-style **cyber security training platform** focused on defensive (Blue Team) skills — SOC analysis, log forensics, phishing triage, memory forensics, SIEM/Splunk querying, and malware triage.
>
> Built as a full-stack project to demonstrate both **security domain knowledge** and **software engineering** capability.

### 🌐 [**► Live Demo**](https://blue-team-platform-ecru.vercel.app) &nbsp;·&nbsp; [Source](https://github.com/einungol/blue-team-platform)

> Try it: register an account → open **Terminal Labs** → type `ls`, then `grep /login access.log`.
> _(Backend runs on Render's free tier and may take ~30s to wake on first request.)_

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss)

---

## 📖 Why I built this

Most people learning Blue Team skills bounce between TryHackMe, LetsDefend, and Blue Team Labs. I wanted to **understand how those platforms work by building one** — and in the process, create realistic, hands-on defensive-security challenges from scratch.

Every challenge ships with **real forensic artifacts** (Windows Event Logs, phishing `.eml` files, Zeek network logs, Volatility memory output) that you analyze to find the answer — no hand-holding, just like a real SOC investigation.

---

## ✨ Features

### 🎯 Two ways to learn

| Mode | What it is |
|------|------------|
| **Rooms** (guided) | THM-style rooms: read real artifacts → answer questions step-by-step. Server-checked answers, hints, per-question scoring, progress tracking. |
| **Terminal Labs** (hands-on) | A **simulated Linux terminal** running in the browser. You type real shell commands (`grep`, `cat`, `cut`, `sort`, pipes) against a virtual filesystem to investigate logs and capture the flag — no Docker, no risk to the host. |

### 📚 Content (6 Rooms + 2 Terminal Labs, 34+ questions)

| Room | Skill | Artifacts |
|------|-------|-----------|
| Log Analysis: Brute Force Hunt | SIEM / Windows Event Logs | Security log (4625/4624/4688/4720) |
| Phishing Triage: The PayPal Lure | Email header analysis, IOC extraction | Raw `.eml`, SPF/DKIM/DMARC |
| Network Forensics: C2 Beacon | Threat hunting, beaconing detection | Zeek `conn.log` + `dns.log` |
| Memory Forensics: Catch the Implant | DFIR, process masquerading | Volatility 3 (pslist/netscan/cmdline) |
| SIEM Detective: Splunk Queries | Detection engineering, SPL | Web access events |
| Malware Triage: Static Analysis | Static analysis, packing, IOCs | PE metadata + string triage report |

### 🏆 Platform features
- **JWT authentication** (register / login / profile)
- **Achievements** — 8 badges auto-awarded on points/completion thresholds
- **Leaderboard** — global player ranking
- **Teams** — create/join teams, shared score
- **Progress tracking** — per-question, per-room, resumable

---

## 🏗️ Architecture

```
┌────────────────────────┐         ┌──────────────────────────────┐
│   webapp/ (Next.js 16) │  HTTP   │   server/ (Express + sql.js)  │
│                        │ ──────▶ │                              │
│  • App Router          │  REST   │  • JWT auth (bcrypt)         │
│  • Tailwind + Radix UI │ ◀────── │  • Rooms engine              │
│  • Zustand state       │  JSON   │  • Terminal interpreter (VFS)│
│  • In-browser terminal │         │  • SQLite (sql.js) storage   │
└────────────────────────┘         └──────────────────────────────┘
        :3000                                  :3001
```

### Tech stack
| Layer | Tech |
|-------|------|
| Frontend | Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict), Tailwind CSS 4, Radix UI, Zustand |
| Backend | Node.js, Express, JWT, bcrypt, sql.js (SQLite) |
| Content | Self-authored artifacts + a safe, sandboxed command interpreter |

### Security-conscious design
- **Answers/flags never leave the server** — the client only receives prompts; grading happens server-side.
- **Simulated terminal is sandboxed** — a whitelist-only command interpreter over an in-memory virtual filesystem. It cannot touch the real OS or filesystem.
- **Parameterized SQL** throughout (no string interpolation in queries).
- **JWT-gated** mutating endpoints.

---

## 🚀 Getting started

### Prerequisites
- Node.js 18+

### 1. Backend
```bash
cd server
npm install
node index.js          # → http://localhost:3001
```

### 2. Frontend
```bash
cd webapp
npm install
cp .env.example .env.local     # sets NEXT_PUBLIC_API_URL
npm run dev            # → http://localhost:3000
```

Open **http://localhost:3000**, register an account, and start with the **Terminal Labs** or **Rooms**.

---

## ☁️ Deployment

The app is split so each half deploys to a free tier:

| Part | Host | Notes |
|------|------|-------|
| `webapp/` | **Vercel** | Set env `NEXT_PUBLIC_API_URL` to your API URL |
| `server/` | **Render** | Uses `render.yaml` blueprint; set `CORS_ORIGIN` to your Vercel URL |

### Backend (Render)
1. Push to GitHub → [render.com](https://render.com) → **New → Blueprint** → pick this repo (`render.yaml` is detected).
2. After it deploys, copy the service URL (e.g. `https://blue-team-platform-api.onrender.com`).
3. Set `CORS_ORIGIN` env var to your Vercel frontend URL.

> Render's free tier sleeps after 15 min idle and uses an ephemeral disk — the SQLite DB re-seeds its rooms/labs on restart, which is fine for a demo.

### Frontend (Vercel)
1. [vercel.com](https://vercel.com) → **New Project** → import this repo → set **Root Directory** to `webapp`.
2. Add env var `NEXT_PUBLIC_API_URL` = your Render API URL.
3. Deploy.

---

## 🗂️ Project structure

```
blue-team-platform/
├── server/
│   ├── index.js                     # Express app: auth, rooms, interactive, teams, achievements
│   └── content/
│       ├── rooms.js                 # 6 guided rooms + answer checker (answers stripped for client)
│       └── interactive-labs.js      # VFS + safe shell interpreter for terminal labs
└── webapp/
    └── src/
        ├── app/                     # App Router pages (dashboard, rooms, interactive, ...)
        ├── components/              # Sidebar, Markdown renderer, UI primitives
        ├── contexts/AuthContext.tsx # Auth state
        ├── lib/api.ts               # Typed API client
        └── stores/                  # Zustand stores
```

---

## 🧠 What I learned

- Designing **realistic Blue Team scenarios** that teach a specific skill (brute-force detection, C2 beaconing, process masquerading, phishing IOCs).
- Building a **safe command interpreter** — parsing pipelines, implementing `grep`/`cut`/`sort`/`wc` semantics over a VFS without ever shelling out.
- **Server-authoritative grading** so challenges can't be trivially solved by reading the client payload.
- Full-stack delivery: typed API client, auth flow, state management, and a polished terminal UI.

---

## 🗺️ Roadmap

- [ ] More rooms (Active Directory attacks, cloud forensics, ransomware IR)
- [ ] Learning paths (SOC Analyst Tier 1 → Tier 2)
- [ ] Writeups / solutions after completion
- [ ] Optional Docker-backed labs for full offensive scenarios
- [ ] Deploy (Postgres + cloud hosting)

---

## 📄 License

MIT — built for learning and as a portfolio piece.
