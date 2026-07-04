'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Sidebar } from '@/components/sidebar';
import {
  Trophy,
  Users,
  ChevronRight,
  Zap,
  DoorOpen,
  Award,
  Route,
  ScrollText,
  Mail,
  Radio,
  Cpu,
  Bug,
  Search,
  Network,
  ShieldAlert,
  Cloud,
  ScanSearch,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RoomSummary } from '@/types';

const iconMap: Record<string, LucideIcon> = {
  ScrollText, Mail, Radio, Cpu, Bug, Search, DoorOpen, Network, ShieldAlert, Cloud, ScanSearch,
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      api.getRooms().then(setRooms).catch(() => {});
      api.getLeaderboard().then(setLeaderboard).catch(() => {});
      api.getAchievements().then(setAchievements).catch(() => {});
    }
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-emerald-400">Loading...</div>
      </div>
    );
  }

  const completedRooms = rooms.filter((r) => r.completed).length;
  const totalSolved = rooms.reduce((sum, r) => sum + (r.solvedQuestions || 0), 0);
  const totalQuestions = rooms.reduce((sum, r) => sum + r.totalQuestions, 0);
  const roomProgress = totalQuestions ? Math.round((totalSolved / totalQuestions) * 100) : 0;
  const earnedBadges = achievements.filter((a) => a.earned).length;

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />

      <main className="flex-1 p-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Welcome, {user.username}!</h1>
            <p className="text-zinc-400">Let's sharpen your Blue Team skills</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-zinc-400">Total points</div>
            <div className="text-2xl font-bold text-emerald-400">{user.points}</div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Rooms completed</CardTitle>
              <DoorOpen className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{completedRooms}/{rooms.length}</div>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Progress</CardTitle>
              <Zap className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{roomProgress}%</div>
              <div className="mt-2 h-2 w-full rounded-full bg-zinc-800">
                <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${roomProgress}%` }} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Badges</CardTitle>
              <Award className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{earnedBadges}/{achievements.length}</div>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Team</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{user.team_id ? 'In a team' : '-'}</div>
            </CardContent>
          </Card>
        </div>

        {/* Learning paths banner */}
        <Link href="/paths">
          <div className="mb-6 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-zinc-900/50 p-5 transition-colors hover:border-emerald-500/60">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                <Route className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Follow a Learning Path</h3>
                <p className="text-sm text-zinc-400">
                  Structured routes like &quot;SOC Analyst Tier 1&quot; — rooms and labs in the right order.
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-emerald-400" />
          </div>
        </Link>

        {/* Rooms */}
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Featured Rooms</h2>
            <Link href="/rooms" className="flex items-center text-sm text-emerald-400 hover:underline">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rooms.slice(0, 6).map((room) => {
              const Icon = iconMap[room.icon] || DoorOpen;
              const pct = room.totalQuestions
                ? Math.round(((room.solvedQuestions || 0) / room.totalQuestions) * 100)
                : 0;
              return (
                <Link key={room.id} href={`/rooms/${room.id}`}>
                  <Card className="group h-full cursor-pointer border-zinc-800 bg-zinc-900/50 transition-colors hover:border-emerald-500/50">
                    <CardContent className="p-5">
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span
                          className={`rounded px-2 py-0.5 text-xs ${
                            room.difficulty === 'easy'
                              ? 'bg-green-500/20 text-green-400'
                              : room.difficulty === 'medium'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {room.difficulty}
                        </span>
                      </div>
                      <h3 className="mb-1 font-semibold text-white group-hover:text-emerald-400">
                        {room.title}
                      </h3>
                      <p className="mb-3 line-clamp-2 text-sm text-zinc-400">{room.description}</p>
                      <div className="mb-1 flex justify-between text-xs text-zinc-500">
                        <span>{room.solvedQuestions || 0}/{room.totalQuestions} questions</span>
                        <span className="text-emerald-400">{room.points} pts</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-zinc-800">
                        <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Leaderboard */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Leaderboard</h2>
            <Link href="/leaderboard" className="flex items-center text-sm text-emerald-400 hover:underline">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800 text-left text-sm text-zinc-400">
                    <th className="px-4 py-3 font-medium">#</th>
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium text-right">points</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.slice(0, 5).map((entry, index) => (
                    <tr key={entry.id} className={`border-b border-zinc-800 ${entry.id === user.id ? 'bg-emerald-500/10' : ''}`}>
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
                      <td className="px-4 py-3 text-white">{entry.username}</td>
                      <td className="px-4 py-3 text-right font-medium text-emerald-400">{entry.points} pts</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}