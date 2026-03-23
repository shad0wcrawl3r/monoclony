import { useState } from 'react';
import { PLAYER_CONFIGS } from '../features/constants';
import { useGameStore } from '../store/gameStore';
import { isSupabaseConfigured } from '../lib/supabase';
import { createRoom, joinRoom } from '../hooks/useMultiplayer';
import { SFX } from '../features/audio';

export function TitlePage() {
  const { startGame, setMultiplayer } = useGameStore();

  const [playerCount, setPlayerCount] = useState(2);
  const [names, setNames] = useState<string[]>(
    PLAYER_CONFIGS.map(c => c.name),
  );
  const [mode, setMode] = useState<'local' | 'online'>('local');
  const [roomCode, setRoomCode] = useState('');
  const [roomAction, setRoomAction] = useState<'create' | 'join'>('create');
  const [roomError, setRoomError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function setName(i: number, val: string) {
    setNames(prev => {
      const n = [...prev];
      n[i] = val;
      return n;
    });
  }

  async function handleStart() {
    SFX.click();
    const usedNames = names.slice(0, playerCount);

    if (mode === 'local') {
      startGame(usedNames, playerCount);
      return;
    }

    // Online mode
    if (!isSupabaseConfigured) {
      setRoomError('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      return;
    }

    setLoading(true);
    setRoomError(null);

    if (roomAction === 'create') {
      // Create game then set multiplayer
      startGame(usedNames, playerCount);
      const game = useGameStore.getState().game!;
      const roomId = await createRoom(game);
      if (!roomId) {
        setRoomError('Failed to create room. Check Supabase config.');
        setLoading(false);
        return;
      }
      setMultiplayer({ isMultiplayer: true, roomId, localPlayerIndex: 0 });
    } else {
      // Join existing room
      if (!roomCode.trim()) {
        setRoomError('Enter a room code.');
        setLoading(false);
        return;
      }
      const remoteState = await joinRoom(roomCode.toUpperCase().trim(), usedNames[0]);
      if (!remoteState) {
        setRoomError('Room not found or error connecting.');
        setLoading(false);
        return;
      }
      const joinIndex = remoteState.players.length;
      if (joinIndex >= 4) {
        setRoomError('Room is full (max 4 players).');
        setLoading(false);
        return;
      }
      // Add self to remote state
      const PC = PLAYER_CONFIGS;
      const newPlayer = {
        index: joinIndex,
        name: usedNames[0],
        token: PC[joinIndex].token,
        color: PC[joinIndex].color,
        money: 1500,
        position: 0,
        inJail: false,
        jailTurns: 0,
        jailFreeCards: 0,
        bankrupt: false,
      };
      const updatedState = {
        ...remoteState,
        players: [...remoteState.players, newPlayer],
      };
      useGameStore.getState().setGameState(updatedState);
      setMultiplayer({
        isMultiplayer: true,
        roomId: roomCode.toUpperCase().trim(),
        localPlayerIndex: joinIndex,
      });
    }

    setLoading(false);
  }

  return (
    <div
      className="flex flex-col items-center justify-center w-full h-full overflow-y-auto"
      style={{ background: '#0a0a0f', padding: '20px 16px' }}
    >
      {/* Title */}
      <div className="text-center mb-8">
        <h1
          className="font-pixel text-accent"
          style={{ fontSize: 48, letterSpacing: 4, lineHeight: 1.4 }}
        >
          MONO
          <br />
          CLONY
        </h1>
        <div
          className="font-vt text-pixel-dim mt-2"
          style={{ fontSize: 36, letterSpacing: 2 }}
        >
          PIXEL BOARD GAME
        </div>
      </div>

      {/* Game setup card */}
      <div
        style={{
          background: '#12121a',
          border: '2px solid #2a2a3d',
          padding: 20,
          width: '100%',
          maxWidth: 400,
        }}
      >
        {/* Mode toggle */}
        <div className="flex mb-4 gap-2">
          {(['local', 'online'] as const).map(m => (
            <button
              key={m}
              className="pixel-btn flex-1"
              onClick={() => { SFX.click(); setMode(m); }}
              style={{
                color: mode === m ? '#0a0a0f' : '#6b7280',
                background: mode === m ? '#f7c948' : '#12121a',
                borderColor: mode === m ? '#f7c948' : '#2a2a3d',
                fontSize: 14,
                padding: '6px 0',
              }}
            >
              {m === 'local' ? 'LOCAL' : 'ONLINE'}
            </button>
          ))}
        </div>

        {/* Player count */}
        <div className="mb-4">
          <div className="font-pixel mb-2" style={{ fontSize: 14, color: '#6b7280' }}>
            PLAYERS
          </div>
          <div className="flex gap-2">
            {[2, 3, 4].map(n => (
              <button
                key={n}
                className="pixel-btn flex-1"
                onClick={() => { SFX.click(); setPlayerCount(n); }}
                style={{
                  color: playerCount === n ? '#0a0a0f' : '#6b7280',
                  background: playerCount === n ? '#f7c948' : '#12121a',
                  borderColor: playerCount === n ? '#f7c948' : '#2a2a3d',
                  fontSize: 18,
                  padding: '6px 0',
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Player names */}
        <div className="mb-4">
          <div className="font-pixel mb-2" style={{ fontSize: 14, color: '#6b7280' }}>
            PLAYER NAMES
          </div>
          <div className="flex flex-col gap-2">
            {Array.from({ length: mode === 'online' && roomAction === 'join' ? 1 : playerCount }, (_, i) => (
              <div key={i} className="flex items-center gap-2">
                <span style={{ fontSize: 32, width: 24 }}>{PLAYER_CONFIGS[i].token}</span>
                <input
                  type="text"
                  value={names[i]}
                  maxLength={12}
                  onChange={e => setName(i, e.target.value.toUpperCase())}
                  className="font-pixel flex-1"
                  style={{
                    background: '#0a0a0f',
                    border: '1px solid #2a2a3d',
                    color: PLAYER_CONFIGS[i].color,
                    padding: '6px 8px',
                    fontSize: 16,
                    outline: 'none',
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Online options */}
        {mode === 'online' && (
          <div className="mb-4">
            <div className="flex gap-2 mb-3">
              {(['create', 'join'] as const).map(a => (
                <button
                  key={a}
                  className="pixel-btn flex-1"
                  onClick={() => { SFX.click(); setRoomAction(a); }}
                  style={{
                    color: roomAction === a ? '#0a0a0f' : '#6b7280',
                    background: roomAction === a ? '#4fc3f7' : '#12121a',
                    borderColor: roomAction === a ? '#4fc3f7' : '#2a2a3d',
                    fontSize: 14,
                    padding: '6px 0',
                  }}
                >
                  {a === 'create' ? 'CREATE ROOM' : 'JOIN ROOM'}
                </button>
              ))}
            </div>

            {roomAction === 'join' && (
              <input
                type="text"
                placeholder="ROOM CODE"
                value={roomCode}
                maxLength={6}
                onChange={e => setRoomCode(e.target.value.toUpperCase())}
                className="font-pixel w-full"
                style={{
                  background: '#0a0a0f',
                  border: '1px solid #2a2a3d',
                  color: '#4fc3f7',
                  padding: '8px 10px',
                  fontSize: 20,
                  textAlign: 'center',
                  letterSpacing: 4,
                  outline: 'none',
                }}
              />
            )}

            {!isSupabaseConfigured && (
              <div
                className="font-vt mt-2"
                style={{ fontSize: 26, color: '#ff4f5e' }}
              >
                ⚠ Supabase not configured — online play unavailable
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {roomError && (
          <div
            className="font-vt mb-3"
            style={{ fontSize: 28, color: '#ff4f5e' }}
          >
            {roomError}
          </div>
        )}

        {/* Start button */}
        <button
          className="pixel-btn w-full"
          onClick={handleStart}
          disabled={loading}
          style={{
            color: '#0a0a0f',
            background: loading ? '#6b7280' : '#f7c948',
            borderColor: loading ? '#6b7280' : '#f7c948',
            fontSize: 20,
            padding: '10px 0',
            boxShadow: loading ? 'none' : '0 4px 0 #b8922e',
          }}
        >
          {loading ? 'CONNECTING...' : 'START GAME ▶'}
        </button>
      </div>

      <div
        className="font-pixel mt-6 text-pixel-dim text-center"
        style={{ fontSize: 10, lineHeight: 1.8 }}
      >
        ● COLLECT $200 SALARY AS YOU PASS GO<br />
        ● BUY PROPERTIES AND CHARGE RENT<br />
        ● BANKRUPT YOUR OPPONENTS TO WIN
      </div>
    </div>
  );
}
