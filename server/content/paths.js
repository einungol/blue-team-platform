/**
 * Learning Paths — recommended sequences of rooms and interactive labs.
 *
 * Paths are "soft" guidance (nothing is locked). Each step references either a
 * guided room (kind: 'room') or an interactive terminal lab (kind: 'lab') by id.
 * Progress is computed from room_progress at request time in index.js.
 */

const paths = [
  {
    id: 1,
    slug: 'soc-analyst-tier-1',
    title: 'SOC Analyst — Tier 1',
    description: 'The foundational path for an entry-level SOC analyst: read logs, triage phishing, spot network anomalies, query a SIEM, and investigate web attacks — from easy to challenging.',
    icon: 'ShieldCheck',
    level: 'Beginner → Intermediate',
    steps: [
      { kind: 'room', ref: 1 },   // Log Analysis: Brute Force Hunt
      { kind: 'lab', ref: 1 },    // Terminal: Web Log Intrusion
      { kind: 'room', ref: 2 },   // Phishing Triage
      { kind: 'room', ref: 3 },   // Network Forensics: C2 Beacon
      { kind: 'room', ref: 5 },   // SIEM Detective: Splunk
      { kind: 'room', ref: 3 + 0, skip: true }, // placeholder guard (kept simple)
    ].filter((s) => !s.skip),
  },
  {
    id: 2,
    slug: 'dfir-threat-hunting',
    title: 'DFIR & Threat Hunting',
    description: 'Level up from reactive triage to proactive hunting and deep forensics: memory analysis, Active Directory attacks, ransomware IR, endpoint hunting, and writing detections.',
    icon: 'Crosshair',
    level: 'Intermediate → Advanced',
    steps: [
      { kind: 'room', ref: 4 },   // Memory Forensics
      { kind: 'room', ref: 7 },   // Active Directory Forensics
      { kind: 'room', ref: 8 },   // Ransomware Incident Response
      { kind: 'lab', ref: 7 },    // Sysmon Threat Hunting
      { kind: 'room', ref: 10 },  // Detection Engineering (Sigma)
    ],
  },
  {
    id: 3,
    slug: 'offensive-and-cloud',
    title: 'Attack Techniques & Cloud',
    description: 'Understand attacker tradecraft (to defend better) and modern cloud incidents: web exploitation forensics, privilege escalation, malware triage, and AWS log analysis.',
    icon: 'Cloud',
    level: 'Intermediate → Advanced',
    steps: [
      { kind: 'lab', ref: 3 },    // Web Attack Forensics
      { kind: 'lab', ref: 4 },    // Privilege Escalation Review
      { kind: 'room', ref: 6 },   // Malware Triage
      { kind: 'lab', ref: 5 },    // Threat Hunt: DNS Exfil
      { kind: 'room', ref: 9 },   // AWS Cloud Log Analysis
    ],
  },
];

function getPathById(id) {
  return paths.find((p) => String(p.id) === String(id) || p.slug === String(id));
}

module.exports = { paths, getPathById };
