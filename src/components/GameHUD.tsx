// React is used via JSX transform
import type { GameState } from '../types';
import { useGameStore } from '../store/gameStore';
import { useUIStore } from '../store/uiStore';
import { SFX } from '../features/audio';

interface GameHUDProps {
  game: GameState;
  localPlayerIndex: number;
  isMultiplayer: boolean;
}

interface HUDButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  color?: string;
  small?: boolean;
}

function HUDButton({ label, onClick, disabled, color = '#f7c948', small }: HUDButtonProps) {
  return (
    <button
      className="pixel-btn"
      disabled={disabled}
      onClick={() => {
        SFX.click();
        onClick();
      }}
      style={{
        color: disabled ? '#6b7280' : color,
        borderColor: disabled ? '#2a2a3d' : color,
        background: '#12121a',
        boxShadow: disabled ? 'none' : `0 3px 0 ${color}44`,
        fontSize: small ? 14 : 16,
        padding: small ? '5px 8px' : '7px 12px',
        minWidth: small ? 60 : 80,
      }}
    >
      {label}
    </button>
  );
}

export function GameHUD({ game, localPlayerIndex, isMultiplayer }: GameHUDProps) {
  const {
    rollDice,
    endTurn,
    bailFromJail,
  } = useGameStore();
  const { setModal } = useUIStore();

  const currentPlayer = game.players[game.current];
  const isMyTurn = !isMultiplayer || game.current === localPlayerIndex;
  const isRollPhase = game.phase === 'roll';
  const isEndPhase = game.phase === 'end';
  const isWaiting = game.phase === 'waiting';

  if (!currentPlayer || currentPlayer.bankrupt) return null;

  const canRoll = isRollPhase && isMyTurn;
  const canEnd = isEndPhase && isMyTurn;
  const inJail = currentPlayer.inJail;

  // Properties owned by current player for mortgage panel
  const ownedCount = Object.values(game.ownership).filter(o => o === game.current).length;

  function openMortgage() {
    setModal({ type: 'mortgage' });
  }

  function openTrade() {
    setModal({ type: 'trade-select' });
  }

  return (
    <div
      style={{
        background: '#0f0f1a',
        borderTop: '2px solid #2a2a3d',
        padding: '8px 12px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        alignItems: 'center',
        minHeight: 52,
      }}
    >
      {/* Current player indicator */}
      <div className="flex items-center gap-2 mr-2">
        <span style={{ fontSize: 32 }}>{currentPlayer.token}</span>
        <div>
          <div
            className="font-pixel"
            style={{ fontSize: 12, color: currentPlayer.color }}
          >
            {currentPlayer.name}
          </div>
          <div
            className="font-vt"
            style={{ fontSize: 28, color: '#3ddc84', lineHeight: 1 }}
          >
            ${currentPlayer.money}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 32, background: '#2a2a3d', margin: '0 4px' }} />

      {/* Main action buttons */}
      {canRoll && !inJail && (
        <HUDButton label="ROLL 🎲" onClick={rollDice} color="#f7c948" />
      )}

      {canRoll && inJail && (
        <>
          <HUDButton label="ROLL (JAIL)" onClick={rollDice} color="#4fc3f7" small />
          <HUDButton
            label="BAIL $50"
            onClick={() => bailFromJail(false)}
            disabled={currentPlayer.money < 50}
            color="#ff4f5e"
            small
          />
          {currentPlayer.jailFreeCards > 0 && (
            <HUDButton
              label="USE CARD"
              onClick={() => bailFromJail(true)}
              color="#c084fc"
              small
            />
          )}
        </>
      )}

      {canEnd && (
        <HUDButton label="END TURN ▶" onClick={endTurn} color="#3ddc84" />
      )}

      {isWaiting && (
        <div className="font-pixel" style={{ fontSize: 14, color: '#f7c948' }}>
          WAITING...
        </div>
      )}

      {/* Always-available actions during current player's turn */}
      {isMyTurn && !isWaiting && (
        <>
          {ownedCount > 0 && (
            <HUDButton
              label="MORTGAGE"
              onClick={openMortgage}
              color="#fb923c"
              small
            />
          )}
          {game.players.filter(p => !p.bankrupt && p.index !== game.current).length > 0 && (
            <HUDButton
              label="TRADE"
              onClick={openTrade}
              color="#c084fc"
              small
            />
          )}
        </>
      )}

      {/* Phase indicator */}
      <div className="ml-auto">
        <span
          className="font-pixel"
          style={{
            fontSize: 12,
            color:
              isRollPhase ? '#f7c948'
              : isEndPhase ? '#3ddc84'
              : '#4fc3f7',
          }}
        >
          {isRollPhase ? 'ROLL PHASE' : isEndPhase ? 'END TURN' : 'WAITING'}
        </span>
      </div>
    </div>
  );
}
