import Redirector from "./Redirector";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockExternal(isExternal: boolean) {
  return jest.spyOn(Redirector, "isExternalUrl").mockReturnValue(isExternal);
}

function mockStandalone(standalone: boolean) {
  return jest.spyOn(Redirector, "isStandalone").mockReturnValue(standalone);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Redirector", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // -----------------------------------------------------------------------
  // isExternalUrl – uses the real jsdom location (http://localhost)
  // -----------------------------------------------------------------------

  describe("isExternalUrl", () => {
    test("returns true for a cross-origin https URL", () => {
      expect(Redirector.isExternalUrl("https://www.google.com/search?q=berlin")).toBe(true);
    });

    test("returns true for an unrelated domain", () => {
      expect(Redirector.isExternalUrl("https://example.org/")).toBe(true);
    });

    test("returns false for a same-origin absolute URL", () => {
      // jsdom defaults to http://localhost
      expect(Redirector.isExternalUrl("http://localhost/process/index.html")).toBe(false);
    });

    test("returns false for a relative URL", () => {
      expect(Redirector.isExternalUrl("../index.html#status=not_found")).toBe(false);
    });

    test("returns false for an empty string", () => {
      expect(Redirector.isExternalUrl("")).toBe(false);
    });

    test("returns false for an un-parseable string", () => {
      expect(Redirector.isExternalUrl("://broken")).toBe(false);
    });

    test("returns true for http vs https origin mismatch", () => {
      expect(Redirector.isExternalUrl("https://localhost/")).toBe(true);
    });

    test("returns true for a different port on the same host", () => {
      expect(Redirector.isExternalUrl("http://localhost:9999/")).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // isStandalone
  // -----------------------------------------------------------------------

  describe("isStandalone", () => {
    test("returns false in a normal test/jsdom environment", () => {
      expect(Redirector.isStandalone()).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // navigateTo – strategy selection
  // -----------------------------------------------------------------------

  describe("navigateTo", () => {
    let assignSpy: jest.SpyInstance;
    let replaceSpy: jest.SpyInstance;

    beforeEach(() => {
      assignSpy = jest.spyOn(Redirector, "assignHref").mockImplementation(() => {});
      replaceSpy = jest.spyOn(Redirector, "replaceHref").mockImplementation(() => {});
    });

    test("does not call escapeStandalone when NOT standalone (external URL)", () => {
      mockStandalone(false);
      mockExternal(true);
      const escapeSpy = jest.spyOn(Redirector, "escapeStandalone").mockImplementation(() => {});
      Redirector.navigateTo("https://www.google.com/search?q=berlin");
      expect(escapeSpy).not.toHaveBeenCalled();
      expect(assignSpy).toHaveBeenCalledWith("https://www.google.com/search?q=berlin");
      expect(replaceSpy).not.toHaveBeenCalled();
    });

    test("calls escapeStandalone for external URL when standalone", () => {
      mockStandalone(true);
      mockExternal(true);
      const escapeSpy = jest.spyOn(Redirector, "escapeStandalone").mockImplementation(() => {});
      Redirector.navigateTo("https://www.google.com/search?q=berlin");
      expect(escapeSpy).toHaveBeenCalledWith("https://www.google.com/search?q=berlin");
      expect(assignSpy).not.toHaveBeenCalled();
      expect(replaceSpy).not.toHaveBeenCalled();
    });

    test("does not call escapeStandalone for same-origin URL when standalone", () => {
      mockStandalone(true);
      mockExternal(false);
      const escapeSpy = jest.spyOn(Redirector, "escapeStandalone").mockImplementation(() => {});
      Redirector.navigateTo("../index.html#status=not_found");
      expect(escapeSpy).not.toHaveBeenCalled();
      expect(assignSpy).toHaveBeenCalledWith("../index.html#status=not_found");
      expect(replaceSpy).not.toHaveBeenCalled();
    });

    test("uses location.replace for same-origin URL with replace option", () => {
      mockStandalone(false);
      mockExternal(false);
      Redirector.navigateTo("../index.html#status=not_found", { replace: true });
      expect(replaceSpy).toHaveBeenCalledWith("../index.html#status=not_found");
      expect(assignSpy).not.toHaveBeenCalled();
    });

    test("ignores replace option for external URL in standalone mode", () => {
      mockStandalone(true);
      mockExternal(true);
      const escapeSpy = jest.spyOn(Redirector, "escapeStandalone").mockImplementation(() => {});
      Redirector.navigateTo("https://www.google.com/", { replace: true });
      expect(escapeSpy).toHaveBeenCalledWith("https://www.google.com/");
      expect(assignSpy).not.toHaveBeenCalled();
      expect(replaceSpy).not.toHaveBeenCalled();
    });
  });

  describe("escapeStandalone", () => {
    test("calls window.open by default", () => {
      const openSpy = jest.spyOn(window, "open").mockImplementation(() => null);
      const assignSpy = jest.spyOn(Redirector, "assignHref").mockImplementation(() => {});

      Redirector.escapeStandalone("https://www.google.com/");

      expect(openSpy).toHaveBeenCalledWith("https://www.google.com/", "_blank", "noopener,noreferrer");
      expect(assignSpy).not.toHaveBeenCalled();
    });

    test("falls back to assignHref if window.open throws an error", () => {
      const openSpy = jest.spyOn(window, "open").mockImplementation(() => {
        throw new Error("Window open blocked");
      });
      const assignSpy = jest.spyOn(Redirector, "assignHref").mockImplementation(() => {});

      Redirector.escapeStandalone("https://www.google.com/");

      expect(openSpy).toHaveBeenCalled();
      expect(assignSpy).toHaveBeenCalledWith("https://www.google.com/");
    });
  });
});
