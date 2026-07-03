'use client';

import { useEffect, useState, useRef, useCallback, type KeyboardEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Sidebar } from '@/components/sidebar';
import { ArrowLeft, Flag, CheckCircle2, Target, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

interface Line {
  type: 'input' | 'output' | 'system';
  text: string;
}

interface InteractiveLab {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  tags: string[];
  points: number;
  objectives: string[];
  welcome: string;
  flagFormat: string;
}

export default function InteractiveLabPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const labId = params.id as string;

  const [lab, setLab] = useState<InteractiveLab | null>(null);
  const [loading, setLoading] = useState(true);
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [running, setRunning] = useState(false);

  const [flag, setFlag] = useState('');
  const [flagResult, setFlagResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [solved, setSolved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const termRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  const load = useCallback(() => {
    api.getInteractiveLab(labId)
      .then((data) => {
        setLab(data);
        setLines([
          { type: 'system', text: data.welcome },
          { type: 'system', text: `Flag format: ${data.flagFormat}` },
        ]);
      })
      .catch(() => router.push('/interactive'))
      .finally(() => setLoading(false));
  }, [labId, router]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  // Auto-scroll terminal to bottom
  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [lines]);

  const runCommand = async (cmd: string) => {
    const trimmed = cmd.trim();
    setLines((prev) => [...prev, { type: 'input', text: trimmed }]);

    if (!trimmed) return;
    setHistory((prev) => [...prev, trimmed]);
    setHistIdx(-1);

    if (trimmed === 'clear') {
      setLines([]);
      return;
    }

    setRunning(true);
    try {
      const res = await api.execCommand(labId, trimmed);
      if (res.output === '\x00CLEAR\x00') {
        setLines([]);
      } else if (res.output !== '') {
        setLines((prev) => [...prev, { type: 'output', text: res.output }]);
      }
    } catch {
      setLines((prev) => [...prev, { type: 'output', text: 'error: command failed' }]);
    } finally {
      setRunning(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      runCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const idx = histIdx === -1 ? history.length - 1 : Math.max(0, histIdx - 1);
      setHistIdx(idx);
      setInput(history[idx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx === -1) return;
      const idx = histIdx + 1;
      if (idx >= history.length) {
        setHistIdx(-1);
        setInput('');
      } else {
        setHistIdx(idx);
        setInput(history[idx]);
      }
    }
  };

  const submitFlag = async () => {
    if (!flag.trim()) return;
    setSubmitting(true);
    setFlagResult(null);
    try {
      const res = await api.submitInteractiveFlag(labId, flag);
      if (res.correct) {
        setSolved(true);
        setFlagResult({ ok: true, msg: `ถูกต้อง! ได้รับ ${res.points || 0} คะแนน 🎉` });
      } else {
        setFlagResult({ ok: false, msg: 'flag ไม่ถูกต้อง ลองวิเคราะห์ log อีกครั้ง' });
      }
    } catch {
      setFlagResult({ ok: false, msg: 'เกิดข้อผิดพลาด' });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user || loading || !lab) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-emerald-400">กำลังโหลด lab...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />
      <main className="flex-1 p-6">
        <Link
          href="/interactive"
          className="mb-4 flex w-fit items-center gap-2 text-sm text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> กลับไปยัง Terminal Labs
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">{lab.title}</h1>
          <p className="text-zinc-400">{lab.description}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Terminal */}
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-lg border border-zinc-800 bg-black shadow-xl">
              {/* Terminal title bar */}
              <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900 px-4 py-2">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="h-3 w-3 rounded-full bg-yellow-500" />
                  <span className="h-3 w-3 rounded-full bg-green-500" />
                </div>
                <span className="ml-2 font-mono text-xs text-zinc-400">
                  analyst@bluelab: ~/case
                </span>
              </div>

              {/* Terminal body */}
              <div
                ref={termRef}
                onClick={() => inputRef.current?.focus()}
                className="h-[460px] cursor-text overflow-y-auto p-4 font-mono text-sm leading-relaxed"
              >
                {lines.map((line, i) => {
                  if (line.type === 'input') {
                    return (
                      <div key={i} className="flex gap-2">
                        <span className="shrink-0 text-emerald-400">analyst@bluelab:~/case$</span>
                        <span className="whitespace-pre-wrap break-all text-zinc-200">{line.text}</span>
                      </div>
                    );
                  }
                  if (line.type === 'system') {
                    return (
                      <div key={i} className="whitespace-pre-wrap break-all text-cyan-400/80">
                        {line.text}
                      </div>
                    );
                  }
                  return (
                    <div key={i} className="whitespace-pre-wrap break-all text-zinc-300">
                      {line.text}
                    </div>
                  );
                })}

                {/* Live input line */}
                <div className="flex gap-2">
                  <span className="shrink-0 text-emerald-400">analyst@bluelab:~/case$</span>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    disabled={running}
                    autoFocus
                    spellCheck={false}
                    autoComplete="off"
                    className="flex-1 bg-transparent text-zinc-200 caret-emerald-400 outline-none"
                  />
                </div>
              </div>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              💡 ลองพิมพ์ <code className="text-emerald-400">help</code> เพื่อดูคำสั่งทั้งหมด · ใช้ ↑ ↓ เพื่อเรียกคำสั่งก่อนหน้า · pipe ได้ เช่น <code className="text-emerald-400">grep 401 access.log | wc -l</code>
            </p>
          </div>

          {/* Objectives + flag */}
          <div className="space-y-4">
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-emerald-400" />
                  <h3 className="font-semibold text-white">ภารกิจ</h3>
                </div>
                <ol className="space-y-2">
                  {lab.objectives.map((obj, i) => (
                    <li key={i} className="flex gap-2 text-sm text-zinc-400">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs text-zinc-300">
                        {i + 1}
                      </span>
                      {obj}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            <Card className={`border-zinc-800 ${solved ? 'border-emerald-500/40 bg-emerald-500/5' : 'bg-zinc-900/50'}`}>
              <CardContent className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Flag className="h-4 w-4 text-emerald-400" />
                  <h3 className="font-semibold text-white">Submit Flag</h3>
                </div>

                {solved ? (
                  <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" /> เสร็จสมบูรณ์! ได้รับ {lab.points} คะแนน
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <Input
                        value={flag}
                        onChange={(e) => setFlag(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && submitFlag()}
                        placeholder={lab.flagFormat}
                        className="border-zinc-700 bg-zinc-800 font-mono text-white"
                      />
                      <Button
                        onClick={submitFlag}
                        disabled={submitting || !flag.trim()}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'ส่ง'}
                      </Button>
                    </div>
                    {flagResult && (
                      <p
                        className={`mt-2 flex items-center gap-1 text-xs ${
                          flagResult.ok ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {flagResult.ok ? <CheckCircle2 className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        {flagResult.msg}
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}