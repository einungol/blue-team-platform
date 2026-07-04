'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Sidebar } from '@/components/sidebar';
import { Terminal, CheckCircle2, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface InteractiveLab {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  tags: string[];
  points: number;
  completed?: boolean;
}

const diffStyle: Record<string, string> = {
  easy: 'bg-green-500/20 text-green-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  hard: 'bg-red-500/20 text-red-400',
};

export default function InteractiveListPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [labs, setLabs] = useState<InteractiveLab[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      api.getInteractiveLabs().then(setLabs).catch(() => {}).finally(() => setLoading(false));
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
          <h1 className="text-2xl font-bold text-white">Terminal Labs</h1>
          <p className="text-zinc-400">
            Hands-on work in a simulated terminal — use Linux commands (grep, cat, cut) to analyze logs and capture the flag.
          </p>
        </div>

        {loading ? (
          <div className="text-center text-zinc-400">Loading...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {labs.map((lab) => (
              <Link key={lab.id} href={`/interactive/${lab.id}`}>
                <Card className="group h-full cursor-pointer border-zinc-800 bg-zinc-900/50 transition-all hover:border-emerald-500/50">
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Terminal className="h-5 w-5" />
                      </div>
                      {lab.completed ? (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> Completed
                        </span>
                      ) : (
                        <span className={`rounded px-2 py-0.5 text-xs ${diffStyle[lab.difficulty]}`}>
                          {lab.difficulty}
                        </span>
                      )}
                    </div>
                    <h3 className="mb-1 font-semibold text-white group-hover:text-emerald-400">
                      {lab.title}
                    </h3>
                    <p className="mb-3 line-clamp-2 text-sm text-zinc-400">{lab.description}</p>
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {lab.tags.slice(0, 3).map((t) => (
                        <span key={t} className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-emerald-400">
                        Start <ChevronRight className="h-4 w-4" />
                      </span>
                      <span className="font-medium text-emerald-400">{lab.points} pts</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}