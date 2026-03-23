import type { Square, PlayerConfig, CardDef } from '../types';

export const PLAYER_CONFIGS: PlayerConfig[] = [
  { name: 'PLAYER 1', token: '🚀', color: '#f7c948' },
  { name: 'PLAYER 2', token: '🛸', color: '#3ddc84' },
  { name: 'PLAYER 3', token: '⚡', color: '#4fc3f7' },
  { name: 'PLAYER 4', token: '💀', color: '#c084fc' },
];

export const COLOR_GROUPS: Record<string, string> = {
  brown:   '#8B4513',
  lblue:   '#87CEEB',
  magenta: '#FF00FF',
  orange:  '#FFA500',
  red:     '#FF4444',
  yellow:  '#FFD700',
  green:   '#22C55E',
  dblue:   '#1E40AF',
};

export const SQUARES: Square[] = [
  { id: 0,  name: 'GO',           type: 'go' },
  { id: 1,  name: 'MEDITERRAN.',  type: 'property', group: 'brown',   price: 60,  rent: [2, 10, 30, 90, 160, 250],       mortgage: 30 },
  { id: 2,  name: 'COMMUNITY',    type: 'community' },
  { id: 3,  name: 'BALTIC AVE',   type: 'property', group: 'brown',   price: 60,  rent: [4, 20, 60, 180, 320, 450],      mortgage: 30 },
  { id: 4,  name: 'INCOME TAX',   type: 'tax',      amount: 200 },
  { id: 5,  name: 'READING RR',   type: 'railroad', price: 200, rent: [25, 50, 100, 200], mortgage: 100 },
  { id: 6,  name: 'ORIENTAL AV',  type: 'property', group: 'lblue',   price: 100, rent: [6, 30, 90, 270, 400, 550],      mortgage: 50 },
  { id: 7,  name: 'CHANCE',       type: 'chance' },
  { id: 8,  name: 'VERMONT AVE',  type: 'property', group: 'lblue',   price: 100, rent: [6, 30, 90, 270, 400, 550],      mortgage: 50 },
  { id: 9,  name: 'CONNECTICUT',  type: 'property', group: 'lblue',   price: 120, rent: [8, 40, 100, 300, 450, 600],     mortgage: 60 },
  { id: 10, name: 'JAIL / VISIT', type: 'jail' },
  { id: 11, name: 'ST CHARLES',   type: 'property', group: 'magenta', price: 140, rent: [10, 50, 150, 450, 625, 750],    mortgage: 70 },
  { id: 12, name: 'ELECTRIC CO',  type: 'utility',  price: 150, rent: [4, 10], mortgage: 75 },
  { id: 13, name: 'STATES AVE',   type: 'property', group: 'magenta', price: 140, rent: [10, 50, 150, 450, 625, 750],    mortgage: 70 },
  { id: 14, name: 'VIRGINIA AVE', type: 'property', group: 'magenta', price: 160, rent: [12, 60, 180, 500, 700, 900],    mortgage: 80 },
  { id: 15, name: 'PENN. RR',     type: 'railroad', price: 200, rent: [25, 50, 100, 200], mortgage: 100 },
  { id: 16, name: 'ST JAMES',     type: 'property', group: 'orange',  price: 180, rent: [14, 70, 200, 550, 750, 950],    mortgage: 90 },
  { id: 17, name: 'COMMUNITY',    type: 'community' },
  { id: 18, name: 'TENN. AVE',    type: 'property', group: 'orange',  price: 180, rent: [14, 70, 200, 550, 750, 950],    mortgage: 90 },
  { id: 19, name: 'NEW YORK AVE', type: 'property', group: 'orange',  price: 200, rent: [16, 80, 220, 600, 800, 1000],   mortgage: 100 },
  { id: 20, name: 'FREE PARKING', type: 'parking' },
  { id: 21, name: 'KENTUCKY AVE', type: 'property', group: 'red',     price: 220, rent: [18, 90, 250, 700, 875, 1050],   mortgage: 110 },
  { id: 22, name: 'CHANCE',       type: 'chance' },
  { id: 23, name: 'INDIANA AVE',  type: 'property', group: 'red',     price: 220, rent: [18, 90, 250, 700, 875, 1050],   mortgage: 110 },
  { id: 24, name: 'ILLINOIS AVE', type: 'property', group: 'red',     price: 240, rent: [20, 100, 300, 750, 925, 1100],  mortgage: 120 },
  { id: 25, name: 'B&O RR',       type: 'railroad', price: 200, rent: [25, 50, 100, 200], mortgage: 100 },
  { id: 26, name: 'ATLANTIC AVE', type: 'property', group: 'yellow',  price: 260, rent: [22, 110, 330, 800, 975, 1150],  mortgage: 130 },
  { id: 27, name: 'VENTNOR AVE',  type: 'property', group: 'yellow',  price: 260, rent: [22, 110, 330, 800, 975, 1150],  mortgage: 130 },
  { id: 28, name: 'WATER WORKS',  type: 'utility',  price: 150, rent: [4, 10], mortgage: 75 },
  { id: 29, name: 'MARVIN GDNS',  type: 'property', group: 'yellow',  price: 280, rent: [24, 120, 360, 850, 1025, 1200], mortgage: 140 },
  { id: 30, name: 'GO TO JAIL',   type: 'gotojail' },
  { id: 31, name: 'PACIFIC AVE',  type: 'property', group: 'green',   price: 300, rent: [26, 130, 390, 900, 1100, 1275], mortgage: 150 },
  { id: 32, name: 'N.CAROLINA',   type: 'property', group: 'green',   price: 300, rent: [26, 130, 390, 900, 1100, 1275], mortgage: 150 },
  { id: 33, name: 'COMMUNITY',    type: 'community' },
  { id: 34, name: 'PENN. AVE',    type: 'property', group: 'green',   price: 320, rent: [28, 150, 450, 1000, 1200, 1400], mortgage: 160 },
  { id: 35, name: 'SHORT LINE',   type: 'railroad', price: 200, rent: [25, 50, 100, 200], mortgage: 100 },
  { id: 36, name: 'CHANCE',       type: 'chance' },
  { id: 37, name: 'PARK PLACE',   type: 'property', group: 'dblue',   price: 350, rent: [35, 175, 500, 1100, 1300, 1500], mortgage: 175 },
  { id: 38, name: 'LUXURY TAX',   type: 'tax',      amount: 100 },
  { id: 39, name: 'BOARDWALK',    type: 'property', group: 'dblue',   price: 400, rent: [50, 200, 600, 1400, 1700, 2000], mortgage: 200 },
];

export const CHANCE_CARDS: CardDef[] = [
  { text: 'ADVANCE TO GO! COLLECT $200',          actionType: 'advanceToGo' },
  { text: 'GO TO JAIL! DO NOT PASS GO',           actionType: 'goToJail' },
  { text: 'BANK PAYS DIVIDEND OF $50',            actionType: 'collectAmount', amount: 50 },
  { text: 'ADVANCE TO BOARDWALK',                 actionType: 'advanceTo',     sqId: 39 },
  { text: 'PAY POOR TAX OF $15',                  actionType: 'payAmount',     amount: 15 },
  { text: 'GO BACK 3 SPACES',                     actionType: 'goBack3' },
  { text: 'GET OUT OF JAIL FREE!',                actionType: 'jailFree' },
  { text: 'ADVANCE TO ILLINOIS AVE',              actionType: 'advanceTo',     sqId: 24 },
  { text: 'BUILDING LOAN MATURES — COLLECT $150', actionType: 'collectAmount', amount: 150 },
  { text: 'SPEEDING FINE — PAY $15',              actionType: 'payAmount',     amount: 15 },
];

export const COMMUNITY_CARDS: CardDef[] = [
  { text: 'BANK ERROR — COLLECT $200',     actionType: 'collectAmount', amount: 200 },
  { text: "DOCTOR'S FEES — PAY $50",      actionType: 'payAmount',     amount: 50 },
  { text: 'STOCK SALE — COLLECT $50',     actionType: 'collectAmount', amount: 50 },
  { text: 'GO TO JAIL!',                   actionType: 'goToJail' },
  { text: 'HOLIDAY FUND — COLLECT $100',  actionType: 'collectAmount', amount: 100 },
  { text: 'TAX REFUND — COLLECT $20',     actionType: 'collectAmount', amount: 20 },
  { text: 'ADVANCE TO GO — COLLECT $200', actionType: 'advanceToGo' },
  { text: 'GET OUT OF JAIL FREE!',         actionType: 'jailFree' },
  { text: 'SCHOOL FEES — PAY $50',         actionType: 'payAmount',     amount: 50 },
  { text: 'YOU INHERIT $100',              actionType: 'collectAmount', amount: 100 },
];

// Squares that are purchasable
export const PURCHASABLE_TYPES = new Set(['property', 'railroad', 'utility']);

// Group sizes (for monopoly detection)
export const GROUP_SIZES: Record<string, number> = {
  brown: 2, lblue: 3, magenta: 3, orange: 3,
  red: 3, yellow: 3, green: 3, dblue: 2,
};

// Railroad square IDs
export const RAILROAD_IDS = [5, 15, 25, 35];

// Utility square IDs
export const UTILITY_IDS = [12, 28];
