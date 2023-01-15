describe('template spec', () => {
  beforeEach(async () => {
    cy.visit('/');
  });

  it('should redirect to hash with language and country', async () => {
    cy.hash().should('include', 'country=gb&language=en');
  });

  it('should have a title including "trovu"', async () => {
    cy.title().should('include', 'trovu');
  });

  it('should contain an Opensearch tag', async () => {
    cy.contains(
      '<link rel="search" type="application/opensearchdescription+xml" href="/opensearch/?country=gb&amp;language=en" title="Trovu">',
    );
  });
  it('should have Suggestions', async () => {
    cy.get('#query').first().focus();
    cy.get('#query').type('g');
    cy.contains('Google Web Homepage');
  });
});
