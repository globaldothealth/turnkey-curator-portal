import validateEnv from '../util/validate-env';

const env = validateEnv();

export enum SortBy {
    Default = 'default',
    ConfirmationDate = 'confirmationDate',
    Country = 'country',
    Admin1 = 'admin1',
    Admin2 = 'admin2',
    Admin3 = 'admin3',
    Location = 'location',
    Age = 'age',
    Occupation = 'occupation',
    Outcome = 'outcome',
    Identifier = '_id',
}

export enum SortByOrder {
    Ascending = 'ascending',
    Descending = 'descending',
}

interface IFilterLabels {
    [id: string]: string;
}

export const FilterLabels: IFilterLabels = {
    caseId: 'Case ID',
    country: 'Country',
    dateConfirmedFrom: 'Date confirmed from',
    dateConfirmedTo: 'Date confirmed to',
    dateModifiedFrom: 'Date modified from',
    dateModifiedTo: 'Date modified to',
    gender: 'Gender',
    lastModifiedBy: 'Last modified by',
    location: 'Location',
    occupation: 'Occupation',
    outcome: 'Outcome',
    place: 'Place',
};

interface IMapLink {
    [id: string]: string;
}

// Link to the map application based on current env
/*
 * Note that the initial state of the app is disease name = '',
 * env = 'prod' (see ../redux/app/slice.ts) and components
 * that use this lookup table can see that if they mount
 * before the selector has returned. They will soon update
 * to show the correct URL, but to avoid a crash we will
 * supply that value for the map link here.
 */
export const MapLink: IMapLink = {
    local: 'https://map.mpox-2024.global.health/',
    locale2e: 'https://map.mpox-2024.global.health/',
    dev: 'https://map.mpox-2024.global.health/',
    qa: 'https://map.mpox-2024.global.health/',
    prod: 'https://map.mpox-2024.global.health/',
};
