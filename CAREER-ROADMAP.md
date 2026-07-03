# 🎯 Blue Team Career Roadmap (เริ่มจากศูนย์ → Remote SOC Job)

> เป้าหมาย: หางาน **Cybersecurity สาย Blue Team** (SOC Analyst / Security Monitoring) — ถ้าได้ **remote** ยิ่งดี
> จุดเริ่มต้น: เริ่มจากศูนย์ · ลงทุนเต็มที่ · ไม่รีบ (เน้นพื้นฐานแน่น ~9–12 เดือน)
> สร้างเมื่อ: 2026-07-03

---

## ⚠️ 3 ความจริงที่ต้องยึด (จากบทความ AI-era + Motasem + SOC Roadmap 2026)

1. **AI กำลัง disrupt Tier-1 SOC** → เล็ง judgment-heavy skills (threat hunting, detection engineering, IR) ตั้งแต่แรก อย่าหยุดที่ "triage alert ซ้ำๆ"
2. **Remote junior หายาก** → ต้องโดดเด่นด้วย **portfolio + personal brand** (LinkedIn/GitHub)
3. **อย่าติดกับดักเลือก platform ให้ perfect** → "The best platform is the one you open tomorrow morning" ลงมือทำสำคัญกว่าเปรียบเทียบ

---

## 📅 Timeline ภาพรวม

```
เดือน 1–3   FOUNDATIONS      Linux · Network · Logs
เดือน 3–6   SOC L1 + CERT#1  Security+ / BTL1 · เริ่ม portfolio
เดือน 6–9   SOC L2 + SPEC    Threat Hunting/Detection · เริ่มสมัคร
เดือน 9–12  CLOUD + CERT#2   Cloud SOC · สัมภาษณ์จริง
```

---

## 🧱 PHASE 1 — Foundations (เดือน 1–3) — ห้ามข้าม

- [ ] **Linux CLI** คล่อง: `ls cd cat grep awk sed cut sort uniq ps top netstat chmod`
  - 👉 ฝึกใน **Terminal Labs ของ platform เราเอง** (`/interactive`)
- [ ] **Networking**: OSI/TCP-IP, IP, ports, DNS, HTTP/S, TCP vs UDP, firewall
- [ ] **Windows logs**: Event ID 4624 (login), 4625 (fail), 4688 (process), 4720 (user created)
- [ ] **Linux logs**: `/var/log/auth.log`, `/var/log/syslog`, ssh/sudo activity
- [ ] TryHackMe **Pre-Security path** (ฟรี) — เริ่มวันนี้

**เช็คพอยต์:** อ่าน access.log / auth.log แล้วบอก attacker IP ได้เองด้วย grep

---

## 🎓 PHASE 2 — SOC L1 + Cert แรก (เดือน 3–6)

- [ ] TryHackMe **SOC Level 1 path** (หรือ HTB SOC Analyst path — เลือกอันเดียว)
- [ ] เรียนรู้: SIEM (Splunk/ELK), Cyber Kill Chain, MITRE ATT&CK, Phishing analysis, Malware concepts
- [ ] **Cert #1** — เลือกลำดับ:
  - [ ] **CompTIA Security+** (~$400) — ผ่านด่าน HR/ATS filter (ไทย & ต่างชาติชอบ)
  - [ ] **BTL1** (Blue Team Level 1, ~$500) — 🥇 cert Blue Team ที่ HR รู้จักสุด, สอบ 24 ชม. hands-on

**เช็คพอยต์:** สอบผ่าน Security+ หรือ BTL1 + ทำ platform นี้ให้ demo ได้

---

## 🔬 PHASE 3 — SOC L2 + Specialization (เดือน 6–9)

เลือก 1 specialization ที่ AI แทนยาก:
- [ ] **Threat Hunting** ⭐ (proactive, ต้องใช้ intuition — AI แทนยากสุด)
- [ ] **Detection Engineering** (เขียน rule ที่ Tier-1 ใช้ — Splunk SPL, Sigma)
- [ ] **DFIR** (forensics + incident response)

- [ ] TryHackMe **SOC Level 2 path** (advanced Splunk, threat hunting, detection eng)
- [ ] **เริ่มสมัครงาน** ควบคู่ (ไม่ต้องรอ "พร้อม 100%")

---

## ☁️ PHASE 4 — Cloud SOC + Cert สอง (เดือน 9–12)

- [ ] **Cloud SOC** (AWS/Azure/GCP log analysis) — differentiator ที่ curriculum ส่วนใหญ่ข้าม
- [ ] CyberDefenders cloud forensics labs
- [ ] **Cert #2** (เลือกตามสาย): CDSA (HTB), หรือ cloud cert (AWS Security)

---

## 💼 3 GitHub Projects สำหรับ Portfolio

- [x] **1. Blue Team Platform** (โปรเจกต์นี้) — full-stack + SOC domain → junior น้อยคนทำได้
- [ ] **2. Home SOC Lab** — Splunk/ELK + Sysmon + log ingestion (ref: `Awesome-Splunk-and-Elastic-SIEM-Practice-Labs`)
- [ ] **3. Incident Response Writeups** — วิเคราะห์ case + เขียน report แบบมี judgment (ref: `Incident-Response-Projects-for-Beginners`)

**GitHub refs ที่รวบรวมไว้:**
- byteoverride/cybersecurity-analyst-portfolio
- Ak-cybe/soc-roadmap-2026
- 0xrajneesh/{Splunk,Log-Analysis,Windows-Forensics,Malware-Analysis}-Projects-for-Beginners
- ChickenLoner/Awesome-Splunk-and-Elastic-SIEM-Practice-Labs

---

## 🌏 หางาน Remote Blue Team

**ตำแหน่งเริ่มต้น:** SOC Analyst Tier 1 · Security Monitoring Analyst · Cyber Defense Analyst

**หาที่ไหน:**
- [ ] LinkedIn (filter "Remote") — ตั้ง "Open to work"
- [ ] Wellfound, We Work Remotely, RemoteOK (filter security)
- [ ] **MSSP** (Managed Security Service Providers) — จ้าง remote SOC เยอะสุด, 24/7 shift
- [ ] ไทย: on-site 6–12 เดือนก่อน → remote ง่ายขึ้น

**Personal brand (สำคัญมากสำหรับ remote):**
- [ ] LinkedIn post สัปดาห์ละครั้ง (incident breakdown, tool ที่ลอง, lesson learned)
- [ ] GitHub portfolio + pin 3 projects ข้างบน
- [ ] Resume: ระบุว่าใช้ AI (Copilot/Claude) ใน workflow ได้ ("Partner with AI")

---

## 🎤 เตรียมสัมภาษณ์ (ทำจาก platform นี้ได้เลย)

- [ ] อธิบายได้ว่า brute-force ต่างจาก password spraying ยังไง (Room 1)
- [ ] อ่าน email header บอก SPF/DKIM/DMARC + typosquat ได้ (Room 2)
- [ ] อธิบาย C2 beaconing + หายังไงใน conn.log (Room 3)
- [ ] เขียน SPL query ตรวจ brute force ได้ (Room 5)
- [ ] เล่า project นี้: ทำไมสร้าง, เจอปัญหาอะไร, แก้ยังไง (แสดง judgment)

---

## ✅ Job-Ready Checklist (จบเมื่อทำครบ)

- [ ] อ่าน log (Windows + Linux) แล้ว identify attack ได้เอง
- [ ] ใช้ Linux CLI คล่อง
- [ ] อ่าน network traffic (Wireshark filter) เป็น
- [ ] เข้าใจ SOC workflow (alert → triage → investigate → escalate → document)
- [ ] เขียน incident report ได้
- [ ] มี cert อย่างน้อย 1 (Security+ หรือ BTL1)
- [ ] มี 3 GitHub projects + LinkedIn active
```
```
