import App from '../App.vue'

describe('App', () => {
  it('mounts and renders properly', () => {
    cy.intercept('GET', '**/storefront/categories', {
      statusCode: 200,
      body: [
        { id: 'cat-1', name: 'Cafe' },
        { id: 'cat-2', name: 'Te' },
      ],
    }).as('getCategories')

    cy.mount(App)
    cy.wait('@getCategories')
    cy.get('.category-nav').should('exist')
    cy.get('.category-nav .nav-link').should('have.length', 2)
    cy.contains('.category-nav .nav-link', 'Cafe')
    cy.get('.category-showcase').should('exist')
    cy.contains('.showcase-title', 'Seleccion')
    cy.get('.showcase-card').should('have.length', 2)
    cy.get('.showcase-card').first().should('have.attr', 'id', 'category-cat-1')
    cy.contains('.showcase-name', 'Cafe')
  })
})
