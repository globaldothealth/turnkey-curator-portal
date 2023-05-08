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
        city: String,
        query: String,
        name: String,
        geometry: {
            latitude: Number,
            longitude: Number,
        },
    },
    { _id: false },
);

export type LocationDocument = mongoose.Document & {
    country: string;
    countryISO3: string;
    geoResolution: string;
    location?: string;
    city?: string;
    query?: string;
    name?: string;
    geometry?: {
        latitude?: number;
        longitude?: number;
    };
};
