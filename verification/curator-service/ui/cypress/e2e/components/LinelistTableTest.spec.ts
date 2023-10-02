import { CaseStatus } from '../../support/commands';
import { getDefaultQuery } from '../../utils/helperFunctions';

/* eslint-disable no-undef */
describe('Linelist table', function () {
    beforeEach(() => {
        cy.task('clearCasesDB', {});
        cy.login({
            email: 'test@bar.com',
            name: 'test',
            roles: ['admin', 'curator'],
        });
        cy.seedLocation({
            country: 'FR',
            geometry: { latitude: 51.5072, longitude: -0.1275 },
            name: 'France',
            geoResolution: 'Country',
        });
        cy.seedLocation({
            country: 'DE',
            geometry: { latitude: 51.5072, longitude: -0.1275 },
            name: 'Germany',
            geoResolution: 'Country',
        });
        cy.seedLocation({
            country: 'ES',
            geometry: { latitude: 51.5072, longitude: -0.1275 },
            name: 'Spain',
            geoResolution: 'Country',
        });
        cy.seedLocation({
            country: 'GB',
            geometry: { latitude: 51.5072, longitude: -0.1275 },
            name: 'United Kingdom',
            geoResolution: 'Country',
        });
        cy.seedLocation({
            country: 'AR',
            geometry: { latitude: 51.5072, longitude: -0.1275 },
            name: 'Argentina',
            geoResolution: 'Country',
        });
    });

    afterEach(() => {
        cy.clearSeededLocations();
    });

    it('Display case properly', function () {
        cy.addCase({
            country: 'France',
            countryISO3: 'FRA',
            dateEntry: '2020-05-01',
            dateReported: '2020-05-01',
            sourceUrl: 'www.example.com',
            caseStatus: CaseStatus.Confirmed,
        });
        cy.visit('/');
        cy.visit('/cases');
        cy.contains('France');
        cy.contains('www.example.com');
        cy.contains('2020-05-01');
        cy.contains('confirmed');
    });

    it('Can open and close the edit modal', function () {
        cy.login({
            roles: ['curator'],
            name: 'testName',
            email: 'test@example.com',
        });
        cy.addCase({
            country: 'France',
            countryISO3: 'FRA',
            dateEntry: '2020-05-01',
            dateReported: '2020-05-01',
            sourceUrl: 'www.example.com',
            caseStatus: CaseStatus.Confirmed,
        });

        cy.intercept('GET', '/api/cases/*').as('fetchCaseDetails');

        cy.visit('/');
        cy.visit('/cases');
        cy.contains('France');
        cy.contains('Edit case').should('not.exist');
        cy.contains('France').click();

        cy.wait('@fetchCaseDetails');

        cy.get('button[data-testid="edit-button"]').click();
        cy.contains('Edit case');
        cy.get('button[aria-label="close overlay"').click();
        cy.contains('Edit case').should('not.exist');
    });

    it('Can open and close the details modal', function () {
        cy.addCase({
            country: 'France',
            countryISO3: 'FRA',
            dateEntry: '2020-05-01',
            dateReported: '2020-05-01',
            sourceUrl: 'www.example.com',
            caseStatus: CaseStatus.Confirmed,
        });
        cy.visit('/');
        cy.visit('/cases');
        cy.contains('France');
        cy.contains(/Case details\b/).should('not.exist');
        cy.contains('td', 'France').click({ force: true });
        cy.contains(/Case details\b/);
        cy.get('button[aria-label="close overlay"').click();
        cy.contains(/Case details\b/).should('not.exist');
    });

    it('Can delete a case', function () {
        cy.addCase({
            country: 'France',
            countryISO3: 'FRA',
            dateEntry: '2020-05-01',
            dateReported: '2020-05-01',
            sourceUrl: 'www.example.com',
            caseStatus: CaseStatus.Confirmed,
        });
        cy.visit('/');
        cy.visit('/cases');
        cy.contains('France');

        cy.get('input#checkbox0').click();
        cy.get('button[aria-label="Delete selected rows"]').click();
        cy.contains('Are you sure you want to delete 1 case?');
        cy.contains('Yes').click();

        cy.contains('France').should('not.exist');
    });

    it('Can delete multiple cases', function () {
        cy.addCase({
            country: 'France',
            countryISO3: 'FRA',
            dateEntry: '2020-05-01',
            dateReported: '2020-05-01',
            sourceUrl: 'www.example.com',
            caseStatus: CaseStatus.Confirmed,
        });
        cy.addCase({
            country: 'Germany',
            countryISO3: 'DEU',
            dateEntry: '2020-05-01',
            dateReported: '2020-05-01',
            sourceUrl: 'www.example.com',
            caseStatus: CaseStatus.Confirmed,
        });
        cy.addCase({
            country: 'Spain',
            countryISO3: 'ESP',
            dateEntry: '2020-05-01',
            dateReported: '2020-05-01',
            sourceUrl: 'www.example.com',
            caseStatus: CaseStatus.Confirmed,
        });
        cy.visit('/');
        cy.visit('/cases');
        cy.contains('France');
        cy.contains('Germany');
        cy.contains('Spain');

        // Three row checkboxes and a header checkbox
        cy.get('input[type="checkbox"]').should('have.length', 4);
        cy.get('input[type="checkbox"]').eq(1).click();
        cy.get('input[type="checkbox"]').eq(3).click();

        cy.intercept('DELETE', `/api/cases`).as('deleteCases');
        cy.get('button[aria-label="Delete selected rows"]').click();
        cy.contains('Are you sure you want to delete 2 cases?');
        cy.contains('Yes').click();
        cy.wait('@deleteCases');

        cy.contains('France').should('not.exist');
        cy.contains('Germany');
        cy.contains('Spain').should('not.exist');
    });

    it('displays search errors', function () {
        cy.addCase({
            country: 'France',
            countryISO3: 'FRA',
            dateEntry: '2020-05-01',
            dateReported: '2020-05-01',
            sourceUrl: 'www.example.com',
            caseStatus: CaseStatus.Confirmed,
        });
        cy.visit('/');
        cy.visit('/cases');
        cy.contains('Filter').click();
        cy.get('input[name="caseId"]').type('!{enter}');
        cy.contains(/Error: Request failed with status code 400/);
    });

    it('Can search', function () {
        cy.addCase({
            country: 'France',
            countryISO3: 'FRA',
            dateEntry: '2020-05-01',
            dateReported: '2020-05-01',
            sourceUrl: 'www.example.com',
            caseStatus: CaseStatus.Confirmed,
        });
        cy.addCase({
            country: 'Germany',
            countryISO3: 'DEU',
            dateEntry: '2020-05-01',
            dateReported: '2020-05-01',
            sourceUrl: 'www.example.com',
            caseStatus: CaseStatus.Confirmed,
        });
        cy.visit('/');
        cy.visit('/cases');
        cy.contains('France');
        cy.contains('Germany');

        cy.contains('Filter').click();
        cy.get('#country').click();

        cy.get('[data-value="UKR"]').click();
        cy.get('button[data-test-id="search-by-filter-button"]').click();
        cy.contains('France').should('not.exist');
        cy.contains('Germany').should('not.exist');

        cy.contains('Filter').click();
        cy.get('#country').click();

        cy.get('[data-value="FRA"]').click();
        cy.get('button[data-test-id="search-by-filter-button"]').click();
        cy.contains('France');
        cy.contains('Germany').should('not.exist');

        cy.contains('Filter').click();
        cy.contains('Clear filters').click();
        cy.get('button[data-test-id="search-by-filter-button"]').click();
        cy.contains('France');
        cy.contains('Germany');
    });

    it('Search query is saved in browser history', function () {
        cy.addCase({
            country: 'France',
            countryISO3: 'FRA',
            dateEntry: '2020-05-01',
            dateReported: '2020-05-01',
            sourceUrl: 'www.example.com',
            caseStatus: CaseStatus.Confirmed,
        });
        cy.addCase({
            country: 'United Kingdom',
            countryISO3: 'GBR',
            dateEntry: '2020-05-01',
            dateReported: '2020-05-01',
            sourceUrl: 'www.example.com',
            caseStatus: CaseStatus.Confirmed,
        });
        cy.visit('/');
        cy.visit('/cases');
        cy.contains('France');
        cy.contains('United Kingdom');

        cy.contains('Filter').click();
        cy.get('div[data-testid="country-select"]').click();
        cy.get('li[data-value="FRA"]').scrollIntoView().click();
        cy.get('button[data-test-id="search-by-filter-button"]').click();
        cy.contains('United Kingdom').should('not.exist');

        // Navigate to case details and back
        cy.contains('France').click();
        cy.contains(/Case details\b/);
        cy.get('button[aria-label="close overlay"').click();
        cy.contains(/Case details\b/).should('not.exist');

        // Search is maintained
        cy.contains('Filter').click();
        cy.get('#country').contains('France');

        cy.contains('France');
        cy.contains('United Kingdom').should('not.exist');
    });

    it('Can select all rows across pages only after searching', function () {
        for (let i = 0; i < 7; i++) {
            cy.addCase({
                country: 'France',
                countryISO3: 'FRA',
                dateEntry: '2020-05-01',
                dateReported: '2020-05-01',
                sourceUrl: 'www.example.com',
                caseStatus: CaseStatus.Confirmed,
            });
        }

        cy.intercept('GET', getDefaultQuery({ limit: 50 })).as('getCases');
        cy.visit('/');
        cy.visit('/cases');
        cy.wait('@getCases');

        cy.intercept('GET', getDefaultQuery({ limit: 5 })).as('get5Cases');

        cy.get('select[aria-label="rows per page"]').select('5');
        cy.wait('@get5Cases');
        cy.get('input[type="checkbox"]').should('have.length', 6);
        cy.contains('1 row selected').should('not.exist');
        cy.get('input[type="checkbox"]').eq(1).click();
        cy.contains('1 row selected');
        cy.get('input[type="checkbox"]').eq(0).click();
        cy.contains('5 rows selected');

        // Select all option not available before search
        cy.contains('Select all 7 rows').should('not.exist');

        cy.contains('Filter').click();
        cy.get('#country').click();
        cy.get('[data-value="FRA"]').click();
        cy.get('button[data-test-id="search-by-filter-button"]').click();

        // Select all option available after search
        cy.contains('Select all 7 rows').click();
        cy.contains('7 rows selected');

        cy.contains('Unselect all 7 rows').click();
        cy.contains('7 rows selected').should('not.exist');
    });

    it('Can delete all cases across rows for a search result', function () {
        for (let i = 0; i < 7; i++) {
            cy.addCase({
                country: 'France',
                countryISO3: 'FRA',
                dateEntry: '2020-05-01',
                dateReported: '2020-05-01',
                sourceUrl: 'www.example.com',
                caseStatus: CaseStatus.Confirmed,
            });
        }
        cy.addCase({
            country: 'Germany',
            countryISO3: 'DEU',
            dateEntry: '2020-05-01',
            dateReported: '2020-05-01',
            sourceUrl: 'www.example.com',
            caseStatus: CaseStatus.Confirmed,
        });
        cy.addCase({
            country: 'United Kingdom',
            countryISO3: 'GBR',
            dateEntry: '2020-05-01',
            dateReported: '2020-05-01',
            sourceUrl: 'www.example.com',
            caseStatus: CaseStatus.Confirmed,
        });

        cy.intercept('GET', getDefaultQuery({ limit: 50 })).as('getCases');
        cy.visit('/');
        cy.visit('/cases');
        cy.wait('@getCases');
        // cy.get('button.iubenda-cs-accept-btn').click();

        cy.get('select[aria-label="rows per page"]').select('5');
        cy.contains('Filter').click();
        cy.get('#country').click();
        cy.get('[data-value="FRA"]').click();
        cy.get('button[data-test-id="search-by-filter-button"]').click();
        cy.get('input[type="checkbox"]').eq(0).click();
        cy.contains('Select all 7 rows').click();

        cy.intercept('DELETE', `/api/cases`).as('deleteCases');
        cy.get('button[aria-label="Delete selected rows"]').click();
        cy.contains('Are you sure you want to delete 7 cases?');
        cy.contains('Yes').click();
        cy.wait('@deleteCases');

        cy.contains('No records to display');
        cy.contains('Filter').click();
        cy.contains('Clear filters').click();
        cy.get('button[data-test-id="search-by-filter-button"]').click();
        cy.contains('France').should('not.exist');
        cy.contains('Germany');
        cy.contains('United Kingdom');
    });

    it('Pagination settings stays the same after returning from details modal', function () {
        for (let i = 0; i < 7; i++) {
            cy.addCase({
                country: 'France',
                countryISO3: 'FRA',
                dateEntry: '2020-05-01',
                dateReported: '2020-05-01',
                sourceUrl: 'www.example.com',
                caseStatus: CaseStatus.Confirmed,
            });
        }

        cy.intercept('GET', getDefaultQuery({ limit: 50 })).as('getCases');
        cy.intercept('GET', getDefaultQuery({ limit: 5 })).as('getFirstPage');
        cy.visit('/');
        cy.visit('/cases');
        cy.wait('@getCases');
        cy.get('select[aria-label="rows per page"]').select('5');
        cy.wait('@getFirstPage');

        cy.get('button[aria-label="next page"]').click();
        cy.contains('France').first().click({ force: true });
        cy.get('button[aria-label="close overlay"').click();

        cy.contains('6 - 7 of 7').should('exist');
        cy.get('select[aria-label="rows per page"]').should('have.value', '5');
    });

    it('Searching from a different page than first flips back to page one', function () {
        for (let i = 0; i < 7; i++) {
            cy.addCase({
                country: 'France',
                countryISO3: 'FRA',
                dateEntry: '2020-05-01',
                dateReported: '2020-05-01',
                sourceUrl: 'www.example.com',
                caseStatus: CaseStatus.Confirmed,
            });
        }

        cy.intercept('GET', getDefaultQuery({ limit: 50 })).as('getCases');
        cy.intercept('GET', getDefaultQuery({ limit: 5 })).as('getFirstPage');
        cy.visit('/');
        cy.visit('/cases');
        cy.wait('@getCases');
        cy.get('select[aria-label="rows per page"]').select('5');
        cy.wait('@getFirstPage');

        cy.get('button[aria-label="next page"]').click();

        cy.get('input[id="search-field"]').type('France{enter}');

        cy.contains('1 - 5 of 7').should('exist');
    });

    // For some reason all the added cases have the same confirmation date
    // without taking into consideration passed creationDate
    // which makes this test always fail, this has to be debugged
    it.skip('Can sort the data', () => {
        cy.addCase({
            country: 'France',
            countryISO3: 'FRA',
            dateEntry: '2022-05-10T13:35:33.6 31Z',
            dateReported: '2020-05-01',
            dateConfirmation: '2022-05-10T13:35:33.631Z',
            sourceUrl: 'www.example.com',
            caseStatus: CaseStatus.Confirmed,
        });
        cy.addCase({
            country: 'Germany',
            countryISO3: 'DEU',
            dateEntry: '2022-02-19T13:35:33.631Z',
            dateReported: '2020-05-01',
            dateConfirmation: '2022-02-19T13:35:33.631Z',
            sourceUrl: 'www.example.com',
            caseStatus: CaseStatus.Confirmed,
        });
        cy.addCase({
            country: 'Argentina',
            countryISO3: 'ARG',
            dateEntry: '2021-07-15T13:35:33.631Z',
            dateReported: '2020-05-01',
            dateConfirmation: '2021-07-15T13:35:33.631Z',
            sourceUrl: 'www.example.com',
            caseStatus: CaseStatus.Confirmed,
        });

        cy.intercept('GET', getDefaultQuery({ limit: 50 })).as('getCases');
        cy.intercept(
            'GET',
            getDefaultQuery({ limit: 50, sortOrder: 'ascending' }),
        ).as('getCasesAscending');

        cy.visit('/cases');
        cy.wait('@getCases');

        cy.get('tr').eq(2).contains('Germany');

        cy.get('#sort-by-select').click();
        cy.get('li').contains('ascending').click();
        cy.wait('@getCasesAscending');

        cy.get('tr').eq(2).contains('France');
    });
});
