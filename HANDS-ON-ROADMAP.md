# 🧪 Hands-On Blue Team Roadmap (Manual, Self-Driven)

> Build **real experience** by doing the work yourself — no auto-generated shortcuts.
> Every project here produces something you can put on GitHub / talk about in interviews.
>
> **Setup you have:** Windows + a VM (VirtualBox/VMware). That's enough for everything below.
>
> **Golden rule (from Motasem's advice):** *grinding unscripted cases beats collecting tutorials.*
> Do the analysis. Write it up. Repeat. The writeup is the proof.

---

## 🔒 Safety First (read once)

- Do **malware analysis only inside an isolated VM** — set network to **Host-Only** or disabled, take a **snapshot** before detonating, revert after.
- Never analyze real malware on your host or work machine.
- Never paste real company data / PII into public tools.
- For honeypots on the internet: use a **throwaway cloud VPS**, never your home network.

---

## 📊 The 4 Tracks (do them roughly in this order)

```
Track A: Detection Lab      ← start here (builds on your home-soc-lab)
Track B: Investigation Writeups  ← do in parallel, cheapest to start
Track C: Malware/Phishing Analysis  ← needs the VM
Track D: Honeypot / Threat Intel   ← capstone, most impressive
```

---

# 🟢 TRACK A — Detection Lab (Splunk + Sysmon)

**Goal:** stand up your `home-soc-lab` for real, ingest live telemetry, and write detections yourself.
**Deliverable:** the repo filled with real screenshots + detections *you* wrote.

### A1 — Stand it up (Week 1)
- [ ] Install **Splunk Free** + **Sysmon** (follow `home-soc-lab/SETUP-GUIDE.md`)
- [ ] Confirm data: `index=sysmon | stats count by EventCode`
- [ ] Run `scripts/generate-test-events.ps1`, watch events land
- [ ] Screenshot Splunk search results → add to the repo README

### A2 — Run the 5 detections (Week 1-2)
- [ ] Open each file in `detections/`, run the SPL, confirm it fires
- [ ] Screenshot each firing → put in README (this is your portfolio proof)

### A3 — Write 3 NEW detections yourself (Week 2-3) ⭐ the real skill
Pick techniques and write the SPL from scratch. Ideas:
- [ ] **Scheduled task creation** (Sysmon EID 1, `schtasks.exe /create`) → T1053.005
- [ ] **New service install** (`sc create` / `New-Service`) → T1543.003
- [ ] **Clearing event logs** (`wevtutil cl`, `Clear-EventLog`) → T1070.001
- [ ] **Unusual parent-child** (e.g. `services.exe` spawning `cmd.exe`)
For each: write the SPL, test it (run the command in your VM), document false positives.

### A4 — Import a real attack dataset (Week 3-4)
- [ ] Download **EVTX-ATTACK-SAMPLES** (github.com/sbousseaden/EVTX-ATTACK-SAMPLES)
- [ ] Import a `.evtx` into Splunk (Add Data → Upload)
- [ ] Hunt it: which of your detections fire? Write what you found.

**✅ Track A done when:** home-soc-lab README has real screenshots + ≥8 detections (5 given + 3 yours) + one dataset hunt writeup.

---

# 🔵 TRACK B — Investigation Writeups (start today, browser only)

**Goal:** solve real investigation challenges and write up your reasoning.
**Deliverable:** a `blue-team-writeups` GitHub repo, one markdown per case.
**Why it matters:** writeups show *judgment* — the #1 thing AI can't replicate and interviewers probe for.

### B1 — Free platforms to grind
- [ ] **CyberDefenders** (cyberdefenders.org) — free "Blue Team" challenges w/ real artifacts
- [ ] **Splunk BOTS v3** (github.com/splunk/botsv3) — full SOC dataset + questions
- [ ] **Blue Team Labs Online** — free tier investigations
- [ ] **LetsDefend** — free SOC-alert challenges

### B2 — The writeup formula (use every time)
```markdown
# Case: [name]  ·  Platform: [x]  ·  Date

## Scenario
(1-2 lines: what you were asked to investigate)

## Tools used
(Splunk / Wireshark / grep / VirusTotal / etc.)

## Investigation
- Question 1: [q]
  - What I did: [query/step]
  - Evidence: [screenshot / log line]
  - Answer: [x]
  - **Why:** [your reasoning — this is the valuable part]
(repeat per question)

## Timeline of the attack
(reconstruct: initial access → actions → impact)

## MITRE ATT&CK mapping
| Technique | ID | Evidence |

## Lessons learned
(what a defender should detect/prevent; what you'd tune)
```

### B3 — Cadence
- [ ] 1 challenge/week minimum → 1 writeup/week
- [ ] Commit each to GitHub → also becomes a LinkedIn post

**✅ Track B done when:** `blue-team-writeups` has ≥6 quality writeups (2-3 months at 1/week).

---

# 🟡 TRACK C — Malware & Phishing Analysis (needs the VM)

**Goal:** safely analyze real samples, extract IOCs, document behavior.
**Deliverable:** `malware-analysis-writeups` repo (static + dynamic analysis notes).
**⚠️ VM must be isolated (Host-Only network + snapshot). Revert after every detonation.**

### C1 — Build the analysis VM (Week 1)
- [ ] Windows VM, network = **Host-Only**, take a **clean snapshot**
- [ ] Install tools: **PEStudio**, **Sysinternals** (Process Explorer, Autoruns, TCPView), **CFF Explorer**, **Wireshark**, **7-Zip**, **strings**
- [ ] (Optional) **FLARE-VM** — a scripted malware-analysis Windows environment
- [ ] (Optional) **REMnux** — a Linux malware-analysis VM

### C2 — Static analysis first (safe — no execution)
- [ ] Get safe samples: **MalwareBazaar** (bazaar.abuse.ch), **theZoo** (research), or EICAR test file to start
- [ ] Practice: file hash → **VirusTotal**; `strings`; check PE imports in **PEStudio**; detect packing (entropy)
- [ ] Document: hashes, suspicious strings, imports, packer → IOCs

### C3 — Dynamic analysis (in the isolated VM)
- [ ] Snapshot → detonate → observe with **Process Explorer** (new processes),
      **Autoruns** (persistence), **TCPView/Wireshark** (network), **Regshot** (registry diff)
- [ ] Record: what it dropped, persistence created, C2 contacted → **revert snapshot**

### C4 — Phishing analysis (no VM needed for most)
- [ ] Collect phishing samples (your spam folder, PhishTank, or public repos)
- [ ] Analyze headers (SPF/DKIM/DMARC), extract URLs, defang IOCs
- [ ] Sandbox suspicious URLs with **urlscan.io** / **VirusTotal** (never click directly)

**✅ Track C done when:** repo has ≥3 static + ≥2 dynamic analysis writeups with IOC tables.

---

# 🔴 TRACK D — Honeypot / Threat Intel (capstone)

**Goal:** capture real attacker activity and/or produce threat intelligence.
**Deliverable:** `honeypot-analysis` or `threat-intel-reports` repo.
**⚠️ Honeypots go on a throwaway cloud VPS, NEVER your home network.**

### D1 — Honeypot (needs a cheap VPS ~$5)
- [ ] Spin up a small VPS (DigitalOcean/Vultr/Linode)
- [ ] Deploy **T-Pot** (multi-honeypot platform) or **Cowrie** (SSH honeypot)
- [ ] Let it run 1-2 weeks → collect real attack data
- [ ] Analyze: top attacker IPs, credentials tried, malware dropped, geolocation
- [ ] Write a report: what you observed, IOCs, trends → **this impresses recruiters**

### D2 — Threat Intel / OSINT (browser only, free)
- [ ] Pick a threat actor or malware family (e.g. from **Malpedia**, **MITRE ATT&CK Groups**)
- [ ] Gather OSINT: TTPs, infrastructure, IOCs from public reporting
- [ ] Produce a **threat profile** report (Diamond Model or ATT&CK Navigator layer)
- [ ] Tools to learn: **MITRE ATT&CK Navigator**, **urlscan.io**, **Shodan**, **VirusTotal**, **MISP** (open-source TIP)

**✅ Track D done when:** you have one honeypot analysis OR two threat-intel reports published.

---

## 🗓️ Suggested 3-Month Schedule

| Month | Focus | Output |
|-------|-------|--------|
| **1** | Track A (detection lab live) + start Track B (1 writeup/week) | home-soc-lab w/ screenshots + 4 writeups |
| **2** | Track B continues + Track C (malware VM + static analysis) | 8 writeups + 3 malware analyses |
| **3** | Track C dynamic + Track D (honeypot or threat intel) | capstone report + full portfolio |

**In parallel the whole time:**
- [ ] Study for **Security+** (then **BTL1**)
- [ ] Post 1×/week on LinkedIn (link your writeups)
- [ ] Apply to MSSPs + remote SOC roles once Security+ is near

---

## 🎯 How I (your coach) can help at each step

I'm not going to do these for you — that defeats the purpose. But I can:
- **Review your writeups** and give feedback like a senior analyst would
- **Unstick you** when a query/tool/config doesn't work
- **Explain concepts** (a Splunk command, a PE header field, an ATT&CK technique)
- **Sanity-check your analysis** ("is this really T1055 or T1620?")
- **Help structure** a repo or report for maximum portfolio impact

**Start with Track A + B this week.** When you've done your first detection or
writeup, bring it back and I'll review it. That feedback loop is where you level up.
