// React is used via JSX transform
import type { GameState } from '../types';
import { Board } from '../components/Board';
import { PlayerPanel } from '../components/PlayerPanel';
import { LogPanel } from '../components/LogPanel';
import { Modal } from '../components/Modal';
import { GameHUD } from '../components/GameHUD';
import { useGameStore } from '../store/gameStore';
import { useUIStore } from '../store/uiStore';
import { useMultiplayer } from '../hooks/useMultiplayer';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface GamePageProps {
  game: GameState;
}

export function GamePage({ game }: GamePageProps) {
  const { multiplayer } = useGameStore();
  const { viewedPlayer, setViewedPlayer, logOpen, toggleLog } = useUIStore();

  // Sync multiplayer if configured
  useMultiplayer();

  const isDesktop = useMediaQuery('(min-width: 900px)');

  return (
    <div
      className="flex flex-col"
      style={{ width: '100%', height: '100%', background: '#0a0a0f', overflow: 'hidden' }}
    >
      {isDesktop ? (
        <DesktopLayout
          game={game}
          isDesktop={isDesktop}
          viewedPlayer={viewedPlayer}
          setViewedPlayer={setViewedPlayer}
          logOpen={logOpen}
          toggleLog={toggleLog}
          multiplayer={multiplayer}
        />
      ) : (
        <MobileLayout
          game={game}
          isDesktop={isDesktop}
          viewedPlayer={viewedPlayer}
          setViewedPlayer={setViewedPlayer}
          logOpen={logOpen}
          toggleLog={toggleLog}
          multiplayer={multiplayer}
        />
      )}

      {/* Modal overlay */}
      <Modal game={game} />
    </div>
  );
}

// ─── Desktop layout (board left, panel right) ─────────────────────────────

interface LayoutProps {
  game: GameState;
  isDesktop: boolean;
  viewedPlayer: number;
  setViewedPlayer: (i: number) => void;
  logOpen: boolean;
  toggleLog: () => void;
  multiplayer: { isMultiplayer: boolean; roomId: string | null; localPlayerIndex: number };
}

function DesktopLayout({
  game,
  isDesktop,
  viewedPlayer,
  setViewedPlayer,
  logOpen,
  toggleLog,
  multiplayer,
}: LayoutProps) {
  return (
    <div className="flex flex-row" style={{ flex: 1, minHeight: 0 }}>
      {/* Board takes up most of the space */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, minHeight: 0 }}>
          <Board game={game} isDesktop={isDesktop} />
        </div>
        <GameHUD
          game={game}
          localPlayerIndex={multiplayer.localPlayerIndex}
          isMultiplayer={multiplayer.isMultiplayer}
        />
      </div>

      {/* Right sidebar */}
      <div
        style={{
          width: 200,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '2px solid #2a2a3d',
          background: '#0f0f1a',
          overflow: 'hidden',
        }}
      >
        {/* Room code */}
        {multiplayer.isMultiplayer && multiplayer.roomId && (
          <div
            className="font-pixel text-center px-2 py-2"
            style={{
              fontSize: 14,
              color: '#4fc3f7',
              borderBottom: '1px solid #2a2a3d',
              background: '#0a0a1a',
            }}
          >
            ROOM: {multiplayer.roomId}
          </div>
        )}

        {/* Player panels */}
        <div className="flex flex-col" style={{ flex: 1, overflowY: 'auto' }}>
          {game.players.map(player => (
            <PlayerPanel
              key={player.index}
              player={player}
              game={game}
              isActive={player.index === game.current}
              isViewed={player.index === viewedPlayer}
              onClick={() => setViewedPlayer(player.index)}
            />
          ))}
        </div>

        {/* Log panel */}
        <LogPanel log={game.log} isOpen={logOpen} onToggle={toggleLog} />
      </div>
    </div>
  );
}

// ─── Mobile layout (board top, panel bottom) ──────────────────────────────

function MobileLayout({
  game,
  isDesktop,
  viewedPlayer,
  setViewedPlayer,
  logOpen,
  toggleLog,
  multiplayer,
}: LayoutProps) {
  return (
    <div className="flex flex-col" style={{ flex: 1, minHeight: 0 }}>
      {/* Board */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <Board game={game} isDesktop={isDesktop} />
      </div>

      {/* Bottom area */}
      <div
        style={{
          flexShrink: 0,
          background: '#0f0f1a',
          borderTop: '2px solid #2a2a3d',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '40vh',
          overflow: 'hidden',
        }}
      >
        {/* Room code */}
        {multiplayer.isMultiplayer && multiplayer.roomId && (
          <div
            className="font-pixel text-center py-1"
            style={{ fontSize: 12, color: '#4fc3f7', borderBottom: '1px solid #2a2a3d' }}
          >
            ROOM: {multiplayer.roomId}
          </div>
        )}

        {/* Player panels — horizontal scroll on mobile */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            overflowX: 'auto',
            flexShrink: 0,
          }}
        >
          {game.players.map(player => (
            <div key={player.index} style={{ minWidth: 140, maxWidth: 160 }}>
              <PlayerPanel
                player={player}
                game={game}
                isActive={player.index === game.current}
                isViewed={player.index === viewedPlayer}
                onClick={() => setViewedPlayer(player.index)}
              />
            </div>
          ))}
        </div>

        {/* HUD */}
        <GameHUD
          game={game}
          localPlayerIndex={multiplayer.localPlayerIndex}
          isMultiplayer={multiplayer.isMultiplayer}
        />

        {/* Log panel */}
        <LogPanel log={game.log} isOpen={logOpen} onToggle={toggleLog} />
      </div>
    </div>
  );
}
