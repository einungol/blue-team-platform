'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Shield,
  LayoutDashboard,
  Route,
  DoorOpen,
  SquareTerminal,
  Trophy,
  Award,
  Users,
  User,
  LogOut,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/paths', icon: Route, label: 'Learning Paths' },
  { href: '/rooms', icon: DoorOpen, label: 'Rooms' },
  { href: '/interactive', icon: SquareTerminal, label: 'Terminal Labs' },
  { href: '/achievements', icon: Award, label: 'Achievements' },
  { href: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { href: '/teams', icon: Users, label: 'Teams' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className="flex w-64 flex-col border-r border-zinc-800 bg-zinc-900/50 p-4">
      <div className="mb-6 flex items-center gap-2">
        <Shield className="h-8 w-8 text-emerald-400" />
        <span className="text-xl font-bold text-white">BlueTeam</span>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-zinc-800 pt-4">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}