'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Sidebar } from '@/components/sidebar';
import {
  ShieldCheck,
  Crosshair,
  Cloud,
  Route,
  DoorOpen,
  SquareTerminal,
  CheckCircle2,
  Circle,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const iconMap: Record<string, LucideIcon> = {
  ShieldCheck, Crosshair, Cloud, Route,
};

const diffStyle: Record<string, string> = {
  easy: 'bg-green-500/20 text-green-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  hard: 'bg-red-500/20 text-red-400',
};

interface Step {
  kind: 'room' | 'lab';
  id: number;
  href: string;
  title: string;
  difficulty: string;
  points: number;
  tags: string[];
  completed: boolean;
  progress: number;
}

interface Path {
  id: number;
  slug: string;
  title: string;
  description: string;
  icon: string;
  level: string;
  totalSteps: number;
  completedSteps: number;
  progress: number;
  steps: Step[];
}

export default function PathsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [paths, setPaths] = useState<Path[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      api.getPaths()
        .then((data) => {
          setPaths(data);
          if (data.length) setOpenId(data[0].id);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-emerald-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Learning Paths</h1>
          <p className="text-zinc-400">
            Recommended sequences of rooms and labs. Follow a path top to bottom — or jump to any step.
          </p>
        </div>

        {loading ? (
          <div className="text-center text-zinc-400">Loading...</div>
        ) : (
          <div className="space-y-4">
            {paths.map((path) => {
              const Icon = iconMap[path.icon] || Route;
              const isOpen = openId === path.id;
              return (
                <Card key={path.id} className="border-zinc-800 bg-zinc-900/50">
                  <CardContent className="p-0">
                    {/* Path header (clickable to expand) */}
                    <button
                      onClick={() => setOpenId(isOpen ? null : path.id)}
                      className="flex w-full items-center gap-4 p-5 text-left"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h2 className="font-semibold text-white">{path.title}</h2>
                          <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                            {path.level}
                          </span>
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-sm text-zinc-400">{path.description}</p>
                        <div className="mt-2 flex items-center gap-3">
                          <div className="h-1.5 w-40 rounded-full bg-zinc-800">
                            <div
                              className="h-1.5 rounded-full bg-emerald-500 transition-all"
                              style={{ width: `${path.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-zinc-500">
                            {path.completedSteps}/{path.totalSteps} completed
                          </span>
                        </div>
                      </div>
                      <ChevronRight
                        className={`h-5 w-5 shrink-0 text-zinc-500 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                      />
                    </button>

                    {/* Steps */}
                    {isOpen && (
                      <div className="border-t border-zinc-800 p-4">
                        <ol className="space-y-2">
                          {path.steps.map((step, i) => {
                            const StepIcon = step.kind === 'lab' ? SquareTerminal : DoorOpen;
                            return (
                              <li key={`${step.kind}-${step.id}`}>
                                <Link
                                  href={step.href}
                                  className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 transition-colors hover:border-emerald-500/50"
                                >
                                  {step.completed ? (
                                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                                  ) : (
                                    <Circle className="h-5 w-5 shrink-0 text-zinc-600" />
                                  )}
                                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs text-zinc-400">
                                    {i + 1}
                                  </span>
                                  <StepIcon className="h-4 w-4 shrink-0 text-emerald-400" />
                                  <span className="flex-1 text-sm text-white">{step.title}</span>
                                  <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] uppercase text-zinc-500">
                                    {step.kind}
                                  </span>
                                  <span className={`rounded px-2 py-0.5 text-xs ${diffStyle[step.difficulty]}`}>
                                    {step.difficulty}
                                  </span>
                                  <span className="hidden text-xs font-medium text-emerald-400 sm:inline">
                                    {step.points} pts
                                  </span>
                                </Link>
                              </li>
                            );
                          })}
                        </ol>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}