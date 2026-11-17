// Vitest type definitions
/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

// Type declarations for Vitest globals
interface Mock<T = any> {
  (fn: T): T;
  mockResolvedValue<T>(value: T): Mock<T>;
  mockRejectedValue<T>(value: T): Mock<T>;
  mockReturnValue<T>(value: T): Mock<T>;
  mockImplementation<T>(fn: T): Mock<T>;
  mockResolvedValueOnce<T>(value: T): Mock<T>;
  mockRejectedValueOnce<T>(value: T): Mock<T>;
  mockReturnValueOnce<T>(value: T): Mock<T>;
  mockImplementationOnce<T>(fn: T): Mock<T>;
}

interface Vi {
  mock: (path: string, factory: () => unknown) => void;
  fn: <T>(fn?: any) => Mock<T>;
  clearAllMocks: () => void;
  resetAllMocks: () => void;
  restoreAllMocks: () => void;
  clearAllTimers: () => void;
  useFakeTimers: () => void;
  runOnlyPendingTimers: () => void;
  advanceTimersByTime: (ms: number) => void;
  advanceTimersToNextTimer: () => void;
  hoisted: <T>(factory: () => T) => T;
}

declare const vi: Vi;