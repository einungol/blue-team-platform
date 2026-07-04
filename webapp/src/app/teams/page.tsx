'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamStore } from '@/stores';
import { Users, Plus, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sidebar } from '@/components/sidebar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function TeamsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { teams, loading, fetchTeams } = useTeamStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchTeams();
    }
  }, [user]);

  const handleCreateTeam = async () => {
    if (!teamName.trim()) return;
    setCreating(true);
    try {
      await (await import('@/lib/api')).api.createTeam(teamName, teamDesc);
      fetchTeams();
      setCreateOpen(false);
      setTeamName('');
      setTeamDesc('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleJoinTeam = async (teamId: number) => {
    try {
      await (await import('@/lib/api')).api.joinTeam(teamId);
      fetchTeams();
      alert('Joined the team!');
    } catch (err: any) {
      alert(err.message);
    }
  };

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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Teams</h1>
            <p className="text-zinc-400">Create or join a team</p>
          </div>
          {!user.team_id && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Create team
                </Button>
              </DialogTrigger>
              <DialogContent className="border-zinc-800 bg-zinc-900">
                <DialogHeader>
                  <DialogTitle className="text-white">Create a new team</DialogTitle>
                  <DialogDescription className="text-zinc-400">
                    Create your own team and invite members
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">Team name</label>
                    <Input
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Team name"
                      className="border-zinc-700 bg-zinc-800 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">Description</label>
                    <Input
                      value={teamDesc}
                      onChange={(e) => setTeamDesc(e.target.value)}
                      placeholder="Team description"
                      className="border-zinc-700 bg-zinc-800 text-white"
                    />
                  </div>
                  <Button
                    onClick={handleCreateTeam}
                    disabled={creating || !teamName.trim()}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    {creating ? 'Creating...' : 'Create team'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {user.team_id && (
          <Card className="mb-6 border-emerald-500/50 bg-emerald-500/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-400">Your team</p>
                  <p className="text-lg font-bold text-white">
                    {teams.find((t) => t.id === user.team_id)?.name || 'Your team'}
                  </p>
                </div>
                <Users className="h-8 w-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="text-center text-zinc-400">Loading...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <Card key={team.id} className="border-zinc-800 bg-zinc-900/50">
                <CardHeader>
                  <CardTitle className="text-white">{team.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 text-sm text-zinc-400">{team.description}</p>
                  <div className="mb-3 flex items-center justify-between text-sm">
                    <span className="text-zinc-500">Leader: {team.leader_name}</span>
                    <span className="text-zinc-500">Members: {team.members_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-emerald-400">{team.points} pts</span>
                    {user.team_id !== team.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleJoinTeam(team.id)}
                        className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                      >
                        <UserPlus className="mr-1 h-3 w-3" />
                        Join
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && teams.length === 0 && (
          <div className="text-center py-12 text-zinc-400">
            No teams yet — create the first one!
          </div>
        )}
      </main>
    </div>
  );
}