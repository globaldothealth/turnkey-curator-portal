import { CaseStatus } from '../../support/commands';

/* eslint-disable no-undef */
describe('New case form', function () {
    beforeEach(() => {
        cy.task('clearSourcesDB', {});
        cy.task('clearCasesDB', {});
        cy.login();
        cy.intercept('GET', '/auth/profile').as('getProfile');
        cy.intercept('GET', '/api/geocode/suggest?q=France', {
            fixture: 'geolocation_france_suggest.json',
        }).as('geolocationFranceSuggest');
        cy.seedLocation({
            country: 'FRA',
            geometry: { latitude: 45.75889, longitude: 4.84139 },
            name: 'France',
            geoResolution: 'Country',
        });
    });

    afterEach(() => {
        cy.clearSeededLocations();
    });

    // Full case is covered in curator test.
    it('Can add minimal row to linelist with existing source', function () {
        cy.addSource('Test source', 'www.example.com');

        cy.visit('/');

        cy.wait('@getProfile');

        cy.visit('/cases/new');
        cy.contains(`Create new ${Cypress.env('DISEASE_NAME')} line list case`);
        cy.get('div[data-testid="caseStatus"]').click();
        cy.get('li[data-value="confirmed"]').click();
        cy.get('div[data-testid="caseReference"]').type('www.example.com');
        cy.contains('www.example.com').click();
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
            cy.contains(`Case ${resp.body.cases[0]._id} added`);
            cy.contains('No records to display').should('not.exist');
            cy.contains('www.example.com');
            cy.contains('France');
            cy.contains('2020-01-01');
        });
    });

    it('Can add minimal row to linelist with new source', function () {
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
            cy.contains(`Case ${resp.body.cases[0]._id} added`);
            cy.contains('No records to display').should('not.exist');
            cy.contains('www.new-source.com');
            cy.contains('France');
            cy.contains('2020-01-01');

            cy.visit('/');
            cy.visit('/sources');
            cy.contains('www.new-source.com');
        });
    });

    it('Can add multiple cases to linelist', function () {
        cy.addSource('Test source', 'www.example.com');

        cy.visit('/');
        cy.wait('@getProfile');

        cy.visit('/cases/new');
        cy.contains(`Create new ${Cypress.env('DISEASE_NAME')} line list case`);
        cy.get('div[data-testid="caseStatus"]').click();
        cy.get('li[data-value="confirmed"]').click();
        cy.get('div[data-testid="caseReference"]').type('www.example.com');
        cy.contains('www.example.com').click();
        cy.get('div[data-testid="location.geocodeLocation"]').type('France');
        cy.wait('@geolocationFranceSuggest');
        cy.contains('li', 'France').click();
        cy.get('div[data-testid="location.countryISO3"]').click()
        cy.get('li[data-value="FRA"').click();
        cy.get('input[name="events.dateEntry"]').type('2020-01-01');
        cy.get('input[name="numCases"]').clear().type('3');

        cy.intercept('POST', '/api/cases?num_cases=3').as('addCases');
        cy.get('button[data-testid="submit"]').click();
        cy.wait('@addCases');
        cy.url().should('eq', 'http://localhost:3002/cases');
        cy.contains('3 cases added');
        cy.contains('No records to display').should('not.exist');
        cy.get('td:contains("www.example.com")').should('have.length', 3);
        cy.get('td:contains("2020-01-01")').should('have.length', 3);
    });

    it('Can submit events without dates', function () {
        cy.visit('/');
        cy.visit('/cases');
        cy.contains('No records to display');
        cy.addSource('Test source', 'www.example.com');

        cy.visit('/');
        cy.wait('@getProfile');

        cy.visit('/cases/new');
        cy.get('div[data-testid="caseStatus"]').click();
        cy.get('li[data-value="confirmed"]').click();
        cy.get('div[data-testid="caseReference"]').type('www.example.com');
        cy.contains('www.example.com').click();
        cy.get('div[data-testid="location.geocodeLocation"]').type('France');
        cy.wait('@geolocationFranceSuggest');
        cy.contains('li', 'France').click();
        cy.get('div[data-testid="location.countryISO3"]').click()
        cy.get('li[data-value="FRA"').click();
        cy.get('input[name="events.dateEntry"]').type('2020-01-01');
        // Outcome without a date.
        cy.get('div[data-testid="events.outcome"]').click();
        cy.get('li[data-value="recovered"').click();
        // Isolated without a date
        cy.get('div[data-testid="events.isolated"]').click();
        cy.get('li[data-value="Y"').click();
        // Hospital admission without a date
        cy.get('div[data-testid="events.hospitalized"]').click();
        cy.get('li[data-value="Y"').click();
        // ICU admission without a date.
        cy.get('div[data-testid="events.intensiveCare"]').click();
        cy.get('li[data-value="Y"').click();

        cy.intercept('POST', '/api/cases?num_cases=1').as('addCase');
        cy.get('button[data-testid="submit"]').click();
        cy.wait('@addCase');

        cy.request({ method: 'GET', url: '/api/cases' }).then((resp) => {
            expect(resp.body.cases).to.have.lengthOf(1);
            cy.contains(`Case ${resp.body.cases[0]._id} added`);
            cy.contains('No records to display').should('not.exist');
            cy.contains('www.example.com');
            cy.contains('France');
            cy.contains('2020-01-01');
            cy.contains('recovered');
        });
    });

    it.skip('Can add fields from chips', function () {
        cy.addSource('Test source', 'www.example.com');
        cy.addCase({
            country: 'France',
            countryISO3: 'FRA',
            dateEntry: '2020-01-01',
            caseStatus: CaseStatus.Confirmed,
            sourceUrl: 'www.example.com',
            occupation: 'Actor',
            symptoms: 'fever, cough, anxiety, apnea, arthritis, bleeding',
        });
        cy.addCase({
            country: 'France',
            countryISO3: 'FRA',
            dateEntry: '2020-01-01',
            caseStatus: CaseStatus.Confirmed,
            sourceUrl: 'www.example.com',
            occupation: 'Horse trainer',
            symptoms: 'fever, cough',
        });

        cy.visit('/');
        cy.wait('@getProfile');

        cy.visit('/cases/new');
        cy.contains(`Create new ${Cypress.env('DISEASE_NAME')} line list case`);
        cy.get('div[data-testid="caseReference"]').type('www.example.com');
        cy.contains('www.example.com').click();
        cy.contains('Actor');
        cy.contains('Horse trainer');
        cy.get('span:contains("Horse trainer")').click();
        cy.get('div[data-testid="location"]').type('France');
        cy.wait('@geolocationFranceSuggest');
        cy.contains('li', 'France').click();
        cy.get('div[data-testid="location.countryISO3"]').click()
        cy.get('li[data-value="FRA"').click();
        cy.get('input[name="confirmedDate"]').type('2020-01-01');
        cy.get('div[data-testid="symptomsStatus"]').click();
        cy.get('li[data-value="Symptomatic"').click();
        cy.contains('fever');
        cy.contains('cough');
        cy.contains('anxiety');
        cy.contains('apnea');
        cy.contains('arthritis');
        cy.get('span:contains("fever")').click();
        cy.get('span:contains("anxiety")').click();
        cy.contains('Gym');
        cy.contains('Hospital');
        cy.contains('Airplane');
        cy.contains('Factory');
        cy.contains('Hotel');
        cy.get('span:contains("Gym")').click();
        cy.get('span:contains("Hospital")').click();

        cy.intercept('POST', '/api/cases?num_cases=1').as('addCase');
        cy.get('button[data-testid="submit"]').click();
        cy.wait('@addCase');
        cy.request({ method: 'GET', url: '/api/cases' }).then((resp) => {
            const casesLength = resp.body.cases.length;
            cy.contains(`Case ${resp.body.cases[casesLength - 1]._id} added`);
            cy.visit(`/cases/view/${resp.body.cases[casesLength - 1]._id}`);
            cy.contains('Horse trainer');
            cy.contains('Actor').should('not.exist');
            cy.contains('fever');
            cy.contains('anxiety');
            cy.contains('cough').should('not.exist');
            cy.contains('Gym');
            cy.contains('Hospital');
            cy.contains('Factory').should('not.exist');
        });
    });

    it('Does not add row on submission error', function () {
        cy.addSource('Test source', 'www.example.com');
        cy.visit('/');
        cy.visit('/cases');
        cy.contains('No records to display');

        cy.visit('/');
        cy.wait('@getProfile');

        cy.visit('/cases/new');
        cy.get('div[data-testid="caseStatus"]').click();
        cy.get('li[data-value="confirmed"]').click();
        cy.get('div[data-testid="caseReference"]').type('www.example.com');
        cy.contains('www.example.com').click();
        cy.get('div[data-testid="location.geocodeLocation"]').type('France');
        cy.wait('@geolocationFranceSuggest');
        cy.contains('li', 'France').click();
        cy.get('div[data-testid="location.countryISO3"]').click()
        cy.get('li[data-value="FRA"').click();
        cy.get('input[name="events.dateEntry"]').type('2020-01-01');

        // Force server to return error
        cy.intercept('POST', '/api/cases?num_cases=1', {
            statusCode: 422,
            body: { message: 'nope' },
        }).as('addCase');
        cy.get('button[data-testid="submit"]').click();
        cy.wait('@addCase');
        cy.contains('nope');

        cy.get('button[aria-label="close overlay"').click();
        cy.contains('No records to display');
    });

    it('Can change source URL without changing source name', function () {
        cy.visit('/');
        cy.wait('@getProfile');

        cy.visit('/cases/new');

        cy.get('div[data-testid="caseReference"]').type('www.example.com');
        cy.contains('www.example.com').click();
        cy.get('input[name="caseReference.sourceName"]').type('New source');
        cy.get('div[data-testid="caseReference"]').type('www.example.com2');
        cy.contains('www.example.com2').click();
        cy.get('input[name="caseReference.sourceName"]').should(
            'have.value',
            'New source',
        );
    });

    it('Check for required fields', function () {
        cy.visit('/');
        cy.wait('@getProfile');

        cy.visit('/cases/new');

        cy.get('p:contains("Required")').should('have.length', 4);
    });

    it('Shows checkbox on field completion', function () {
        cy.visit('/');
        cy.wait('@getProfile');

        cy.visit('/cases/new');
        cy.get('svg[data-testid="check-icon"]').should('not.exist');
        cy.get('div[data-testid="demographics.gender"]').click();
        cy.get('li[data-value="female"]').click();
        cy.get('svg[data-testid="check-icon"]').should('exist');
    });

    it('Shows error icon on field submission error', function () {
        cy.visit('/');
        cy.wait('@getProfile');

        cy.visit('/cases/new');
        cy.get('svg[data-testid="error-icon"]').should('not.exist');
        cy.get('svg[data-testid="check-icon"]').should('not.exist');

        cy.get('#scroll-container').scrollTo('bottom');

        cy.get('button[data-testid="submit"]').click();
        cy.get('svg[data-testid="error-icon"]').should('exist');
        cy.get('svg[data-testid="check-icon"]').should('not.exist');
    });

    it('Can specify geocode manually', function () {
        cy.addSource('Test source', 'www.example.com');

        cy.visit('/');
        cy.wait('@getProfile');

        cy.visit('/cases/new');
        cy.contains(`Create new ${Cypress.env('DISEASE_NAME')} line list case`);
        cy.get('div[data-testid="caseStatus"]').click();
        cy.get('li[data-value="confirmed"]').click();
        cy.get('div[data-testid="caseReference"]').type('www.example.com');
        cy.contains('www.example.com').click();
        cy.get('button[id="add-location"]').click();
        cy.get('input[name="location.country"]').type('France');
        cy.get('div[data-testid="location.countryISO3"]').click()
        cy.get('li[data-value="FRA"').click();
        cy.get('input[name="events.dateEntry"]').type('2020-01-01');

        cy.intercept('POST', '/api/cases?num_cases=1').as('addCase');
        cy.get('button[data-testid="submit"]').click();
        cy.wait('@addCase');

        cy.url().should('eq', 'http://localhost:3002/cases');
        cy.contains('No records to display').should('not.exist');
        cy.contains('www.example.com');
        cy.contains('France');
        cy.contains('2020-01-01');
    });
});
