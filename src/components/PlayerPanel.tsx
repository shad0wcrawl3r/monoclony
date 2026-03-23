// React is used via JSX transform
import type { Player, GameState } from '../types';
import { SQUARES } from '../features/constants';
import { useUIStore } from '../store/uiStore';

interface PlayerPanelProps {
  player: Player;
  game: GameState;
  isActive: boolean;
  isViewed: boolean;
  onClick: () => void;
}

export function PlayerPanel({
  player,
  game,
  isActive,
  isViewed,
  onClick,
}: PlayerPanelProps) {
  const setModal = useUIStore(s => s.setModal);

  const ownedIds = Object.entries(game.ownership)
    .filter(([, owner]) => owner === player.index)
    .map(([id]) => Number(id));

  const propCount = ownedIds.length;

  function openProperties() {
    setModal({ type: 'properties', playerIndex: player.index });
  }

  return (
    <button
      className="w-full text-left"
      onClick={onClick}
      style={{
        background: isViewed ? '#1e1e2e' : '#12121a',
        border: `2px solid ${isActive ? player.color : isViewed ? '#2a2a3d' : '#1a1a2a'}`,
        padding: '8px 10px',
        cursor: 'pointer',
        transition: 'border-color 0.2s, background 0.2s',
        opacity: player.bankrupt ? 0.4 : 1,
      }}
    >
      <div className="flex items-center gap-2">
        {/* Token */}
        <div style={{ fontSize: 36, lineHeight: 1, filter: isActive ? `drop-shadow(0 0 4px ${player.color})` : undefined }}>
          {player.token}
        </div>

        {/* Name + money */}
        <div className="flex-1 min-w-0">
          <div
            className="font-pixel truncate"
            style={{ fontSize: 14, color: player.color, letterSpacing: 0.5 }}
          >
            {player.name}
            {player.bankrupt && ' [OUT]'}
            {player.inJail && ' [JAIL]'}
          </div>
          <div
            className="font-vt mt-0.5"
            style={{ fontSize: 36, color: '#3ddc84', lineHeight: 1 }}
          >
            ${player.money.toLocaleString()}
          </div>
        </div>

        {/* Property count */}
        <div className="text-right flex-shrink-0">
          <button
            className="font-pixel"
            style={{
              fontSize: 12,
              color: '#4fc3f7',
              background: 'transparent',
              border: '1px solid #2a2a3d',
              padding: '2px 4px',
              cursor: 'pointer',
            }}
            onClick={(e) => {
              e.stopPropagation();
              openProperties();
            }}
          >
            {propCount} PROP
          </button>
        </div>
      </div>

      {/* Jail free cards */}
      {player.jailFreeCards > 0 && (
        <div
          className="font-pixel mt-1"
          style={{ fontSize: 10, color: '#c084fc' }}
        >
          🎫 ×{player.jailFreeCards} JAIL FREE
        </div>
      )}

      {/* Position */}
      {isViewed && !player.bankrupt && (
        <div
          className="font-pixel mt-1"
          style={{ fontSize: 10, color: '#6b7280' }}
        >
          AT: {SQUARES[player.position]?.name ?? '?'}
        </div>
      )}
    </button>
  );
}
