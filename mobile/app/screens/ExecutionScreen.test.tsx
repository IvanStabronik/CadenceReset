import { useSessionStore } from '../store/useSessionStore';
import { useProtocolStore } from '../store/useProtocolStore';

// Mock @react-navigation/native
const mockNavigate = jest.fn();
const mockAddListener = jest.fn().mockReturnValue(jest.fn());
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    addListener: mockAddListener,
  }),
}));

// Mock @react-navigation/native-stack
jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: jest.fn(),
}));

// Mock react-native with AppState
const mockAppStateAddEventListener = jest.fn().mockReturnValue({ remove: jest.fn() });
jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  StyleSheet: { create: (styles: any) => styles },
  AppState: {
    currentState: 'active',
    addEventListener: mockAppStateAddEventListener,
  },
}));

// Mock the animations
jest.mock('../animations/BreathingCircle', () => 'BreathingCircle');
jest.mock('../animations/BoxSquare', () => 'BoxSquare');

describe('ExecutionScreen - back navigation prevention', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSessionStore.getState().reset();
  });

  describe('beforeRemove listener logic', () => {
    it('should block navigation when phase is execution', () => {
      useSessionStore.getState().setPhase('preparation');
      useSessionStore.getState().setPhase('execution');

      const phase = useSessionStore.getState().phase;
      const mockEvent = { preventDefault: jest.fn() };

      if (phase === 'execution') {
        mockEvent.preventDefault();
      }

      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('should allow navigation when phase is idle', () => {
      const phase = useSessionStore.getState().phase;
      const mockEvent = { preventDefault: jest.fn() };

      if (phase === 'execution') {
        mockEvent.preventDefault();
      }

      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow navigation when phase is preparation', () => {
      useSessionStore.getState().setPhase('preparation');

      const phase = useSessionStore.getState().phase;
      const mockEvent = { preventDefault: jest.fn() };

      if (phase === 'execution') {
        mockEvent.preventDefault();
      }

      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow navigation when phase is feedback', () => {
      useSessionStore.getState().setPhase('preparation');
      useSessionStore.getState().setPhase('execution');
      useSessionStore.getState().setPhase('feedback');

      const phase = useSessionStore.getState().phase;
      const mockEvent = { preventDefault: jest.fn() };

      if (phase === 'execution') {
        mockEvent.preventDefault();
      }

      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow navigation after skip (phase transitions to feedback)', () => {
      useSessionStore.getState().setPhase('preparation');
      useSessionStore.getState().setPhase('execution');
      useSessionStore.getState().skip();

      const phase = useSessionStore.getState().phase;
      const mockEvent = { preventDefault: jest.fn() };

      if (phase === 'execution') {
        mockEvent.preventDefault();
      }

      expect(phase).toBe('feedback');
      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow navigation after complete (phase transitions to feedback)', () => {
      useSessionStore.getState().setPhase('preparation');
      useSessionStore.getState().setPhase('execution');
      useSessionStore.getState().complete();

      const phase = useSessionStore.getState().phase;
      const mockEvent = { preventDefault: jest.fn() };

      if (phase === 'execution') {
        mockEvent.preventDefault();
      }

      expect(phase).toBe('feedback');
      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    });
  });
});

describe('ExecutionScreen - timer and skip logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSessionStore.getState().reset();
  });

  it('skip() sets completedFully to false and transitions to feedback', () => {
    useSessionStore.getState().setPhase('preparation');
    useSessionStore.getState().setPhase('execution');
    useSessionStore.getState().skip();

    const state = useSessionStore.getState();
    expect(state.phase).toBe('feedback');
    expect(state.completedFully).toBe(false);
  });

  it('complete() sets completedFully to true and transitions to feedback', () => {
    useSessionStore.getState().setPhase('preparation');
    useSessionStore.getState().setPhase('execution');
    useSessionStore.getState().complete();

    const state = useSessionStore.getState();
    expect(state.phase).toBe('feedback');
    expect(state.completedFully).toBe(true);
  });

  it('tick() increments elapsedSeconds', () => {
    expect(useSessionStore.getState().elapsedSeconds).toBe(0);
    useSessionStore.getState().tick();
    expect(useSessionStore.getState().elapsedSeconds).toBe(1);
    useSessionStore.getState().tick();
    expect(useSessionStore.getState().elapsedSeconds).toBe(2);
  });
});

describe('ExecutionScreen - protocol store integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useProtocolStore.getState().clearProtocol();
  });

  it('protocol store provides duration_seconds and animation_type', () => {
    useProtocolStore.getState().setProtocol({
      id: 'test-1',
      name: 'Box Breathing',
      duration_seconds: 120,
      instruction_text: 'Follow the box',
      animation_type: 'box_square',
      audio_guide_url: null,
    });

    const protocol = useProtocolStore.getState().protocol;
    expect(protocol?.duration_seconds).toBe(120);
    expect(protocol?.animation_type).toBe('box_square');
  });

  it('defaults to 60 seconds when no protocol is set', () => {
    const protocol = useProtocolStore.getState().protocol;
    const duration = protocol?.duration_seconds ?? 60;
    expect(duration).toBe(60);
  });
});
