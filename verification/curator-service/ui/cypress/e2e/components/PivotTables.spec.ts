import { CaseStatus } from '../../support/commands';
import { Role } from '../../../src/api/models/User'

/* eslint-disable no-undef */
describe('Pivot Tables', function () {
    beforeEach(() => {
        cy.task('clearSourcesDB', {});
        cy.task('clearCasesDB', {});
        cy.login();
        cy.intercept('GET', '/auth/profile').as('getProfile');
    });

    afterEach(() => {
        cy.clearSeededLocations();
    });

    const casesByCountryPivotDataFixture = {
        countries: {
            France: {
                confirmed: 3,
                suspected: 2,
                death: 1,
                total: 5,
            },
            Poland: {
                confirmed: 2,
                total: 1,
            },
            "United States of America": {
                confirmed: 5,
                suspected: 3,
                death: 2,
                total: 8,
            },
        },
        globally: {
            confirmed: 12,
            suspected: 4,
            death: 3,
            total: 19,
        }
    }

    it('Correctly displays data in Cases by Country Pivot Table', function () {
        cy.intercept('GET', '/api/cases/countryData', casesByCountryPivotDataFixture).as('getCasesByCountryPivotData');
        cy.visit('/');
        cy.wait('@getProfile');
        cy.visit('/pivot-tables');
        cy.wait('@getCasesByCountryPivotData');

        cy.contains('tr', 'France').within(() => {
            cy.get('td').eq(1).contains('3');
            cy.get('td').eq(2).contains('2');
            cy.get('td').eq(3).contains('1');
            cy.get('td').eq(4).contains('5');
        });
        cy.contains('tr', 'Poland').within(() => {
            cy.get('td').eq(1).contains('2');
            cy.get('td').eq(2).should('be.empty');
            cy.get('td').eq(3).should('be.empty');
            cy.get('td').eq(4).contains('1');
        });
        cy.contains('tr', 'United States of America').within(() => {
            cy.get('td').eq(1).contains('5');
            cy.get('td').eq(2).contains('3');
            cy.get('td').eq(3).contains('2');
            cy.get('td').eq(4).contains('8');
        });
        cy.contains('tr', 'Grand Total').within(() => {
            cy.get('td').eq(1).contains('12');
            cy.get('td').eq(2).contains('4');
            cy.get('td').eq(3).contains('3');
            cy.get('td').eq(4).contains('19');
        });
    });

    it('Correctly displays empty Pivot Table', function () {
        cy.intercept('GET', '/api/cases/countryData', {}).as('getCasesByCountryPivotData');
        cy.visit('/');
        cy.wait('@getProfile');
        cy.visit('/pivot-tables');
        cy.wait('@getCasesByCountryPivotData');

        cy.contains('tr', 'No records to display').should('exist');
        cy.contains('tr', 'Grand Total').within(() => {
            cy.get('td').eq(1).should('be.empty');
            cy.get('td').eq(2).should('be.empty');
            cy.get('td').eq(3).should('be.empty');
            cy.get('td').eq(4).should('be.empty');
        });
    });

    it('Does not display omitted or discarded cases in the Pivot Table', function () {
        cy.intercept('GET', '/api/cases/countryData', {}).as('getCasesByCountryPivotData');
        cy.visit('/');
        cy.wait('@getProfile');
        cy.visit('/cases');
        cy.addCase({
            country: 'Albania',
            countryISO3: 'ALB',
            sourceUrl: 'www.example.com',
            confirmationMethod: 'PCR test',
            dateEntry: '2020-01-01',
            dateReported: '2020-01-01',
            caseStatus: CaseStatus.OmitError,
        });
        cy.addCase({
            country: 'France',
            countryISO3: 'FRA',
            sourceUrl: 'www.example.com',
            confirmationMethod: 'PCR test',
            dateEntry: '2020-01-01',
            dateReported: '2020-01-01',
            caseStatus: CaseStatus.Discarded,
        });
        cy.visit('/pivot-tables');
        cy.wait('@getCasesByCountryPivotData');

        cy.contains('tr', 'No records to display').should('exist');
        cy.contains('tr', 'Grand Total').within(() => {
            cy.get('td').eq(1).should('be.empty');
            cy.get('td').eq(2).should('be.empty');
            cy.get('td').eq(3).should('be.empty');
            cy.get('td').eq(4).should('be.empty');
        });
    });

    it('Allow searching for country in Cases by Country Pivot Table', function () {
        cy.intercept('GET', '/api/cases/countryData', casesByCountryPivotDataFixture).as('getCasesByCountryPivotData');
        cy.visit('/');
        cy.wait('@getProfile');
        cy.visit('/pivot-tables');
        cy.wait('@getCasesByCountryPivotData');

        cy.contains('tr', 'France').should('exist');
        cy.contains('tr', 'Poland').should('exist');
        cy.contains('tr', 'United States of America').should('exist');
        cy.contains('tr', 'Grand Total').should('exist');

        cy.get('input[aria-label="Search"]').type('France');

        cy.contains('tr', 'France').should('exist');
        cy.contains('tr', 'Poland').should('not.exist');
        cy.contains('tr', 'United States of America').should('not.exist');
        cy.contains('tr', 'Grand Total').should('exist');

        cy.get('input[aria-label="Search"]').clear().type('United States of America');

        cy.contains('tr', 'France').should('not.exist');
        cy.contains('tr', 'Poland').should('not.exist');
        cy.contains('tr', 'United States of America').should('exist');
        cy.contains('tr', 'Grand Total').should('exist');
    });

    it('Adding a case changes data in Cases by Country Pivot Table', function () {
        cy.intercept('GET', '/api/cases/countryData').as('getCasesByCountryPivotData');
        cy.visit('/');
        cy.wait('@getProfile');
        cy.visit('/cases');
        cy.addCase({
            country: 'France',
            countryISO3: 'FRA',
            sourceUrl: 'www.example.com',
            confirmationMethod: 'PCR test',
            dateEntry: '2020-01-01',
            dateReported: '2020-01-01',
            caseStatus: CaseStatus.Confirmed,
        });
        cy.visit('/pivot-tables');
        cy.wait('@getCasesByCountryPivotData');

        cy.contains('tr', 'France').within(() => {
            cy.get('td').eq(1).contains('1');
            cy.get('td').eq(2).should('be.empty');
            cy.get('td').eq(2).should('be.empty');
            cy.get('td').eq(4).contains('1');
        });
        cy.contains('tr', 'Poland').should('not.exist');
        cy.contains('tr', 'Grand Total').within(() => {
            cy.get('td').eq(1).contains('1');
            cy.get('td').eq(2).should('be.empty');
            cy.get('td').eq(2).should('be.empty');
            cy.get('td').eq(4).contains('1');
        });

        cy.visit('/cases');
        cy.addCase({
            country: 'France',
            countryISO3: 'FRA',
            sourceUrl: 'www.example.com',
            confirmationMethod: 'PCR test',
            dateEntry: '2020-01-01',
            dateReported: '2020-01-01',
            caseStatus: CaseStatus.Suspected,
        });
        cy.addCase({
            country: 'Poland',
            countryISO3: 'POL',
            sourceUrl: 'www.example.com',
            confirmationMethod: 'PCR test',
            dateEntry: '2020-01-01',
            dateReported: '2020-01-01',
            caseStatus: CaseStatus.Confirmed,
        });

        cy.visit('/pivot-tables');
        cy.contains('tr', 'France').within(() => {
            cy.get('td').eq(1).contains('1');
            cy.get('td').eq(2).contains('1');
            cy.get('td').eq(3).should('be.empty');
            cy.get('td').eq(4).contains('2');
        });
        cy.contains('tr', 'Poland').within(() => {
            cy.get('td').eq(1).contains('1');
            cy.get('td').eq(2).should('be.empty');
            cy.get('td').eq(3).should('be.empty');
            cy.get('td').eq(4).contains('1');
        });
        cy.contains('tr', 'Grand Total').within(() => {
            cy.get('td').eq(1).contains('2');
            cy.get('td').eq(2).contains('1');
            cy.get('td').eq(3).should('be.empty');
            cy.get('td').eq(4).contains('3');
        });
    });
});
