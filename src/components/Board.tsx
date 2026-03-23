import React, { useRef } from 'react';
import type { GameState } from '../types';
import {
  SQUARES,
  PLAYER_CONFIGS,
} from '../features/constants';
import {
  squareIdAt,
  isInnerCell,
  LANDSCAPE_COLS,
  LANDSCAPE_ROWS,
  PORTRAIT_COLS,
  PORTRAIT_ROWS,
} from '../features/boardLayout';
import { Tile } from './Tile';
import { PlayerToken } from './PlayerToken';
import { Dice } from './Dice';
import { useUIStore } from '../store/uiStore';

interface BoardProps {
  game: GameState;
  isDesktop: boolean;
}

export function Board({ game, isDesktop }: BoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const diceAnimating = useUIStore(s => s.diceAnimating);

  const cols = isDesktop ? LANDSCAPE_COLS : PORTRAIT_COLS;
  const rows = isDesktop ? LANDSCAPE_ROWS : PORTRAIT_ROWS;

  // Compute which players are on each square (for stacking offset)
  const squarePlayers: Record<number, number[]> = {};
  for (const player of game.players) {
    if (player.bankrupt) continue;
    if (!squarePlayers[player.position]) squarePlayers[player.position] = [];
    squarePlayers[player.position].push(player.index);
  }

  const cells: React.ReactNode[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const inner = isInnerCell(row, col, isDesktop);

      if (inner) {
        // Center area — render dice + board title here
        const centerRow = isDesktop ? Math.floor(LANDSCAPE_ROWS / 2) : Math.floor(PORTRAIT_ROWS / 2);
        const centerCol = isDesktop ? Math.floor(LANDSCAPE_COLS / 2) : Math.floor(PORTRAIT_COLS / 2);
        if (row === centerRow && col === centerCol) {
          cells.push(
            <div
              key={`${row}-${col}`}
              className="flex flex-col items-center justify-center"
              style={{ gridRow: row + 1, gridColumn: col + 1 }}
            >
              <div
                className="font-pixel text-accent text-center"
                style={{ fontSize: 16, marginBottom: 6, letterSpacing: 2 }}
              >
                MONO
                <br />
                CLONY
              </div>
              <Dice dice={game.dice} animating={diceAnimating} />
              <div
                className="font-vt text-pixel-dim text-center mt-2"
                style={{ fontSize: 28 }}
              >
                PARKING POT: ${game.parkingPot}
              </div>
            </div>,
          );
        } else {
          cells.push(
            <div
              key={`${row}-${col}`}
              style={{ gridRow: row + 1, gridColumn: col + 1 }}
            />,
          );
        }
        continue;
      }

      const sqId = squareIdAt(row, col, isDesktop);
      if (sqId === null) {
        cells.push(
          <div
            key={`${row}-${col}`}
            style={{ gridRow: row + 1, gridColumn: col + 1 }}
          />,
        );
        continue;
      }

      const sq = SQUARES[sqId];
      const ownerIndex = game.ownership[sqId] ?? null;
      const ownerColor = ownerIndex !== null ? PLAYER_CONFIGS[ownerIndex].color : null;
      const houses = game.houses[sqId] ?? 0;
      const isMortgaged = !!game.mortgaged[sqId];
      const playersHere = squarePlayers[sqId] ?? [];
      const isHighlighted = playersHere.length > 0;

      cells.push(
        <div
          key={`${row}-${col}`}
          style={{
            gridRow: row + 1,
            gridColumn: col + 1,
            position: 'relative',
          }}
        >
          <Tile
            square={sq}
            ownerColor={ownerColor}
            houses={houses}
            isMortgaged={isMortgaged}
            isHighlighted={isHighlighted}
          />
        </div>,
      );
    }
  }

  return (
    <div
      ref={boardRef}
      className="relative"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        width: '100%',
        height: '100%',
        background: '#0a0a0f',
        border: '2px solid #2a2a3d',
      }}
    >
      {cells}

      {/* Tokens overlay */}
      {game.players.map(player => {
        const playersOnSq = squarePlayers[player.position] ?? [];
        const offsetIndex = playersOnSq.indexOf(player.index);
        return (
          <PlayerToken
            key={player.index}
            player={player}
            isDesktop={isDesktop}
            boardRef={boardRef}
            isActive={player.index === game.current && !player.bankrupt}
            offset={offsetIndex}
          />
        );
      })}
    </div>
  );
}
