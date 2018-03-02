describe('The index page', function () {
  it('.should() - assert that <title> is correct', function () {

    cy.visit('http://0.0.0.0:8004')
    cy.title().should('include', 'Snapcraft - Snaps are universal Linux packages')
  })
})

describe('The account page', function () {
  it('should redirect to the Ubuntu SSO', function () {
    cy.clearCookies()
    cy.visit('http://0.0.0.0:8004/account')

    cy.url().should('include', 'login.staging.ubuntu.com')

    const email = Cypress.env('EMAIL_ACCOUNT')
    const password = Cypress.env('PASSWORD_ACCOUNT')

    cy.get('#id_email')
      .type(email)
      .should('have.value', email)

    cy.get('#id_password')
      .type(password)
      .should('have.value', password)

    cy.get('button[data-qa-id=login_button]')
      .click()

    cy.url().should('include', 'decide')

    cy.get('button[data-qa-id=rp_confirm_login]')
      .click()

    cy.url().should('include', '/account')
  })
})
