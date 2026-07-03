'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Trophy, Target, Users, Save, Loader2 } from 'lucide-react';
import { Sidebar } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, updateProfile } = useAuth();
  const [avatar, setAvatar] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setAvatar(user.avatar || '');
      setBio(user.bio || '');
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      await updateProfile(avatar, bio);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to update profile:', e);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-emerald-400">กำลังโหลด...</div>
      </div>
    );
  }

  const avatarOptions = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=blue1',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=blue2',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=hacker1',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=cyber1',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=security1',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=tech1',
  ];

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">โปรไฟล์</h1>
          <p className="text-zinc-400">จัดการข้อมูลส่วนตัว</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile Edit */}
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="text-white">แก้ไขโปรไฟล์</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avatar Selection */}
              <div className="space-y-2">
                <label className="text-sm text-zinc-400">Avatar</label>
                <div className="flex flex-wrap gap-2">
                  {avatarOptions.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAvatar(url)}
                      className={`h-12 w-12 rounded-full overflow-hidden border-2 transition-all ${
                        avatar === url ? 'border-emerald-400 scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`avatar-${i}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
                <Input
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="URL รูปภาพ"
                  className="border-zinc-700 bg-zinc-800 text-white"
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <label className="text-sm text-zinc-400">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="แนะนำตัวเอง..."
                  rows={4}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                บันทึก
              </Button>

              {success && (
                <div className="rounded-md bg-emerald-500/10 p-3 text-center text-sm text-emerald-400">
                  บันทึกสำเร็จ!
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Info */}
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="text-white">ข้อมูลผู้ใช้</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-emerald-500/20 flex items-center justify-center overflow-hidden">
                  {user.avatar ? (
                    <img src={user.avatar} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-10 w-10 text-emerald-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{user.username}</h3>
                  <p className="text-zinc-400">{user.role}</p>
                </div>
              </div>

              <div className="space-y-3 border-t border-zinc-800 pt-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-zinc-500" />
                  <span className="text-zinc-300">{user.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Trophy className="h-4 w-4 text-zinc-500" />
                  <span className="text-zinc-300">คะแนน: <span className="text-emerald-400 font-bold">{user.points}</span></span>
                </div>
                <div className="flex items-center gap-3">
                  <Target className="h-4 w-4 text-zinc-500" />
                  <span className="text-zinc-300">Labs ที่ทำแล้ว: <span className="text-emerald-400 font-bold">{user.labs_completed}</span></span>
                </div>
                {user.team_id && (
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-zinc-500" />
                    <span className="text-zinc-300">Team ID: <span className="text-emerald-400">{user.team_id}</span></span>
                  </div>
                )}
              </div>

              {user.bio && (
                <div className="border-t border-zinc-800 pt-4">
                  <label className="text-sm text-zinc-500">Bio</label>
                  <p className="mt-1 text-zinc-300">{user.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}