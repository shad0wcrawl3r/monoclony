// React is used via JSX transform

interface DiceProps {
  dice: [number, number];
  animating: boolean;
}

const DOT_POSITIONS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

function DieFace({ value, animating }: { value: number; animating: boolean }) {
  const dots = DOT_POSITIONS[value] ?? [];

  return (
    <div
      className={animating ? 'dice-rolling' : ''}
      style={{
        width: 36,
        height: 36,
        background: '#1e1e2e',
        border: '2px solid #f7c948',
        borderRadius: 4,
        padding: 4,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(3, 1fr)',
        gap: 2,
        position: 'relative',
      }}
    >
      {Array.from({ length: 9 }, (_, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const hasDot = dots.some(([r, c]) => r === row && c === col);
        return (
          <div
            key={i}
            style={{
              borderRadius: '50%',
              background: hasDot ? '#f7c948' : 'transparent',
              width: '100%',
              height: '100%',
            }}
          />
        );
      })}
    </div>
  );
}

export function Dice({ dice, animating }: DiceProps) {
  const [d1, d2] = dice;
  const total = d1 + d2;

  return (
    <div
      className="flex flex-col items-center gap-1"
      style={{ pointerEvents: 'none' }}
    >
      <div className="flex gap-2">
        <DieFace value={d1 || 1} animating={animating} />
        <DieFace value={d2 || 1} animating={animating} />
      </div>
      {total > 0 && !animating && (
        <div
          className="font-vt text-accent"
          style={{ fontSize: 32, letterSpacing: 1 }}
        >
          = {total}
          {d1 === d2 && (
            <span className="text-pixel-green ml-1">DOUBLES!</span>
          )}
        </div>
      )}
    </div>
  );
}
