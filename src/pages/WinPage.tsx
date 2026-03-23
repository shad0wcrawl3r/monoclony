import { useEffect } from 'react';
import type { Player } from '../types';
import { useGameStore } from '../store/gameStore';
import { SFX } from '../features/audio';

interface WinPageProps {
  winner: Player;
}

export function WinPage({ winner }: WinPageProps) {
  const { resetGame } = useGameStore();

  useEffect(() => {
    SFX.win();
  }, []);

  return (
    <div
      className="flex flex-col items-center justify-center w-full h-full"
      style={{ background: '#0a0a0f' }}
    >
      {/* Scanlines are applied globally via CSS */}

      {/* Winner announcement */}
      <div className="text-center" style={{ padding: '0 20px' }}>
        <div
          className="font-vt"
          style={{ fontSize: 56, color: '#6b7280', letterSpacing: 4, marginBottom: 12 }}
        >
          GAME OVER
        </div>

        <div
          style={{ fontSize: 128, lineHeight: 1, marginBottom: 16 }}
          className={winner.token ? 'token-active' : ''}
        >
          {winner.token}
        </div>

        <div
          className="font-pixel"
          style={{ fontSize: 40, color: winner.color, letterSpacing: 2, marginBottom: 8 }}
        >
          {winner.name}
        </div>

        <div
          className="font-pixel text-accent"
          style={{ fontSize: 28, letterSpacing: 4, marginBottom: 4 }}
        >
          WINS!
        </div>

        <div
          className="font-vt"
          style={{ fontSize: 44, color: '#3ddc84', marginBottom: 32 }}
        >
          Final Balance: ${winner.money.toLocaleString()}
        </div>

        {/* Stars decoration */}
        <div
          className="font-pixel text-accent"
          style={{ fontSize: 24, letterSpacing: 8, marginBottom: 32 }}
        >
          ★ ★ ★
        </div>

        <button
          className="pixel-btn"
          onClick={() => {
            SFX.click();
            resetGame();
          }}
          style={{
            color: '#0a0a0f',
            background: '#f7c948',
            borderColor: '#f7c948',
            fontSize: 20,
            padding: '12px 24px',
            boxShadow: '0 4px 0 #b8922e',
          }}
        >
          PLAY AGAIN ↺
        </button>
      </div>
    </div>
  );
}
