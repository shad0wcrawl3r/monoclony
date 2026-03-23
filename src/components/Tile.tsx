import React from 'react'; // needed for React.memo
import type { Square, ColorGroup } from '../types';
import { COLOR_GROUPS } from '../features/constants';

interface TileProps {
  square: Square;
  ownerColor: string | null;
  houses: number; // 0-5 (5=hotel)
  isMortgaged: boolean;
  isHighlighted: boolean; // current player is here
}

const TYPE_ICONS: Record<string, string> = {
  go:       '★',
  jail:     '⊠',
  parking:  'P',
  gotojail: '→⊠',
  chance:   '?',
  community:'♦',
  tax:      '$',
  railroad: '🚂',
  utility:  '⚡',
};

function ColorStrip({ group }: { group: ColorGroup }) {
  const color = COLOR_GROUPS[group] ?? '#888';
  return (
    <div
      className="w-full"
      style={{ height: 6, background: color, flexShrink: 0 }}
    />
  );
}

function HouseIndicators({ count }: { count: number }) {
  if (count === 0) return null;
  if (count === 5) {
    return (
      <div className="flex justify-center mt-0.5">
        <div
          className="text-pixel-red font-pixel"
          style={{ fontSize: 14, lineHeight: 1 }}
        >
          HTL
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-center gap-px mt-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{ width: 5, height: 5, background: '#3ddc84', borderRadius: 1 }}
        />
      ))}
    </div>
  );
}

export const Tile = React.memo(function Tile({
  square,
  ownerColor,
  houses,
  isMortgaged,
  isHighlighted,
}: TileProps) {
  const isProperty = square.type === 'property';
  const isRailroad = square.type === 'railroad';
  const isUtility = square.type === 'utility';

  const borderColor = isHighlighted ? '#f7c948' : ownerColor ?? '#2a2a3d';
  const borderWidth = isHighlighted ? 2 : ownerColor ? 2 : 1;

  return (
    <div
      className="relative flex flex-col overflow-hidden select-none"
      style={{
        width: '100%',
        height: '100%',
        background: isMortgaged ? '#1a1a2e' : '#12121a',
        border: `${borderWidth}px solid ${borderColor}`,
        opacity: isMortgaged ? 0.6 : 1,
        transition: 'border-color 0.2s',
      }}
    >
      {/* Color strip for properties */}
      {isProperty && (
        <ColorStrip group={(square as { group: ColorGroup }).group} />
      )}

      {/* Owner dot for railroad/utility */}
      {(isRailroad || isUtility) && ownerColor && (
        <div
          style={{
            position: 'absolute',
            top: 2,
            right: 2,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: ownerColor,
          }}
        />
      )}

      {/* Mortgage overlay */}
      {isMortgaged && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 1, pointerEvents: 'none' }}
        >
          <span
            className="font-pixel text-pixel-red"
            style={{ fontSize: 12, opacity: 0.7, transform: 'rotate(-20deg)' }}
          >
            MRTG
          </span>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col items-center justify-center flex-1 px-0.5 py-0.5 min-h-0">
        {/* Icon for special squares */}
        {!isProperty && (
          <div
            className="font-pixel text-center"
            style={{
              fontSize: 16,
              color:
                square.type === 'go' ? '#f7c948'
                : square.type === 'jail' ? '#4fc3f7'
                : square.type === 'gotojail' ? '#ff4f5e'
                : square.type === 'parking' ? '#3ddc84'
                : square.type === 'chance' ? '#fb923c'
                : square.type === 'community' ? '#c084fc'
                : square.type === 'tax' ? '#ff4f5e'
                : '#e2e8f0',
              lineHeight: 1.2,
            }}
          >
            {TYPE_ICONS[square.type] ?? '?'}
          </div>
        )}

        {/* Square name */}
        <div
          className="font-pixel text-center leading-tight"
          style={{
            fontSize: 10,
            color: isMortgaged ? '#6b7280' : '#e2e8f0',
            wordBreak: 'break-word',
            hyphens: 'auto',
            maxWidth: '100%',
            marginTop: isProperty ? 2 : 1,
          }}
        >
          {square.name}
        </div>

        {/* Price for purchasable */}
        {(isProperty || isRailroad || isUtility) && (
          <div
            className="font-vt text-center"
            style={{ fontSize: 22, color: '#f7c948', marginTop: 1 }}
          >
            ${(square as { price: number }).price}
          </div>
        )}

        {/* Tax amount */}
        {square.type === 'tax' && (
          <div
            className="font-vt text-center"
            style={{ fontSize: 22, color: '#ff4f5e', marginTop: 1 }}
          >
            ${square.amount}
          </div>
        )}
      </div>

      {/* House indicators at bottom of property */}
      {isProperty && <HouseIndicators count={houses} />}
    </div>
  );
});
