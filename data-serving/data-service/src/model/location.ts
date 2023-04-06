import mongoose from 'mongoose';

export const locationSchema = new mongoose.Schema(
    {
        country: {
            type: String,
            required: true,
        },
        countryISO2: {
            type: String,
            required: true,
            minLength: 2,
            maxLength: 2,
        },
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
    countryISO2: string;
    location?: string;
    city?: string;
    query?: string;
    name?: string;
    geometry?: {
        latitude?: number;
        longitude?: number;
    };
};
