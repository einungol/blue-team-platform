import {
  API_URL,
  type User,
  type Lab,
  type Achievement,
  type Team,
  type RoomSummary,
  type RoomDetail,
  type AnswerResult,
} from '@/types';

class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('user', '');
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return res.json();
  }

  // Auth
  async login(username: string, password: string) {
    const data = await this.request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.setToken(data.token);
    return data.user;
  }

  async register(username: string, email: string, password: string) {
    const data = await this.request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    this.setToken(data.token);
    return data.user;
  }

  async getMe() {
    return this.request<User>('/api/auth/me');
  }

  async updateProfile(avatar: string, bio: string) {
    return this.request<{ message: string }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ avatar, bio }),
    });
  }

  // Labs
  async getLabs() {
    return this.request<Lab[]>('/api/labs');
  }

  async getLab(id: number) {
    return this.request<Lab>(`/api/labs/${id}`);
  }

  async submitFlag(labId: number, flag: string) {
    return this.request<{ message: string; points: number }>(`/api/labs/${labId}/flag`, {
      method: 'POST',
      body: JSON.stringify({ flag }),
    });
  }

  async getProgress() {
    return this.request<any[]>('/api/labs/progress');
  }

  // Rooms (THM-style playable content)
  async getRooms() {
    return this.request<RoomSummary[]>('/api/rooms');
  }

  async getRoom(id: number | string) {
    return this.request<RoomDetail>(`/api/rooms/${id}`);
  }

  async submitAnswer(roomId: number | string, questionId: string, answer: string) {
    return this.request<AnswerResult>(`/api/rooms/${roomId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ questionId, answer }),
    });
  }

  // Interactive labs (simulated terminal)
  async getInteractiveLabs() {
    return this.request<any[]>('/api/interactive');
  }

  async getInteractiveLab(id: number | string) {
    return this.request<any>(`/api/interactive/${id}`);
  }

  async execCommand(id: number | string, command: string) {
    return this.request<{ output: string }>(`/api/interactive/${id}/exec`, {
      method: 'POST',
      body: JSON.stringify({ command }),
    });
  }

  async submitInteractiveFlag(id: number | string, flag: string) {
    return this.request<AnswerResult>(`/api/interactive/${id}/flag`, {
      method: 'POST',
      body: JSON.stringify({ flag }),
    });
  }

  // Learning paths
  async getPaths() {
    return this.request<any[]>('/api/paths');
  }

  // Achievements
  async getAchievements() {
    return this.request<any[]>('/api/achievements');
  }

  // Leaderboard
  async getLeaderboard() {
    return this.request<any[]>('/api/users/leaderboard');
  }

  // Teams
  async getTeams() {
    return this.request<Team[]>('/api/teams');
  }

  async createTeam(name: string, description: string) {
    return this.request<{ id: number }>('/api/teams', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  async joinTeam(teamId: number) {
    return this.request<{ message: string }>(`/api/teams/${teamId}/join`, {
      method: 'POST',
    });
  }

  // Admin
  async getAdminStats() {
    return this.request<any>('/api/admin/stats');
  }

  async getAdminLabs() {
    return this.request<Lab[]>('/api/admin/labs');
  }

  async createLab(lab: Partial<Lab>) {
    return this.request<{ id: number }>('/api/admin/labs', {
      method: 'POST',
      body: JSON.stringify(lab),
    });
  }

  async deleteLab(id: number) {
    return this.request<{ message: string }>(`/api/admin/labs/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiService();