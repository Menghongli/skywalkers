import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Game, gamesAPI } from '../services/api';

interface GamesContextType {
  games: Game[];
  loading: boolean;
  error: string | null;
  refreshGames: () => Promise<void>;
  recentGames: Game[];
  upcomingGames: Game[];
}

const GamesContext = createContext<GamesContextType | undefined>(undefined);

export const useGames = () => {
  const context = useContext(GamesContext);
  if (!context) {
    throw new Error('useGames must be used within a GamesProvider');
  }
  return context;
};

export const GamesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const refreshGames = useCallback(async () => {
    // Prevent duplicate concurrent API calls
    if (fetchingRef.current) {
      return;
    }
    
    try {
      fetchingRef.current = true;
      setLoading(true);
      setError(null);
      const allGames = await gamesAPI.getAll();
      setGames(allGames);
    } catch (err) {
      setError('Failed to load games');
      console.error('Error fetching games:', err);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    refreshGames();
  }, [refreshGames]);

  // Memoized computed values
  const recentGames = React.useMemo(() => {
    const now = new Date(); // Current date and time
    
    return games.filter(game => {
      // Only show games that have already happened (past date/time)
      return game.datetime <= now;
    }).sort((a, b) => b.datetime.getTime() - a.datetime.getTime()); // Sort by date/time descending (most recent first)
  }, [games]);

  const upcomingGames = React.useMemo(() => {
    const now = new Date(); // Current date and time
    
    return games.filter(game => {
      // Only show games that haven't happened yet (future date/time)
      return game.datetime > now;
    }).sort((a, b) => a.datetime.getTime() - b.datetime.getTime()); // Sort by date/time ascending
  }, [games]);

  const value: GamesContextType = {
    games,
    loading,
    error,
    refreshGames,
    recentGames,
    upcomingGames,
  };

  return (
    <GamesContext.Provider value={value}>
      {children}
    </GamesContext.Provider>
  );
};