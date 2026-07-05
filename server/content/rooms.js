/**
 * Blue Team Rooms - Playable content modules
 *
 * Each room contains REAL artifacts (logs, emails, pcap summaries) embedded
 * directly so the platform is fully playable in the browser without Docker.
 *
 * Structure:
 *   room.tasks[].questions[].answer  -> checked server-side, never sent to client
 *
 * Answer matching is case-insensitive and trimmed by default.
 */

// ---------------------------------------------------------------------------
// ROOM 1: Log Analysis - Brute Force Hunt
// ---------------------------------------------------------------------------
const WIN_SECURITY_LOG = `TimeGenerated        EventID  Account          SourceIP         Workstation   Status
2024-03-14 01:02:11  4625     administrator    45.133.1.87      WEB01         0xC000006A
2024-03-14 01:02:13  4625     administrator    45.133.1.87      WEB01         0xC000006A
2024-03-14 01:02:15  4625     administrator    45.133.1.87      WEB01         0xC000006A
2024-03-14 01:02:17  4625     admin            45.133.1.87      WEB01         0xC000006A
2024-03-14 01:02:19  4625     admin            45.133.1.87      WEB01         0xC000006A
2024-03-14 01:02:21  4625     root             45.133.1.87      WEB01         0xC000006A
2024-03-14 01:02:23  4625     sqladmin         45.133.1.87      WEB01         0xC000006A
2024-03-14 01:02:25  4625     backup           45.133.1.87      WEB01         0xC000006A
2024-03-14 01:02:27  4625     jsmith           45.133.1.87      WEB01         0xC000006A
2024-03-14 01:02:29  4625     jsmith           45.133.1.87      WEB01         0xC000006A
2024-03-14 03:41:02  4624     mwallace         10.0.4.22        FIN02         0x0
2024-03-14 08:14:55  4624     jsmith           10.0.4.31        HR01          0x0
2024-03-14 22:15:03  4625     svc_backup       45.133.1.87      WEB01         0xC000006A
2024-03-14 22:15:05  4625     svc_backup       45.133.1.87      WEB01         0xC000006A
2024-03-14 22:15:07  4625     svc_backup       45.133.1.87      WEB01         0xC000006A
2024-03-14 22:15:09  4625     svc_backup       45.133.1.87      WEB01         0xC000006A
2024-03-14 22:15:11  4625     svc_backup       45.133.1.87      WEB01         0xC000006A
2024-03-14 22:15:13  4625     svc_backup       45.133.1.87      WEB01         0xC000006A
2024-03-14 22:15:15  4625     svc_backup       45.133.1.87      WEB01         0xC000006A
2024-03-14 22:15:17  4625     svc_backup       45.133.1.87      WEB01         0xC000006A
2024-03-14 22:15:19  4625     svc_backup       45.133.1.87      WEB01         0xC000006A
2024-03-14 22:15:21  4625     svc_backup       45.133.1.87      WEB01         0xC000006A
2024-03-14 22:15:23  4625     svc_backup       45.133.1.87      WEB01         0xC000006A
2024-03-14 22:15:25  4625     svc_backup       45.133.1.87      WEB01         0xC000006A
2024-03-14 22:15:29  4624     svc_backup       45.133.1.87      WEB01         0x0
2024-03-14 22:16:44  4672     svc_backup       45.133.1.87      WEB01         0x0
2024-03-14 22:19:10  4688     svc_backup       45.133.1.87      WEB01         cmd.exe /c whoami
2024-03-14 22:20:37  4688     svc_backup       45.133.1.87      WEB01         powershell.exe -enc SQBFAFgA
2024-03-14 22:24:01  4720     Administrator    45.133.1.87      WEB01         (new user: hpsupport)`;

const room1 = {
  slug: 'log-analysis-brute-force',
  title: 'Log Analysis: Brute Force Hunt',
  description: 'A web server was hit with a brute force attack overnight. Analyze the Windows Security logs to identify the attacker and determine if they succeeded.',
  difficulty: 'easy',
  category: 'blue',
  tags: ['SIEM', 'Windows Event Logs', 'Brute Force', 'SOC'],
  icon: 'ScrollText',
  points: 70,
  estimatedTime: 20,
  tasks: [
    {
      id: 1,
      title: 'Briefing',
      content: `## Scenario

You are a **SOC Analyst** on the night shift. At 06:00 an alert fired for *"multiple failed logons"* on host **WEB01**.

Your job: analyze the exported Windows Security log and answer the questions below.

### Key Event IDs
| Event ID | Meaning |
|----------|---------|
| **4625** | Failed logon |
| **4624** | Successful logon |
| **4672** | Special privileges assigned (admin logon) |
| **4688** | New process created |
| **4720** | A user account was created |

> **Status \`0xC000006A\`** = wrong password. Read the log on the next task carefully.`,
      artifacts: [],
      questions: [],
    },
    {
      id: 2,
      title: 'Investigate the log',
      content: `## The Evidence

Below is the exported Security log from **WEB01**. Scroll through it and answer the questions.

Look for:
- Bursts of **4625** (failed logons) from a single IP
- The moment a **4624** (success) appears for a previously-failing account
- What the attacker did **after** getting in`,
      artifacts: [
        { name: 'WEB01_Security.log', type: 'log', content: WIN_SECURITY_LOG },
      ],
      questions: [
        {
          id: 'q1',
          prompt: 'What is the source IP address of the attacker?',
          answer: '45.133.1.87',
          points: 10,
          hint: 'One IP is responsible for almost every failed logon (4625).',
        },
        {
          id: 'q2',
          prompt: 'Which account did the attacker eventually log in successfully with? (4624 after many 4625)',
          answer: 'svc_backup',
          points: 15,
          hint: 'Find the account that had 12 failed attempts at 22:15 then a success.',
        },
        {
          id: 'q3',
          prompt: 'What type of attack is this: password spraying or brute force?',
          answer: 'brute force',
          points: 10,
          hint: 'Many passwords against ONE account = brute force. One password against MANY accounts = spraying.',
          accept: ['brute force', 'bruteforce', 'brute-force'],
        },
      ],
    },
    {
      id: 3,
      title: 'Post-compromise',
      content: `## What happened next?

Getting a foothold is only step one. A good analyst determines the **impact**.

Review the events **after** the successful logon (events with ID 4688 and 4720) and answer below.`,
      artifacts: [
        { name: 'WEB01_Security.log', type: 'log', content: WIN_SECURITY_LOG },
      ],
      questions: [
        {
          id: 'q4',
          prompt: 'What suspicious process did the attacker run that used an encoded command? (process name only, e.g. name.exe)',
          answer: 'powershell.exe',
          points: 15,
          hint: 'Look at event 4688 - one process was launched with the "-enc" (EncodedCommand) flag.',
        },
        {
          id: 'q5',
          prompt: 'What is the username of the new backdoor account the attacker created? (Event 4720)',
          answer: 'hpsupport',
          points: 20,
          hint: 'The very last event in the log is a 4720 - account creation.',
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// ROOM 2: Phishing Email Analysis
// ---------------------------------------------------------------------------
const PHISH_EML = `Return-Path: <billing@paypa1-secure.com>
Received: from mail.paypa1-secure.com (unknown [193.42.33.19])
        by mx.corp-target.com with ESMTP id 4F2A1B;
        Thu, 14 Mar 2024 09:12:44 +0000
Authentication-Results: mx.corp-target.com;
        spf=fail (sender IP is 193.42.33.19) smtp.mailfrom=paypa1-secure.com;
        dkim=none;
        dmarc=fail action=quarantine header.from=paypal.com
From: "PayPal Service" <billing@paypa1-secure.com>
Reply-To: <recover@mail-secure-verify.ru>
To: <finance@corp-target.com>
Subject: [Urgent] Your account has been limited - verify within 24 hours
Date: Thu, 14 Mar 2024 09:12:40 +0000
Message-ID: <9931.4471@paypa1-secure.com>
Content-Type: text/html; charset="UTF-8"
X-Mailer: PHPMailer 6.1.7

<html>
<body>
<p>Dear Customer,</p>
<p>We detected unusual activity. Your account has been <b>limited</b>.
To restore access you must confirm your identity within 24 hours or your
account will be permanently suspended.</p>
<p><a href="http://secure-paypal.account-verify.ru/login?id=8842">
Click here to verify your account</a></p>
<p>Attached is your case file.</p>
<p>PayPal Security Team</p>
</body>
</html>

--boundary_9931
Content-Type: application/octet-stream; name="Account_Statement.pdf.htm"
Content-Transfer-Encoding: base64
Content-Disposition: attachment; filename="Account_Statement.pdf.htm"

PGh0bWw+PGZvcm0gYWN0aW9uPSJodHRwOi8vMTkzLjQyLjMzLjE5L2NvbGxlY3QucGhwIj4=
--boundary_9931--`;

const room2 = {
  slug: 'phishing-email-analysis',
  title: 'Phishing Triage: The PayPal Lure',
  description: 'A finance employee reported a suspicious "PayPal" email. Perform header analysis and IOC extraction to confirm the phish and pull indicators for blocking.',
  difficulty: 'easy',
  category: 'blue',
  tags: ['Phishing', 'Email Headers', 'SPF/DKIM/DMARC', 'IOC'],
  icon: 'Mail',
  points: 75,
  estimatedTime: 20,
  tasks: [
    {
      id: 1,
      title: 'Header Analysis',
      content: `## Scenario

The finance team forwarded a suspicious email to the SOC phishing mailbox. The raw \`.eml\` is on the right.

### What to check in headers
- **From** vs **Return-Path** vs **Reply-To** mismatches
- **SPF / DKIM / DMARC** authentication results
- The real sending **IP address**

> Tip: Attackers often use *lookalike* domains. Read the sender domain **character by character**.`,
      artifacts: [
        { name: 'reported_email.eml', type: 'email', content: PHISH_EML },
      ],
      questions: [
        {
          id: 'q1',
          prompt: 'What is the sender domain used in the From address?',
          answer: 'paypa1-secure.com',
          points: 15,
          hint: 'Look at the From: header. Note the "1" instead of an "l" (typosquatting).',
        },
        {
          id: 'q2',
          prompt: 'Did SPF pass or fail?',
          answer: 'fail',
          points: 10,
          hint: 'Check the Authentication-Results header.',
        },
        {
          id: 'q3',
          prompt: 'What is the IP address of the actual sending mail server?',
          answer: '193.42.33.19',
          points: 15,
          hint: 'The Received: header and SPF result both show it.',
        },
      ],
    },
    {
      id: 2,
      title: 'IOC Extraction',
      content: `## Extract the indicators

To protect the rest of the company, pull the **Indicators of Compromise** so they can be blocked at the proxy and mail gateway.

Look at the body link, the Reply-To, and the attachment.`,
      artifacts: [
        { name: 'reported_email.eml', type: 'email', content: PHISH_EML },
      ],
      questions: [
        {
          id: 'q4',
          prompt: 'What is the full phishing domain used in the "Click here" link? (domain only, no http:// or path)',
          answer: 'secure-paypal.account-verify.ru',
          points: 15,
          hint: 'The real domain is the rightmost part before the first single slash: account-verify.ru ... include the full host.',
          accept: ['secure-paypal.account-verify.ru'],
        },
        {
          id: 'q5',
          prompt: 'The attachment filename uses a classic trick. What is the REAL file extension? (e.g. .exe)',
          answer: '.htm',
          points: 10,
          hint: 'Account_Statement.pdf.htm - the last extension is what actually runs.',
          accept: ['.htm', 'htm', '.html', 'html'],
        },
        {
          id: 'q6',
          prompt: 'What country code TLD is the Reply-To address using? (2 letters)',
          answer: 'ru',
          points: 10,
          hint: 'recover@mail-secure-verify.RU',
          accept: ['ru', '.ru'],
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// ROOM 3: Network Forensics - C2 Beacon
// ---------------------------------------------------------------------------
const CONN_LOG = `# Zeek conn.log (simplified)
ts                   src_ip        src_port  dst_ip           dst_port  proto  duration  bytes  service
2024-03-15 10:00:03  10.0.4.55     51022     142.250.72.14    443       tcp    1.204     8241   ssl
2024-03-15 10:00:41  10.0.4.55     51033     23.211.9.4       443       tcp    0.061     412    ssl
2024-03-15 10:01:41  10.0.4.55     51044     23.211.9.4       443       tcp    0.058     410    ssl
2024-03-15 10:02:41  10.0.4.55     51050     23.211.9.4       443       tcp    0.060     414    ssl
2024-03-15 10:03:41  10.0.4.55     51061     23.211.9.4       443       tcp    0.059     409    ssl
2024-03-15 10:04:41  10.0.4.55     51070     23.211.9.4       443       tcp    0.061     412    ssl
2024-03-15 10:05:41  10.0.4.55     51088     23.211.9.4       443       tcp    0.057     411    ssl
2024-03-15 10:06:41  10.0.4.55     51090     23.211.9.4       443       tcp    0.060     413    ssl
2024-03-15 10:07:12  10.0.4.55     51101     142.250.72.14    443       tcp    2.881     19422  ssl
2024-03-15 10:07:41  10.0.4.55     51108     23.211.9.4       443       tcp    0.059     410    ssl
2024-03-15 10:08:41  10.0.4.55     51117     23.211.9.4       443       tcp    0.058     412    ssl
2024-03-15 10:09:41  10.0.4.55     51120     23.211.9.4       443       tcp    0.060     409    ssl
2024-03-15 10:14:22  10.0.4.55     51140     23.211.9.4       8443      tcp    47.552    2483194  ssl
2024-03-15 10:15:03  10.0.4.55     51155     142.250.72.14    443       tcp    0.902     6120   ssl`;

const DNS_LOG = `# Zeek dns.log (simplified)
ts                   src_ip      query                                  answer
2024-03-15 09:59:58  10.0.4.55   cdn.update-sync.net                    23.211.9.4
2024-03-15 10:00:02  10.0.4.55   www.google.com                        142.250.72.14
2024-03-15 10:07:10  10.0.4.55   drive.google.com                      142.250.72.14`;

const room3 = {
  slug: 'network-forensics-c2-beacon',
  title: 'Network Forensics: Hunt the C2 Beacon',
  description: 'An EDR alert hints at a compromised workstation. Use Zeek connection and DNS logs to identify Command & Control beaconing and the data exfiltration event.',
  difficulty: 'medium',
  category: 'blue',
  tags: ['Network', 'Zeek', 'C2', 'Beaconing', 'Threat Hunting'],
  icon: 'Radio',
  points: 85,
  estimatedTime: 25,
  tasks: [
    {
      id: 1,
      title: 'Spot the Beacon',
      content: `## Scenario

Host **10.0.4.55** is behaving oddly. You have Zeek \`conn.log\` and \`dns.log\`.

### What is beaconing?
Malware "phones home" to its **C2 server** at regular intervals. In logs this looks like:
- Connections to the **same destination**
- At a **fixed time interval** (e.g. every 60 seconds)
- With a **small, near-identical byte size** each time

Compare that to normal web traffic which is bursty and varied in size.`,
      artifacts: [
        { name: 'conn.log', type: 'log', content: CONN_LOG },
      ],
      questions: [
        {
          id: 'q1',
          prompt: 'What destination IP is the host beaconing to? (regular ~60s small connections)',
          answer: '23.211.9.4',
          points: 20,
          hint: 'One IP is contacted every 60 seconds with ~410 bytes each time.',
        },
        {
          id: 'q2',
          prompt: 'What is the beacon interval in seconds?',
          answer: '60',
          points: 15,
          hint: 'Compare the timestamps: 10:01:41, 10:02:41, 10:03:41 ...',
          accept: ['60', '60s', '60 seconds', '1 minute'],
        },
      ],
    },
    {
      id: 2,
      title: 'Attribute & Exfil',
      content: `## Correlate DNS + find the exfiltration

Now correlate the beacon IP with the DNS log to find the **malicious domain**, then look back at \`conn.log\` for the odd connection that **doesn't fit the pattern** — that's likely the data theft.`,
      artifacts: [
        { name: 'conn.log', type: 'log', content: CONN_LOG },
        { name: 'dns.log', type: 'log', content: DNS_LOG },
      ],
      questions: [
        {
          id: 'q3',
          prompt: 'What malicious domain resolved to the C2 IP address?',
          answer: 'cdn.update-sync.net',
          points: 20,
          hint: 'Find the dns.log entry whose answer equals the beacon IP (23.211.9.4).',
        },
        {
          id: 'q4',
          prompt: 'Which destination PORT was used for the large data exfiltration connection (~2.4 MB)?',
          answer: '8443',
          points: 15,
          hint: 'One connection to the C2 IP is huge (2483194 bytes) and uses a non-standard port.',
        },
        {
          id: 'q5',
          prompt: 'Roughly how many megabytes were exfiltrated in that connection? (answer to nearest whole MB)',
          answer: '2',
          points: 15,
          hint: '2483194 bytes / 1024 / 1024 ≈ ? MB',
          accept: ['2', '2mb', '2 mb', '2.4', '2.4mb'],
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// ROOM 4: Memory Forensics - Volatility
// ---------------------------------------------------------------------------
const PSLIST = `# vol.py -f infected.raw windows.pslist
PID    PPID   ImageFileName     CreateTime               Path
4      0      System           2024-03-16 08:00:01
368    4      smss.exe         2024-03-16 08:00:03      C:\\Windows\\System32\\smss.exe
488    368    csrss.exe        2024-03-16 08:00:04      C:\\Windows\\System32\\csrss.exe
564    488    winlogon.exe     2024-03-16 08:00:05      C:\\Windows\\System32\\winlogon.exe
620    564    services.exe     2024-03-16 08:00:06      C:\\Windows\\System32\\services.exe
712    620    svchost.exe      2024-03-16 08:00:07      C:\\Windows\\System32\\svchost.exe
1104   620    spoolsv.exe      2024-03-16 08:00:11      C:\\Windows\\System32\\spoolsv.exe
2288   1872   explorer.exe     2024-03-16 08:01:22      C:\\Windows\\explorer.exe
2540   2288   chrome.exe       2024-03-16 08:02:44      C:\\Program Files\\Google\\Chrome\\chrome.exe
3120   2288   OUTLOOK.EXE      2024-03-16 08:03:10      C:\\Program Files\\Office\\OUTLOOK.EXE
3684   3120   svch0st.exe      2024-03-16 09:14:52      C:\\Users\\jsmith\\AppData\\Local\\Temp\\svch0st.exe
3912   3684   powershell.exe   2024-03-16 09:15:03      C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe
4088   3684   rundll32.exe     2024-03-16 09:16:40      C:\\Windows\\System32\\rundll32.exe`;

const NETSCAN = `# vol.py -f infected.raw windows.netscan
Proto  LocalAddr          LocalPort  ForeignAddr      ForeignPort  State        PID    Owner
TCPv4  10.0.4.55          51455      185.220.101.42   4444         ESTABLISHED  3684   svch0st.exe
TCPv4  10.0.4.55          51460      185.220.101.42   4444         ESTABLISHED  3912   powershell.exe
TCPv4  10.0.4.55          49871      142.250.72.14    443          ESTABLISHED  2540   chrome.exe
TCPv4  10.0.4.55          139        0.0.0.0          0            LISTENING    4      System
UDPv4  10.0.4.55          5353       *                *                         2540   chrome.exe`;

const CMDLINE = `# vol.py -f infected.raw windows.cmdline
PID    Process          Args
3684   svch0st.exe      "C:\\Users\\jsmith\\AppData\\Local\\Temp\\svch0st.exe"
3912   powershell.exe   powershell -nop -w hidden -enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQA
4088   rundll32.exe     rundll32.exe C:\\Users\\jsmith\\AppData\\Local\\Temp\\payload.dll,Start`;

const room4 = {
  slug: 'memory-forensics-volatility',
  title: 'Memory Forensics: Catch the Implant',
  description: 'A workstation memory image was captured after an EDR alert. Use Volatility 3 output to hunt the malicious process, its C2 channel, and its persistence DLL.',
  difficulty: 'medium',
  category: 'blue',
  tags: ['Memory Forensics', 'Volatility', 'DFIR', 'Malware'],
  icon: 'Cpu',
  points: 90,
  estimatedTime: 25,
  tasks: [
    {
      id: 1,
      title: 'Process Hunt',
      content: `## Scenario

An analyst captured RAM from host **10.0.4.55** (\`infected.raw\`) after an alert on user **jsmith**.

You've already run some Volatility 3 plugins — the output is on the right.

### What to look for
- **Masquerading**: process names that *look* legit but aren't (typosquats of \`svchost.exe\`, wrong parent, wrong path)
- Legit \`svchost.exe\` lives in \`C:\\Windows\\System32\` and its parent is \`services.exe\`
- Anything running from \`AppData\\Local\\Temp\` is suspicious`,
      artifacts: [
        { name: 'pslist.txt', type: 'log', content: PSLIST },
      ],
      questions: [
        {
          id: 'q1',
          prompt: 'What is the name of the malicious masquerading process? (exact name as shown)',
          answer: 'svch0st.exe',
          points: 20,
          hint: 'Look for a process pretending to be svchost.exe — note the zero instead of the letter "o".',
        },
        {
          id: 'q2',
          prompt: 'What is the PID of that malicious process?',
          answer: '3684',
          points: 15,
          hint: 'Find svch0st.exe in the pslist output and read its PID column.',
        },
        {
          id: 'q3',
          prompt: 'From which full directory path was the malicious process executed?',
          answer: 'C:\\Users\\jsmith\\AppData\\Local\\Temp',
          points: 15,
          hint: 'Legit system processes never run from a user Temp folder.',
          accept: [
            'C:\\Users\\jsmith\\AppData\\Local\\Temp',
            'C:\\Users\\jsmith\\AppData\\Local\\Temp\\',
            'C:/Users/jsmith/AppData/Local/Temp',
            'AppData\\Local\\Temp',
          ],
        },
      ],
    },
    {
      id: 2,
      title: 'C2 & Persistence',
      content: `## Network + Command line

Now correlate the malicious PID with the **netscan** output to find its Command & Control server, and read the **cmdline** output to find how it maintains persistence.

> Port **4444** is a classic Metasploit/Meterpreter default — a strong red flag.`,
      artifacts: [
        { name: 'netscan.txt', type: 'log', content: NETSCAN },
        { name: 'cmdline.txt', type: 'log', content: CMDLINE },
      ],
      questions: [
        {
          id: 'q4',
          prompt: 'What is the C2 (foreign) IP address the implant connects to?',
          answer: '185.220.101.42',
          points: 20,
          hint: 'In netscan, find the ESTABLISHED connection owned by svch0st.exe (PID 3684).',
        },
        {
          id: 'q5',
          prompt: 'What foreign port is used for the C2 connection?',
          answer: '4444',
          points: 10,
          hint: 'Classic Meterpreter default port.',
        },
        {
          id: 'q6',
          prompt: 'What is the name of the DLL loaded via rundll32 for persistence? (filename only, e.g. name.dll)',
          answer: 'payload.dll',
          points: 10,
          hint: 'Check the cmdline output for the rundll32.exe entry (PID 4088).',
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// ROOM 5: SIEM / Splunk Queries
// ---------------------------------------------------------------------------
const SPLUNK_EVENTS = `index=web sourcetype=access_combined
--------------------------------------------------------------------------
2024-03-17 14:02:11  198.51.100.23  POST /login  200  user=admin
2024-03-17 14:02:14  198.51.100.23  POST /login  401  user=admin
2024-03-17 14:02:15  198.51.100.23  POST /login  401  user=admin
2024-03-17 14:02:16  198.51.100.23  POST /login  401  user=admin
... (198.51.100.23 => 842 failed POST /login in 3 minutes) ...
2024-03-17 14:05:49  198.51.100.23  POST /login  302  user=admin   <-- success
2024-03-17 14:06:20  198.51.100.23  GET  /admin/export?table=users  200
2024-03-17 14:06:55  198.51.100.23  GET  /admin/export?table=cards  200`;

const room5 = {
  slug: 'siem-splunk-detection',
  title: 'SIEM Detective: Write the Splunk Query',
  description: 'Learn to think in SPL. Given a scenario, choose the right Splunk Search Processing Language to detect brute force, then interpret the results to scope the incident.',
  difficulty: 'medium',
  category: 'blue',
  tags: ['SIEM', 'Splunk', 'SPL', 'Detection Engineering'],
  icon: 'Search',
  points: 85,
  estimatedTime: 25,
  tasks: [
    {
      id: 1,
      title: 'SPL Fundamentals',
      content: `## Scenario

You are a **Detection Engineer**. Web logs are in Splunk under \`index=web sourcetype=access_combined\`.

You suspect a brute force against \`/login\`. You'll build a query to prove it.

### SPL building blocks
| Command | Purpose |
|---------|---------|
| \`stats count by field\` | Aggregate/group events |
| \`where\` | Filter after aggregation |
| \`table\` | Pick columns to display |
| \`sort -field\` | Sort descending |

> A failed HTTP login is usually status **401**. A successful redirect after login is **302**.`,
      artifacts: [
        { name: 'sample_events.txt', type: 'log', content: SPLUNK_EVENTS },
      ],
      questions: [
        {
          id: 'q1',
          prompt: 'Which HTTP status code represents the FAILED login attempts here?',
          answer: '401',
          points: 10,
          hint: 'See the repeated failed POST /login lines.',
        },
        {
          id: 'q2',
          prompt: 'To count failed logins grouped by source IP, complete: index=web status=401 uri="/login" | stats ___ by src_ip  (one word)',
          answer: 'count',
          points: 15,
          hint: 'The stats function that tallies events is count.',
          accept: ['count', 'count()'],
        },
        {
          id: 'q3',
          prompt: 'To show only IPs with more than 100 failures, which command filters the aggregated results? (one word)',
          answer: 'where',
          points: 15,
          hint: 'After stats, you filter with: | where count > 100',
        },
      ],
    },
    {
      id: 2,
      title: 'Scope the Incident',
      content: `## Interpret the results

Your query flagged one noisy IP. Now read the events on the right to scope what the attacker did **after** breaking in.

The pattern: hundreds of 401s → a single 302 (success) → sensitive GET requests.`,
      artifacts: [
        { name: 'sample_events.txt', type: 'log', content: SPLUNK_EVENTS },
      ],
      questions: [
        {
          id: 'q4',
          prompt: 'What is the attacker source IP address?',
          answer: '198.51.100.23',
          points: 15,
          hint: 'The single IP responsible for all 842 failed logins.',
        },
        {
          id: 'q5',
          prompt: 'Which username did the attacker successfully brute force?',
          answer: 'admin',
          points: 10,
          hint: 'Look at the user= field on the 302 success line.',
        },
        {
          id: 'q6',
          prompt: 'After login, the attacker exported two tables via /admin/export. Which table containing payment data was stolen? (value of the table= parameter)',
          answer: 'cards',
          points: 20,
          hint: 'GET /admin/export?table=cards — payment card data.',
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// ROOM 6: Malware Triage - Static Analysis
// ---------------------------------------------------------------------------
// Analyst-annotated summary of notable strings (defanged, education-only).
// Presented as a triage report rather than raw output so it reads clinically.
const STRINGS_OUT = `# Static string triage report - invoice_march.exe
# (indicators are defanged; sample never executed)

[ Packing / loader ]
  UPX0, UPX1, UPX!            -> UPX section markers (packed)
  LoadLibraryA, GetProcAddress, VirtualAlloc -> typical unpacking stub imports

[ Network capability ]
  WinHttpOpen                 -> HTTP client API present
  URL string (defanged):      hxxp://track-invoices[.]top/gate[.]php

[ Persistence capability ]
  RegSetValueExA
  Registry path string:       Software\\Microsoft\\Windows\\CurrentVersion\\Run

[ Impact / anti-recovery capability ]
  References a shadow-copy removal command (backup deletion)
  References a dropped ransom note file: readme.txt

# Analyst note: the combination of backup-deletion + ransom-note
# reference is characteristic of the RANSOMWARE category.`;

const PE_INFO = `# PE metadata (invoice_march.exe)
MD5:      e99a18c428cb38d5f260853678922e03
SHA256:   9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
Compiler: Microsoft Visual C++
Packer:   UPX 3.96 (detected via section names UPX0/UPX1)
Sections: UPX0 (0 raw / large virtual), UPX1, .rsrc
Imports:  kernel32.dll (LoadLibraryA, GetProcAddress, VirtualAlloc)
Entropy:  7.91 / 8.0  (very high => packed/encrypted)`;

const room6 = {
  slug: 'malware-triage-static',
  title: 'Malware Triage: Static Analysis',
  description: 'A suspicious "invoice" executable landed in a user inbox. Perform first-pass static triage — packing, strings, IOCs and behavior — without ever running it.',
  difficulty: 'medium',
  category: 'blue',
  tags: ['Malware Analysis', 'Static Analysis', 'Strings', 'Ransomware', 'IOC'],
  icon: 'Bug',
  points: 90,
  estimatedTime: 25,
  tasks: [
    {
      id: 1,
      title: 'Is it packed?',
      content: `## Scenario

A file named **invoice_march.exe** was attached to a phishing email. **Never run unknown samples** on your host — start with static triage.

### Packing 101
Packers (UPX, Themida, etc.) compress/encrypt the real code to evade AV.
Tell-tale signs:
- Section names like **UPX0 / UPX1**
- **High entropy** (close to 8.0 = looks random = encrypted)
- Very few imports in the packed view`,
      artifacts: [
        { name: 'pe_info.txt', type: 'log', content: PE_INFO },
      ],
      questions: [
        {
          id: 'q1',
          prompt: 'What packer was used on this sample? (name only)',
          answer: 'upx',
          points: 15,
          hint: 'Section names UPX0/UPX1 are a dead giveaway.',
          accept: ['upx', 'upx 3.96', 'upx3.96'],
        },
        {
          id: 'q2',
          prompt: 'What is the SHA256 hash of the sample? (used to search VirusTotal)',
          answer: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
          points: 15,
          hint: 'Copy the SHA256 line from the PE metadata.',
        },
        {
          id: 'q3',
          prompt: 'The entropy is 7.91/8.0. Does this indicate the file is packed/encrypted? (yes/no)',
          answer: 'yes',
          points: 10,
          hint: 'Entropy near 8.0 means the data looks random — a hallmark of packing/encryption.',
          accept: ['yes', 'y', 'packed', 'true'],
        },
      ],
    },
    {
      id: 2,
      title: 'Strings & Behavior',
      content: `## Read the triage report

Even packed binaries leak strings (in the loader stub, or after unpacking). Review the analyst's **string triage report** and determine **what the sample is capable of** and **its IOCs**.

Watch for:
- Network callbacks (URLs / domains)
- Persistence (\`...CurrentVersion\\Run\`)
- Anti-recovery capability (backup/shadow-copy deletion) + a ransom-note reference → points to the **ransomware** category`,
      artifacts: [
        { name: 'strings.txt', type: 'log', content: STRINGS_OUT },
      ],
      questions: [
        {
          id: 'q4',
          prompt: 'What is the C2 / callback domain found in the strings? (defanged form is fine)',
          answer: 'track-invoices.top',
          points: 20,
          hint: 'Look at the http:// string. "[.]" is just a defanged dot.',
          accept: ['track-invoices.top', 'track-invoices[.]top', 'http://track-invoices.top', 'http://track-invoices[.]top/gate.php'],
        },
        {
          id: 'q5',
          prompt: 'Which registry key does the malware use for persistence? (the ...\\Run path)',
          answer: 'Software\\Microsoft\\Windows\\CurrentVersion\\Run',
          points: 15,
          hint: 'The classic autorun key under CurrentVersion.',
          accept: [
            'Software\\Microsoft\\Windows\\CurrentVersion\\Run',
            'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
            'CurrentVersion\\Run',
            'Software/Microsoft/Windows/CurrentVersion/Run',
          ],
        },
        {
          id: 'q6',
          prompt: 'Based on the backup-deletion capability and ransom-note reference, what malware CATEGORY is this?',
          answer: 'ransomware',
          points: 15,
          hint: 'Anti-recovery (shadow-copy deletion) + a ransom note = this category.',
          accept: ['ransomware', 'ransom'],
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// ROOM 7: Active Directory Forensics
// ---------------------------------------------------------------------------
const AD_EVENT_LOG = `EventID  Time              Account        Service/Detail              SourceIP       Notes
4768     02:11:03          jdoe           krbtgt                       10.0.5.20      TGT requested (normal)
4769     02:11:41          jdoe           MSSQLSvc/db01.corp.local      10.0.5.20      ST req, enc 0x17 (RC4!)
4769     02:11:42          jdoe           HTTP/web01.corp.local         10.0.5.20      ST req, enc 0x17 (RC4!)
4769     02:11:44          jdoe           CIFS/file01.corp.local        10.0.5.20      ST req, enc 0x17 (RC4!)
4769     02:11:46          jdoe           MSSQLSvc/db02.corp.local      10.0.5.20      ST req, enc 0x17 (RC4!)
4624     03:05:22          Administrator  Logon type 3                 10.0.5.20      DCSync source host
4662     03:05:23          Administrator  Replication (DS-Replication-Get-Changes-All)  10.0.5.20  DCSYNC!
4768     05:40:00          Administrator  krbtgt                       10.0.5.20      TGT lifetime 10 years (!)`;

const room7 = {
  slug: 'active-directory-forensics',
  title: 'Active Directory Forensics',
  description: 'A domain controller shows abnormal Kerberos activity. Trace a Kerberoasting attack, a DCSync, and a forged Golden Ticket from the AD event logs.',
  difficulty: 'hard',
  category: 'blue',
  tags: ['Active Directory', 'Kerberos', 'Kerberoasting', 'DCSync', 'DFIR'],
  icon: 'Network',
  points: 95,
  estimatedTime: 30,
  tasks: [
    {
      id: 1,
      title: 'Kerberoasting',
      content: `## Scenario

You are investigating **corp.local**'s domain controller after an alert on unusual Kerberos ticket requests.

### Kerberos event IDs
| Event | Meaning |
|-------|---------|
| **4768** | TGT (Ticket Granting Ticket) requested |
| **4769** | Service ticket (TGS) requested |
| **4662** | Directory Service access (replication) |

### Kerberoasting
An attacker requests **service tickets (4769)** for many **SPNs** (service accounts) with weak **RC4 encryption (0x17)** so they can crack them offline. A burst of 4769 with enc \`0x17\` from one user = Kerberoasting.`,
      artifacts: [
        { name: 'ad_events.log', type: 'log', content: AD_EVENT_LOG },
      ],
      questions: [
        {
          id: 'q1',
          prompt: 'Which user account performed the Kerberoasting (burst of RC4 service-ticket requests)?',
          answer: 'jdoe',
          points: 15,
          hint: 'Find the account with many 4769 events using enc 0x17 (RC4).',
        },
        {
          id: 'q2',
          prompt: 'What encryption type (hex value) indicates the weak RC4 tickets targeted for cracking?',
          answer: '0x17',
          points: 15,
          hint: 'The Notes column shows enc 0x17 = RC4.',
          accept: ['0x17', '17', 'rc4'],
        },
      ],
    },
    {
      id: 2,
      title: 'DCSync & Golden Ticket',
      content: `## Escalation

After the roasting, the attacker escalated. Two hallmark techniques appear:

- **DCSync** — impersonating a DC to pull password hashes. Look for **Event 4662** with the **DS-Replication-Get-Changes-All** right from a non-DC host.
- **Golden Ticket** — forging a TGT with the **krbtgt** hash. A tell-tale sign is a **4768** granting an absurd ticket lifetime (e.g. 10 years).`,
      artifacts: [
        { name: 'ad_events.log', type: 'log', content: AD_EVENT_LOG },
      ],
      questions: [
        {
          id: 'q3',
          prompt: 'What is the Event ID that reveals the DCSync (replication) attack?',
          answer: '4662',
          points: 20,
          hint: 'Directory Service access with the DS-Replication-Get-Changes-All right.',
        },
        {
          id: 'q4',
          prompt: 'Which account was used to perform the DCSync and forge the Golden Ticket?',
          answer: 'Administrator',
          points: 20,
          hint: 'Same account appears in the 4662 replication event and the 10-year 4768.',
          accept: ['administrator', 'admin'],
        },
        {
          id: 'q5',
          prompt: 'Golden Tickets are forged using the hash of which special account?',
          answer: 'krbtgt',
          points: 25,
          hint: 'The KDC account whose hash signs all TGTs.',
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// ROOM 8: Ransomware Incident Response
// ---------------------------------------------------------------------------
const RANSOM_TIMELINE = `Time   Host      Event
08:02  HR-PC04   Email opened: "Invoice_Q1.zip" -> invoice.exe executed
08:04  HR-PC04   4688: powershell.exe -enc (downloader)
08:06  HR-PC04   Outbound TLS to 194.5.249.10:443 (C2)
08:31  FILE-SRV  4624 logon from HR-PC04 (SMB, user hruser)
08:33  FILE-SRV  vssadmin delete shadows /all  (backups destroyed)
08:35  FILE-SRV  Mass file rename *.docx -> *.docx.LOCKD
08:40  FILE-SRV  Ransom note dropped: HOW_TO_DECRYPT.txt
09:15  BACKUP01  Offline backup intact (air-gapped, not reachable by attacker)`;

const room8 = {
  slug: 'ransomware-incident-response',
  title: 'Ransomware Incident Response',
  description: 'A ransomware outbreak is underway. Work the incident using the IR lifecycle: scope patient zero, identify the C2, and make the right containment and recovery decisions.',
  difficulty: 'medium',
  category: 'blue',
  tags: ['Incident Response', 'Ransomware', 'IR Lifecycle', 'Containment'],
  icon: 'ShieldAlert',
  points: 85,
  estimatedTime: 25,
  tasks: [
    {
      id: 1,
      title: 'Scope the Incident',
      content: `## Scenario

Users report files renamed to \`.LOCKD\` and a ransom note. You're the **Incident Commander**. Work the timeline on the right.

### IR Lifecycle (NIST)
1. **Preparation**
2. **Detection & Analysis** ← you are here
3. **Containment**
4. **Eradication**
5. **Recovery**
6. **Lessons Learned**

First: find **patient zero** (the first infected host) and the **initial access vector**.`,
      artifacts: [
        { name: 'incident_timeline.txt', type: 'log', content: RANSOM_TIMELINE },
      ],
      questions: [
        {
          id: 'q1',
          prompt: 'Which host is patient zero (first infected)?',
          answer: 'HR-PC04',
          points: 15,
          hint: 'The earliest event — an email attachment was executed there.',
          accept: ['hr-pc04', 'HR-PC04'],
        },
        {
          id: 'q2',
          prompt: 'What was the initial access vector? (one phrase, e.g. "phishing email")',
          answer: 'phishing email',
          points: 15,
          hint: 'The first event is an opened email attachment (Invoice_Q1.zip).',
          accept: ['phishing email', 'phishing', 'email attachment', 'malicious attachment', 'phishing attachment'],
        },
        {
          id: 'q3',
          prompt: 'What is the C2 IP address the downloader connected to?',
          answer: '194.5.249.10',
          points: 15,
          hint: 'Outbound TLS at 08:06.',
        },
      ],
    },
    {
      id: 2,
      title: 'Contain & Recover',
      content: `## Decisions

You've scoped it. Now make the **containment** and **recovery** calls.

Key facts from the timeline:
- Attacker deleted shadow copies on FILE-SRV
- But **BACKUP01 is air-gapped and intact**

Think about what a good Incident Commander does — isolate first, don't pay, restore from clean backups.`,
      artifacts: [
        { name: 'incident_timeline.txt', type: 'log', content: RANSOM_TIMELINE },
      ],
      questions: [
        {
          id: 'q4',
          prompt: 'What command did the attacker run to destroy local backups? (the vssadmin command verb + object, e.g. "vssadmin delete shadows")',
          answer: 'vssadmin delete shadows',
          points: 15,
          hint: 'Look at the 08:33 event on FILE-SRV.',
          accept: ['vssadmin delete shadows', 'vssadmin delete shadows /all', 'delete shadows'],
        },
        {
          id: 'q5',
          prompt: 'For recovery, which host holds the clean, usable backup?',
          answer: 'BACKUP01',
          points: 15,
          hint: 'The air-gapped host the attacker could not reach.',
          accept: ['backup01', 'BACKUP01'],
        },
        {
          id: 'q6',
          prompt: 'Best-practice answer: should the organization pay the ransom? (yes/no)',
          answer: 'no',
          points: 10,
          hint: 'With clean air-gapped backups and law-enforcement guidance, paying is discouraged.',
          accept: ['no', 'n', 'do not pay', "don't pay"],
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// ROOM 9: AWS / Cloud Log Analysis (CloudTrail)
// ---------------------------------------------------------------------------
const CLOUDTRAIL_LOG = `time       eventName                  userIdentity            sourceIP         params/notes
14:02:10   ConsoleLogin               iam-user/devops         203.0.113.7      MFA=Yes, SUCCESS
14:20:55   ConsoleLogin               iam-user/svc_ci         45.61.164.9      MFA=No,  SUCCESS (leaked key?)
14:21:30   ListBuckets                iam-user/svc_ci         45.61.164.9
14:22:01   GetObject                  iam-user/svc_ci         45.61.164.9      s3://corp-backups/customers.db
14:22:44   CreateAccessKey            iam-user/svc_ci         45.61.164.9      new key for svc_ci (persistence)
14:23:19   AttachUserPolicy           iam-user/svc_ci         45.61.164.9      AdministratorAccess (privesc!)
14:25:02   PutBucketPolicy            iam-user/svc_ci         45.61.164.9      s3://corp-backups made public!
14:40:00   StopLogging                iam-user/svc_ci         45.61.164.9      CloudTrail disabled (anti-forensics)`;

const room9 = {
  slug: 'aws-cloud-log-analysis',
  title: 'AWS Cloud Log Analysis',
  description: 'A leaked access key led to an AWS account compromise. Analyze CloudTrail to trace the privilege escalation, data access, and anti-forensics.',
  difficulty: 'hard',
  category: 'blue',
  tags: ['Cloud', 'AWS', 'CloudTrail', 'IAM', 'Incident Response'],
  icon: 'Cloud',
  points: 95,
  estimatedTime: 30,
  tasks: [
    {
      id: 1,
      title: 'Spot the Compromise',
      content: `## Scenario

An alert fired on your AWS account. You have a **CloudTrail** export.

### CloudTrail basics
Each event has an **eventName** (the API call), a **userIdentity** (who), and a **sourceIP**.

Signs of compromise:
- **Login without MFA** from an unusual IP
- **CreateAccessKey / AttachUserPolicy** = persistence & privilege escalation
- **PutBucketPolicy** making data public
- **StopLogging** = the attacker covering tracks`,
      artifacts: [
        { name: 'cloudtrail.log', type: 'log', content: CLOUDTRAIL_LOG },
      ],
      questions: [
        {
          id: 'q1',
          prompt: 'Which IAM user was compromised (logged in without MFA from an external IP)?',
          answer: 'svc_ci',
          points: 15,
          hint: 'Look for ConsoleLogin with MFA=No.',
          accept: ['svc_ci', 'iam-user/svc_ci'],
        },
        {
          id: 'q2',
          prompt: 'What is the attacker source IP?',
          answer: '45.61.164.9',
          points: 15,
          hint: 'All the malicious events share one source IP.',
        },
        {
          id: 'q3',
          prompt: 'Which S3 object containing sensitive data did the attacker read? (the file name)',
          answer: 'customers.db',
          points: 15,
          hint: 'GetObject on s3://corp-backups/...',
          accept: ['customers.db', 's3://corp-backups/customers.db', 'corp-backups/customers.db'],
        },
      ],
    },
    {
      id: 2,
      title: 'Persistence & Anti-Forensics',
      content: `## Trace the full attack chain

Continue through the CloudTrail events to identify how the attacker **escalated privileges**, **exposed data**, and **disabled logging**.`,
      artifacts: [
        { name: 'cloudtrail.log', type: 'log', content: CLOUDTRAIL_LOG },
      ],
      questions: [
        {
          id: 'q4',
          prompt: 'Which IAM policy did the attacker attach to gain full admin? (policy name)',
          answer: 'AdministratorAccess',
          points: 20,
          hint: 'AttachUserPolicy event — the most powerful AWS managed policy.',
          accept: ['administratoraccess', 'AdministratorAccess', 'admin'],
        },
        {
          id: 'q5',
          prompt: 'What eventName did the attacker use to disable CloudTrail (anti-forensics)?',
          answer: 'StopLogging',
          points: 20,
          hint: 'The last event in the log.',
          accept: ['stoplogging', 'StopLogging'],
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// ROOM 10: Detection Engineering (Sigma)
// ---------------------------------------------------------------------------
const SYSMON_SAMPLE = `# Sysmon Event ID 1 (Process Creation) sample the rule must catch
Image: C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe
CommandLine: powershell.exe -nop -w hidden -enc SQBFAFgA
ParentImage: C:\\Program Files\\Microsoft Office\\WINWORD.EXE`;

const SIGMA_TEMPLATE = `title: Suspicious PowerShell Spawned by Office
logsource:
  product: windows
  category: process_creation
detection:
  selection:
    ParentImage|endswith: '\\WINWORD.EXE'
    Image|endswith: '\\powershell.exe'
    CommandLine|contains:
      - '-enc'
      - '-nop'
      - 'hidden'
  condition: selection
level: high`;

const room10 = {
  slug: 'detection-engineering-sigma',
  title: 'Detection Engineering with Sigma',
  description: 'Step up to Tier-2. Learn how a Sigma detection rule is structured and how it maps generic detection logic to a real malicious event.',
  difficulty: 'medium',
  category: 'blue',
  tags: ['Detection Engineering', 'Sigma', 'Sysmon', 'MITRE ATT&CK'],
  icon: 'ScanSearch',
  points: 80,
  estimatedTime: 25,
  tasks: [
    {
      id: 1,
      title: 'Anatomy of a Sigma Rule',
      content: `## Scenario

You're a **Detection Engineer**. A common attack is **Office spawning PowerShell with an encoded command** (macro malware). You'll analyze a Sigma rule that detects it.

### Sigma structure
| Field | Purpose |
|-------|---------|
| \`logsource\` | Which log type the rule runs against |
| \`detection.selection\` | The match conditions |
| \`condition\` | How selections combine |
| \`level\` | Severity |

Review the malicious event and the Sigma rule on the right.`,
      artifacts: [
        { name: 'malicious_event.txt', type: 'log', content: SYSMON_SAMPLE },
        { name: 'rule.yml', type: 'log', content: SIGMA_TEMPLATE },
      ],
      questions: [
        {
          id: 'q1',
          prompt: 'What Sysmon Event ID does this rule detect? (process creation)',
          answer: '1',
          points: 15,
          hint: 'Sysmon Event ID 1 = Process Creation.',
          accept: ['1', 'event id 1', 'eventid 1'],
        },
        {
          id: 'q2',
          prompt: 'In the rule, which ParentImage value triggers the detection? (the .EXE)',
          answer: 'WINWORD.EXE',
          points: 15,
          hint: 'ParentImage|endswith in the selection block.',
          accept: ['winword.exe', 'WINWORD.EXE', '\\WINWORD.EXE'],
        },
        {
          id: 'q3',
          prompt: 'What severity level is assigned to this rule?',
          answer: 'high',
          points: 10,
          hint: 'The "level:" field at the bottom.',
        },
      ],
    },
    {
      id: 2,
      title: 'Map to ATT&CK',
      content: `## Tune & classify

Good detections map to **MITRE ATT&CK** and avoid false positives.

The encoded-command PowerShell technique is well-known in ATT&CK, and the CommandLine flags in the rule are the key indicators.`,
      artifacts: [
        { name: 'rule.yml', type: 'log', content: SIGMA_TEMPLATE },
      ],
      questions: [
        {
          id: 'q4',
          prompt: 'Which PowerShell flag (in CommandLine) indicates a base64 EncodedCommand?',
          answer: '-enc',
          points: 20,
          hint: 'One of the CommandLine|contains values; short for -EncodedCommand.',
          accept: ['-enc', 'enc', '-encodedcommand', 'encodedcommand'],
        },
        {
          id: 'q5',
          prompt: 'What MITRE ATT&CK tactic does "Office spawning PowerShell to run code" fall under? (one word)',
          answer: 'execution',
          points: 20,
          hint: 'Running attacker code on the host = this tactic (TA0002).',
          accept: ['execution', 'ta0002'],
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// ROOM 11: SOC Alert Triage (Tier 1 core skill)
// ---------------------------------------------------------------------------
const ALERT_QUEUE = `# SIEM Alert Queue (oldest first)
ID     Time   Severity  Rule                                 Host      User      SourceIP        Status
A-1001 09:02  low       Multiple failed logons (5)            HR01      mwallace  10.0.4.22       new
A-1002 09:05  medium    PowerShell EncodedCommand            FIN02     jbrown    10.0.4.31       new
A-1003 09:06  high      Outbound to known-bad IP (TI match)  FIN02     jbrown    185.220.101.42  new
A-1004 09:09  info      User connected to VPN                REMOTE    ssmith    203.0.113.9     new
A-1005 09:10  low       Windows Defender quarantined EICAR   IT03      admin     10.0.4.9        new
A-1006 09:12  high      Impossible travel (TH->RU in 5 min)  MAIL      psuriya   91.240.118.5    new
A-1007 09:15  medium    New admin account created            DC01      SYSTEM    10.0.4.31       new`;

const ALERT_CONTEXT = `# Enrichment notes (from the analyst's tools)
- A-1001: mwallace fat-fingered password, then logged in fine. Internal IP. Baseline: normal.
- A-1002 + A-1003 + A-1007: all tie to host FIN02 / user jbrown / IP 10.0.4.31 within 10 min:
    encoded PowerShell -> beacon to 185.220.101.42 (Cobalt Strike TI hit) -> new admin on DC01.
- A-1004: ssmith is a known remote employee; VPN login expected. Informational.
- A-1005: EICAR is the standard AV *test* file, not real malware. Defender already quarantined it.
- A-1006: psuriya logged in from Thailand then Russia (91.240.118.5) 5 min apart = impossible travel.`;

const room11 = {
  slug: 'soc-alert-triage',
  title: 'SOC Alert Triage',
  description: 'The core Tier-1 skill: work an alert queue. Decide what to escalate, what to close as false positive, and how to prioritize when everything says "new".',
  difficulty: 'easy',
  category: 'blue',
  tags: ['SOC', 'Alert Triage', 'Tier 1', 'Prioritization', 'Escalation'],
  icon: 'ListChecks',
  points: 70,
  estimatedTime: 20,
  tasks: [
    {
      id: 1,
      title: 'Work the Queue',
      content: `## Scenario

You just started your shift. Seven alerts are sitting in the queue, all marked
**new**. A Tier-1 analyst's job is to **triage**: quickly separate real threats
from noise, prioritize, and escalate what matters.

### Triage mindset
- **Severity is a hint, not the truth** — a "low" can be real, a "high" can be a false positive.
- **Correlate** — alerts that share a host/user/IP in a short window are often *one* incident.
- **Know your test artifacts** — EICAR is a harmless AV test file, not malware.
- **Escalate** confirmed malicious activity to Tier-2 / IR; **close** false positives with a note.`,
      artifacts: [
        { name: 'alert_queue.txt', type: 'log', content: ALERT_QUEUE },
        { name: 'enrichment_notes.txt', type: 'log', content: ALERT_CONTEXT },
      ],
      questions: [
        {
          id: 'q1',
          prompt: 'Which alert should be CLOSED as a false positive because it is a standard AV test file? (alert ID, e.g. A-1000)',
          answer: 'A-1005',
          points: 10,
          hint: 'EICAR is the industry-standard antivirus *test* string — harmless.',
          accept: ['a-1005', 'A-1005', '1005'],
        },
        {
          id: 'q2',
          prompt: 'Three alerts are actually ONE incident (same host/user/IP chain). Which HOST is compromised?',
          answer: 'FIN02',
          points: 15,
          hint: 'A-1002, A-1003, and A-1007 all trace to the same host via user jbrown / 10.0.4.31.',
          accept: ['fin02', 'FIN02'],
        },
        {
          id: 'q3',
          prompt: 'Which single alert is the HIGHEST priority to escalate (confirmed C2 to a known-bad IP)?',
          answer: 'A-1003',
          points: 15,
          hint: 'Outbound to a threat-intel-matched Cobalt Strike IP = active C2.',
          accept: ['a-1003', 'A-1003', '1003'],
        },
      ],
    },
    {
      id: 2,
      title: 'Escalate Correctly',
      content: `## Decisions

Now finalize your triage. A good analyst can justify **why** each alert is
escalated or closed — that reasoning is what gets documented in the ticket.`,
      artifacts: [
        { name: 'alert_queue.txt', type: 'log', content: ALERT_QUEUE },
        { name: 'enrichment_notes.txt', type: 'log', content: ALERT_CONTEXT },
      ],
      questions: [
        {
          id: 'q4',
          prompt: 'A-1006 shows a login from Thailand then Russia 5 minutes apart. What is this detection called? (two words)',
          answer: 'impossible travel',
          points: 15,
          hint: 'A user cannot physically be in two distant countries within 5 minutes.',
          accept: ['impossible travel', 'impossibletravel'],
        },
        {
          id: 'q5',
          prompt: 'Which LOW-severity alert (A-1001) is a genuine false positive — a user who mistyped their password?',
          answer: 'A-1001',
          points: 15,
          hint: 'The enrichment note says mwallace fat-fingered the password then logged in fine.',
          accept: ['a-1001', 'A-1001', '1001'],
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// ROOM 12: Windows Event Log Fundamentals (Tier 1 foundation)
// ---------------------------------------------------------------------------
const EVENTID_LOG = `EventID  Meaning                              LogonType / Detail
4624     Successful logon                     Type 2=interactive, 3=network, 10=RemoteInteractive(RDP)
4625     Failed logon                         (status/sub-status shows reason)
4634     Logoff
4648     Logon using explicit credentials     (runas / lateral movement hint)
4672     Special privileges assigned to logon (admin-equivalent logon)
4688     A new process was created            (NewProcessName + CommandLine)
4720     A user account was created
4722     A user account was enabled
4728     Member added to a security-enabled global group
4732     Member added to a security-enabled local group (e.g. Administrators)
4740     A user account was locked out
7045     A new service was installed          (System log)`;

const EVENT_SAMPLE = `Time   EventID  Account   Detail
10:00   4625    admin     LogonType 10, status 0xC000006A (bad password)
10:01   4625    admin     LogonType 10, status 0xC000006A
10:02   4624    admin     LogonType 10  (SUCCESS from same source)
10:02   4672    admin     Special privileges assigned
10:03   4688    admin     NewProcessName: cmd.exe  CommandLine: cmd /c net user
10:04   4720    SYSTEM    New account created: "helpdesk_svc"
10:04   4732    SYSTEM    "helpdesk_svc" added to Administrators`;

const room12 = {
  slug: 'windows-event-log-fundamentals',
  title: 'Windows Event Log Fundamentals',
  description: 'Master the Windows Security Event IDs every SOC analyst must know cold. Read a real logon-to-privilege-escalation sequence and identify each step.',
  difficulty: 'easy',
  category: 'blue',
  tags: ['Windows', 'Event Logs', 'Tier 1', 'Fundamentals', 'SIEM'],
  icon: 'FileSearch',
  points: 65,
  estimatedTime: 20,
  tasks: [
    {
      id: 1,
      title: 'Learn the Event IDs',
      content: `## Why this matters

SOC analysts spend a huge chunk of their day reading Windows logs. Knowing the
**key Event IDs** by heart is non-negotiable — it's asked in almost every SOC
interview.

Study the reference table on the right, then answer.

> **Logon Types** to remember: **2** = interactive (at the keyboard), **3** =
> network (SMB/shares), **10** = RemoteInteractive (**RDP**).`,
      artifacts: [
        { name: 'event_id_reference.txt', type: 'log', content: EVENTID_LOG },
      ],
      questions: [
        {
          id: 'q1',
          prompt: 'What Event ID means a FAILED logon?',
          answer: '4625',
          points: 10,
          hint: 'Successful = 4624, failed = one more than that.',
        },
        {
          id: 'q2',
          prompt: 'Which LogonType number indicates an RDP (RemoteInteractive) logon?',
          answer: '10',
          points: 10,
          hint: 'Type 2 = interactive, 3 = network, 10 = RDP.',
          accept: ['10', 'type 10', 'logontype 10'],
        },
        {
          id: 'q3',
          prompt: 'What Event ID records that a NEW USER ACCOUNT was created?',
          answer: '4720',
          points: 10,
          hint: 'It is in the 47xx range — account creation.',
        },
      ],
    },
    {
      id: 2,
      title: 'Read the Sequence',
      content: `## Put it together

The sample on the right is a real attack sequence in Windows events. Read it
top to bottom and reconstruct what happened — from initial access to privilege
escalation and persistence.`,
      artifacts: [
        { name: 'event_id_reference.txt', type: 'log', content: EVENTID_LOG },
        { name: 'sequence.txt', type: 'log', content: EVENT_SAMPLE },
      ],
      questions: [
        {
          id: 'q4',
          prompt: 'The sequence starts with two 4625 then a 4624 over LogonType 10. What technique is this? (two words)',
          answer: 'brute force',
          points: 15,
          hint: 'Repeated failed RDP logons followed by a success.',
          accept: ['brute force', 'bruteforce', 'rdp brute force'],
        },
        {
          id: 'q5',
          prompt: 'What is the name of the backdoor account the attacker created and added to Administrators?',
          answer: 'helpdesk_svc',
          points: 20,
          hint: 'See the 4720 (created) then 4732 (added to Administrators) events.',
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// ROOM 13: Threat Intelligence & IOC Enrichment (Tier 2)
// ---------------------------------------------------------------------------
const IOC_LIST = `# Indicators pulled from an incident
Type     Indicator                                          Notes
IP       185.220.101.42                                     seen in outbound beacon
Domain   cdn.update-sync[.]net                              resolved by infected host
Hash     9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd  dropped file (SHA256, truncated shown)
URL      hxxp://185.220.101.42/gate.php                     beacon callback
Email    billing@paypa1-secure[.]com                        phishing sender`;

const TI_ENRICHMENT = `# Threat-intel platform results (simulated OSINT / VT / MISP)
185.220.101.42
  - VirusTotal: 14/89 vendors flag malicious
  - Category: Cobalt Strike C2
  - ASN: known bulletproof hosting
  - First seen: 12 days ago; still active
  - Linked campaign: "SyncCrypt" (financially motivated)

cdn.update-sync[.]net
  - Registered: 14 days ago (newly registered domain = suspicious)
  - Resolves to: 185.220.101.42 (same C2 IP)
  - Certificate: self-signed

Hash 9f86d081...
  - VT: 52/72 detections, family: Cobalt Strike beacon
  - First submitted: from Thailand, 10 days ago

Actor attribution note:
  - TTPs (Kerberoasting -> Cobalt Strike -> ransomware) match the "SyncCrypt" group,
    a financially motivated (not nation-state) actor.`;

const room13 = {
  slug: 'threat-intel-ioc-enrichment',
  title: 'Threat Intelligence & IOC Enrichment',
  description: 'Step into Tier-2 work. Take raw IOCs from an incident, enrich them with threat intelligence, pivot to find related infrastructure, and attribute the campaign.',
  difficulty: 'medium',
  category: 'blue',
  tags: ['Threat Intelligence', 'IOC', 'Enrichment', 'Tier 2', 'OSINT'],
  icon: 'Radar',
  points: 85,
  estimatedTime: 25,
  tasks: [
    {
      id: 1,
      title: 'Enrich the IOCs',
      content: `## Scenario

Tier-1 handed you a confirmed incident with a list of raw **IOCs** (Indicators of
Compromise). Your Tier-2 job: **enrich** them with threat intelligence to
understand the threat, then **pivot** to find related infrastructure.

### Enrichment tools (real world)
- **VirusTotal** — reputation of hashes/IPs/domains/URLs
- **MISP / OpenCTI** — threat-intel platforms
- **Passive DNS / WHOIS** — domain age, resolution history
- **Shodan / urlscan.io** — infrastructure

> **Newly registered domains (NRDs)** and **self-signed certs** are classic
> malicious-infra tells.`,
      artifacts: [
        { name: 'iocs.txt', type: 'log', content: IOC_LIST },
        { name: 'ti_enrichment.txt', type: 'log', content: TI_ENRICHMENT },
      ],
      questions: [
        {
          id: 'q1',
          prompt: 'What malware family does the C2 IP and the dropped hash belong to? (two words)',
          answer: 'cobalt strike',
          points: 20,
          hint: 'Both VirusTotal results name the same red-team framework abused by attackers.',
          accept: ['cobalt strike', 'cobaltstrike', 'cobalt-strike'],
        },
        {
          id: 'q2',
          prompt: 'The malicious domain resolves to which IP address? (pivoting IOCs)',
          answer: '185.220.101.42',
          points: 15,
          hint: 'The enrichment shows cdn.update-sync[.]net resolves to the same C2 IP.',
        },
        {
          id: 'q3',
          prompt: 'What property of the domain (age) makes it suspicious? (two words, e.g. "self signed")',
          answer: 'newly registered',
          points: 15,
          hint: 'Registered 14 days ago — a newly ______ domain (NRD).',
          accept: ['newly registered', 'new domain', 'recently registered', 'nrd'],
        },
      ],
    },
    {
      id: 2,
      title: 'Attribute the Campaign',
      content: `## Attribution

With enriched IOCs and observed TTPs, you can attribute the activity to a known
campaign or actor — and judge their **motivation** (which shapes the response).`,
      artifacts: [
        { name: 'ti_enrichment.txt', type: 'log', content: TI_ENRICHMENT },
      ],
      questions: [
        {
          id: 'q4',
          prompt: 'What is the name of the campaign/actor group these TTPs match?',
          answer: 'SyncCrypt',
          points: 20,
          hint: 'Named in both the IP campaign link and the attribution note.',
          accept: ['synccrypt', 'SyncCrypt'],
        },
        {
          id: 'q5',
          prompt: 'What is the actor\'s motivation: financially motivated or nation-state?',
          answer: 'financially motivated',
          points: 15,
          hint: 'The attribution note states it explicitly.',
          accept: ['financially motivated', 'financial', 'financially-motivated', 'money'],
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// ROOM 14: Business Email Compromise (Tier 2)
// ---------------------------------------------------------------------------
const BEC_HEADERS = `From: "CEO Somchai Jaidee" <somchai.jaidee@company-th.com>
Reply-To: <s.jaidee.finance@gmail.com>
Return-Path: <bounce@mailer-relay-42.xyz>
Received: from mailer-relay-42.xyz (185.53.178.9)
Authentication-Results: spf=softfail; dkim=none; dmarc=fail
To: <finance.manager@company-th.com>
Subject: Urgent - Confidential Wire Transfer Needed Today
Date: Fri, 04 Jul 2026 14:22:00 +0700

Hi, I'm in a meeting and can't talk. I need you to process an urgent wire
transfer of THB 2,400,000 to a new vendor today. Keep this confidential until
it's done. Send confirmation to my personal email once complete.

Account: 555-1-234567  Bank: [redacted]
Thanks, Somchai`;

const BEC_CONTEXT = `# Investigation context
- The real CEO's email is somchai.jaidee@company-th.com (display name matches).
- BUT: Reply-To points to a Gmail address, NOT the corporate domain.
- Return-Path / Received show the mail actually came from mailer-relay-42.xyz (185.53.178.9),
  not company-th.com mail servers.
- SPF softfail, DKIM none, DMARC fail — the domain was spoofed in the display name only.
- No malware, no links, no attachment. Pure social engineering.
- Hallmarks: urgency, secrecy, authority (CEO), request to change payment details,
  redirect confirmation to a personal email.`;

const room14 = {
  slug: 'business-email-compromise',
  title: 'Business Email Compromise (BEC)',
  description: 'Investigate a CEO-fraud wire-transfer request. No malware, no links — just social engineering. Learn to spot BEC through header analysis and behavioral red flags.',
  difficulty: 'medium',
  category: 'blue',
  tags: ['Phishing', 'BEC', 'Social Engineering', 'Email', 'Tier 2'],
  icon: 'MailWarning',
  points: 80,
  estimatedTime: 22,
  tasks: [
    {
      id: 1,
      title: 'Header Analysis',
      content: `## Scenario

The finance manager forwarded an urgent "CEO" email asking for a **THB 2.4M wire
transfer**. There's no malware and no link — this is **Business Email Compromise
(BEC)**, pure social engineering, and it's one of the costliest attack types.

Analyze the headers on the right. In BEC the **display name** often looks right
while the **actual sender / Reply-To** does not.`,
      artifacts: [
        { name: 'ceo_email.eml', type: 'email', content: BEC_HEADERS },
        { name: 'investigation_notes.txt', type: 'log', content: BEC_CONTEXT },
      ],
      questions: [
        {
          id: 'q1',
          prompt: 'The Reply-To points to what kind of address that a real CEO would not use for corporate wire requests? (the email domain, e.g. example.com)',
          answer: 'gmail.com',
          points: 15,
          hint: 'Reply-To is s.jaidee.finance@______ — a free personal mail provider.',
          accept: ['gmail.com', 'gmail'],
        },
        {
          id: 'q2',
          prompt: 'Did DMARC pass or fail?',
          answer: 'fail',
          points: 15,
          hint: 'Check Authentication-Results.',
        },
        {
          id: 'q3',
          prompt: 'What is the sending IP the mail actually originated from (per Received/Return-Path)?',
          answer: '185.53.178.9',
          points: 15,
          hint: 'The Received header shows mailer-relay-42.xyz (IP).',
        },
      ],
    },
    {
      id: 2,
      title: 'Behavioral Red Flags',
      content: `## Beyond the headers

BEC succeeds through **psychology**, not malware. Recognizing the behavioral
pattern is what stops the wire from going out.`,
      artifacts: [
        { name: 'ceo_email.eml', type: 'email', content: BEC_HEADERS },
        { name: 'investigation_notes.txt', type: 'log', content: BEC_CONTEXT },
      ],
      questions: [
        {
          id: 'q4',
          prompt: 'What attack category is this? (three words)',
          answer: 'business email compromise',
          points: 20,
          hint: 'CEO fraud requesting a wire transfer = B__ E__ C__.',
          accept: ['business email compromise', 'bec', 'ceo fraud'],
        },
        {
          id: 'q5',
          prompt: 'What is the correct response before any money moves: verify via a separate trusted channel, or reply to the email? (answer "verify" or "reply")',
          answer: 'verify',
          points: 15,
          hint: 'Never trust the email itself — call the CEO on a known number (out-of-band verification).',
          accept: ['verify', 'out of band', 'out-of-band', 'call', 'separate channel'],
        },
      ],
    },
  ],
};

const rooms = [room1, room2, room3, room4, room5, room6, room7, room8, room9, room10, room11, room12, room13, room14];

// Assign stable numeric ids + total question count
rooms.forEach((r, i) => {
  r.id = i + 1;
  r.totalQuestions = r.tasks.reduce((sum, t) => sum + (t.questions?.length || 0), 0);
  r.totalPoints = r.tasks.reduce(
    (sum, t) => sum + (t.questions || []).reduce((s, q) => s + (q.points || 0), 0),
    0
  );
});

/** Normalize an answer for comparison */
function normalize(str) {
  return String(str == null ? '' : str).trim().toLowerCase();
}

/** Check a submitted answer against a question's accepted answers */
function checkAnswer(question, submitted) {
  const sub = normalize(submitted);
  if (!sub) return false;
  const accepted = question.accept && question.accept.length
    ? question.accept
    : [question.answer];
  return accepted.some((a) => normalize(a) === sub);
}

/** Public view of a room - answers/hints handling for the client.
 *  Answers are ALWAYS stripped. Hints are kept (they cost nothing here). */
function toPublicRoom(room) {
  return {
    id: room.id,
    slug: room.slug,
    title: room.title,
    description: room.description,
    difficulty: room.difficulty,
    category: room.category,
    tags: room.tags,
    icon: room.icon,
    points: room.totalPoints,
    estimatedTime: room.estimatedTime,
    totalQuestions: room.totalQuestions,
    tasks: room.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      content: t.content,
      artifacts: t.artifacts || [],
      questions: (t.questions || []).map((q) => ({
        id: q.id,
        prompt: q.prompt,
        points: q.points,
        hint: q.hint || null,
      })),
    })),
  };
}

/** Summary card view (no task content) */
function toSummary(room) {
  return {
    id: room.id,
    slug: room.slug,
    title: room.title,
    description: room.description,
    difficulty: room.difficulty,
    category: room.category,
    tags: room.tags,
    icon: room.icon,
    points: room.totalPoints,
    estimatedTime: room.estimatedTime,
    totalQuestions: room.totalQuestions,
  };
}

function getRoomById(id) {
  return rooms.find((r) => String(r.id) === String(id) || r.slug === String(id));
}

function findQuestion(room, questionId) {
  for (const task of room.tasks) {
    const q = (task.questions || []).find((qq) => qq.id === questionId);
    if (q) return q;
  }
  return null;
}

module.exports = {
  rooms,
  getRoomById,
  findQuestion,
  checkAnswer,
  toPublicRoom,
  toSummary,
};
