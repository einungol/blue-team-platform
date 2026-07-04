'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Sidebar } from '@/components/sidebar';
import { Markdown } from '@/components/markdown';
import {
  ArrowLeft,
  FileText,
  Mail,
  CheckCircle2,
  Lightbulb,
  Loader2,
  Trophy,
  Flag,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import type { RoomDetail, RoomQuestion, RoomArtifact } from '@/types';

export default function RoomPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const roomId = params.id as string;

  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [solved, setSolved] = useState<Set<string>>(new Set());
  const [earned, setEarned] = useState(0);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  const load = useCallback(() => {
    api.getRoom(roomId)
      .then((data) => {
        setRoom(data);
        setSolved(new Set(data.solved || []));
        setEarned(data.earnedPoints || 0);
      })
      .catch(() => router.push('/rooms'))
      .finally(() => setLoading(false));
  }, [roomId, router]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const handleSolved = (questionId: string, points: number, roomCompleted?: boolean) => {
    setSolved((prev) => new Set(prev).add(questionId));
    setEarned((prev) => prev + points);
    if (roomCompleted) {
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 4000);
    }
  };

  if (authLoading || !user || loading || !room) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-emerald-400">Loading room...</div>
      </div>
    );
  }

  const progress = room.totalQuestions
    ? Math.round((solved.size / room.totalQuestions) * 100)
    : 0;
  const allDone = solved.size >= room.totalQuestions;

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
          <div className="p-6">
            <Link
              href="/rooms"
              className="mb-3 flex w-fit items-center gap-2 text-sm text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Rooms
            </Link>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">{room.title}</h1>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {room.tags.map((t) => (
                    <span key={t} className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-xs text-zinc-500">points</div>
                  <div className="text-lg font-bold text-emerald-400">
                    {earned}/{room.points}
                  </div>
                </div>
                <div className="w-40">
                  <div className="mb-1 flex justify-between text-xs text-zinc-500">
                    <span>{solved.size}/{room.totalQuestions} questions</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-800">
                    <div
                      className="h-2 rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Completion banner */}
        {allDone && (
          <div className="mx-6 mt-6 flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
            <Trophy className="h-6 w-6 text-emerald-400" />
            <div>
              <p className="font-semibold text-emerald-400">Great work! You completed every question in this room 🎉</p>
              <p className="text-sm text-zinc-400">earned {room.points} full points</p>
            </div>
          </div>
        )}

        {/* Tasks */}
        <div className="space-y-8 p-6">
          {room.tasks.map((task, idx) => (
            <div key={task.id} className="grid gap-6 lg:grid-cols-5">
              {/* Content + questions */}
              <div className="lg:col-span-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                    {idx + 1}
                  </span>
                  <h2 className="text-lg font-semibold text-white">{task.title}</h2>
                </div>

                <Card className="mb-4 border-zinc-800 bg-zinc-900/50">
                  <CardContent className="p-5">
                    <Markdown>{task.content}</Markdown>
                  </CardContent>
                </Card>

                {task.questions.map((q) => (
                  <QuestionCard
                    key={q.id}
                    roomId={room.id}
                    question={q}
                    solved={solved.has(q.id)}
                    onSolved={handleSolved}
                  />
                ))}
              </div>

              {/* Artifacts */}
              <div className="lg:col-span-2">
                {task.artifacts.length > 0 && (
                  <div className="sticky top-40 space-y-3">
                    {task.artifacts.map((a) => (
                      <ArtifactViewer key={a.name} artifact={a} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {celebrate && <Confetti />}
    </div>
  );
}

// ---------------------------------------------------------------------------
function QuestionCard({
  roomId,
  question,
  solved,
  onSolved,
}: {
  roomId: number;
  question: RoomQuestion;
  solved: boolean;
  onSolved: (questionId: string, points: number, roomCompleted?: boolean) => void;
}) {
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const submit = async () => {
    if (!value.trim() || solved) return;
    setSubmitting(true);
    setWrong(false);
    try {
      const res = await api.submitAnswer(roomId, question.id, value);
      if (res.correct) {
        onSolved(question.id, res.points || 0, res.roomCompleted);
      } else {
        setWrong(true);
        setTimeout(() => setWrong(false), 2000);
      }
    } catch {
      setWrong(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card
      className={`mb-3 border-zinc-800 transition-colors ${
        solved ? 'border-emerald-500/40 bg-emerald-500/5' : 'bg-zinc-900/50'
      }`}
    >
      <CardContent className="p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            {solved ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            ) : (
              <Flag className="mt-0.5 h-5 w-5 shrink-0 text-zinc-500" />
            )}
            <p className="text-sm text-zinc-200">{question.prompt}</p>
          </div>
          <span className="shrink-0 rounded bg-zinc-800 px-2 py-0.5 text-xs text-emerald-400">
            +{question.points}
          </span>
        </div>

        {solved ? (
          <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4" /> Solved
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder="Type your answer..."
                className={`border-zinc-700 bg-zinc-800 font-mono text-white ${
                  wrong ? 'border-red-500' : ''
                }`}
              />
              <Button
                onClick={submit}
                disabled={submitting || !value.trim()}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit'}
              </Button>
            </div>

            {wrong && (
              <p className="mt-2 flex items-center gap-1 text-xs text-red-400">
                <X className="h-3 w-3" /> Not quite, try again
              </p>
            )}

            {question.hint && (
              <div className="mt-2">
                {showHint ? (
                  <div className="flex items-start gap-2 rounded-md bg-yellow-500/10 px-3 py-2 text-xs text-yellow-300">
                    <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{question.hint}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowHint(true)}
                    className="flex items-center gap-1 text-xs text-zinc-500 hover:text-yellow-400"
                  >
                    <Lightbulb className="h-3.5 w-3.5" /> Show hint
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
function ArtifactViewer({ artifact }: { artifact: RoomArtifact }) {
  const Icon = artifact.type === 'email' ? Mail : FileText;
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
      <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900 px-3 py-2">
        <Icon className="h-4 w-4 text-emerald-400" />
        <span className="font-mono text-xs text-zinc-300">{artifact.name}</span>
      </div>
      <pre className="max-h-[500px] overflow-auto p-3 text-xs leading-relaxed text-zinc-300">
        <code>{artifact.content}</code>
      </pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
function Confetti() {
  const pieces = Array.from({ length: 40 });
  const colors = ['#10b981', '#34d399', '#fbbf24', '#60a5fa', '#f87171'];
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((_, i) => (
        <span
          key={i}
          className="absolute top-0 h-2 w-2 animate-[fall_3s_linear_forwards]"
          style={{
            left: `${Math.random() * 100}%`,
            backgroundColor: colors[i % colors.length],
            animationDelay: `${Math.random() * 1.5}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}