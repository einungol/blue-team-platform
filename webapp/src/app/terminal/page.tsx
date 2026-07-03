'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Shield, Terminal, Plus, Trash2, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TerminalSession {
  id: string;
  lab_id: number | null;
  lab_name?: string;
  created_at: string;
}

function TerminalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const terminalRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const termRef = useRef<any>(null);
  const fitRef = useRef<any>(null);

  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [labId, setLabId] = useState<number | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);

  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Initialize terminals list
  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  // Check for labId in URL
  useEffect(() => {
    const labParam = searchParams.get('lab');
    if (labParam) {
      setLabId(parseInt(labParam));
      setShowNewDialog(true);
    }
  }, [searchParams]);

  const loadSessions = async () => {
    try {
      const token = api.getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/terminals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (e) {
      console.error('Failed to load sessions:', e);
    }
  };

  const createTerminal = async () => {
    setLoading(true);
    try {
      const token = api.getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/terminals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ labId, cols: 80, rows: 24 })
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentSession(data.id);
        connectWebSocket(data.id);
        setShowNewDialog(false);
        setLabId(null);
        loadSessions();
      }
    } catch (e) {
      console.error('Failed to create terminal:', e);
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = (sessionId: string) => {
    const token = api.getToken();
    if (!token || !terminalRef.current) return;

    // Dynamically import xterm
    import('xterm').then(async ({ Terminal }) => {
      const { FitAddon } = await import('xterm-addon-fit');

      const term = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        theme: {
          background: '#0a0a0a',
          foreground: '#e0e0e0',
          cursor: '#00d4aa',
          black: '#000000',
          red: '#ff4757',
          green: '#2ed573',
          yellow: '#ffa502',
          blue: '#3742fa',
          magenta: '#ff6b81',
          cyan: '#00d4aa',
          white: '#e0e0e0'
        }
      });

      const fit = new FitAddon();
      term.loadAddon(fit);

      term.open(terminalRef.current!);
      fit.fit();

      termRef.current = term;
      fitRef.current = fit;

      const ws = new WebSocket(`${wsUrl}?token=${token}&id=${sessionId}`);

      ws.onopen = () => {
        setConnected(true);
        term.writeln('\x1b[32m╔═══════════════════════════════════════════════════╗');
        term.writeln('║      Blue Team Lab Platform - Interactive Terminal       ║');
        term.writeln('╚═══════════════════════════════════════════════════╝\x1b[0m\r\n');
      };

      ws.onmessage = (event) => {
        term.write(event.data);
      };

      ws.onclose = () => {
        setConnected(false);
        term.writeln('\r\n\x1b[31m[Disconnected]\x1b[0m');
      };

      ws.onerror = () => {
        setConnected(false);
        term.writeln('\r\n\x1b[31m[Connection Error]\x1b[0m');
      };

      // Use onData event listener
      term.onData((data: string) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      });

      wsRef.current = ws;

      // Handle resize
      const handleResize = () => {
        if (fitRef.current) {
          fitRef.current.fit();
        }
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    });
  };

  const deleteTerminal = async (id: string) => {
    try {
      const token = api.getToken();
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/terminals/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (currentSession === id) {
        wsRef.current?.close();
        setCurrentSession(null);
        setConnected(false);
      }
      loadSessions();
    } catch (e) {
      console.error('Failed to delete terminal:', e);
    }
  };

  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-emerald-400">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800 bg-zinc-900/50 p-4">
        <div className="mb-6 flex items-center gap-2">
          <Shield className="h-8 w-8 text-emerald-400" />
          <span className="text-xl font-bold text-white">BlueTeam</span>
        </div>

        <nav className="space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <Shield className="h-4 w-4" />
            แดชบอร์ด
          </Link>
          <Link
            href="/terminal"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm bg-emerald-500/10 text-emerald-400"
          >
            <Terminal className="h-4 w-4" />
            Terminal
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-white">Terminal</h1>
              {currentSession && (
                <span className={`flex items-center gap-2 text-sm ${connected ? 'text-emerald-400' : 'text-red-400'}`}>
                  <span className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setShowNewDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="mr-2 h-4 w-4" />
                New Terminal
              </Button>
            </div>
          </div>
        </div>

        {/* Terminal Area */}
        <div className="flex-1 flex">
          {/* Sessions List */}
          <div className="w-64 border-r border-zinc-800 p-4">
            <h3 className="mb-3 text-sm font-medium text-zinc-400">Active Sessions</h3>
            <div className="space-y-2">
              {sessions.length === 0 ? (
                <p className="text-sm text-zinc-500">No active sessions</p>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`flex items-center justify-between rounded-lg p-2 cursor-pointer ${
                      currentSession === session.id ? 'bg-emerald-500/20' : 'bg-zinc-800/50 hover:bg-zinc-800'
                    }`}
                    onClick={() => {
                      if (currentSession !== session.id) {
                        wsRef.current?.close();
                        setCurrentSession(session.id);
                        connectWebSocket(session.id);
                      }
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{session.id.slice(0, 8)}...</p>
                      <p className="text-xs text-zinc-500">{new Date(session.created_at).toLocaleTimeString()}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-zinc-400 hover:text-red-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTerminal(session.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Terminal */}
          <div className="flex-1 bg-black p-2">
            {currentSession ? (
              <div ref={terminalRef} className="h-full w-full" />
            ) : (
              <div className="flex h-full items-center justify-center text-zinc-500">
                <div className="text-center">
                  <Terminal className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p>Select or create a terminal session</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* New Terminal Dialog */}
        {showNewDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <Card className="w-full max-w-md border-zinc-800 bg-zinc-900">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">New Terminal</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setShowNewDialog(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Lab ID (optional)</label>
                  <input
                    type="number"
                    value={labId || ''}
                    onChange={(e) => setLabId(e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Leave empty for plain terminal"
                    className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white"
                  />
                </div>
                <Button
                  onClick={createTerminal}
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Terminal
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

export default function TerminalPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-emerald-400">กำลังโหลด...</div>
      </div>
    }>
      <TerminalContent />
    </Suspense>
  );
}