describe("Homepage startup", () => {
  beforeEach(() => {
    cy.visit("/");
    cy.get('[data-page-loaded="true"]', { timeout: 10000 }).should("exist");
  });

  it("should redirect to hash with language and country", () => {
    cy.hash().should("include", "country=gb&language=en");
  });

  it('should have a title including "trovu"', () => {
    cy.title().should("include", "trovu");
  });

  it("should contain an Opensearch tag", () => {
    cy.get('head link[rel="search"][href="/opensearch/?country=gb&language=en"]');
  });

  it("should have suggestions", () => {
    cy.get("#query").first().focus().should("be.focused");
    cy.get("#query").type("g");
    cy.contains("Google Web Homepage");
  });

  it("should have suggestions with type icons", () => {
    cy.get("#query").first().focus().should("be.focused");
    cy.get("#query").type("db");
    cy.contains("📅");
  });

  it("should submit a query", () => {
    cy.get("#query").first().focus().should("be.focused");
    cy.get("#query").type("debug:g{enter}");
    cy.url().should("include", "/process/index.html?#country=gb&debug=1&language=en&query=debug%3Ag");
    cy.contains("https://www.google.");
  });

  it("should have a working Settings modal", () => {
    cy.get("span#settings-button").should("be.visible").click();
    cy.get("select#languageSetting").should("be.visible").select("pl");
    cy.get("select#countrySetting").should("be.visible").select("cz");
    cy.get("#settings-close").click();
    cy.wait(500); // TODO: Find cleaner solution.
    cy.hash().should("match", /language=pl/);
    cy.hash().should("match", /country=cz/);
    cy.get(".navbar .language").should("contain", "pl");
    cy.get(".navbar .country").should("contain", "🇨🇿");
  });
});

describe("Homepage, Shortcut not found", () => {
  it("should show not_found", () => {
    cy.visit("/#country=gb&language=en&query=foobar&status=not_found");
    cy.wait(500);
    cy.contains("No matching shortcut found.").should("be.visible");
  });
});
