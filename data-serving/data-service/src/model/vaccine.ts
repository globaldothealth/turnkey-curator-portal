import mongoose from 'mongoose';
import { YesNo } from './day0-case';

export const vaccineSchema = new mongoose.Schema(
    {
        vaccination: {
            type: String,
            enum: YesNo,
        },
        vaccineName: String,
        vaccineDate: Date,
        vaccineSideEffects: String,
    },
    { _id: false },
);

export type VaccineDocument = mongoose.Document & {
    vaccination: YesNo;
    vaccineName: string;
    vaccineDate: Date;
    vaccineSideEffects: string;
};
