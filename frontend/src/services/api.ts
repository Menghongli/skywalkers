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
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UserCreateData {
  email: string;
  password: string;
  name: string;
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
};

export interface Player {
  id: number;
  name: string;
  jersey_number: number;
  date_joined: string;
  is_active: number;
}

export interface PlayerCreate {
  name: string;
  jersey_number: number;
}

export interface PlayerUpdate {
  name?: string;
  jersey_number?: number;
  is_active?: number;
}

export interface PlayerMerge {
  source_player_id: number;
  target_player_id: number;
}

export const adminAPI = {
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  createUser: async (data: UserCreateData): Promise<User> => {
    const response = await api.post('/admin/create-user', data);
    return response.data;
  },

  deleteUser: async (userId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  // Player management endpoints
  getAllPlayers: async (): Promise<Player[]> => {
    const response = await api.get('/admin/players');
    return response.data;
  },

  createPlayer: async (data: PlayerCreate): Promise<Player> => {
    const response = await api.post('/admin/players', data);
    return response.data;
  },

  updatePlayer: async (playerId: number, data: PlayerUpdate): Promise<Player> => {
    const response = await api.put(`/admin/players/${playerId}`, data);
    return response.data;
  },

  deactivatePlayer: async (playerId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/admin/players/${playerId}`);
    return response.data;
  },

  activatePlayer: async (playerId: number): Promise<{ message: string }> => {
    const response = await api.post(`/admin/players/${playerId}/activate`);
    return response.data;
  },

  mergePlayers: async (data: PlayerMerge): Promise<{ message: string }> => {
    const response = await api.post('/admin/players/merge', data);
    return response.data;
  },
};

export interface Game {
  id: number;
  opponent_name: string;
  datetime: Date;
  time?: string; // ISO datetime string from backend
  venue?: string;
  final_score_skywalkers?: number;
  final_score_opponent?: number;
  video_url?: string;
}

export interface GameCreate {
  opponent_name: string;
  datetime: string; // ISO string
  venue?: string;
  final_score_skywalkers?: number;
  final_score_opponent?: number;
  video_url?: string;
}

export const gamesAPI = {
  getAll: async (): Promise<Game[]> => {
    const response = await api.get('/games');
    const games = (response.data as any[]).map((g) => ({
      ...g,
      datetime: new Date(g.datetime),
      final_score_skywalkers: g.final_score_skywalkers ?? undefined,
      final_score_opponent: g.final_score_opponent ?? undefined,
      video_url: g.video_url ?? undefined,
    }));
    return games as Game[];
  },

  getById: async (id: number): Promise<Game> => {
    const response = await api.get(`/games/${id}`);
    const g = response.data;
    return {
      ...g,
      datetime: new Date(g.datetime),
      final_score_skywalkers: g.final_score_skywalkers ?? undefined,
      final_score_opponent: g.final_score_opponent ?? undefined,
      video_url: g.video_url ?? undefined,
    } as Game;
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
  player_id: number;
  game_id: number;
  points: number;
  fouls: number;
  is_verified: boolean;
  verified_at?: string;
  verified_by?: number;
  is_scraped: boolean;
  scrape_source?: string;
  player: {
    id: number;
    name: string;
    jersey_number: number;
  };
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

  fetchGameStats: async (url: string, cookies?: string, gameId?: number, saveToDB?: boolean): Promise<any> => {
    const response = await api.post('/stats/fetch-game-stats', { 
      url, 
      cookies, 
      game_id: gameId,
      save_to_db: saveToDB || false
    });
    return response.data;
  },

  getUnverifiedStats: async (): Promise<PlayerGameStats[]> => {
    const response = await api.get('/stats/unverified');
    return response.data;
  },

  verifyStats: async (statsId: number): Promise<{ message: string; stats: PlayerGameStats }> => {
    const response = await api.post(`/stats/${statsId}/verify`);
    return response.data;
  },

  rejectStats: async (statsId: number): Promise<{ message: string }> => {
    const response = await api.post(`/stats/${statsId}/reject`);
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

export interface FixtureData {
  id: number;
  opponent_name: string;
  date: string;
  is_today: boolean;
  days_until: number;
  has_scores: boolean;
}

export interface FixturesResponse {
  fixtures: FixtureData[];
  count: number;
}

export interface FixturesUpdateResponse {
  success: boolean;
  message: string;
  created: number;
  updated: number;
  skipped: number;
  total_processed?: number;
}

export const fixturesAPI = {
  getFixtures: async (limit: number = 10): Promise<FixturesResponse> => {
    const response = await api.get(`/fixtures?limit=${limit}`);
    return response.data;
  },

  updateFixtures: async (url?: string): Promise<{ message: string }> => {
    const response = await api.post('/fixtures/update', url ? { url } : {});
    return response.data;
  },

  getFixturesStatus: async (): Promise<{
    upcoming_count: number;
    today_count: number;
    this_week_count: number;
    last_checked: string;
  }> => {
    const response = await api.get('/fixtures/status');
    return response.data;
  },

  syncFixturesWithGames: async (): Promise<{ message: string }> => {
    const response = await api.post('/fixtures/sync-with-games');
    return response.data;
  },
};

export default api;