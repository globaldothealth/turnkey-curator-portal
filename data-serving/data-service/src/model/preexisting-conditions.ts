import mongoose from 'mongoose';
import { YesNo } from './day0-case';

export const preexistingConditionsSchema = new mongoose.Schema(
    {
        previousInfection: {
            type: String,
            enum: YesNo,
        },
        coInfection: String,
        preexistingCondition: String,
        pregnancyStatus: {
            type: String,
            enum: YesNo,
        },
    },
    { _id: false },
);

export type PreexistingConditionsDocument = mongoose.Document & {
    previousInfection: YesNo;
    coInfection: string;
    preexistingCondition: string;
    pregnancyStatus: YesNo;
};
