import { create } from 'zustand';
import { Protocol, ProtocolState } from '../types';

export const useProtocolStore = create<ProtocolState>((set) => ({
  protocol: null,

  setProtocol: (protocol: Protocol) => {
    set({ protocol });
  },

  clearProtocol: () => {
    set({ protocol: null });
  },
}));
