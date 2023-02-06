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
            minLength: 2,
            maxLength: 2,
        },
        // Location represents a precise location, such as an establishment or POI.
        location: String,
        city: String,
        query: String,
    },
    { _id: false },
);

export type LocationDocument = mongoose.Document & {
    country: string;
    countryISO3: string;
    location?: string;
    city?: string;
    query?: string;
};
