import type { LoggerLike } from "../src/ts/types";

export function createLogger(): LoggerLike & {
  error: jest.Mock<never, [string]>;
  info: jest.Mock<void, [string]>;
  success: jest.Mock<void, [string]>;
  warning: jest.Mock<void, [string]>;
} {
  return {
    error: jest.fn((message: string): never => {
      throw new Error(message);
    }),
    info: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
  };
}
