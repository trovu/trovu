describe('template spec', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should redirect to hash with language and country', () => {
    cy.hash().should('include', 'country=gb&language=en');
  });

  it('should have a title including "trovu"', () => {
    cy.title().should('include', 'trovu');
  });

  it('should contain an Opensearch tag', () => {
    cy.get(
      'head link[rel="search"][href="/opensearch/?country=gb&language=en"]',
    );
  });

  it('should have Suggestions', () => {
    cy.get('#query').first().focus();
    cy.wait(500);
    cy.get('#query').type('g');
    cy.contains('Google Web Homepage');
  });
});
