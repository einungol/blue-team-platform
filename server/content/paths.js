/**
 * Learning Paths — recommended sequences of rooms and interactive labs.
 *
 * Structured as a SOC career ladder: Tier 1 (foundational triage/analysis) ->
 * Tier 2 (hunting, forensics, detection, threat intel), plus a specialization
 * track. Paths are "soft" guidance (nothing is locked). Each step references a
 * guided room (kind: 'room') or an interactive terminal lab (kind: 'lab') by id.
 * Progress is computed from room_progress at request time in index.js.
 */

const paths = [
  {
    id: 1,
    slug: 'soc-analyst-tier-1',
    title: 'SOC Analyst — Tier 1',
    description: 'The foundational path for an entry-level SOC analyst. Learn to read Windows event logs, triage an alert queue, investigate phishing, and hunt basic intrusions — the day-one skills of a Tier-1 analyst.',
    icon: 'ShieldCheck',
    level: 'Tier 1 · Beginner',
    steps: [
      { kind: 'room', ref: 12 },  // Windows Event Log Fundamentals
      { kind: 'room', ref: 1 },   // Log Analysis: Brute Force Hunt
      { kind: 'room', ref: 11 },  // SOC Alert Triage
      { kind: 'lab', ref: 1 },    // Terminal: Web Log Intrusion
      { kind: 'room', ref: 2 },   // Phishing Triage
      { kind: 'room', ref: 3 },   // Network Forensics: C2 Beacon
      { kind: 'room', ref: 5 },   // SIEM Detective: Splunk
    ],
  },
  {
    id: 2,
    slug: 'soc-analyst-tier-2',
    title: 'SOC Analyst — Tier 2',
    description: 'Level up from reactive triage to deeper investigation and proactive defense: memory and endpoint forensics, threat hunting, threat intelligence enrichment, detection engineering, and incident response.',
    icon: 'Crosshair',
    level: 'Tier 2 · Intermediate → Advanced',
    steps: [
      { kind: 'lab', ref: 7 },    // Sysmon Threat Hunting
      { kind: 'room', ref: 4 },   // Memory Forensics
      { kind: 'room', ref: 13 },  // Threat Intelligence & IOC Enrichment
      { kind: 'room', ref: 14 },  // Business Email Compromise
      { kind: 'room', ref: 10 },  // Detection Engineering (Sigma)
      { kind: 'room', ref: 8 },   // Ransomware Incident Response
      { kind: 'room', ref: 7 },   // Active Directory Forensics
    ],
  },
  {
    id: 3,
    slug: 'attack-techniques-and-cloud',
    title: 'Attack Techniques & Cloud',
    description: 'Understand attacker tradecraft (to defend better) and modern cloud incidents: web exploitation forensics, privilege escalation, malware triage, DNS exfiltration hunting, and AWS log analysis.',
    icon: 'Cloud',
    level: 'Specialization · Intermediate → Advanced',
    steps: [
      { kind: 'lab', ref: 3 },    // Web Attack Forensics
      { kind: 'lab', ref: 4 },    // Privilege Escalation Review
      { kind: 'room', ref: 6 },   // Malware Triage
      { kind: 'lab', ref: 5 },    // Threat Hunt: DNS Exfil
      { kind: 'lab', ref: 6 },    // Windows RDP Lateral Movement
      { kind: 'room', ref: 9 },   // AWS Cloud Log Analysis
    ],
  },
];

function getPathById(id) {
  return paths.find((p) => String(p.id) === String(id) || p.slug === String(id));
}

module.exports = { paths, getPathById };
