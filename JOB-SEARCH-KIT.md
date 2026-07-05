# Job Search Kit — Blue Team / SOC Analyst

> Entry-level, project-first materials for a new grad targeting SOC roles (Thailand + international remote).
> English is used throughout so the same materials work for both markets.

---

## 1. Résumé (entry-level, project-first)

> Fill in the [BRACKETS]. Keep to ONE page. Lead with Projects since you don't have SOC work experience yet — that's expected for entry-level and totally fine.

```
[YOUR FULL NAME]
Aspiring SOC / Blue Team Analyst
📧 jpirasampan@gmail.com · 🔗 linkedin.com/in/[you] · 💻 github.com/einungol · 📍 [City, Thailand] · Open to Remote

──────────────────────────────────────────────────────────────
SUMMARY
──────────────────────────────────────────────────────────────
Motivated cyber security learner focused on defensive operations (SOC,
log analysis, incident response). Built and deployed a full-stack Blue
Team training platform with 17 hands-on labs. Comfortable on the Linux
CLI, reading Windows/Sysmon logs, and mapping activity to MITRE ATT&CK.
Actively pursuing CompTIA Security+ and BTL1.

──────────────────────────────────────────────────────────────
PROJECTS
──────────────────────────────────────────────────────────────
Blue Team Platform — Full-stack SOC training app        [live demo] [github]
• Designed 10 guided rooms + 7 simulated-terminal labs across log analysis,
  phishing, network/C2, memory forensics, SIEM/Splunk, AD attacks,
  ransomware IR, AWS CloudTrail, and Sigma detection engineering.
• Built a sandboxed Linux command interpreter (grep/cut/sort/pipes) over a
  virtual filesystem so users investigate real log artifacts safely.
• Implemented JWT auth, server-side answer grading, achievements, and
  learning paths. Deployed on Vercel (Next.js/TS) + Render (Node/Express).

Home SOC Lab — Splunk/ELK detection lab                        [github]
• [Ingested Windows Sysmon + Linux logs into Splunk/ELK; wrote N detection
   rules for brute force, LOLBins, and suspicious PowerShell; built a
   triage dashboard.]  ← fill in after you build project #2

──────────────────────────────────────────────────────────────
SKILLS
──────────────────────────────────────────────────────────────
Blue Team:  Log Analysis, SIEM (Splunk/ELK), Windows Event Logs, Sysmon,
            Phishing Triage, Network Forensics, Memory Forensics,
            Incident Response, Threat Hunting, MITRE ATT&CK, Sigma
Tools:      Linux CLI, Wireshark, Volatility, AWS CloudTrail, Git
Languages:  Python [level], Bash, TypeScript/JavaScript

──────────────────────────────────────────────────────────────
CERTIFICATIONS  (in progress)
──────────────────────────────────────────────────────────────
• CompTIA Security+            [Target: MM/YYYY]
• BTL1 — Blue Team Level 1     [Target: MM/YYYY]

──────────────────────────────────────────────────────────────
EDUCATION
──────────────────────────────────────────────────────────────
[Degree], [University]                              [Year – Year]
```

**Résumé tips**
- Every bullet = *action verb + what + result/skill*. No fluff.
- Put the **live demo link** on the résumé — recruiters click it.
- Keep it 1 page. ATS-friendly: simple layout, no columns/graphics, save as PDF.
- Mirror keywords from the job post (e.g. "SIEM", "triage", "MITRE ATT&CK").

---

## 2. LinkedIn

**Headline** (pick one):
```
Aspiring SOC Analyst | Blue Team · Log Analysis · SIEM | Building hands-on security projects
```
```
Cyber Security (Blue Team) | SOC Analyst in the making | Security+ & BTL1 in progress
```

**About section:**
```
I'm an aspiring SOC / Blue Team analyst who learns by building and doing.

Rather than only watching courses, I built and deployed a full-stack Blue
Team training platform — 17 hands-on labs covering log analysis, phishing
triage, network and memory forensics, SIEM/Splunk queries, Active Directory
attacks, ransomware incident response, and detection engineering with Sigma.
(Live demo + source on my profile.)

I'm comfortable on the Linux command line, reading Windows and Sysmon logs,
and mapping activity to MITRE ATT&CK. I'm currently working toward CompTIA
Security+ and BTL1, and building a home SOC lab with Splunk/ELK.

I also believe defenders should partner with AI, not compete with it — so
I'm exploring LLM-assisted log triage and IOC extraction.

Open to entry-level SOC / Security Analyst roles (remote-friendly).
Let's connect if you're hiring or building in defensive security.

📧 jpirasampan@gmail.com
```

**LinkedIn checklist**
- [ ] Professional photo + banner
- [ ] Turn on "Open to Work" (SOC Analyst, Security Analyst, remote)
- [ ] Add the Platform project to the Projects/Featured section with the live link
- [ ] Post 1×/week: a lab writeup, a tool you tried, something you learned
- [ ] Follow & engage with SOC/DFIR people so the algorithm surfaces you

---

## 3. Where to apply (remote-friendly Blue Team)

**Priority 1 — MSSPs** (most remote SOC hiring; 24/7 shift model):
Arctic Wolf, Expel, Red Canary, eSentire, Rapid7 MDR, Alert Logic, Secureworks.
→ Search LinkedIn: `"SOC Analyst" remote` and filter Entry level.

**Job boards**
- LinkedIn Jobs (filter: Remote + "SOC Analyst" / "Security Analyst", Entry level)
- Wellfound (startups, remote-friendly)
- We Work Remotely / RemoteOK (filter: security)
- isecjobs.com · CyberSecJobs · InfosecJobs

**Communities (jobs get shared here)**
- Discord: TryHackMe, Blue Team Labs, SANS
- Reddit: r/SOCAnalyst, r/cybersecurity (monthly hiring threads)

**Thailand**
- G-Able, MFEC, NForce Secure, Cyber Elite, bank SOCs.
- Reality: start on-site/hybrid 6–12 months → remote becomes much easier.

**Reality check on remote-junior:** it's harder than on-site for entry level,
because companies like to train juniors in person. Beat it by (1) standing out
with your portfolio, (2) staying publicly visible on LinkedIn/GitHub, and
(3) targeting MSSPs first.

---

## 4. Interview prep — you can answer these straight from your Platform

- Difference between **brute force vs password spraying**? (Room 1)
- How do you read **email headers** and check **SPF/DKIM/DMARC**? (Room 2)
- What does **C2 beaconing** look like in logs and how do you find it? (Room 3)
- Write a **Splunk query** to detect brute force. (Room 5)
- Walk through the **IR lifecycle** for a ransomware case. (Room 8)
- What is **Kerberoasting / DCSync**? (Room 7)
- Explain a **Sigma rule** you understand. (Room 10)
- Tell me about a project: *why* you built the Platform, what broke, how you fixed it.
```
```
