// A single result from a Geocoder.
export interface GeocodeResult {
    geometry: {
        latitude: number;
        longitude: number;
    };
    country: string;
    // First administrative division (state in the US, Länder in Germany, ...).
    administrativeAreaLevel1?: string;
    // Second administrative division (county in the US, departments in France, ...).
    administrativeAreaLevel2?: string;
    // Third administrative division (cities usually).
    administrativeAreaLevel3?: string;
    // Area in admin1 resolution.
    admin1: string | undefined;
    // Area in admin2 resolution.
    admin2: string | undefined;
    // Area in admin3 resolution.
    admin3: string | undefined;
    // Human-readable place name.
    name: string;
    // How granular the geocode is.
    geoResolution: Resolution;
}

/** Resolution defines how granular a location is. */
export enum Resolution {
    Point = 'Point',
    Admin3 = 'Admin3',
    Admin2 = 'Admin2',
    Admin1 = 'Admin1',
    Country = 'Country',
}

export interface GeocodeOptions {
    // If set, will only return features with the given resolutions.
    // Otherwise all available resolutions can be returned.
    limitToResolution?: Resolution[];
    limitToCountry?: string[];
}

// A geocoder can geocode queries into places.
export interface Geocoder {
    geocode(query: string, opts?: GeocodeOptions): Promise<GeocodeResult[]>;
}
