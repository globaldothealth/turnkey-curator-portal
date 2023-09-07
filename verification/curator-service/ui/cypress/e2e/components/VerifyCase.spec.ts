import { CaseStatus } from '../../support/commands';
import { Role } from '../../../src/api/models/User'

/* eslint-disable no-undef */
describe('New case form', function () {
    beforeEach(() => {
        cy.task('clearSourcesDB', {});
        cy.task('clearCasesDB', {});
        // cy.login();
        cy.intercept('GET', '/auth/profile').as('getProfile');
        cy.intercept('GET', '/api/geocode/suggest?q=France', {
            fixture: 'geolocation_france_suggest.json',
        }).as('geolocationFranceSuggest');
        cy.seedLocation({
            country: 'FR',
            geometry: { latitude: 45.75889, longitude: 4.84139 },
            name: 'France',
            geoResolution: 'Country',
        });
    });

    afterEach(() => {
        cy.clearSeededLocations();
    });

    it('Case added by user with Junior Curator role should not be marked as verified', function () {
        cy.login({roles: [ Role.JuniorCurator ]})
        cy.visit('/');
        cy.wait('@getProfile');

        cy.visit('/cases/new');
        cy.contains(`Create new ${Cypress.env('DISEASE_NAME')} line list case`);
        cy.get('div[data-testid="caseStatus"]').click();
        cy.get('li[data-value="confirmed"]').click();
        cy.get('div[data-testid="caseReference"]').type('www.new-source.com');
        cy.get('div[data-testid="location.geocodeLocation"]').type('France');
        cy.wait('@geolocationFranceSuggest');
        cy.contains('li', 'France').click();
        cy.get('div[data-testid="location.countryISO3"]').click()
        cy.get('li[data-value="FRA"').click();
        cy.get('input[name="events.dateEntry"]').type('2020-01-01');

        cy.intercept('POST', '/api/cases?num_cases=1').as('addCase');
        cy.get('button[data-testid="submit"]').click();
        cy.wait('@addCase');
        cy.request({ method: 'GET', url: '/api/cases' }).then((resp) => {
            expect(resp.body.cases).to.have.lengthOf(1);
            cy.url().should('eq', 'http://localhost:3002/cases');
            // Check if verification mark is not present
            cy.get('table').find('tr').eq(1).find('td').eq(1).should('be.empty')
        });
    });


    it('Case added by user with Curator role should be marked as verified', function () {
        cy.login({roles: [ Role.Curator ]})
        cy.visit('/');
        cy.wait('@getProfile');

        cy.visit('/cases/new');
        cy.get('div[data-testid="caseStatus"]').click();
        cy.get('li[data-value="confirmed"]').click();
        cy.get('div[data-testid="caseReference"]').type('www.new-source.com');
        cy.get('div[data-testid="location.geocodeLocation"]').type('France');
        cy.wait('@geolocationFranceSuggest');
        cy.contains('li', 'France').click();
        cy.get('input[name="events.dateEntry"]').type('2020-01-01');

        cy.intercept('POST', '/api/cases?num_cases=1').as('addCase');
        cy.get('button[data-testid="submit"]').click();
        cy.wait('@addCase');
        cy.request({ method: 'GET', url: '/api/cases' }).then((resp) => {
            expect(resp.body.cases).to.have.lengthOf(1);
            cy.url().should('eq', 'http://localhost:3002/cases');
            // Check if verification mark is not present
            cy.get('table').find('tr').eq(1).find('td').eq(1).should('not.be.empty')
        });
    });

    it('Case added by user with Junior Curator can be verified by user with Curator role', function () {
        cy.login({email: 'junior_curator.cypress_test@global.health', roles: [ Role.JuniorCurator ]});
        cy.addCase({
            country: 'France',
            countryISO3: 'FRA',
            dateEntry: '2020-01-01',
            caseStatus: CaseStatus.Confirmed,
            sourceUrl: 'www.example.com',
            occupation: 'Actor',
            symptoms: 'fever, cough, anxiety, apnea, arthritis, bleeding',
        });
        cy.logout();

        cy.login({email: 'curator.cypress_test@global.health', roles: [ Role.Curator ]});
        cy.visit('/');
        cy.get('td[data-testid="verification-status"]').should('be.empty');
        cy.contains('France').click();
        cy.contains('Verify').click();
        cy.get('button[data-testid="verify-dialog-close-button"]').click();
        cy.contains('Verify').click();
        cy.get('button[data-testid="verify-dialog-confirm-button"]').click();
        cy.contains('Verify').should('not.exist');
        cy.visit('/');
        cy.get('td[data-testid="verification-status"]').should('not.be.empty');
    });
});
