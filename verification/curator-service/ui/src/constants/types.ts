export enum SortBy {
    Default = 'default',
    ConfirmationDate = 'confirmationDate',
    Country = 'country',
    City = 'city',
    Location = 'location',
    Age = 'age',
    Occupation = 'occupation',
    Outcome = 'outcome',
}

export enum SortByOrder {
    Ascending = 'ascending',
    Descending = 'descending',
}

interface IMapLink {
    [id: string]: string;
}

interface IOutbreakEnvironments {
    [id: string]: IMapLink;
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
export const MapLink: IOutbreakEnvironments = {
    'COVID-19': {
        local: 'http://dev-map.covid-19.global.health/',
        locale2e: 'http://dev-map.covid-19.global.health/',
        dev: 'http://dev-map.covid-19.global.health/',
        qa: 'http://qa-map.covid-19.global.health',
        prod: 'https://map.covid-19.global.health/',
    },
    '': {
        prod: 'https://map.covid-19.global.health/',
    },
};
