'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sidebar } from '@/components/sidebar';

export default function LeaderboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      api.getLeaderboard()
        .then(setLeaderboard)
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

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
          <p className="text-zinc-400">Player and team rankings</p>
        </div>

        {loading ? (
          <div className="text-center text-zinc-400">Loading...</div>
        ) : (
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="text-white">Player Rankings</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800 text-left text-sm text-zinc-400">
                    <th className="px-4 py-3 font-medium">#</th>
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Team</th>
                    <th className="px-4 py-3 font-medium text-right">points</th>
                    <th className="px-4 py-3 font-medium text-right">Labs</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, index) => (
                    <tr
                      key={entry.id}
                      className={`border-b border-zinc-800 ${
                        entry.id === user.id ? 'bg-emerald-500/10' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                            index === 0
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : index === 1
                              ? 'bg-zinc-400/20 text-zinc-300'
                              : index === 2
                              ? 'bg-amber-700/20 text-amber-600'
                              : 'text-zinc-500'
                          }`}
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                            {entry.username[0].toUpperCase()}
                          </div>
                          <span className="font-medium text-white">{entry.username}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-400">{entry.team_name || '-'}</td>
                      <td className="px-4 py-3 text-right font-medium text-emerald-400">
                        {entry.points} pts
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-400">{entry.labs_completed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {!loading && leaderboard.length === 0 && (
          <div className="text-center py-12 text-zinc-400">
            No data yet
          </div>
        )}
      </main>
    </div>
  );
}