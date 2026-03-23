import { create } from 'zustand';
import type { ModalConfig } from '../types';

interface UIStore {
  modal: ModalConfig | null;
  diceAnimating: boolean;
  viewedPlayer: number;
  logOpen: boolean;

  // Trade builder state
  tradeOffer: {
    proposerProps: number[];
    proposerCash: number;
    targetProps: number[];
    targetCash: number;
  };

  setModal: (modal: ModalConfig | null) => void;
  setDiceAnimating: (val: boolean) => void;
  setViewedPlayer: (index: number) => void;
  setLogOpen: (val: boolean) => void;
  toggleLog: () => void;

  setTradeOffer: (offer: Partial<UIStore['tradeOffer']>) => void;
  resetTradeOffer: () => void;
}

const DEFAULT_TRADE_OFFER = {
  proposerProps: [] as number[],
  proposerCash: 0,
  targetProps: [] as number[],
  targetCash: 0,
};

export const useUIStore = create<UIStore>((set) => ({
  modal: null,
  diceAnimating: false,
  viewedPlayer: 0,
  logOpen: false,
  tradeOffer: { ...DEFAULT_TRADE_OFFER },

  setModal: (modal) => set({ modal }),
  setDiceAnimating: (val) => set({ diceAnimating: val }),
  setViewedPlayer: (index) => set({ viewedPlayer: index }),
  setLogOpen: (val) => set({ logOpen: val }),
  toggleLog: () => set((s) => ({ logOpen: !s.logOpen })),

  setTradeOffer: (offer) =>
    set((s) => ({ tradeOffer: { ...s.tradeOffer, ...offer } })),
  resetTradeOffer: () => set({ tradeOffer: { ...DEFAULT_TRADE_OFFER } }),
}));
