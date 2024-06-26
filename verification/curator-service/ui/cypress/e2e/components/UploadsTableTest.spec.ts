import { CaseStatus } from '../../support/commands';

/* eslint-disable no-undef */
describe('Uploads table', function () {
    beforeEach(() => {
        cy.login();
        cy.task('clearSourcesDB', {});
    });

    it('displays uploads properly', function () {
        cy.addSource(
            'New source',
            'www.example.com',
            true,
            'Example',
            'www.example.com',
            ['IN'],
            [
                {
                    _id: '5ef8e943dfe6e00030892d58',
                    status: 'IN_PROGRESS',
                    summary: { numCreated: 5, numUpdated: 3 },
                    created: '2020-01-01',
                },
                {
                    _id: '5ef8e943dfe6e00030892d59',
                    status: 'SUCCESS',
                    summary: { numCreated: 2 },
                    created: '2020-01-02',
                },
                {
                    _id: '5ef8e943dfe6e00030892d60',
                    status: 'SUCCESS',
                    summary: { numUpdated: 4, numError: 1 },
                    created: '2020-01-03',
                },
                {
                    _id: '5ef8e943dfe6e00030892d61',
                    status: 'SUCCESS',
                    summary: { numCreated: 0, numUpdated: 0 },
                    created: '2020-01-04',
                },
            ],
        );
        cy.visit('/');
        cy.contains('Uploads').click();
        cy.contains('www.example.com');
        cy.get('td[value="New source"]').should('have.length', 4);
        cy.contains('5ef8e943dfe6e00030892d58');
        cy.contains('2020-01-01');
        cy.contains('IN_PROGRESS');
        cy.contains('5');
        cy.contains('3');
        cy.contains('5ef8e943dfe6e00030892d59');
        cy.contains('2020-01-02');
        cy.get('td[value="SUCCESS"]').should('have.length', 3);
        cy.contains('2');
        cy.get('td[value=0]').should('have.length', 7);
        cy.contains('5ef8e943dfe6e00030892d60');
        cy.contains('2020-01-03');
        cy.contains('4');
        cy.contains('1');
        cy.contains('5ef8e943dfe6e00030892d61');
        cy.contains('2020-01-04');
    });

    // @TBD: do we need filtering by upload ids
    it.skip('can navigate to filtered linelist', function () {
        cy.task('clearCasesDB', {});

        cy.addCase({
            uploadIds: ['5ef8e943dfe6e00030892d58'],
            country: 'France',
            countryISO3: 'FRA',
            caseStatus: CaseStatus.Confirmed,
            dateEntry: '2020-05-05',
            dateReported: '2020-05-01',
        });
        cy.addCase({
            uploadIds: ['5ef8e943dfe6e00030892d58', '5ef8e943dfe6e00030892d59'],
            country: 'United States',
            countryISO3: 'USA',
            caseStatus: CaseStatus.Confirmed,
            dateEntry: '2020-05-05',
            dateReported: '2020-05-01',
        });
        cy.addCase({
            uploadIds: ['5ef8e943dfe6e00030892d59'],
            country: 'United Kingdom',
            countryISO3: 'GBR',
            caseStatus: CaseStatus.Confirmed,
            dateEntry: '2020-05-05',
            dateReported: '2020-05-01',
        });
        cy.addCase({
            uploadIds: ['5ef8e943dfe6e00030892d60'],
            country: 'Germany',
            countryISO3: 'DEU',
            caseStatus: CaseStatus.Confirmed,
            dateEntry: '2020-05-05',
            dateReported: '2020-05-01',
        });
        cy.addSource(
            'New source',
            'www.example.com',
            true,
            'Example',
            'www.example.com',
            ['IN'],
            [
                {
                    _id: '5ef8e943dfe6e00030892d58',
                    status: 'IN_PROGRESS',
                    summary: { numCreated: 5, numUpdated: 3 },
                    created: '2020-01-01',
                },
                {
                    _id: '5ef8e943dfe6e00030892d59',
                    status: 'SUCCESS',
                    summary: { numCreated: 2 },
                    created: '2020-01-02',
                },
            ],
        );
        cy.visit('/');
        cy.contains('Uploads').click();
        cy.contains(
            'a[href="/cases?uploadid=5ef8e943dfe6e00030892d58"]',
            '5',
        ).click();
        cy.url().should(
            'eq',
            'http://localhost:3002/cases?uploadid=5ef8e943dfe6e00030892d58',
        );
        cy.contains('Filter').click();
        cy.get('input[id="uploadid"]').should(
            'have.value',
            '5ef8e943dfe6e00030892d58',
        );
        cy.get('body').trigger('keydown', { key: 'Escape' });

        cy.contains('France');
        cy.contains('United States');
        cy.contains('United Kingdom').should('not.exist');
        cy.contains('Germany').should('not.exist');

        cy.get('div[role="button"]').contains('Uploads').click();

        cy.contains(
            'a[href="/cases?uploadid=5ef8e943dfe6e00030892d59"]',
            '2',
        ).click();
        cy.url().should(
            'eq',
            'http://localhost:3002/cases?uploadid=5ef8e943dfe6e00030892d59',
        );
        cy.contains('Filter').click();
        cy.get('input[id="uploadid"]').should(
            'have.value',
            '5ef8e943dfe6e00030892d59',
        );
        cy.get('body').trigger('keydown', { key: 'Escape' });

        cy.contains('France').should('not.exist');
        cy.contains('United States');
        cy.contains('United Kingdom');
        cy.contains('Germany').should('not.exist');

        cy.contains('Line list').click({ force: true });
        cy.contains('Filter').click();
        cy.get('input[id="uploadid"]').should('have.value', '');
        cy.get('body').trigger('keydown', { key: 'Escape' });

        cy.contains('France');
        cy.contains('United States');
        cy.contains('United Kingdom');
        cy.contains('Germany');
    });
});
