// Pure game logic functions — no side effects, no store imports.

import type {
  GameState,
  Player,
  CardDef,
  PropertySquare,
  RailroadSquare,
  UtilitySquare,
  LogEntry,
  LogType,
} from '../types';
import {
  SQUARES,
  GROUP_SIZES,
  RAILROAD_IDS,
  UTILITY_IDS,
  CHANCE_CARDS,
  COMMUNITY_CARDS,
} from './constants';

// ─── Helpers ───────────────────────────────────────────────────────────────

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function makeShuffledOrder(length: number): number[] {
  return shuffle(Array.from({ length }, (_, i) => i));
}

export function addLog(
  state: GameState,
  text: string,
  type: LogType = 'info',
): GameState {
  const entry: LogEntry = { id: state.logCounter + 1, text, type };
  return {
    ...state,
    logCounter: state.logCounter + 1,
    log: [entry, ...state.log].slice(0, 100),
  };
}

// ─── Monopoly check ────────────────────────────────────────────────────────

export function checkMonopoly(
  sqId: number,
  playerIndex: number,
  ownership: Record<number, number>,
): boolean {
  const sq = SQUARES[sqId];
  if (sq.type !== 'property') return false;
  const group = sq.group;
  const groupSquares = SQUARES.filter(
    s => s.type === 'property' && s.group === group,
  );
  const size = GROUP_SIZES[group] ?? groupSquares.length;
  const owned = groupSquares.filter(s => ownership[s.id] === playerIndex).length;
  return owned === size;
}

export function getGroupSquares(group: string): number[] {
  return SQUARES.filter(s => s.type === 'property' && (s as PropertySquare).group === group).map(s => s.id);
}

// ─── Rent calculation ──────────────────────────────────────────────────────

export function calcRent(
  sqId: number,
  dice: [number, number],
  ownership: Record<number, number>,
  mortgaged: Record<number, boolean>,
  houses: Record<number, number>,
): number {
  if (mortgaged[sqId]) return 0;

  const sq = SQUARES[sqId];

  if (sq.type === 'property') {
    const prop = sq as PropertySquare;
    const h = houses[sqId] ?? 0;
    let rent = prop.rent[h];
    // Double rent if 0 houses and owner has full color group
    if (h === 0 && checkMonopoly(sqId, ownership[sqId], ownership)) {
      rent *= 2;
    }
    return rent;
  }

  if (sq.type === 'railroad') {
    const rr = sq as RailroadSquare;
    const owner = ownership[sqId];
    const count = RAILROAD_IDS.filter(id => ownership[id] === owner).length;
    return rr.rent[count - 1] ?? 0;
  }

  if (sq.type === 'utility') {
    const util = sq as UtilitySquare;
    const owner = ownership[sqId];
    const count = UTILITY_IDS.filter(id => ownership[id] === owner).length;
    const multiplier = util.rent[count - 1] ?? util.rent[0];
    return multiplier * (dice[0] + dice[1]);
  }

  return 0;
}

// ─── Player money helpers ──────────────────────────────────────────────────

export function adjustMoney(
  players: Player[],
  index: number,
  delta: number,
): Player[] {
  return players.map((p, i) =>
    i === index ? { ...p, money: p.money + delta } : p,
  );
}

// ─── Move player ───────────────────────────────────────────────────────────

/**
 * Moves a player by `steps` squares, collecting $200 if passing GO.
 * Returns updated players array and whether GO was passed.
 */
export function movePlayer(
  players: Player[],
  playerIndex: number,
  steps: number,
): { players: Player[]; passedGo: boolean } {
  const player = players[playerIndex];
  const rawNew = player.position + steps;
  const wrappedPos = rawNew % 40;
  const didPassGo = rawNew >= 40;

  let updated = players.map((p, i) =>
    i === playerIndex ? { ...p, position: wrappedPos } : p,
  );

  if (didPassGo) {
    updated = adjustMoney(updated, playerIndex, 200);
  }

  return { players: updated, passedGo: didPassGo };
}

// ─── Send to jail ──────────────────────────────────────────────────────────

export function sendToJail(players: Player[], playerIndex: number): Player[] {
  return players.map((p, i) =>
    i === playerIndex
      ? { ...p, position: 10, inJail: true, jailTurns: 0 }
      : p,
  );
}

// ─── Bankruptcy check ──────────────────────────────────────────────────────

/**
 * Checks if player has gone bankrupt (money <= 0).
 * If so, marks them bankrupt and releases all their properties.
 * Returns updated state and whether bankruptcy occurred.
 */
export function checkBankruptcy(
  state: GameState,
  playerIndex: number,
): { state: GameState; went_bankrupt: boolean } {
  const player = state.players[playerIndex];
  if (player.money > 0) return { state, went_bankrupt: false };

  // Release all owned properties
  const newOwnership = { ...state.ownership };
  const newHouses = { ...state.houses };
  for (const [sqId, owner] of Object.entries(newOwnership)) {
    if (owner === playerIndex) {
      delete newOwnership[Number(sqId)];
      delete newHouses[Number(sqId)];
    }
  }

  const newMortgaged = { ...state.mortgaged };
  for (const sqId of Object.keys(newMortgaged)) {
    if (newOwnership[Number(sqId)] === undefined) {
      delete newMortgaged[Number(sqId)];
    }
  }

  const newPlayers = state.players.map((p, i) =>
    i === playerIndex ? { ...p, bankrupt: true, money: 0 } : p,
  );

  let newState: GameState = {
    ...state,
    players: newPlayers,
    ownership: newOwnership,
    mortgaged: newMortgaged,
    houses: newHouses,
  };
  newState = addLog(newState, `${player.name} IS BANKRUPT!`, 'warn');

  // Check for winner
  const activePlayers = newPlayers.filter(p => !p.bankrupt);
  if (activePlayers.length === 1) {
    newState = { ...newState, winner: activePlayers[0].index };
  }

  return { state: newState, went_bankrupt: true };
}

// ─── Card actions ──────────────────────────────────────────────────────────

/**
 * Applies a card action to the state. Returns the new state.
 * Note: advanceTo / advanceToGo may trigger further landing logic —
 * the store handles that after receiving the new state.
 */
export function executeCardAction(
  state: GameState,
  playerIndex: number,
  card: CardDef,
): GameState {
  let s = state;
  const player = s.players[playerIndex];

  switch (card.actionType) {
    case 'advanceToGo': {
      const players = adjustMoney(s.players, playerIndex, 200);
      const updatedPlayers = players.map((p, i) =>
        i === playerIndex ? { ...p, position: 0 } : p,
      );
      s = { ...s, players: updatedPlayers };
      s = addLog(s, `${player.name} ADVANCES TO GO! +$200`, 'money');
      break;
    }

    case 'goToJail': {
      s = { ...s, players: sendToJail(s.players, playerIndex) };
      s = addLog(s, `${player.name} GOES TO JAIL!`, 'jail');
      break;
    }

    case 'collectAmount': {
      const amount = card.amount ?? 0;
      s = { ...s, players: adjustMoney(s.players, playerIndex, amount) };
      s = addLog(s, `${player.name} COLLECTS $${amount}`, 'money');
      break;
    }

    case 'payAmount': {
      const amount = card.amount ?? 0;
      s = {
        ...s,
        players: adjustMoney(s.players, playerIndex, -amount),
        parkingPot: s.parkingPot + amount,
      };
      s = addLog(s, `${player.name} PAYS $${amount}`, 'money');
      const bc = checkBankruptcy(s, playerIndex);
      s = bc.state;
      break;
    }

    case 'advanceTo': {
      const targetId = card.sqId ?? 0;
      const current = s.players[playerIndex].position;
      const passedGo = targetId < current && targetId !== current;
      let newPlayers = s.players.map((p, i) =>
        i === playerIndex ? { ...p, position: targetId } : p,
      );
      if (passedGo) {
        newPlayers = adjustMoney(newPlayers, playerIndex, 200);
        s = addLog(s, `${player.name} PASSES GO! +$200`, 'money');
      }
      s = { ...s, players: newPlayers };
      s = addLog(s, `${player.name} ADVANCES TO ${SQUARES[targetId].name}`, 'info');
      break;
    }

    case 'goBack3': {
      const newPos = ((s.players[playerIndex].position - 3) + 40) % 40;
      const newPlayers = s.players.map((p, i) =>
        i === playerIndex ? { ...p, position: newPos } : p,
      );
      s = { ...s, players: newPlayers };
      s = addLog(s, `${player.name} GOES BACK 3 SPACES TO ${SQUARES[newPos].name}`, 'info');
      break;
    }

    case 'jailFree': {
      const newPlayers = s.players.map((p, i) =>
        i === playerIndex ? { ...p, jailFreeCards: p.jailFreeCards + 1 } : p,
      );
      s = { ...s, players: newPlayers };
      s = addLog(s, `${player.name} GETS GET OUT OF JAIL FREE CARD!`, 'card');
      break;
    }
  }

  return s;
}

// ─── Next card from deck ────────────────────────────────────────────────────

export function drawCard(
  state: GameState,
  deck: 'chance' | 'community',
): { state: GameState; card: CardDef } {
  const isChance = deck === 'chance';
  const cards = isChance ? CHANCE_CARDS : COMMUNITY_CARDS;
  const order = isChance ? state.chanceOrder : state.communityOrder;
  const idx = isChance ? state.chanceIdx : state.communityIdx;

  const cardIndex = order[idx % order.length];
  const card = cards[cardIndex];

  const newIdx = (idx + 1) % order.length;
  const newState = isChance
    ? { ...state, chanceIdx: newIdx }
    : { ...state, communityIdx: newIdx };

  return { state: newState, card };
}

// ─── House building ────────────────────────────────────────────────────────

/**
 * Returns true if the player can build a house on sqId.
 * Rules: must own monopoly, all group squares must have equal or fewer houses
 * than the target square, and can't exceed 5 (hotel).
 */
export function canBuildHouse(
  sqId: number,
  playerIndex: number,
  ownership: Record<number, number>,
  mortgaged: Record<number, boolean>,
  houses: Record<number, number>,
): boolean {
  const sq = SQUARES[sqId];
  if (sq.type !== 'property') return false;
  if (ownership[sqId] !== playerIndex) return false;
  if (mortgaged[sqId]) return false;
  if (!checkMonopoly(sqId, playerIndex, ownership)) return false;

  const currentHouses = houses[sqId] ?? 0;
  if (currentHouses >= 5) return false;

  // Even building rule: can't build if another group square has fewer houses
  const groupSqs = getGroupSquares((sq as PropertySquare).group);
  const minHouses = Math.min(...groupSqs.map(id => houses[id] ?? 0));
  return currentHouses <= minHouses;
}

/**
 * Cost to build one house/hotel on a property.
 * Standard Monopoly house costs:
 */
export function houseCost(sqId: number): number {
  const sq = SQUARES[sqId];
  if (sq.type !== 'property') return 0;
  const group = (sq as PropertySquare).group;
  const costs: Record<string, number> = {
    brown: 50, lblue: 50, magenta: 100, orange: 100,
    red: 150, yellow: 150, green: 200, dblue: 200,
  };
  return costs[group] ?? 100;
}

// ─── Mortgage helpers ──────────────────────────────────────────────────────

export function unmortgageCost(sqId: number): number {
  const sq = SQUARES[sqId];
  if (sq.type !== 'property' && sq.type !== 'railroad' && sq.type !== 'utility') return 0;
  return Math.floor((sq as PropertySquare).mortgage * 1.1);
}

// ─── Trade execution ───────────────────────────────────────────────────────

export interface TradeOfferData {
  proposerProps: number[];
  proposerCash: number;
  targetProps: number[];
  targetCash: number;
}

export function executeTrade(
  state: GameState,
  proposerIndex: number,
  targetIndex: number,
  offer: TradeOfferData,
): GameState {
  let s = state;
  const proposer = s.players[proposerIndex];
  const target = s.players[targetIndex];

  // Transfer ownership of proposer's offered properties to target
  const newOwnership = { ...s.ownership };
  const newHouses = { ...s.houses };

  for (const sqId of offer.proposerProps) {
    newOwnership[sqId] = targetIndex;
    // Remove houses from traded property
    delete newHouses[sqId];
  }
  for (const sqId of offer.targetProps) {
    newOwnership[sqId] = proposerIndex;
    delete newHouses[sqId];
  }

  // Transfer cash
  let newPlayers = s.players.map(p => ({ ...p }));
  newPlayers[proposerIndex].money += offer.targetCash - offer.proposerCash;
  newPlayers[targetIndex].money += offer.proposerCash - offer.targetCash;

  s = {
    ...s,
    players: newPlayers,
    ownership: newOwnership,
    houses: newHouses,
  };

  const propNames = offer.proposerProps.map(id => SQUARES[id].name).join(', ');
  const targNames = offer.targetProps.map(id => SQUARES[id].name).join(', ');
  s = addLog(s, `TRADE: ${proposer.name} ↔ ${target.name} [${propNames || '$'+offer.proposerCash}] / [${targNames || '$'+offer.targetCash}]`, 'property');

  return s;
}

// ─── Next active player ────────────────────────────────────────────────────

export function nextPlayer(state: GameState): GameState {
  const total = state.players.length;
  let next = (state.current + 1) % total;
  let tries = 0;
  while (state.players[next].bankrupt && tries < total) {
    next = (next + 1) % total;
    tries++;
  }
  return { ...state, current: next, phase: 'roll', dice: [0, 0], doublesCount: 0 };
}
