jest.mock('react-native-reanimated', () => ({
  useSharedValue: jest.fn((init) => ({ value: init })),
  useAnimatedStyle: jest.fn(() => ({})),
  withTiming: jest.fn((val) => val),
  withRepeat: jest.fn((val) => val),
  withSequence: jest.fn((...vals) => vals[0]),
  Easing: { linear: jest.fn(), inOut: jest.fn(() => jest.fn()), ease: jest.fn() },
  default: {
    View: 'Animated.View',
    call: jest.fn(),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  isSpeakingAsync: jest.fn().mockResolvedValue(false),
}));
