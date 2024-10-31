/* eslint-disable no-undef */
import { YesNo } from '../../support/commands';

describe('Curator', function () {
    beforeEach(() => {
        cy.task('clearCasesDB', {});
        cy.login();
    });

    afterEach(() => {
        cy.clearSeededLocations();
    });

    it('Can Create, edit and view a full case', function () {
        cy.intercept('GET', '/api/geocode/suggest?q=Spain', {
            fixture: 'geolocation_spain_suggest.json',
        }).as('geolocationSpainSuggest');

        cy.intercept('GET', '/api/geocode/suggest?q=France', {
            fixture: 'geolocation_france_suggest.json',
        }).as('geolocationFranceSuggest');

        cy.visit('/');
        cy.visit('/cases');
        cy.contains('No records to display');
        cy.seedLocation({
            country: 'FR',
            geometry: { latitude: 45.75889, longitude: 4.84139 },
            name: 'France',
            geoResolution: 'Country',
        });
        cy.seedLocation({
            country: 'DE',
            geometry: { latitude: 51.0968509, longitude: 5.9688274 },
            name: 'Germany',
            geoResolution: 'Country',
        });
        cy.seedLocation({
            country: 'GB',
            geometry: { latitude: 54.2316104, longitude: -13.4274035 },
            name: 'United Kingdom',
            geoResolution: 'Country',
        });

        const sidebar = cy.get(
            'div[data-testid="sidebar"] .MuiDrawer-paperAnchorDockedLeft',
        );
        sidebar.then((sidebar) => {
            if (sidebar.css('visibility') == 'hidden') {
                cy.get('button[aria-label="toggle drawer"]').click();
            }
        });

        // Input full case.
        cy.get('button[data-testid="create-new-button"]').click();
        cy.contains('li', 'New line list case').click();

        // GENERAL
        cy.get('div[data-testid="caseStatus"]').click();
        cy.get('li[data-value="confirmed"').click();
        cy.get('div[data-testid="comment"]').type(
            'This case should be consulted with Supervisor.',
        );

        // DATA SOURCE
        cy.get('div[data-testid="caseReference"]').type('www.example.com');
        cy.contains('www.example.com').click();
        cy.get('input[name="caseReference.isGovernmentSource"]').click();
        cy.get('button[data-testid="add-additional-source"]').click();
        cy.get('div[data-testid="additional-source-0"]').type(
            'www.example2.com',
        );
        cy.get('button[data-testid="add-additional-source"]').click();
        cy.get('div[data-testid="additional-source-1"]').type(
            'www.example3.com',
        );
        cy.get('span[data-testid="government-source-1"]').click();

        // LOCATION
        cy.get('div[data-testid="location.geocodeLocation"]').type('France', {
            delay: 0,
        });
        cy.wait('@geolocationFranceSuggest');
        cy.contains('France').click();
        /* Change France to something else to check we can edit geocode results.
         * We need to change it to a valid country so that we can find the ISO code!
         */
        cy.get('div[data-testid="location.country"]').click();
        cy.get('input[name="location.country"]').clear().type('Germany');
        cy.get('p').contains('Germany').click();
        cy.get('input[name="location.admin1"]').type('Berlin');
        cy.get('p').contains('Berlin').click();
        cy.get('input[name="location.admin2"]').type('SK Berlin');
        cy.get('p').contains('SK Berlin').click();
        cy.get('input[name="location.admin3"]').type('Berlin');
        cy.get('p').contains('Berlin').click();
        cy.get('div[data-testid="location.comment"]').type(
            'Martin Luther Hospital',
        );

        // EVENTS
        cy.get('input[name="events.dateEntry"]').type('2020-01-01');
        cy.get('input[name="events.dateReported"]').type('2020-01-01');
        cy.get('input[name="events.dateConfirmation"]').type('2020-01-02');
        cy.get('input[name="events.confirmationMethod').type('PCR test');
        cy.get('input[name="events.dateOnset"]').type('2020-01-03');
        cy.get('input[name="events.dateOfFirstConsult"]').type('2020-01-04');
        cy.get('div[data-testid="events.homeMonitoring"').click();
        cy.get(`li[data-value="${YesNo.Y}"]`).click();
        cy.get('div[data-testid="events.isolated"]').click();
        cy.get(`li[data-value="${YesNo.Y}"]`).click();
        cy.get('input[name="events.dateIsolation"]').type('2020-01-05');
        cy.get('div[data-testid="events.hospitalized"]').click();
        cy.get(`li[data-value="${YesNo.Y}"]`).click();
        cy.get('input[name="events.dateHospitalization"]').type('2020-01-06');
        cy.get('input[name="events.dateDischargeHospital"]').type('2020-01-07');
        cy.get('div[data-testid="events.intensiveCare"]').click();
        cy.get(`li[data-value="${YesNo.Y}"]`).click();
        cy.get('input[name="events.dateAdmissionICU"]').type('2020-01-08');
        cy.get('input[name="events.dateDischargeICU"]').type('2020-01-09');
        cy.get('div[data-testid="events.outcome"]').click();
        cy.get('li[data-value="recovered"').click();
        cy.get('input[name="events.dateRecovered"]').type('2020-03-01');

        // DEMOGRAPHICS
        cy.get('div[data-testid="demographics.gender"]').click();
        cy.get('li[data-value="female"').click();
        // TODO UI for age entry needs redesign
        cy.get('div[data-testid="occupation"]').click();
        cy.contains('li', 'Accountant').click();
        cy.get('div[data-testid="demographics.healthcareWorker"]').click();
        cy.get(`li[data-value="${YesNo.N}"]`).click();

        // SYMPTOMS
        cy.get('div[data-testid="symptoms"]').type('dry cough');
        cy.contains('li', 'dry cough').click();
        cy.get('div[data-testid="symptoms"]').type('mild fever');
        cy.contains('li', 'mild fever').click();

        // PREEXISTING CONDITIONS
        cy.get(
            'div[data-testid="preexistingConditions.previousInfection"]',
        ).click();
        cy.get(`li[data-value="${YesNo.Y}"]`).click();
        cy.get('input[name="preexistingConditions.coInfection"]').type('Flu');
        cy.get('div[data-testid="preexistingConditionsHelper"]').type(
            'ABCD syndrome',
        );
        cy.contains('li', 'ABCD syndrome').click();
        cy.get('div[data-testid="preexistingConditionsHelper"]').type(
            'ADULT syndrome',
        );
        cy.contains('li', 'ADULT syndrome').click();
        cy.get(
            'div[data-testid="preexistingConditions.pregnancyStatus"]',
        ).click();
        cy.get(`li[data-value="${YesNo.N}"]`).click();

        // TRANSMISSION
        cy.get('div[data-testid="transmission.contactWithCase"]').click();
        cy.get(`li[data-value="${YesNo.Y}"]`).click();
        cy.get('input[name="transmission.contactId"]').type('ABC123');
        cy.get('input[name="transmission.contactSetting"]').type(
            'test setting',
        );
        cy.get('input[name="transmission.contactAnimal"]').type('Bat');
        cy.get('input[name="transmission.contactComment"]').type(
            'test comment',
        );
        cy.get('div[data-testid="transmissionHelper"]').click();
        cy.contains('Direct contact').click();

        // TRAVEL HISTORY
        cy.get('div[data-testid="travelHistory.travelHistory"]').click();
        cy.get(`li[data-value="${YesNo.Y}"]`).click();
        cy.get('input[name="travelHistory.travelHistoryEntry"]').type(
            '2020-02-01',
        );
        cy.get('input[name="travelHistory.travelHistoryStart"]').type(
            'test start',
        );
        cy.get('input[name="travelHistory.travelHistoryLocation"]').type(
            'Warsaw',
        );
        cy.get('input[name="travelHistory.travelHistoryCountry"]').type(
            'Poland',
        );

        // GENOME SEQUENCES
        cy.get('input[name="genomeSequences.genomicsMetadata"]').type(
            'test metadata',
        );
        cy.get('input[name="genomeSequences.accessionNumber"]').type(
            'test accession number',
        );

        // VACCINES
        cy.get('div[data-testid="vaccination.vaccination"]').click();
        cy.get(`li[data-value="${YesNo.Y}"]`).click();
        cy.get('input[name="vaccination.vaccineName"]').type('Moderna');
        cy.get('input[name="vaccination.vaccineDate"]').type('2020-03-01');
        cy.get('div[data-testid="vaccineSideEffects"]').click();
        cy.contains('acute pain').click();

        cy.intercept('POST', '/api/cases?num_cases=1').as('addCase');

        cy.get('button[data-testid="submit"]').click();
        cy.wait('@addCase');

        // Check that linelist has everything.
        cy.request({ method: 'GET', url: '/api/cases' }).then((resp) => {
            expect(resp.body.cases).to.have.lengthOf(1);
            cy.contains(`Case ${resp.body.cases[0]._id} added`);
            cy.contains('No records to display').should('not.exist');
            cy.contains('www.example.com');
            cy.contains('female');
            // TODO UI for demographics.age needs redesigning
            cy.contains('Germany');
            cy.contains('2020-01-01');
            cy.contains('recovered');

            cy.intercept('GET', `/api/cases/${resp.body.cases[0]._id}`).as(
                'fetchCaseDetails',
            );

            // View the case from the message bar.
            cy.get('button[data-testid="view-case-btn"').click({ force: true });
            cy.wait('@fetchCaseDetails');

            cy.contains(/Case details\b/);

            // Edit the case.
            cy.get('button').contains(/EDIT/i).click();

            // Everything should be there.
            // Source.
            cy.get('div[data-testid="caseReference"]').within(() => {
                cy.get('input[type="text"]').should(
                    'have.value',
                    'www.example.com',
                );
            });
            cy.get('div[data-testid="additional-source-0"]').within(() => {
                cy.get('input[type="text"]').should(
                    'have.value',
                    'www.example2.com',
                );
            });
            cy.get('div[data-testid="additional-source-1"]').within(() => {
                cy.get('input[type="text"]').should(
                    'have.value',
                    'www.example3.com',
                );
            });

            // Demographics.
            cy.get('input[name="demographics.gender"]').should(
                'have.value',
                'female',
            );
            // TODO UI for demographics.age needs redesign
            cy.get('div[data-testid="occupation"]').within(() => {
                cy.get('input[type="text"]').should('have.value', 'Accountant');
            });

            // Location.
            cy.get('input[name="location.country"]').should(
                'have.value',
                'Germany',
            );
            cy.get('input[name="location.admin1"]').should(
                'have.value',
                'Berlin',
            );
            cy.get('input[name="location.admin2"]').should(
                'have.value',
                'SK Berlin',
            );
            cy.get('input[name="location.admin3"]').should(
                'have.value',
                'Berlin',
            );
            cy.get('input[value="Martin Luther Hospital"]').should('exist');

            // Events.
            cy.get('input[name="events.dateEntry"]').should(
                'have.value',
                '2020/01/01',
            );
            cy.get('input[name="events.dateReported"]').should(
                'have.value',
                '2020/01/01',
            );
            cy.get('input[name="events.dateConfirmation"]').should(
                'have.value',
                '2020/01/02',
            );
            cy.get('input[name="events.confirmationMethod"]').should(
                'have.value',
                'PCR test',
            );
            cy.get('input[name="events.dateOnset"]').should(
                'have.value',
                '2020/01/03',
            );
            cy.get('input[name="events.dateOfFirstConsult"]').should(
                'have.value',
                '2020/01/04',
            );
            cy.get('input[name="events.homeMonitoring"]').should(
                'have.value',
                YesNo.Y,
            );
            cy.get('input[name="events.isolated"]').should(
                'have.value',
                YesNo.Y,
            );
            cy.get('input[name="events.dateIsolation"]').should(
                'have.value',
                '2020/01/05',
            );
            cy.get('input[name="events.hospitalized"]').should(
                'have.value',
                YesNo.Y,
            );
            cy.get('input[name="events.dateHospitalization"]').should(
                'have.value',
                '2020/01/06',
            );
            cy.get('input[name="events.dateDischargeHospital"]').should(
                'have.value',
                '2020/01/07',
            );
            cy.get('input[name="events.intensiveCare"]').should(
                'have.value',
                YesNo.Y,
            );
            cy.get('input[name="events.dateAdmissionICU"]').should(
                'have.value',
                '2020/01/08',
            );
            cy.get('input[name="events.dateDischargeICU"]').should(
                'have.value',
                '2020/01/09',
            );
            cy.get('input[name="events.outcome"]').should(
                'have.value',
                'recovered',
            );
            cy.get('input[name="events.dateRecovered"]').should(
                'have.value',
                '2020/03/01',
            );

            // Symptoms.
            cy.contains('dry cough');
            cy.contains('mild fever');

            // Preconditions.
            cy.get(
                'input[name="preexistingConditions.previousInfection"]',
            ).should('have.value', YesNo.Y);
            cy.get('input[name="preexistingConditions.coInfection"]').should(
                'have.value',
                'Flu',
            );
            cy.contains('ABCD syndrome');
            cy.contains('ADULT syndrome');
            cy.get(
                'input[name="preexistingConditions.pregnancyStatus"]',
            ).should('have.value', YesNo.N);

            // Transmission
            cy.get('input[name="transmission.contactWithCase"]').should(
                'have.value',
                YesNo.Y,
            );
            cy.get('input[name="transmission.contactId"]').should(
                'have.value',
                'ABC123',
            );
            cy.get('input[name="transmission.contactSetting"]').should(
                'have.value',
                'test setting',
            );
            cy.get('input[name="transmission.contactAnimal"]').should(
                'have.value',
                'Bat',
            );
            cy.get('input[name="transmission.contactComment"]').should(
                'have.value',
                'test comment',
            );
            cy.get('div[data-testid="transmissionHelper"]').within(() => {
                cy.get('input[type="text"]').should(
                    'have.value',
                    'Direct contact',
                );
            });

            // Travel history.
            cy.get('input[name="travelHistory.travelHistory"]').should(
                'have.value',
                YesNo.Y,
            );
            cy.get('input[name="travelHistory.travelHistoryEntry"]').should(
                'have.value',
                '2020/02/01',
            );
            cy.get('input[name="travelHistory.travelHistoryStart"]').should(
                'have.value',
                'test start',
            );
            cy.get('input[name="travelHistory.travelHistoryLocation"]').should(
                'have.value',
                'Warsaw',
            );
            cy.get('input[name="travelHistory.travelHistoryCountry"]').should(
                'have.value',
                'Poland',
            );

            // Vaccination
            cy.get('input[name="vaccination.vaccination"]').should(
                'have.value',
                YesNo.Y,
            );
            cy.get('input[name="vaccination.vaccineName"]').should(
                'have.value',
                'Moderna',
            );
            cy.get('input[name="vaccination.vaccineDate"]').should(
                'have.value',
                '2020/03/01',
            );
            cy.contains('acute pain');

            // Change a few things.
            cy.get('div[data-testid="demographics.gender"]').click();
            cy.get('li[data-value="male"').click();
            // Check you can submit any value for occupation
            cy.get('div[data-testid="occupation"]').within(() => {
                cy.get('input[type="text"]').clear().type('Test occupation');
            });
            cy.contains('li', 'Test occupation').click();
            cy.get('div[data-testid="location.comment"]').clear();
            cy.contains('li', 'Martin Luther Hospital').click();
            // Submit the changes.
            cy.get('button[data-testid="submit"]').click();

            // Updated info should be there.
            cy.contains(`Case ${resp.body.cases[0]._id} edited`);
            cy.contains(`Case ${resp.body.cases[0]._id} added`).should(
                'not.exist',
            );
            cy.contains('No records to display').should('not.exist');
            cy.contains('male');
            // What's untouched should stay as is.
            // TODO UI for demographics.age needs redesigning
            // View full details about the case
            cy.contains('td', 'www.example.com').click({ force: true });
            // Curator's comment.
            cy.contains('This case should be consulted with Supervisor.');
            // Case data.
            cy.contains('www.example.com (Government Source)');
            cy.contains('www.example2.com');
            cy.contains('www.example3.com (Government Source)');
            // Demographics.
            // TODO UI for demographics.age needs redesigning
            cy.contains('male');
            cy.contains('Test occupation');
            cy.contains('Germany');
            // Events.
            cy.contains('2020-01-01');
            cy.contains('2020-01-02');
            cy.contains('2020-01-03');
            cy.contains('2020-01-04');
            cy.contains('2020-01-05');
            cy.contains('2020-01-06');
            cy.contains('2020-01-07');
            cy.contains('2020-01-08');
            cy.contains('2020-01-09');
            cy.contains('2020-03-01');
            cy.contains('PCR test');
            cy.contains('recovered');
            //  Symptoms.
            cy.contains('dry cough, mild fever');
            // Preexisting conditions.
            cy.contains('Flu');
            cy.contains('ABCD syndrome (AS), ADULT syndrome (AS)');
            // Transmission.
            cy.contains('ABC123');
            cy.contains('test setting');
            cy.contains('Bat');
            cy.contains('test comment');
            cy.contains('Direct contact');
            // Travel history.
            cy.contains('2020-02-01');
            cy.contains('test start');
            cy.contains('Warsaw');
            cy.contains('Poland');
            // Genome sequences.
            cy.contains('test metadata');
            cy.contains('test accession number');
            // Vaccination
            cy.contains('Moderna');
            cy.contains('2020-03-01');
            cy.contains('acute pain');
        });
    });
});
