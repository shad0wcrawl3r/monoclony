import { useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useGameStore } from '../store/gameStore';
import type { GameState } from '../types';

const TABLE = 'games';

/**
 * Generates a random 6-character uppercase room code.
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/**
 * Creates a new multiplayer room. Returns the room ID on success.
 */
export async function createRoom(initialState: GameState): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const roomId = generateRoomCode();
  const { error } = await supabase.from(TABLE).insert({
    id: roomId,
    state: initialState,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.error('Failed to create room:', error);
    return null;
  }
  return roomId;
}

/**
 * Joins an existing room. Returns the current game state on success.
 */
export async function joinRoom(
  roomId: string,
  _playerName: string,
): Promise<GameState | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase
    .from(TABLE)
    .select('state')
    .eq('id', roomId)
    .single();

  if (error || !data) {
    console.error('Failed to join room:', error);
    return null;
  }

  return data.state as GameState;
}

/**
 * Pushes updated state to Supabase.
 */
export async function pushState(roomId: string, state: GameState): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from(TABLE).upsert({
    id: roomId,
    state,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.error('Failed to push state:', error);
  }
}

/**
 * React hook: subscribes to realtime updates for a room and syncs to local store.
 * Also overrides the store's _syncMultiplayer to push state on every action.
 */
export function useMultiplayer(): void {
  const { multiplayer, game, setGameState } = useGameStore();
  const { isMultiplayer, roomId } = multiplayer;
  const gameRef = useRef(game);
  gameRef.current = game;

  // Push on every game state change when multiplayer is active
  useEffect(() => {
    if (!isMultiplayer || !roomId || !game) return;
    pushState(roomId, game);
  }, [game, isMultiplayer, roomId]);

  // Subscribe to remote changes
  useEffect(() => {
    if (!isMultiplayer || !roomId || !isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: TABLE,
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          const remoteState = payload.new?.state as GameState | undefined;
          if (!remoteState) return;
          // Only apply if it's newer / different from our current state
          // Simple approach: always apply remote (last-write-wins)
          setGameState(remoteState);
        },
      )
      .subscribe();

    return () => {
      supabase!.removeChannel(channel);
    };
  }, [isMultiplayer, roomId, setGameState]);
}
