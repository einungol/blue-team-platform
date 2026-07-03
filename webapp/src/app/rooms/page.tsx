'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Sidebar } from '@/components/sidebar';
import {
  ScrollText,
  Mail,
  Radio,
  DoorOpen,
  Clock,
  CheckCircle2,
  Search,
  Cpu,
  Bug,
  type LucideIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import type { RoomSummary } from '@/types';

const iconMap: Record<string, LucideIcon> = {
  ScrollText,
  Mail,
  Radio,
  DoorOpen,
  Cpu,
  Bug,
};

const difficultyStyles: Record<string, string> = {
  easy: 'bg-green-500/20 text-green-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  hard: 'bg-red-500/20 text-red-400',
};

const difficultyLabel: Record<string, string> = {
  easy: 'ง่าย',
  medium: 'ปานกลาง',
  hard: 'ยาก',
};

export default function RoomsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('all');

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      api.getRooms()
        .then(setRooms)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-emerald-400">กำลังโหลด...</div>
      </div>
    );
  }

  const filtered = rooms.filter((r) => {
    const matchSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      r.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchDiff = difficulty === 'all' || r.difficulty === difficulty;
    return matchSearch && matchDiff;
  });

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />

      <main className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Rooms</h1>
          <p className="text-zinc-400">
            ห้องฝึกแบบ guided — มี artifact จริงให้วิเคราะห์ และตอบคำถามทีละข้อ
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              placeholder="ค้นหา room หรือ tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-zinc-700 bg-zinc-800 pl-10 text-white placeholder:text-zinc-500"
            />
          </div>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-white"
          >
            <option value="all">ทุกระดับ</option>
            <option value="easy">ง่าย</option>
            <option value="medium">ปานกลาง</option>
            <option value="hard">ยาก</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center text-zinc-400">กำลังโหลด rooms...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((room) => {
              const Icon = iconMap[room.icon] || DoorOpen;
              const progress = room.totalQuestions
                ? Math.round(((room.solvedQuestions || 0) / room.totalQuestions) * 100)
                : 0;
              return (
                <Link key={room.id} href={`/rooms/${room.id}`}>
                  <Card className="group h-full cursor-pointer border-zinc-800 bg-zinc-900/50 transition-all hover:border-emerald-500/50 hover:bg-zinc-900">
                    <CardContent className="p-5">
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                          <Icon className="h-5 w-5" />
                        </div>
                        {room.completed ? (
                          <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" /> เสร็จแล้ว
                          </span>
                        ) : (
                          <span
                            className={`rounded px-2 py-0.5 text-xs ${difficultyStyles[room.difficulty]}`}
                          >
                            {difficultyLabel[room.difficulty]}
                          </span>
                        )}
                      </div>

                      <h3 className="mb-1 font-semibold text-white group-hover:text-emerald-400">
                        {room.title}
                      </h3>
                      <p className="mb-3 line-clamp-2 text-sm text-zinc-400">
                        {room.description}
                      </p>

                      <div className="mb-3 flex flex-wrap gap-1.5">
                        {room.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Progress bar */}
                      <div className="mb-3">
                        <div className="mb-1 flex justify-between text-xs text-zinc-500">
                          <span>{room.solvedQuestions || 0}/{room.totalQuestions} ข้อ</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-zinc-800">
                          <div
                            className="h-1.5 rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {room.estimatedTime} นาที
                        </span>
                        <span className="font-medium text-emerald-400">{room.points} pts</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="py-12 text-center text-zinc-400">ไม่พบ room ที่ตรงกับการค้นหา</div>
        )}
      </main>
    </div>
  );
}