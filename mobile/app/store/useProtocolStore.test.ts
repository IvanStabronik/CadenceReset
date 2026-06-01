import { useProtocolStore } from './useProtocolStore';
import { Protocol } from '../types';

describe('useProtocolStore', () => {
  const sampleProtocol: Protocol = {
    id: 'proto-1',
    name: 'Physiological Sigh',
    duration_seconds: 60,
    instruction_text: 'Breathe deeply.',
    animation_type: 'breathing_circle',
    audio_guide_url: null,
  };

  beforeEach(() => {
    useProtocolStore.getState().clearProtocol();
  });

  it('initial state has null protocol', () => {
    expect(useProtocolStore.getState().protocol).toBeNull();
  });

  it('setProtocol stores the full protocol object', () => {
    useProtocolStore.getState().setProtocol(sampleProtocol);
    expect(useProtocolStore.getState().protocol).toEqual(sampleProtocol);
  });

  it('clearProtocol resets to null', () => {
    useProtocolStore.getState().setProtocol(sampleProtocol);
    useProtocolStore.getState().clearProtocol();
    expect(useProtocolStore.getState().protocol).toBeNull();
  });

  it('setProtocol overwrites previous protocol', () => {
    useProtocolStore.getState().setProtocol(sampleProtocol);

    const anotherProtocol: Protocol = {
      id: 'proto-2',
      name: 'Box Breathing',
      duration_seconds: 240,
      instruction_text: 'Follow the box pattern.',
      animation_type: 'box_square',
      audio_guide_url: 'https://example.com/audio.mp3',
    };

    useProtocolStore.getState().setProtocol(anotherProtocol);
    expect(useProtocolStore.getState().protocol).toEqual(anotherProtocol);
  });
});
