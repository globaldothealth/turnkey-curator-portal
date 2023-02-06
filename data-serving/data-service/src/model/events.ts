import mongoose from 'mongoose';
import { YesNo } from './day0-case';

export enum HospitalizationReason {
    Monitoring = 'monitoring',
    Treatment = 'treatment',
    Unknown = 'unknown',
}

export enum Outcome {
    Recovered = 'recovered',
    Death = 'death',
}

export const EventsSchema = new mongoose.Schema(
    {
        dateEntry: {
            type: Date,
            required: true,
        },
        dateLastModified: Date,
        dateOnset: Date,
        dateConfirmation: Date,
        confirmationMethod: String,
        dateOfFirstConsult: Date,
        hospitalized: {
            type: String,
            enum: YesNo,
        },
        reasonForHospitalization: {
            type: String,
            enum: HospitalizationReason,
        },
        dateHospitalization: Date,
        dateDischargeHospital: Date,
        intensiveCare: {
            type: String,
            enum: YesNo,
        },
        dateAdmissionICU: Date,
        dateDischargeICU: Date,
        homeMonitoring: {
            type: String,
            enum: YesNo,
        },
        isolated: {
            type: String,
            enum: YesNo,
        },
        dateIsolation: Date,
        outcome: {
            type: String,
            enum: Outcome,
        },
        dateDeath: Date,
        dateRecovered: Date,
    },
    { _id: false },
);

export type EventsDocument = mongoose.Document & {
    dateEntry: Date;
    dateLastModified?: Date;
    dateOnset?: Date;
    dateConfirmation?: Date;
    confirmationMethod?: string;
    dateOfFirstConsult?: Date;
    hospitalized?: YesNo;
    reasonForHospitalization?: HospitalizationReason;
    dateHospitalization?: Date;
    dateDischargeHospital?: Date;
    intensiveCare?: YesNo;
    dateAdmissionICU?: Date;
    dateDischargeICU?: Date;
    homeMonitoring?: YesNo;
    isolated?: YesNo;
    dateIsolation?: Date;
    outcome?: Outcome;
    dateDeath?: Date;
    dateRecovered?: Date;
};
