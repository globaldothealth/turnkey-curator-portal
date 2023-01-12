import { ObjectId } from 'mongodb';
import _ from 'lodash';
import mongoose from 'mongoose';
import { dateFieldInfo } from './date';
import validateEnv from '../util/validate-env';

/*
 * There are separate types for case for data storage (the mongoose document) and
 * for data transfer (CaseDTO). The DTO only has an age range, and is what the cases
 * controller receives and transmits over the network. The mongoose document has both an age
 * range and age buckets, and is what gets written to the database. The end goal is that the
 * mongoose document only has age buckets, and that the cases controller converts between the
 * two so that outside you only see a single age range.
 */

export enum CaseStatus {
    Confirmed = 'confirmed',
    Suspected = 'suspected',
    Discarded = 'discarded',
    OmitError = 'omit_error',
}

export enum Gender {
    Male = 'male',
    Female = 'female',
    Other = 'other',
}

export enum YesNo {
    Y = 'Y',
    N = 'N',
    NA = 'NA',
}

export enum HospitalizationReason {
    Monitoring = 'monitoring',
    Treatment = 'treatment',
    Unknown = 'unknown',
}

export enum Outcome {
    Recovered = 'recovered',
    Death = 'death',
}

export const caseSchema = new mongoose.Schema(
    {
        ID: String,
        Case_status: {
            type: CaseStatus,
            required: true,
        },
        Date_entry: {
            type: Date,
            required: true,
        },
        Date_last_modified: {
            type: Date,
            required: true,
        },
        Source: String,
        Source_II: String,
        Source_III: String,
        Source_IV: String,
        Source_V: String,
        Source_VI: String,
        Source_VII: String,
        Age: String,
        Gender: Gender,
        Occupation: String,
        Healthcare_worker: YesNo,
        Country: {
            type: String,
            required: true,
        },
        Country_ISO3: {
            type: String,
            required: true,
        },
        Location: String,
        City: String,
        Date_onset: Date,
        Date_confirmation: Date,
        Confirmation_method: String,
        Date_of_first_consult: Date,
        Hospitalized: YesNo,
        'Reason for hospitalization': HospitalizationReason,
        Date_hospitalization: Date,
        Date_discharge_hospital: Date,
        Intensive_care: YesNo,
        Date_admission_ICU: Date,
        Date_discharge_ICU: Date,
        Home_monitoring: YesNo,
        Isolated: YesNo,
        Date_isolation: Date,
        Outcome: Outcome,
        Date_death: Date,
        Date_recovered: Date,
        Symptoms: String,
        Previous_infection: YesNo,
        Co_infection: String,
        Pre_existing_condition: String,
        Pregnancy_status: YesNo,
        Contact_with_case: YesNo,
        Contact_ID: String,
        Contact_setting: String,
        Contact_animal: String,
        Contact_comment: String,
        Transmission: String,
        Travel_history: YesNo,
        Travel_history_entry: String,
        Travel_history_start: String,
        Travel_history_location: String,
        Travel_history_country: String,
        Genomics_Metadata: String,
        'Accession Number': String,
        Pathogen: {
            type: String,
            required: true,
        },
        Vaccination: YesNo,
        Vaccine_name: String,
        Vaccine_date: Date,
        Vaccine_side_effects: String,
    },
    {
        toObject: {
            transform: function (__, ret) {
                // TODO: Transform the model layer to the API layer.
                return ret;
            },
        },
        toJSON: {
            transform: function (__, ret) {
                // TODO: Transform the model layer to the API layer.
                return ret;
            },
        },
    },
);

/**
 * Determines if a provided JSON-representation case is equivalent to the
 * document.
 *
 * @remarks
 * This is a _semantic_ equivalence. We intentionally don't check book-keeping
 * data (like revisionMetadata) -- we strictly want to know if the content has
 * changed.
 *
 * @param jsonCase - JSON object representing a case document.
 * @returns Whether or not the provided JSON is equivalent.
 */
// @TODO: Type request Cases.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
caseSchema.methods.equalsJSON = function (jsonCase: any): boolean {
    const thisJson = this.toJSON() as any;
    const other = new Case(jsonCase).toJSON() as any;
    return (
        _.isEqual(thisJson.demographics, other.demographics) &&
        _.isEqual(thisJson.events, other.events) &&
        _.isEqual(thisJson.exclusionData, other.exclusionData) &&
        _.isEqual(thisJson.genomeSequences, other.genomeSequences) &&
        _.isEqual(thisJson.location, other.location) &&
        _.isEqual(thisJson.pathogens, other.pathogens) &&
        _.isEqual(
            thisJson.preexistingConditions,
            other.preexistingConditions,
        ) &&
        _.isEqual(thisJson.symptoms, other.symptoms) &&
        _.isEqual(thisJson.transmission, other.transmission) &&
        _.isEqual(thisJson.travelHistory, other.travelHistory) &&
        _.isEqual(thisJson.vaccines, other.vaccines) &&
        _.isEqual(thisJson.variant, other.variant) &&
        _.isEqual(thisJson.SGTF, other.SGTF)
    );
};

export type ICase = {
    // GENERAL
    Case_status: CaseStatus;
    Date_entry: string | null;
    Date_last_modified: string;

    // SOURCE
    Source: string; // source
    Source_II?: string;
    Source_III?: string;
    Source_IV?: string;
    Source_V?: string;
    Source_VI?: string;
    Source_VII?: string;

    // DEMOGRAPHICS
    Age?: string;
    Gender?: Gender;
    Occupation?: string;
    Healthcare_worker?: YesNo;

    // LOCATION
    Country: string;
    Country_ISO3: string;
    Location?: string;
    City?: string;

    // EVENTS
    Date_onset?: string | null;
    Date_confirmation?: string | null;
    Confirmation_method?: string;
    Date_of_first_consult?: string | null;
    Hospitalized?: YesNo;
    'Reason for hospitalition'?: HospitalizationReason;
    Date_hospitalization?: string | null;
    Date_discharge_hospital?: string | null;
    Intensive_care?: YesNo;
    Date_admission_ICU?: string | null;
    Date_discharge_ICU?: string | null;
    Home_monitoring?: YesNo;
    Isolated?: YesNo;
    Date_isolation?: string | null;
    Outcome?: Outcome;
    Date_death?: string | null;
    Date_recovered?: string | null;

    // SYMPTOPMS
    Symptoms?: string;

    // PRE-EXISTING CONDITIONS
    Previous_infection?: YesNo;
    Co_infection?: string;
    Pre_existing_condition?: string;
    Pregnancy_status?: YesNo;

    // TRANSMISSION
    Contact_with_case?: YesNo;
    Contact_ID?: string;
    Contact_setting?: string;
    Contact_animal?: string;
    Contact_comment?: string;
    Transmission?: string;

    // TRAVEL HISTORY
    Travel_history?: YesNo;
    Travel_history_entry?: string;
    Travel_history_start?: string;
    Travel_history_location?: string;
    Travel_history_country?: string;

    // GENOME SEQUENCES
    Genomics_Metadata?: string;
    'Accession Number'?: string;

    // PATHOGENS
    Pathogen: string;

    // VACCINATION
    Vaccination?: YesNo;
    Vaccine_name?: string;
    Vaccine_date?: string | null;
    Vaccine_side_effects?: string;
};

export type CaseDocument = mongoose.Document &
    ICase & {
        _id: ObjectId;
        // TODO: Type request Cases.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        equalsJSON(jsonCase: any): boolean;
    };

export const Case = mongoose.model<CaseDocument>('Case', caseSchema);
export const RestrictedCase = mongoose.model<CaseDocument>(
    'RestrictedCase',
    caseSchema,
);

// export const caseAgeRange = async (aCase: LeanDocument<CaseDocument>) => {
//     return await demographicsAgeRange(aCase.demographics);
// };
