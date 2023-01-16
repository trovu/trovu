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
    cy.wait(500);
    cy.get('link [rel="search"]').should(
      'have.attr',
      'href',
      '/opensearch/?country=gb&amp;language=en',
    );
    //.contains(
    //  '<link rel="search" type="application/opensearchdescription+xml" href="/opensearch/?country=gb&amp;language=en" title="Trovu">',
    //);
  });
  it('should have Suggestions', () => {
    cy.get('#query').first().focus();
    cy.get('#query').type('g');
    cy.contains('Google Web Homepage');
  });
});
