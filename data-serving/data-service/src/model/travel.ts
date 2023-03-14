import { DateRangeDocument, dateRangeSchema } from './date-range';

import mongoose from 'mongoose';

export const travelSchema = new mongoose.Schema(
    {
        dateRange: dateRangeSchema,

        methods: [String],
        purpose: String,
    },
    { _id: false },
);

export type TravelDocument = mongoose.Document & {
    dateRange: DateRangeDocument;
    methods: [string];
    purpose: string;
};
