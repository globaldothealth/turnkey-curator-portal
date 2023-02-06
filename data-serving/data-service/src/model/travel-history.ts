import { YesNo } from './day0-case';

import mongoose from 'mongoose';

export const travelHistorySchema = new mongoose.Schema(
    {
        travelHistory: {
            type: String,
            enum: YesNo,
        },
        travelHistoryEntry: Date,
        travelHistoryStart: String,
        travelHistoryLocation: String,
        travelHistoryCountry: String,
    },
    { _id: false },
);

export type TravelHistoryDocument = mongoose.Document & {
    travelHistory: YesNo;
    travelHistoryEntry: Date;
    travelHistoryStart: string;
    travelHistoryLocation: string;
    travelHistoryCountry: string;
};
