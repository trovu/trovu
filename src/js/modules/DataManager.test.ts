// @ts-nocheck
import DataManager from "./DataManager";

describe("DataManager.load", () => {
  test("should return object with specific keys", () => {
    const result = DataManager.load();
    expect(result).toEqual(
      expect.objectContaining({
        shortcuts: expect.anything(),
        types: expect.objectContaining({
          city: expect.anything(),
        }),
      }),
    );
  });
});
