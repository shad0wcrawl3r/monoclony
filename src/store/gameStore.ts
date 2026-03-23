import { create } from 'zustand';
import type { GameState, Player, MultiplayerState, CardDef } from '../types';
import {
  SQUARES,
  PLAYER_CONFIGS,
  CHANCE_CARDS,
  COMMUNITY_CARDS,
  PURCHASABLE_TYPES,
} from '../features/constants';
import {
  makeShuffledOrder,
  addLog,
  movePlayer,
  sendToJail,
  checkBankruptcy,
  calcRent,
  executeCardAction,
  drawCard,
  nextPlayer,
  adjustMoney,
  canBuildHouse,
  houseCost,
  unmortgageCost,
  executeTrade as execTradeLogic,
} from '../features/gameLogic';
import { SFX } from '../features/audio';
import { useUIStore } from './uiStore';

// ─── Internal helpers (module-level, not in store interface) ───────────────

function landOnSquare(s: GameState, playerIndex: number): GameState {
  const player = s.players[playerIndex];
  const sq = SQUARES[player.position];
  s = addLog(s, `${player.name} LANDS ON ${sq.name}`, 'info');

  switch (sq.type) {
    case 'go':
    case 'jail':
    case 'parking':
      s = { ...s, phase: 'end' };
      break;

    case 'gotojail':
      SFX.jail();
      s = { ...s, players: sendToJail(s.players, playerIndex), phase: 'end' };
      s = addLog(s, `${player.name} GOES TO JAIL!`, 'jail');
      break;

    case 'tax': {
      const amount = sq.amount;
      s = {
        ...s,
        players: adjustMoney(s.players, playerIndex, -amount),
        parkingPot: s.parkingPot + amount,
        phase: 'end',
      };
      s = addLog(s, `${player.name} PAYS TAX $${amount}`, 'money');
      s = checkBankruptcy(s, playerIndex).state;
      break;
    }

    case 'chance': {
      const { state: ns, card } = drawCard(s, 'chance');
      s = ns;
      s = addLog(s, `CHANCE: ${card.text}`, 'card');
      SFX.card();
      useUIStore.getState().setModal({
        type: 'chance',
        cardIndex: CHANCE_CARDS.findIndex(c => c.text === card.text),
      });
      (s as GameState & { _pendingCard: CardDef })._pendingCard = card;
      s = { ...s, phase: 'waiting' };
      break;
    }

    case 'community': {
      const { state: ns, card } = drawCard(s, 'community');
      s = ns;
      s = addLog(s, `COMMUNITY: ${card.text}`, 'card');
      SFX.card();
      useUIStore.getState().setModal({
        type: 'community',
        cardIndex: COMMUNITY_CARDS.findIndex(c => c.text === card.text),
      });
      (s as GameState & { _pendingCard: CardDef })._pendingCard = card;
      s = { ...s, phase: 'waiting' };
      break;
    }

    case 'property':
    case 'railroad':
    case 'utility': {
      const owner = s.ownership[sq.id];
      if (owner === undefined) {
        const price = (sq as { price: number }).price;
        if (player.money >= price) {
          useUIStore.getState().setModal({ type: 'buy', sqId: sq.id });
          s = { ...s, phase: 'waiting' };
        } else {
          s = addLog(s, `${player.name} CAN'T AFFORD ${sq.name}`, 'warn');
          s = { ...s, phase: 'end' };
        }
      } else if (owner === playerIndex) {
        if (sq.type === 'property' && canBuildHouse(sq.id, playerIndex, s.ownership, s.mortgaged, s.houses)) {
          useUIStore.getState().setModal({ type: 'house', sqId: sq.id });
          s = { ...s, phase: 'waiting' };
        } else {
          s = { ...s, phase: 'end' };
        }
      } else {
        if (!s.mortgaged[sq.id]) {
          const rent = calcRent(sq.id, s.dice, s.ownership, s.mortgaged, s.houses);
          s = {
            ...s,
            players: adjustMoney(
              adjustMoney(s.players, playerIndex, -rent),
              owner,
              rent,
            ),
          };
          s = addLog(s, `${player.name} PAYS $${rent} RENT TO ${s.players[owner].name}`, 'money');
          SFX.rent();
          s = checkBankruptcy(s, playerIndex).state;
        } else {
          s = addLog(s, `${sq.name} IS MORTGAGED — NO RENT`, 'info');
        }
        s = { ...s, phase: 'end' };
      }
      break;
    }
  }

  return s;
}

function moveAndLand(s: GameState, playerIndex: number, steps: number): GameState {
  const { players, passedGo } = movePlayer(s.players, playerIndex, steps);
  if (passedGo) {
    SFX.go();
    s = addLog({ ...s, players }, `${players[playerIndex].name} PASSES GO! +$200`, 'money');
  } else {
    s = { ...s, players };
  }
  SFX.move();
  return landOnSquare(s, playerIndex);
}

// ─── Initial state factory ─────────────────────────────────────────────────

function createInitialGameState(
  playerNames: string[],
  playerCount: number,
): GameState {
  const players: Player[] = Array.from({ length: playerCount }, (_, i) => ({
    index: i,
    name: playerNames[i] ?? PLAYER_CONFIGS[i].name,
    token: PLAYER_CONFIGS[i].token,
    color: PLAYER_CONFIGS[i].color,
    money: 1500,
    position: 0,
    inJail: false,
    jailTurns: 0,
    jailFreeCards: 0,
    bankrupt: false,
  }));

  return {
    players,
    current: 0,
    phase: 'roll',
    ownership: {},
    mortgaged: {},
    houses: {},
    dice: [0, 0],
    doublesCount: 0,
    chanceIdx: 0,
    communityIdx: 0,
    chanceOrder: makeShuffledOrder(CHANCE_CARDS.length),
    communityOrder: makeShuffledOrder(COMMUNITY_CARDS.length),
    parkingPot: 0,
    log: [],
    logCounter: 0,
    winner: null,
  };
}

// ─── Store interface ───────────────────────────────────────────────────────

interface GameStore {
  game: GameState | null;
  multiplayer: MultiplayerState;

  startGame: (playerNames: string[], playerCount: number) => void;
  resetGame: () => void;
  setGameState: (state: GameState) => void;

  rollDice: () => void;
  endTurn: () => void;

  bailFromJail: (useCard?: boolean) => void;

  buyProperty: (sqId: number) => void;
  passProperty: () => void;
  buildHouse: (sqId: number) => void;
  mortgageProperty: (sqId: number) => void;
  unmortgageProperty: (sqId: number) => void;

  confirmCard: (deck: 'chance' | 'community') => void;

  executeTrade: (
    proposerIndex: number,
    targetIndex: number,
    offer: {
      proposerProps: number[];
      proposerCash: number;
      targetProps: number[];
      targetCash: number;
    },
  ) => void;

  setMultiplayer: (mp: Partial<MultiplayerState>) => void;
}

// ─── Store implementation ──────────────────────────────────────────────────

export const useGameStore = create<GameStore>((set, get) => ({
  game: null,
  multiplayer: {
    isMultiplayer: false,
    roomId: null,
    localPlayerIndex: 0,
  },

  startGame(playerNames, playerCount) {
    const game = createInitialGameState(playerNames, playerCount);
    set({ game });
  },

  resetGame() {
    set({ game: null });
    useUIStore.getState().setModal(null);
  },

  setGameState(state) {
    set({ game: state });
  },

  // ── Roll dice ────────────────────────────────────────────────────────────
  rollDice() {
    const { game } = get();
    if (!game) return;
    if (game.phase !== 'roll') return;
    const player = game.players[game.current];
    if (player.bankrupt) return;

    const d1 = Math.ceil(Math.random() * 6);
    const d2 = Math.ceil(Math.random() * 6);
    const doubles = d1 === d2;

    SFX.roll();
    useUIStore.getState().setDiceAnimating(true);
    setTimeout(() => useUIStore.getState().setDiceAnimating(false), 650);

    let s: GameState = { ...game, dice: [d1, d2] };

    if (player.inJail) {
      if (doubles) {
        s = addLog(s, `${player.name} ROLLS DOUBLES — RELEASED FROM JAIL!`, 'jail');
        s = {
          ...s,
          players: s.players.map((p, i) =>
            i === s.current ? { ...p, inJail: false, jailTurns: 0 } : p,
          ),
        };
        s = moveAndLand(s, s.current, d1 + d2);
      } else {
        const newTurns = player.jailTurns + 1;
        if (newTurns >= 3) {
          s = addLog(s, `${player.name} SERVES 3 TURNS — AUTO-PAY $50 + MOVE`, 'jail');
          s = {
            ...s,
            players: adjustMoney(s.players, s.current, -50).map((p, i) =>
              i === s.current ? { ...p, inJail: false, jailTurns: 0 } : p,
            ),
          };
          s = moveAndLand(s, s.current, d1 + d2);
        } else {
          s = addLog(s, `${player.name} STAYS IN JAIL (turn ${newTurns}/3)`, 'jail');
          s = {
            ...s,
            players: s.players.map((p, i) =>
              i === s.current ? { ...p, jailTurns: newTurns } : p,
            ),
            phase: 'end',
          };
        }
      }
    } else {
      if (doubles && game.doublesCount + 1 >= 3) {
        s = addLog(s, `${player.name} ROLLS 3 DOUBLES — SPEEDING TO JAIL!`, 'jail');
        SFX.jail();
        s = { ...s, players: sendToJail(s.players, s.current), phase: 'end', doublesCount: 0 };
      } else {
        if (doubles) s = { ...s, doublesCount: s.doublesCount + 1 };
        s = moveAndLand(s, s.current, d1 + d2);
      }
    }

    set({ game: s });
  },

  // ── End turn ─────────────────────────────────────────────────────────────
  endTurn() {
    const { game } = get();
    if (!game || game.phase !== 'end') return;

    const player = game.players[game.current];
    if (game.dice[0] === game.dice[1] && game.doublesCount > 0 && !player.inJail && !player.bankrupt) {
      set({ game: { ...game, phase: 'roll' } });
      return;
    }

    const s = nextPlayer(game);
    set({ game: s });
    useUIStore.getState().setViewedPlayer(s.current);
  },

  // ── Bail from jail ───────────────────────────────────────────────────────
  bailFromJail(useCard = false) {
    const { game } = get();
    if (!game) return;
    const player = game.players[game.current];
    if (!player.inJail) return;

    let s = game;

    if (useCard && player.jailFreeCards > 0) {
      s = {
        ...s,
        players: s.players.map((p, i) =>
          i === s.current
            ? { ...p, inJail: false, jailTurns: 0, jailFreeCards: p.jailFreeCards - 1 }
            : p,
        ),
      };
      s = addLog(s, `${player.name} USES GET OUT OF JAIL FREE CARD!`, 'jail');
    } else {
      if (player.money < 50) return;
      s = {
        ...s,
        players: adjustMoney(s.players, s.current, -50).map((p, i) =>
          i === s.current ? { ...p, inJail: false, jailTurns: 0 } : p,
        ),
      };
      s = addLog(s, `${player.name} PAYS $50 BAIL!`, 'jail');
    }

    SFX.jail();
    set({ game: s });
  },

  // ── Buy property ─────────────────────────────────────────────────────────
  buyProperty(sqId) {
    const { game } = get();
    if (!game) return;
    const playerIndex = game.current;
    const player = game.players[playerIndex];
    const sq = SQUARES[sqId];
    if (!PURCHASABLE_TYPES.has(sq.type)) return;

    const price = (sq as { price: number }).price;
    if (player.money < price) return;

    let s: GameState = {
      ...game,
      players: adjustMoney(game.players, playerIndex, -price),
      ownership: { ...game.ownership, [sqId]: playerIndex },
      phase: 'end',
    };
    s = addLog(s, `${player.name} BUYS ${sq.name} FOR $${price}`, 'property');
    SFX.buy();
    useUIStore.getState().setModal(null);
    set({ game: s });
  },

  // ── Pass on buying ───────────────────────────────────────────────────────
  passProperty() {
    const { game } = get();
    if (!game) return;
    useUIStore.getState().setModal(null);
    set({ game: { ...game, phase: 'end' } });
  },

  // ── Build house ──────────────────────────────────────────────────────────
  buildHouse(sqId) {
    const { game } = get();
    if (!game) return;
    const playerIndex = game.current;
    const player = game.players[playerIndex];
    const cost = houseCost(sqId);

    if (player.money < cost) return;
    if (!canBuildHouse(sqId, playerIndex, game.ownership, game.mortgaged, game.houses)) return;

    const newHouses = { ...game.houses, [sqId]: (game.houses[sqId] ?? 0) + 1 };
    let s: GameState = {
      ...game,
      players: adjustMoney(game.players, playerIndex, -cost),
      houses: newHouses,
      phase: 'end',
    };
    const count = newHouses[sqId];
    const label = count === 5 ? 'HOTEL' : `${count} HOUSE${count > 1 ? 'S' : ''}`;
    s = addLog(s, `${player.name} BUILDS ${label} ON ${SQUARES[sqId].name} (-$${cost})`, 'property');
    SFX.house();
    useUIStore.getState().setModal(null);
    set({ game: s });
  },

  // ── Mortgage property ────────────────────────────────────────────────────
  mortgageProperty(sqId) {
    const { game } = get();
    if (!game) return;
    const playerIndex = game.current;
    const player = game.players[playerIndex];
    if (game.ownership[sqId] !== playerIndex) return;
    if (game.mortgaged[sqId]) return;
    if (game.houses[sqId]) return;

    const sq = SQUARES[sqId];
    const value = (sq as { mortgage: number }).mortgage;

    let s: GameState = {
      ...game,
      players: adjustMoney(game.players, playerIndex, value),
      mortgaged: { ...game.mortgaged, [sqId]: true },
    };
    s = addLog(s, `${player.name} MORTGAGES ${sq.name} FOR $${value}`, 'property');
    SFX.mortgage();
    set({ game: s });
  },

  // ── Unmortgage property ──────────────────────────────────────────────────
  unmortgageProperty(sqId) {
    const { game } = get();
    if (!game) return;
    const playerIndex = game.current;
    const player = game.players[playerIndex];
    if (game.ownership[sqId] !== playerIndex) return;
    if (!game.mortgaged[sqId]) return;

    const cost = unmortgageCost(sqId);
    if (player.money < cost) return;

    const newMortgaged = { ...game.mortgaged };
    delete newMortgaged[sqId];

    let s: GameState = {
      ...game,
      players: adjustMoney(game.players, playerIndex, -cost),
      mortgaged: newMortgaged,
    };
    s = addLog(s, `${player.name} UNMORTGAGES ${SQUARES[sqId].name} FOR $${cost}`, 'property');
    SFX.unmort();
    set({ game: s });
  },

  // ── Confirm card ─────────────────────────────────────────────────────────
  confirmCard(_deck) {
    const { game } = get();
    if (!game) return;
    const playerIndex = game.current;
    const pendingCard = (game as GameState & { _pendingCard?: CardDef })._pendingCard;
    if (!pendingCard) return;

    let s = executeCardAction(game, playerIndex, pendingCard);
    delete (s as GameState & { _pendingCard?: CardDef })._pendingCard;

    const movedActions = ['advanceTo', 'advanceToGo', 'goBack3'];
    if (movedActions.includes(pendingCard.actionType) && pendingCard.actionType !== 'goToJail') {
      s = landOnSquare(s, playerIndex);
    } else {
      s = { ...s, phase: 'end' };
    }

    useUIStore.getState().setModal(null);
    set({ game: s });
  },

  // ── Execute trade ────────────────────────────────────────────────────────
  executeTrade(proposerIndex, targetIndex, offer) {
    const { game } = get();
    if (!game) return;

    const s = execTradeLogic(game, proposerIndex, targetIndex, offer);
    SFX.trade();
    useUIStore.getState().setModal(null);
    useUIStore.getState().resetTradeOffer();
    set({ game: s });
  },

  // ── Multiplayer ──────────────────────────────────────────────────────────
  setMultiplayer(mp) {
    set((s) => ({ multiplayer: { ...s.multiplayer, ...mp } }));
  },
}));
