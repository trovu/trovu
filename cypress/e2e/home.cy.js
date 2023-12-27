describe('Homepage startup', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('[data-page-loaded="true"]', { timeout: 10000 }).should('exist');
  });

  it('should have suggestions with type icons', () => {
    cy.get('#query').first().focus().should('be.focused');
    cy.get('#query').type('g');
    cy.contains('📅');
  });
  it('should have suggestions', () => {
    cy.get('#query').first().focus().should('be.focused');
    cy.get('#query').type('g');
    cy.contains('Google Web Homepage');
  });
});
