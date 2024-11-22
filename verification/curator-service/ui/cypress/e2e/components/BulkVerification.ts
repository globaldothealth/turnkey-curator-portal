import { CaseStatus } from '../../support/commands';
import {Role} from "../../../src/api/models/User";

/* eslint-disable no-undef */
describe('Linelist table', function () {
    beforeEach(() => {
        cy.task('clearCasesDB', {});
        cy.intercept('GET', '/auth/profile').as('getProfile');
        cy.intercept('GET', '/api/cases*').as('getCases');
    });

    afterEach(() => {
        cy.clearSeededLocations();
    });

    it('Displays and verifies bundled cases correctly', function () {
        cy.login({roles: [ Role.JuniorCurator ]})
        cy.addCase({
            country: 'France',
            countryISO3: 'FRA',
            dateEntry: '2020-05-01',
            dateReported: '2020-05-01',
            sourceUrl: 'www.example.com',
            caseStatus: CaseStatus.Confirmed,
        });
        cy.logout();
        cy.login({roles: [ Role.Curator ]})

        // Make sure that case is not verified
        cy.visit('/');
        cy.wait('@getProfile');
        cy.wait('@getCases');
        cy.get('[data-testid="CheckCircleOutlineIcon"]').should('not.exist');

        // Verify case
        cy.visit('/bulk-verification');

        // We don't need additional library for just one test, we can format date manually
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() < 9 ? `0${today.getMonth() + 1}` : today.getMonth() + 1;
        const day = today.getDate() < 10 ? `0${today.getDate()}` : today.getDate();
        cy.contains(`${year}-${month}-${day}`)
        cy.contains('superuser@test.com');
        cy.contains('France');
        cy.contains('www.example.com');
        cy.contains('2020-05-01');
        cy.contains('confirmed');
        cy.get('tr').get('input[type="checkbox"]').check();
        cy.get('[data-testid="verify-case-bundles-button"]').click();
        cy.get('[data-testid="confirm-case-bundles-verification-button"]').click();

        // Case bundle no longer shows in bulk verification list
        cy.contains('No records to display').should('exist');

        // Case from case bundle is now verified
        cy.visit('/');
        cy.wait('@getCases');
        cy.get('[data-testid="CheckCircleOutlineIcon"]').should('exist');
    });
});
