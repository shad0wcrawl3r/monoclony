// ─── Square definitions ────────────────────────────────────────────────────

export type SquareType =
  | 'go'
  | 'property'
  | 'railroad'
  | 'utility'
  | 'tax'
  | 'chance'
  | 'community'
  | 'jail'
  | 'parking'
  | 'gotojail';

export type ColorGroup =
  | 'brown'
  | 'lblue'
  | 'magenta'
  | 'orange'
  | 'red'
  | 'yellow'
  | 'green'
  | 'dblue';

export interface BaseSquare {
  id: number;
  name: string;
  type: SquareType;
}

export interface PropertySquare extends BaseSquare {
  type: 'property';
  group: ColorGroup;
  price: number;
  rent: [number, number, number, number, number, number]; // 0-5 houses (5=hotel)
  mortgage: number;
}

export interface RailroadSquare extends BaseSquare {
  type: 'railroad';
  price: number;
  rent: [number, number, number, number]; // 1-4 owned
  mortgage: number;
}

export interface UtilitySquare extends BaseSquare {
  type: 'utility';
  price: number;
  rent: [number, number]; // multiplier: 1 owned=4x, 2 owned=10x
  mortgage: number;
}

export interface TaxSquare extends BaseSquare {
  type: 'tax';
  amount: number;
}

export interface SimpleSquare extends BaseSquare {
  type: 'go' | 'chance' | 'community' | 'jail' | 'parking' | 'gotojail';
}

export type Square =
  | PropertySquare
  | RailroadSquare
  | UtilitySquare
  | TaxSquare
  | SimpleSquare;

// ─── Cards ─────────────────────────────────────────────────────────────────

export type CardActionType =
  | 'advanceToGo'
  | 'goToJail'
  | 'collectAmount'
  | 'payAmount'
  | 'advanceTo'
  | 'goBack3'
  | 'jailFree';

export interface CardDef {
  text: string;
  actionType: CardActionType;
  amount?: number;
  sqId?: number;
}

// ─── Players ───────────────────────────────────────────────────────────────

export interface PlayerConfig {
  name: string;
  token: string;
  color: string;
}

export interface Player {
  index: number;
  name: string;
  token: string;
  color: string;
  money: number;
  position: number;
  inJail: boolean;
  jailTurns: number;
  jailFreeCards: number; // count of "get out of jail free" cards
  bankrupt: boolean;
}

// ─── Game phase ────────────────────────────────────────────────────────────

export type GamePhase = 'roll' | 'waiting' | 'end';

// ─── Log entry ─────────────────────────────────────────────────────────────

export type LogType = 'info' | 'money' | 'property' | 'jail' | 'card' | 'warn';

export interface LogEntry {
  id: number;
  text: string;
  type: LogType;
}

// ─── Game state ────────────────────────────────────────────────────────────

export interface GameState {
  players: Player[];
  current: number;
  phase: GamePhase;
  ownership: Record<number, number>; // sqId → playerIndex
  mortgaged: Record<number, boolean>; // sqId → bool
  houses: Record<number, number>; // sqId → count (5=hotel)
  dice: [number, number];
  doublesCount: number; // consecutive doubles this turn
  chanceIdx: number;
  communityIdx: number;
  chanceOrder: number[]; // shuffled indices
  communityOrder: number[]; // shuffled indices
  parkingPot: number;
  log: LogEntry[];
  logCounter: number;
  winner: number | null; // playerIndex or null
}

// ─── Modal configs ─────────────────────────────────────────────────────────

export type ModalConfig =
  | { type: 'buy'; sqId: number }
  | { type: 'chance'; cardIndex: number }
  | { type: 'community'; cardIndex: number }
  | { type: 'house'; sqId: number }
  | { type: 'mortgage' }
  | { type: 'trade-select' }
  | { type: 'trade-builder'; targetIndex: number }
  | { type: 'properties'; playerIndex: number };

// ─── UI state ──────────────────────────────────────────────────────────────

export interface UIState {
  modal: ModalConfig | null;
  diceAnimating: boolean;
  viewedPlayer: number;
  logOpen: boolean;
}

// ─── Trade offer ───────────────────────────────────────────────────────────

export interface TradeOffer {
  proposerProps: number[]; // sqIds
  proposerCash: number;
  targetProps: number[]; // sqIds
  targetCash: number;
}

// ─── Multiplayer ───────────────────────────────────────────────────────────

export interface MultiplayerState {
  isMultiplayer: boolean;
  roomId: string | null;
  localPlayerIndex: number;
}
