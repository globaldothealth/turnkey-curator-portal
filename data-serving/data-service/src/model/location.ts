import mongoose from 'mongoose';

export const locationSchema = new mongoose.Schema(
    {
        country: {
            type: String,
            required: true,
        },
        countryISO3: {
            type: String,
            required: true,
            minLength: 3,
            maxLength: 3,
        },
        geoResolution: String,
        // Location represents a precise location, such as an establishment or POI.
        location: String,
        admin1: String,
        admin2: String,
        admin3: String,
        query: String,
        name: String,
        geometry: {
            latitude: Number,
            longitude: Number,
        },
        comment: String,
    },
    { _id: false },
);

export type LocationDocument = mongoose.Document & {
    country: string;
    countryISO3: string;
    geoResolution: string;
    location?: string;
    admin1?: string;
    admin2?: string;
    admin3?: string;
    query?: string;
    name?: string;
    geometry?: {
        latitude?: number;
        longitude?: number;
    };
    comment?: string;
};
