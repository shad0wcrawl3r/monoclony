// React JSX transform — no explicit import needed
import type { GameState } from '../types';
import {
  SQUARES,
  CHANCE_CARDS,
  COMMUNITY_CARDS,
  COLOR_GROUPS,
} from '../features/constants';
import {
  checkMonopoly,
  canBuildHouse,
  houseCost,
  unmortgageCost,
} from '../features/gameLogic';
import { useGameStore } from '../store/gameStore';
import { useUIStore } from '../store/uiStore';
import type { PropertySquare, RailroadSquare, UtilitySquare } from '../types';
import { SFX } from '../features/audio';

// ─── Modal shell ──────────────────────────────────────────────────────────

interface ModalShellProps {
  title: string;
  titleColor?: string;
  children: React.ReactNode;
  onClose?: () => void;
}

function ModalShell({ title, titleColor = '#f7c948', children, onClose }: ModalShellProps) {
  return (
    <div
      className="modal-backdrop fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 100 }}
    >
      <div
        style={{
          background: '#12121a',
          border: '2px solid #2a2a3d',
          minWidth: 280,
          maxWidth: 'min(420px, 90vw)',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 0 32px rgba(0,0,0,0.8)',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: '#0f0f1a',
            borderBottom: '2px solid #2a2a3d',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <span className="font-pixel" style={{ fontSize: 18, color: titleColor }}>
            {title}
          </span>
          {onClose && (
            <button
              onClick={() => { SFX.click(); onClose(); }}
              style={{
                background: 'transparent',
                border: '1px solid #2a2a3d',
                color: '#6b7280',
                cursor: 'pointer',
                fontSize: 24,
                lineHeight: 1,
                padding: '2px 6px',
                fontFamily: 'monospace',
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: 14 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Action button ─────────────────────────────────────────────────────────

interface ActionBtnProps {
  label: string;
  onClick: () => void;
  color?: string;
  disabled?: boolean;
  fullWidth?: boolean;
}

function ActionBtn({ label, onClick, color = '#f7c948', disabled, fullWidth }: ActionBtnProps) {
  return (
    <button
      className="pixel-btn"
      disabled={disabled}
      onClick={() => { SFX.click(); onClick(); }}
      style={{
        color: disabled ? '#6b7280' : color,
        borderColor: disabled ? '#2a2a3d' : color,
        background: '#12121a',
        boxShadow: disabled ? 'none' : `0 3px 0 ${color}44`,
        fontSize: 16,
        padding: '7px 12px',
        width: fullWidth ? '100%' : undefined,
      }}
    >
      {label}
    </button>
  );
}

// ─── Buy modal ────────────────────────────────────────────────────────────

function BuyModal({ sqId, game }: { sqId: number; game: GameState }) {
  const { buyProperty, passProperty } = useGameStore();
  const sq = SQUARES[sqId];
  const player = game.players[game.current];
  const price = (sq as { price: number }).price;
  const canAfford = player.money >= price;

  const isProperty = sq.type === 'property';
  const stripColor = isProperty ? COLOR_GROUPS[(sq as PropertySquare).group] : null;

  return (
    <ModalShell title="BUY PROPERTY?" titleColor="#4fc3f7">
      {/* Color strip */}
      {stripColor && (
        <div style={{ height: 10, background: stripColor, margin: '-14px -14px 14px' }} />
      )}

      <div className="font-pixel text-center mb-3" style={{ fontSize: 22, color: '#e2e8f0' }}>
        {sq.name}
      </div>

      <div className="font-vt text-center mb-4" style={{ fontSize: 56, color: '#f7c948' }}>
        ${price}
      </div>

      {sq.type === 'property' && (
        <div className="mb-4">
          <div className="font-pixel mb-1" style={{ fontSize: 12, color: '#6b7280' }}>RENT SCHEDULE</div>
          {((sq as PropertySquare).rent).map((r, i) => (
            <div
              key={i}
              className="flex justify-between font-vt"
              style={{ fontSize: 28, color: '#e2e8f0', borderBottom: '1px solid #1a1a2a', paddingBottom: 1 }}
            >
              <span>{i === 0 ? 'Base' : i === 5 ? 'Hotel' : `${i} House${i > 1 ? 's' : ''}`}</span>
              <span style={{ color: '#3ddc84' }}>${r}</span>
            </div>
          ))}
        </div>
      )}

      {sq.type === 'railroad' && (
        <div className="mb-4">
          <div className="font-pixel mb-1" style={{ fontSize: 12, color: '#6b7280' }}>RENT BY RR OWNED</div>
          {((sq as RailroadSquare).rent).map((r, i) => (
            <div
              key={i}
              className="flex justify-between font-vt"
              style={{ fontSize: 28, color: '#e2e8f0', borderBottom: '1px solid #1a1a2a', paddingBottom: 1 }}
            >
              <span>{i + 1} Railroad{i > 0 ? 's' : ''}</span>
              <span style={{ color: '#3ddc84' }}>${r}</span>
            </div>
          ))}
        </div>
      )}

      {sq.type === 'utility' && (
        <div className="mb-4 font-vt" style={{ fontSize: 28, color: '#e2e8f0' }}>
          <div>1 utility: dice × {(sq as UtilitySquare).rent[0]}</div>
          <div>2 utilities: dice × {(sq as UtilitySquare).rent[1]}</div>
        </div>
      )}

      <div className="font-vt text-center mb-4" style={{ fontSize: 28, color: '#6b7280' }}>
        Your money: <span style={{ color: '#3ddc84' }}>${player.money}</span>
        {!canAfford && <span style={{ color: '#ff4f5e' }}> (insufficient!)</span>}
      </div>

      <div className="flex gap-3 justify-center">
        <ActionBtn label={`BUY $${price}`} onClick={() => buyProperty(sqId)} color="#3ddc84" disabled={!canAfford} />
        <ActionBtn label="PASS" onClick={passProperty} color="#ff4f5e" />
      </div>
    </ModalShell>
  );
}

// ─── Card modal ───────────────────────────────────────────────────────────

function CardModal({
  deck,
  cardIndex,
}: {
  deck: 'chance' | 'community';
  cardIndex: number;
  game: GameState;
}) {
  const { confirmCard } = useGameStore();
  const cards = deck === 'chance' ? CHANCE_CARDS : COMMUNITY_CARDS;
  const card = cards[cardIndex];
  const titleColor = deck === 'chance' ? '#fb923c' : '#c084fc';
  const title = deck === 'chance' ? '★ CHANCE ★' : '♦ COMMUNITY CHEST ♦';

  return (
    <ModalShell title={title} titleColor={titleColor}>
      <div
        className="font-vt text-center mb-6"
        style={{ fontSize: 44, color: '#e2e8f0', lineHeight: 1.4 }}
      >
        {card?.text ?? '???'}
      </div>
      <div className="flex justify-center">
        <ActionBtn label="OK" onClick={() => confirmCard(deck)} color={titleColor} />
      </div>
    </ModalShell>
  );
}

// ─── House modal ──────────────────────────────────────────────────────────

function HouseModal({ sqId, game }: { sqId: number; game: GameState }) {
  const { buildHouse } = useGameStore();
  const { setModal } = useUIStore();
  const sq = SQUARES[sqId];
  const player = game.players[game.current];
  const cost = houseCost(sqId);
  const currentHouses = game.houses[sqId] ?? 0;
  const canBuild = canBuildHouse(sqId, game.current, game.ownership, game.mortgaged, game.houses);
  const canAfford = player.money >= cost;

  const label = currentHouses >= 4 ? 'BUILD HOTEL' : `BUILD HOUSE (${currentHouses + 1})`;

  return (
    <ModalShell title="BUILD HOUSES?" titleColor="#3ddc84" onClose={() => { setModal(null); useGameStore.getState().passProperty(); }}>
      <div className="font-pixel text-center mb-2" style={{ fontSize: 20, color: '#e2e8f0' }}>
        {sq.name}
      </div>
      <div className="font-vt text-center mb-1" style={{ fontSize: 36, color: '#3ddc84' }}>
        Current: {currentHouses === 5 ? 'HOTEL' : `${currentHouses} house${currentHouses !== 1 ? 's' : ''}`}
      </div>
      <div className="font-vt text-center mb-4" style={{ fontSize: 36, color: '#f7c948' }}>
        Cost: ${cost} | Your $: ${player.money}
      </div>
      <div className="flex gap-3 justify-center">
        <ActionBtn
          label={label}
          onClick={() => buildHouse(sqId)}
          color="#3ddc84"
          disabled={!canBuild || !canAfford || currentHouses >= 5}
        />
        <ActionBtn
          label="SKIP"
          onClick={() => {
            setModal(null);
            // Set phase to end
            const store = useGameStore.getState();
            if (store.game) {
              store.setGameState({ ...store.game, phase: 'end' });
            }
          }}
          color="#6b7280"
        />
      </div>
    </ModalShell>
  );
}

// ─── Mortgage panel ───────────────────────────────────────────────────────

function MortgageModal({ game }: { game: GameState }) {
  const { mortgageProperty, unmortgageProperty } = useGameStore();
  const { setModal } = useUIStore();
  const playerIndex = game.current;
  const player = game.players[playerIndex];

  const ownedIds = Object.entries(game.ownership)
    .filter(([, owner]) => owner === playerIndex)
    .map(([id]) => Number(id));

  return (
    <ModalShell title="MORTGAGE / UNMORTGAGE" titleColor="#fb923c" onClose={() => setModal(null)}>
      {ownedIds.length === 0 && (
        <div className="font-vt text-pixel-dim" style={{ fontSize: 36 }}>
          You own no properties.
        </div>
      )}
      <div className="flex flex-col gap-2">
        {ownedIds.map(sqId => {
          const sq = SQUARES[sqId];
          const isMort = !!game.mortgaged[sqId];
          const hasHouses = (game.houses[sqId] ?? 0) > 0;
          const mortValue = (sq as { mortgage: number }).mortgage;
          const unmortCost = unmortgageCost(sqId);

          return (
            <div
              key={sqId}
              className="flex items-center justify-between"
              style={{ borderBottom: '1px solid #1a1a2a', paddingBottom: 6 }}
            >
              <div>
                <div className="font-pixel" style={{ fontSize: 12, color: isMort ? '#6b7280' : '#e2e8f0' }}>
                  {sq.name}
                  {isMort && ' [MORTGAGED]'}
                  {hasHouses && ' [HAS HOUSES]'}
                </div>
              </div>
              <div className="flex gap-2">
                {!isMort && (
                  <ActionBtn
                    label={`MORT +$${mortValue}`}
                    onClick={() => mortgageProperty(sqId)}
                    color="#fb923c"
                    disabled={hasHouses}
                  />
                )}
                {isMort && (
                  <ActionBtn
                    label={`UNMORT -$${unmortCost}`}
                    onClick={() => unmortgageProperty(sqId)}
                    color="#3ddc84"
                    disabled={player.money < unmortCost}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ModalShell>
  );
}

// ─── Trade select modal ───────────────────────────────────────────────────

function TradeSelectModal({ game }: { game: GameState }) {
  const { setModal } = useUIStore();
  const others = game.players.filter(
    p => !p.bankrupt && p.index !== game.current,
  );

  return (
    <ModalShell title="TRADE WITH..." titleColor="#c084fc" onClose={() => setModal(null)}>
      <div className="flex flex-col gap-3">
        {others.map(p => (
          <button
            key={p.index}
            className="pixel-btn"
            style={{
              color: p.color,
              borderColor: p.color,
              background: '#12121a',
              fontSize: 16,
              padding: '8px 12px',
            }}
            onClick={() => {
              SFX.click();
              setModal({ type: 'trade-builder', targetIndex: p.index });
            }}
          >
            {p.token} {p.name} (${p.money})
          </button>
        ))}
        {others.length === 0 && (
          <div className="font-vt text-pixel-dim" style={{ fontSize: 36 }}>
            No other active players.
          </div>
        )}
      </div>
    </ModalShell>
  );
}

// ─── Trade builder modal ──────────────────────────────────────────────────

function TradeBuilderModal({
  targetIndex,
  game,
}: {
  targetIndex: number;
  game: GameState;
}) {
  const { executeTrade: doTrade } = useGameStore();
  const { setModal, tradeOffer, setTradeOffer, resetTradeOffer } = useUIStore();
  const proposerIndex = game.current;
  const proposer = game.players[proposerIndex];
  const target = game.players[targetIndex];

  const proposerProps = Object.entries(game.ownership)
    .filter(([, owner]) => owner === proposerIndex)
    .map(([id]) => Number(id));
  const targetProps = Object.entries(game.ownership)
    .filter(([, owner]) => owner === targetIndex)
    .map(([id]) => Number(id));

  function toggleProp(sqId: number, side: 'proposer' | 'target') {
    const key = side === 'proposer' ? 'proposerProps' : 'targetProps';
    const current = tradeOffer[key];
    const updated = current.includes(sqId)
      ? current.filter(id => id !== sqId)
      : [...current, sqId];
    setTradeOffer({ [key]: updated });
  }

  function handleConfirm() {
    doTrade(proposerIndex, targetIndex, tradeOffer);
  }

  function handleCancel() {
    resetTradeOffer();
    setModal({ type: 'trade-select' });
  }

  const canAffordProposer = proposer.money >= tradeOffer.proposerCash;
  const canAffordTarget = target.money >= tradeOffer.targetCash;

  return (
    <ModalShell
      title={`TRADE: ${proposer.name} ↔ ${target.name}`}
      titleColor="#c084fc"
      onClose={handleCancel}
    >
      <div className="flex gap-4">
        {/* Proposer side */}
        <div style={{ flex: 1 }}>
          <div className="font-pixel mb-2" style={{ fontSize: 12, color: proposer.color }}>
            YOU OFFER:
          </div>
          <div className="flex flex-col gap-1 mb-2">
            {proposerProps.map(sqId => {
              const selected = tradeOffer.proposerProps.includes(sqId);
              return (
                <button
                  key={sqId}
                  onClick={() => toggleProp(sqId, 'proposer')}
                  className="font-pixel text-left"
                  style={{
                    fontSize: 10,
                    padding: '4px 6px',
                    background: selected ? '#1e2a1e' : '#1a1a2a',
                    border: `1px solid ${selected ? '#3ddc84' : '#2a2a3d'}`,
                    color: selected ? '#3ddc84' : '#e2e8f0',
                    cursor: 'pointer',
                  }}
                >
                  {selected ? '☑' : '☐'} {SQUARES[sqId].name}
                </button>
              );
            })}
          </div>
          <div>
            <div className="font-pixel mb-1" style={{ fontSize: 10, color: '#6b7280' }}>
              CASH OFFER:
            </div>
            <input
              type="number"
              min={0}
              max={proposer.money}
              value={tradeOffer.proposerCash}
              onChange={e => setTradeOffer({ proposerCash: Math.max(0, Number(e.target.value)) })}
              className="font-vt"
              style={{
                width: '100%',
                background: '#0a0a0f',
                border: '1px solid #2a2a3d',
                color: '#f7c948',
                padding: '4px 6px',
                fontSize: 32,
              }}
            />
            <div className="font-vt" style={{ fontSize: 24, color: canAffordProposer ? '#6b7280' : '#ff4f5e' }}>
              max: ${proposer.money}
            </div>
          </div>
        </div>

        <div style={{ width: 1, background: '#2a2a3d' }} />

        {/* Target side */}
        <div style={{ flex: 1 }}>
          <div className="font-pixel mb-2" style={{ fontSize: 12, color: target.color }}>
            THEY OFFER:
          </div>
          <div className="flex flex-col gap-1 mb-2">
            {targetProps.map(sqId => {
              const selected = tradeOffer.targetProps.includes(sqId);
              return (
                <button
                  key={sqId}
                  onClick={() => toggleProp(sqId, 'target')}
                  className="font-pixel text-left"
                  style={{
                    fontSize: 10,
                    padding: '4px 6px',
                    background: selected ? '#1e1e2e' : '#1a1a2a',
                    border: `1px solid ${selected ? '#c084fc' : '#2a2a3d'}`,
                    color: selected ? '#c084fc' : '#e2e8f0',
                    cursor: 'pointer',
                  }}
                >
                  {selected ? '☑' : '☐'} {SQUARES[sqId].name}
                </button>
              );
            })}
          </div>
          <div>
            <div className="font-pixel mb-1" style={{ fontSize: 10, color: '#6b7280' }}>
              CASH OFFER:
            </div>
            <input
              type="number"
              min={0}
              max={target.money}
              value={tradeOffer.targetCash}
              onChange={e => setTradeOffer({ targetCash: Math.max(0, Number(e.target.value)) })}
              className="font-vt"
              style={{
                width: '100%',
                background: '#0a0a0f',
                border: '1px solid #2a2a3d',
                color: '#f7c948',
                padding: '4px 6px',
                fontSize: 32,
              }}
            />
            <div className="font-vt" style={{ fontSize: 24, color: canAffordTarget ? '#6b7280' : '#ff4f5e' }}>
              max: ${target.money}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-center mt-4">
        <ActionBtn
          label="CONFIRM TRADE"
          onClick={handleConfirm}
          color="#c084fc"
          disabled={!canAffordProposer || !canAffordTarget}
        />
        <ActionBtn label="CANCEL" onClick={handleCancel} color="#ff4f5e" />
      </div>
    </ModalShell>
  );
}

// ─── Properties modal ─────────────────────────────────────────────────────

function PropertiesModal({
  playerIndex,
  game,
}: {
  playerIndex: number;
  game: GameState;
}) {
  const { setModal } = useUIStore();
  const player = game.players[playerIndex];

  const ownedIds = Object.entries(game.ownership)
    .filter(([, owner]) => owner === playerIndex)
    .map(([id]) => Number(id))
    .sort((a, b) => a - b);

  return (
    <ModalShell
      title={`${player.name}'S PROPERTIES`}
      titleColor={player.color}
      onClose={() => setModal(null)}
    >
      {ownedIds.length === 0 && (
        <div className="font-vt text-pixel-dim" style={{ fontSize: 36 }}>
          No properties owned.
        </div>
      )}
      <div className="flex flex-col gap-2">
        {ownedIds.map(sqId => {
          const sq = SQUARES[sqId];
          const isMort = !!game.mortgaged[sqId];
          const h = game.houses[sqId] ?? 0;
          const isProperty = sq.type === 'property';
          const hasMonopoly = isProperty
            ? checkMonopoly(sqId, playerIndex, game.ownership)
            : false;
          const stripColor = isProperty
            ? COLOR_GROUPS[(sq as PropertySquare).group]
            : null;

          return (
            <div
              key={sqId}
              style={{
                background: '#1a1a2a',
                border: `1px solid ${isMort ? '#2a2a3d' : hasMonopoly ? '#f7c948' : '#2a2a3d'}`,
                padding: '6px 8px',
                opacity: isMort ? 0.6 : 1,
              }}
            >
              <div className="flex items-center gap-2">
                {stripColor && (
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      background: stripColor,
                      borderRadius: 2,
                      flexShrink: 0,
                    }}
                  />
                )}
                <div className="flex-1">
                  <div className="font-pixel" style={{ fontSize: 12, color: '#e2e8f0' }}>
                    {sq.name}
                  </div>
                  <div className="font-vt flex gap-3 mt-0.5" style={{ fontSize: 26 }}>
                    {isProperty && (
                      <span style={{ color: '#3ddc84' }}>
                        {h === 5 ? 'HOTEL' : `${h}H`}
                        {hasMonopoly && ' ★'}
                      </span>
                    )}
                    {isMort && <span style={{ color: '#ff4f5e' }}>MORTGAGED</span>}
                    <span style={{ color: '#6b7280' }}>
                      ${(sq as { mortgage?: number }).mortgage ?? '—'} mtg
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ModalShell>
  );
}

// ─── Root modal dispatcher ────────────────────────────────────────────────

interface ModalProps {
  game: GameState;
}

export function Modal({ game }: ModalProps) {
  const modal = useUIStore(s => s.modal);
  if (!modal) return null;

  switch (modal.type) {
    case 'buy':
      return <BuyModal sqId={modal.sqId} game={game} />;
    case 'chance':
      return <CardModal deck="chance" cardIndex={modal.cardIndex} game={game} />;
    case 'community':
      return <CardModal deck="community" cardIndex={modal.cardIndex} game={game} />;
    case 'house':
      return <HouseModal sqId={modal.sqId} game={game} />;
    case 'mortgage':
      return <MortgageModal game={game} />;
    case 'trade-select':
      return <TradeSelectModal game={game} />;
    case 'trade-builder':
      return <TradeBuilderModal targetIndex={modal.targetIndex} game={game} />;
    case 'properties':
      return <PropertiesModal playerIndex={modal.playerIndex} game={game} />;
    default:
      return null;
  }
}
