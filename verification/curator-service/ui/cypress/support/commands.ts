import 'cypress-file-upload';
import countries from 'i18n-iso-countries';
import en from 'i18n-iso-countries/langs/en.json';

countries.registerLocale(en);

export enum Outcome {
    Recovered = 'recovered',
    Death = 'death',
}

export enum YesNo {
    Y = 'Y',
    N = 'N',
    NA = 'NA',
}

export enum Gender {
    Male = 'male',
    Female = 'female',
    Other = 'other',
}

export enum CaseStatus {
    Confirmed = 'confirmed',
    Suspected = 'suspected',
    Discarded = 'discarded',
    OmitError = 'omit_error',
}

interface AddCaseProps {
    caseStatus: CaseStatus;
    country: string;
    countryISO2: string;
    dateEntry: string;
    dateConfirmation?: string;
    confirmationMethod?: string;
    occupation?: string;
    symptoms?: string;
    sourceUrl?: string;
    gender?: Gender;
    outcome?: Outcome;
    uploadIds?: string[];
}

declare global {
    // One-off Cypress setup.
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            addCase: (opts: AddCaseProps) => void;
            login: (opts?: {
                name: string;
                email: string;
                roles: string[];
                removeGoogleID?: boolean;
            }) => void;
            addSource: (
                name: string,
                url: string,
                providerName?: string,
                providerWebsiteUrl?: string,
                countryCodes?: string[],
                uploads?: [],
            ) => void;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            seedLocation: (loc: any) => void;
            clearSeededLocations: () => void;
        }
    }
}

export function addCase(opts: AddCaseProps): void {
    cy.request({
        method: 'POST',
        url: '/api/cases',
        body: {
            caseStatus: opts.caseStatus,
            pathogen: 'COVID-19',
            caseReference: {
                sourceId: '5ef8e943dfe6e00030892d58',
                sourceUrl: opts.sourceUrl || 'www.example.com',
                uploadIds: opts.uploadIds,
            },
            demographics: {
                occupation: opts.occupation,
                gender: opts.gender,
            },
            location: {
                country: opts.country,
                countryISO2: opts.countryISO2,
                query: opts.country,
                geoResolution: 'Country',
                name: opts.country,
            },
            events: {
                dateEntry: opts.dateEntry,
                dateConfirmation: opts.dateConfirmation,
                confirmationMethod: opts.confirmationMethod,
                outcome: opts.outcome,
            },
            symptoms: opts.symptoms,
            preexistingConditions: {},
            transmission: {},
            travelHistory: {},
            genomeSequences: {},
            vaccination: {},
        },
    });
}

export function login(opts?: {
    name: string;
    email: string;
    roles: string[];
    removeGoogleID: boolean;
}): void {
    cy.request({
        method: 'POST',
        url: '/auth/register',
        body: {
            name: opts?.name ?? 'superuser',
            email: opts?.email ?? 'superuser@test.com',
            roles: opts?.roles ?? ['admin', 'curator'],
            removeGoogleID: opts?.removeGoogleID ?? undefined,
        },
    });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function seedLocation(loc: any): void {
    cy.request({
        method: 'POST',
        url: '/api/geocode/seed',
        body: loc,
    });
}

export function clearSeededLocations(): void {
    cy.request({
        method: 'POST',
        url: '/api/geocode/clear',
    });
}

export function addSource(
    name: string,
    url: string,
    providerName?: string,
    providerWebsiteUrl?: string,
    countryCodes?: string[],
    uploads?: [],
): void {
    cy.request({
        method: 'POST',
        url: '/api/sources',
        body: {
            name: name,
            countryCodes: countryCodes ?? ['ZZ'],
            origin: {
                url: url,
                license: 'MIT',
                providerName: providerName ?? 'Example',
                providerWebsiteUrl: providerWebsiteUrl ?? 'www.example.com',
            },
            uploads: uploads ?? [],
            format: 'JSON',
        },
    });
}

Cypress.on('uncaught:exception', (err, runnable) => {
    // returning false here prevents Cypress from failing the test
    return false;
});

Cypress.Commands.add('addCase', addCase);
Cypress.Commands.add('login', login);
Cypress.Commands.add('addSource', addSource);
Cypress.Commands.add('seedLocation', seedLocation);
Cypress.Commands.add('clearSeededLocations', clearSeededLocations);
