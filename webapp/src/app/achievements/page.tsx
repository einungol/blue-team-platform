'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Sidebar } from '@/components/sidebar';
import { Lock, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  badge_type: 'bronze' | 'silver' | 'gold';
  points_required: number;
  labs_required: number;
  earned: boolean;
  earned_at: string | null;
}

const badgeRing: Record<string, string> = {
  bronze: 'ring-amber-700/40 bg-amber-700/10',
  silver: 'ring-zinc-400/40 bg-zinc-400/10',
  gold: 'ring-yellow-500/40 bg-yellow-500/10',
};

const badgeLabel: Record<string, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
};

export default function AchievementsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      api.getAchievements()
        .then(setAchievements)
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

  const earnedCount = achievements.filter((a) => a.earned).length;

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />

      <main className="flex-1 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Achievements</h1>
            <p className="text-zinc-400">Earn badges by completing rooms and gaining points</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-zinc-500">Unlocked</div>
            <div className="text-2xl font-bold text-emerald-400">
              {earnedCount}/{achievements.length}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-zinc-400">Loading...</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {achievements.map((a) => (
              <Card
                key={a.id}
                className={`border-zinc-800 transition-all ${
                  a.earned ? 'bg-zinc-900/70' : 'bg-zinc-900/30 opacity-60'
                }`}
              >
                <CardContent className="flex flex-col items-center p-5 text-center">
                  <div
                    className={`mb-3 flex h-16 w-16 items-center justify-center rounded-full text-3xl ring-2 ${
                      a.earned ? badgeRing[a.badge_type] : 'bg-zinc-800 ring-zinc-700'
                    }`}
                  >
                    {a.earned ? (
                      <span>{a.icon}</span>
                    ) : (
                      <Lock className="h-6 w-6 text-zinc-600" />
                    )}
                  </div>
                  <h3 className={`font-semibold ${a.earned ? 'text-white' : 'text-zinc-500'}`}>
                    {a.name}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500">{a.description}</p>

                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-medium uppercase ${
                        a.badge_type === 'gold'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : a.badge_type === 'silver'
                          ? 'bg-zinc-400/20 text-zinc-300'
                          : 'bg-amber-700/20 text-amber-600'
                      }`}
                    >
                      {badgeLabel[a.badge_type]}
                    </span>
                    {a.earned && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                        <Award className="h-3 w-3" /> Earned
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}