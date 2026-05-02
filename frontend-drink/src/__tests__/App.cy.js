import App from '../App.vue'

describe('App', () => {
  it('renders the storefront layout with live categories and products', () => {
    cy.intercept('GET', '**/storefront/categories', {
      statusCode: 200,
      body: [
        {
          id: 'cat-vinos',
          name: 'Vinos',
          children: [{ id: 'cat-espumosos', name: 'Espumosos' }],
        },
        {
          id: 'cat-whisky',
          name: 'Whisky',
          children: [],
        },
      ],
    }).as('getCategories')

    cy.intercept('GET', '**/storefront/products**', {
      statusCode: 200,
      body: [
        {
          id: 'prod-1',
          title: 'Malbec Reserva',
          slug: 'malbec-reserva',
          description: 'Notas maduras y final largo.',
          category: { id: 'cat-vinos', name: 'Vinos' },
          tags: ['15%', 'nuevo'],
          variants: [{ id: 'var-1', price: 128400, availableStock: 8 }],
          images: [],
        },
        {
          id: 'prod-2',
          title: 'Whisky 12 Anos',
          slug: 'whisky-12-anos',
          description: 'Crianza en barrica y perfil especiado.',
          category: { id: 'cat-whisky', name: 'Whisky' },
          variants: [{ id: 'var-2', price: 189500, availableStock: 5 }],
          images: [],
        },
      ],
    }).as('getProducts')

    cy.mount(App)
    cy.wait('@getCategories')
    cy.wait('@getProducts')

    cy.get('.site-header').should('exist')
    cy.contains('.brand-title', 'La Cantina')
    cy.get('.category-link').should('contain.text', 'Vinos')
    cy.get('.hero').should('exist')
    cy.contains('.hero h1', 'alma de cantina')
    cy.get('.circle-card').should('have.length', 2)
    cy.get('.catalog-grid .product-card').should('have.length', 2)
    cy.contains('.product-card h3', 'Malbec Reserva')
  })
})
