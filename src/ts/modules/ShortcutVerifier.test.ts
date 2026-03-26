// @ts-nocheck
import ShortcutVerifier from "./ShortcutVerifier";

describe("ShortcutVerifier", () => {
  describe("checkIfHasUrl", () => {
    it("should return an error message if url and deprecated are missing", () => {
      const shortcut = { namespace: "testNamespace", key: "testKey", url: null, deprecated: null };
      const result = ShortcutVerifier.checkIfHasUrl(shortcut);
      expect(result).toBe("Missing url in testNamespace.testKey.");
    });

    it("should return undefined if url is present", () => {
      const shortcut = { namespace: "testNamespace", key: "testKey", url: "http://example.com", deprecated: null };
      const result = ShortcutVerifier.checkIfHasUrl(shortcut);
      expect(result).toBeUndefined();
    });
  });

  describe("checkIfHasUrlAndNoInclude", () => {
    it("should return an error message if url, deprecated, and include are missing", () => {
      const shortcut = { namespace: "testNamespace", key: "testKey", url: null, deprecated: null, include: null };
      const result = ShortcutVerifier.checkIfHasUrlAndNoInclude(shortcut);
      expect(result).toBe("Missing url in testNamespace.testKey.");
    });

    it("should return undefined if url is present", () => {
      const shortcut = {
        namespace: "testNamespace",
        key: "testKey",
        url: "http://example.com",
        deprecated: null,
        include: null,
      };
      const result = ShortcutVerifier.checkIfHasUrlAndNoInclude(shortcut);
      expect(result).toBeUndefined();
    });

    it("should return undefined if include is present", () => {
      const shortcut = { namespace: "testNamespace", key: "testKey", url: null, deprecated: null, include: true };
      const result = ShortcutVerifier.checkIfHasUrlAndNoInclude(shortcut);
      expect(result).toBeUndefined();
    });
  });

  describe("checkIfArgCountMatches", () => {
    it("should return an error message if argumentCount does not match the length of arguments", () => {
      const shortcut = {
        namespace: "testNamespace",
        key: "testKey",
        url: "http://example.com",
        argumentCount: 2,
        arguments: { arg1: "value1" }, // Only 1 argument provided
      };
      const result = ShortcutVerifier.checkIfArgCountMatches(shortcut);
      expect(result).toBe('Mismatch in argumentCount of key and arguments.length of url in "testNamespace.testKey".');
    });

    it("should return undefined if argumentCount matches the length of arguments", () => {
      const shortcut = {
        namespace: "testNamespace",
        key: "testKey",
        url: "http://example.com",
        argumentCount: 2,
        arguments: { arg1: "value1", arg2: "value2" }, // 2 arguments provided
      };
      const result = ShortcutVerifier.checkIfArgCountMatches(shortcut);
      expect(result).toBeUndefined();
    });

    it("should return undefined if url is not present", () => {
      const shortcut = {
        namespace: "testNamespace",
        key: "testKey",
        url: null,
        argumentCount: 2,
        arguments: { arg1: "value1", arg2: "value2" },
      };
      const result = ShortcutVerifier.checkIfArgCountMatches(shortcut);
      expect(result).toBeUndefined();
    });
  });

  describe("checkIfArgCountMatchesWithExamples", () => {
    it("should return undefined if examples are not provided", () => {
      const shortcut = {
        namespace: "testNamespace",
        key: "testKey",
        argumentCount: 2,
        examples: null,
      };
      const result = ShortcutVerifier.checkIfArgCountMatchesWithExamples(shortcut);
      expect(result).toBeUndefined();
    });

    it("should return undefined if an example does not have arguments", () => {
      const shortcut = {
        namespace: "testNamespace",
        key: "testKey",
        argumentCount: 2,
        examples: [{ arguments: null }, { arguments: null }],
      };
      const result = ShortcutVerifier.checkIfArgCountMatchesWithExamples(shortcut);
      expect(result).toBeUndefined();
    });

    it("should return an error message if argumentCount does not match the length of example arguments", () => {
      const shortcut = {
        namespace: "testNamespace",
        key: "testKey",
        argumentCount: 2,
        examples: [
          { arguments: "arg1,arg2" }, // 2 arguments
          { arguments: "arg1,arg2,arg3" }, // 3 arguments
        ],
      };
      const result = ShortcutVerifier.checkIfArgCountMatchesWithExamples(shortcut);
      expect(result).toBe(
        'Mismatch in argumentCount of key and arguments.length of example in "testNamespace.testKey".',
      );
    });

    it("should return undefined if argumentCount matches the length of example arguments", () => {
      const shortcut = {
        namespace: "testNamespace",
        key: "testKey",
        argumentCount: 2,
        examples: [
          { arguments: "arg1,arg2" }, // 2 arguments
          { arguments: "arg1,arg2" }, // 2 arguments
        ],
      };
      const result = ShortcutVerifier.checkIfArgCountMatchesWithExamples(shortcut);
      expect(result).toBeUndefined();
    });

    it("should return undefined if all examples have matching argument counts", () => {
      const shortcut = {
        namespace: "testNamespace",
        key: "testKey",
        argumentCount: 3,
        examples: [
          { arguments: "arg1,arg2,arg3" }, // 3 arguments
          { arguments: "arg1,arg2,arg3" }, // 3 arguments
        ],
      };
      const result = ShortcutVerifier.checkIfArgCountMatchesWithExamples(shortcut);
      expect(result).toBeUndefined();
    });
  });
});
