/* eslint-disable no-undef */
describe('Automated source form', function () {
    beforeEach(() => {
        cy.task('clearSourcesDB', {});
        cy.login();
    });

    it('Creates source given proper data', function () {
        cy.login({
            roles: ['curator'],
            name: 'testName',
            email: 'test@example.com',
        });
        cy.visit('/');
        cy.visit('/sources');
        cy.contains('No records to display');

        const url = 'www.newsource.com';
        const name = 'New source name';
        const format = 'JSON';
        const license = 'WTFPL';
        const otherEmail = 'other.curator9001@gmail.com';

        cy.intercept('POST', '/api/sources').as('createSource');

        cy.visit('/');
        cy.get('button[data-testid="create-new-button"]').click();
        cy.contains('li', 'New automated source').click();
        cy.wait(100);
        cy.get('div[data-testid="url"]').type(url);
        cy.get('div[data-testid="name"]').type(name);
        cy.get('div[data-testid="license"]').type(license);
        cy.get('div[data-testid="recipients"]').type(`${otherEmail}{enter}`);
        cy.get('div[data-testid="format"]').click();
        cy.get(`li[data-value=${format}`).click();

        cy.get('button[data-testid="submit"]').click();
        cy.wait('@createSource');

        // Check that all relevant fields are visible.
        cy.url().should('include', '/sources');
        cy.contains('No records to display').should('not.exist');
        cy.contains(url);
        cy.contains(name);
        cy.contains(format);
        cy.contains(license);
        cy.contains('test@example.com');
        cy.contains(otherEmail);
    });

    it('Does not add source on submission error', function () {
        cy.visit('/');
        cy.contains('Sources').click();
        cy.contains('No records to display');

        cy.contains('Create new').click();
        cy.contains('New automated source').click();
        cy.get('div[data-testid="url"]').type('www.newsource.com');
        cy.get('div[data-testid="name"]').type('New source name');
        cy.get('div[data-testid="license"]').type('WTFPL');
        cy.get('div[data-testid="format"]').click();
        cy.get('li[data-value="JSON"').click();

        // Force server to return error
        cy.intercept('POST', '/api/sources', {
            statusCode: 422,
            body: {
                message: 'nope',
            },
        }).as('createSource');

        cy.get('button[data-testid="submit"]').click();
        cy.wait('@createSource');
        cy.contains('nope');

        cy.get('header button[aria-label="close overlay"]').click();
        cy.contains('Sources').click();
        cy.contains('No records to display');
    });
});
