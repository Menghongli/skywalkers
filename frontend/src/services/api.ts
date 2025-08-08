import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'manager' | 'player';
  is_verified: boolean;
  jersey_number?: number;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: 'manager' | 'player';
  jersey_number?: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const authAPI = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterData): Promise<User> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  verifyEmail: async (token: string): Promise<{ message: string }> => {
    const response = await api.post(`/auth/verify-email?token=${token}`);
    return response.data;
  },

  resendVerification: async (email: string): Promise<{ message: string }> => {
    const response = await api.post(`/auth/resend-verification?email=${email}`);
    return response.data;
  },
};

export const adminAPI = {
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  createManager: async (data: RegisterData): Promise<User> => {
    const response = await api.post('/admin/create-manager', data);
    return response.data;
  },

  deleteUser: async (userId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  verifyUser: async (userId: number): Promise<{ message: string }> => {
    const response = await api.put(`/admin/users/${userId}/verify`);
    return response.data;
  },
};

export interface Game {
  id: number;
  opponent_name: string;
  date: string;
  final_score_skywalkers?: number;
  final_score_opponent?: number;
  video_url?: string;
}

export interface GameCreate {
  opponent_name: string;
  date: string;
  final_score_skywalkers?: number;
  final_score_opponent?: number;
}

export const gamesAPI = {
  getAll: async (): Promise<Game[]> => {
    const response = await api.get('/games');
    return response.data;
  },

  getById: async (id: number): Promise<Game> => {
    const response = await api.get(`/games/${id}`);
    return response.data;
  },

  create: async (data: GameCreate): Promise<Game> => {
    const response = await api.post('/games', data);
    return response.data;
  },

  update: async (id: number, data: GameCreate): Promise<Game> => {
    const response = await api.put(`/games/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/games/${id}`);
    return response.data;
  },
};

export interface PlayerGameStats {
  id: number;
  user_id: number;
  game_id: number;
  points: number;
  fouls: number;
  user: User;
}

export interface LadderEntry {
  id: number;
  team_name: string;
  position: number;
  wins: number;
  draws: number;
  losses: number;
  points_for: number;
  points_against: number;
  win_percentage: number;
  games_played: number;
  season?: string;
  division?: string;
  last_updated: string;
}

export const statsAPI = {
  getPlayerStats: async (userId: number): Promise<PlayerGameStats[]> => {
    const response = await api.get(`/stats/player/${userId}`);
    return response.data;
  },

  getGameStats: async (gameId: number): Promise<PlayerGameStats[]> => {
    const response = await api.get(`/stats/game/${gameId}`);
    return response.data;
  },
};

export const ladderAPI = {
  getLadder: async (limit: number = 10): Promise<LadderEntry[]> => {
    const response = await api.get(`/ladder?limit=${limit}`);
    return response.data;
  },

  getTeamPosition: async (teamName: string): Promise<LadderEntry> => {
    const response = await api.get(`/ladder/team/${encodeURIComponent(teamName)}`);
    return response.data;
  },

  updateLadder: async (url?: string): Promise<{ message: string }> => {
    const response = await api.post('/ladder/update', url ? { url } : {});
    return response.data;
  },
};

export default api;