import { CaseStatus } from '../../support/commands';
import { getDefaultQuery } from '../../utils/helperFunctions';

/* eslint-disable no-undef */
describe('View case', function () {
    beforeEach(() => {
        cy.task('clearCasesDB', {});
        cy.login();

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

    it('highlights text search results', function () {
        cy.addCase({
            country: 'France',
            countryISO3: 'FR',
            sourceUrl: 'www.example.com',
            confirmationMethod: 'PCR test',
            dateEntry: '2020-01-01',
            caseStatus: CaseStatus.Confirmed,
        });

        cy.intercept('GET', getDefaultQuery({ limit: 50 })).as('getCases');
        cy.visit('/');

        cy.visit('/cases');
        cy.wait('@getCases');

        cy.get('input[id="search-field"]').type('example{enter}');

        cy.get('body').then(($body) => {
            if ($body.find('.iubenda-cs-accept-btn').length) {
                cy.get('.iubenda-cs-accept-btn').click();
            }
        });
        cy.contains('France').click();
        cy.get('.highlighted').children('mark').contains('example');
    });

    // View of a full case is covered in the curator test.
    it('can view a case', function () {
        cy.addCase({
            country: 'France',
            countryISO3: 'FR',
            sourceUrl: 'www.example.com',
            confirmationMethod: 'PCR test',
            dateEntry: '2020-01-01',
            caseStatus: CaseStatus.Confirmed,
        });
        cy.request({ method: 'GET', url: '/api/cases' }).then((resp) => {
            expect(resp.body.cases).to.have.lengthOf(1);
            cy.visit('/');
            cy.contains('France').click();

            cy.contains('France');
            cy.contains('www.example.com');
            cy.contains('PCR test');
            cy.contains('2020-01-01');
        });
    });
});
