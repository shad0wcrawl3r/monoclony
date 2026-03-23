import { useLayoutEffect, useRef, useState } from 'react';
import type { Player } from '../types';
import { squareGridPos } from '../features/boardLayout';

interface PlayerTokenProps {
  player: Player;
  isDesktop: boolean;
  boardRef: React.RefObject<HTMLDivElement>;
  isActive: boolean;
  offset: number; // horizontal offset index for stacking multiple tokens on same square
}

export function PlayerToken({
  player,
  isDesktop,
  boardRef,
  isActive,
  offset,
}: PlayerTokenProps) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const tokenRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    const [row, col] = squareGridPos(player.position, isDesktop);
    const cols = isDesktop ? 15 : 7;
    const rows = isDesktop ? 7 : 15;

    const cellW = board.offsetWidth / cols;
    const cellH = board.offsetHeight / rows;

    // Center of the cell
    const cx = col * cellW + cellW / 2;
    const cy = row * cellH + cellH / 2;

    // Offset for multiple tokens on same square (2×2 grid)
    const SLOT_SIZE = 8;
    const offsets = [
      [-SLOT_SIZE, -SLOT_SIZE],
      [ SLOT_SIZE, -SLOT_SIZE],
      [-SLOT_SIZE,  SLOT_SIZE],
      [ SLOT_SIZE,  SLOT_SIZE],
    ];
    const [dx, dy] = offsets[offset] ?? [0, 0];

    setPos({ x: cx + dx, y: cy + dy });
  }, [player.position, isDesktop, boardRef, offset]);

  // Re-position on board resize
  useLayoutEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    const observer = new ResizeObserver(() => {
      const [row, col] = squareGridPos(player.position, isDesktop);
      const cols = isDesktop ? 15 : 7;
      const rows = isDesktop ? 7 : 15;
      const cellW = board.offsetWidth / cols;
      const cellH = board.offsetHeight / rows;
      const cx = col * cellW + cellW / 2;
      const cy = row * cellH + cellH / 2;
      const SLOT_SIZE = 8;
      const offsets = [
        [-SLOT_SIZE, -SLOT_SIZE],
        [ SLOT_SIZE, -SLOT_SIZE],
        [-SLOT_SIZE,  SLOT_SIZE],
        [ SLOT_SIZE,  SLOT_SIZE],
      ];
      const [dx, dy] = offsets[offset] ?? [0, 0];
      setPos({ x: cx + dx, y: cy + dy });
    });

    observer.observe(board);
    return () => observer.disconnect();
  }, [player.position, isDesktop, boardRef, offset]);

  if (!pos || player.bankrupt) return null;

  return (
    <div
      ref={tokenRef}
      className={isActive ? 'token-active' : ''}
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        transform: 'translate(-50%, -50%)',
        fontSize: 28,
        lineHeight: 1,
        zIndex: 10,
        pointerEvents: 'none',
        filter: isActive ? 'drop-shadow(0 0 4px ' + player.color + ')' : undefined,
        transition: 'left 0.3s ease, top 0.3s ease',
      }}
    >
      {player.token}
    </div>
  );
}
