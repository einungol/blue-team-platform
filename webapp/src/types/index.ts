// API Base URL
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  points: number;
  labs_completed: number;
  avatar: string;
  bio: string;
  team_id: number | null;
}

export interface Lab {
  id: number;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  points: number;
  docker_image: string | null;
  flag: string;
  hint: string;
  is_public: number;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  badge_type: 'bronze' | 'silver' | 'gold';
}

export interface Team {
  id: number;
  name: string;
  description: string;
  points: number;
  members_count: number;
  leader_name: string;
}

// ---- Rooms (THM-style playable content) ----
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface RoomSummary {
  id: number;
  slug: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  category: string;
  tags: string[];
  icon: string;
  points: number;
  estimatedTime: number;
  totalQuestions: number;
  // present when authenticated
  solvedQuestions?: number;
  earnedPoints?: number;
  completed?: boolean;
}

export interface RoomArtifact {
  name: string;
  type: string;
  content: string;
}

export interface RoomQuestion {
  id: string;
  prompt: string;
  points: number;
  hint: string | null;
}

export interface RoomTask {
  id: number;
  title: string;
  content: string;
  artifacts: RoomArtifact[];
  questions: RoomQuestion[];
}

export interface RoomDetail extends RoomSummary {
  tasks: RoomTask[];
  solved: string[];
  earnedPoints: number;
}

export interface AnswerResult {
  correct: boolean;
  points?: number;
  alreadySolved?: boolean;
  roomCompleted?: boolean;
}