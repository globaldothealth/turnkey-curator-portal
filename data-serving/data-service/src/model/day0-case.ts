import { CaseReferenceDocument, caseReferenceSchema } from './case-reference';
import {
    demographicsAgeRange,
    DemographicsDocument,
    DemographicsDTO,
    demographicsSchema,
} from './demographics';
import { EventDocument, eventSchema } from './event';
import {
    GenomeSequenceDocument,
    genomeSequenceSchema,
} from './genome-sequence';
import { LocationDocument, locationSchema } from './location';
import { PathogenDocument, pathogenSchema } from './pathogen';
import {
    PreexistingConditionsDocument,
    preexistingConditionsSchema,
} from './preexisting-conditions';
import {
    RevisionMetadataDocument,
    revisionMetadataSchema,
} from './revision-metadata';
import { SymptomsDocument, symptomsSchema } from './symptoms';
import { TransmissionDocument, transmissionSchema } from './transmission';
import { TravelHistoryDocument, travelHistorySchema } from './travel-history';
import { VaccineDocument, vaccineSchema } from './vaccine';
import { VariantDocument, variantSchema } from './variant';

import { ObjectId } from 'mongodb';
import _ from 'lodash';
import mongoose, { LeanDocument } from 'mongoose';
import { ExclusionDataDocument, exclusionDataSchema } from './exclusion-data';
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

const requiredDateField = {
    ...dateFieldInfo(validateEnv().OUTBREAK_DATE),
    required: true,
};

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
            type: String,
            required: true,
        },
        Date_last_modified: {
            type: String,
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
        Date_onset: String,
        Date_confirmation: String,
        Confirmation_method: String,
        Date_of_first_consult: String,
        Hospitalized: YesNo,
        'Reason for hospitalization': HospitalizationReason,
        Date_hospitalization: String,
        Date_discharge_hospital: String,
        Intensive_care: YesNo,
        Date_admission_ICU: String,
        Date_discharge_ICU: String,
        Home_monitoring: YesNo,
        Isolated: YesNo,
        Date_isolation: String,
        Outcome: Outcome,
        Date_death: String,
        Date_recovered: String,
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
        Vaccine_date: String,
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
// TODO: Type request Cases.
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
    caseReference: CaseReferenceDocument;
    confirmationDate: Date;
    events: [EventDocument];
    exclusionData: ExclusionDataDocument;
    genomeSequences: [GenomeSequenceDocument];
    importedCase: unknown;
    location: LocationDocument;
    revisionMetadata: RevisionMetadataDocument;
    notes?: string;
    restrictedNotes?: string;
    pathogens: [PathogenDocument];
    list: boolean;
    SGTF: '0' | '1' | 'NA';
    preexistingConditions: PreexistingConditionsDocument;
    symptoms: SymptomsDocument;
    transmission: TransmissionDocument;
    travelHistory: TravelHistoryDocument;
    vaccines: [VaccineDocument];
    variant: VariantDocument;
};

export type CaseDTO = ICase & {
    demographics?: DemographicsDTO;
};

export type CaseDocument = mongoose.Document &
    ICase & {
        _id: ObjectId;
        demographics: DemographicsDocument;
        // TODO: Type request Cases.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        equalsJSON(jsonCase: any): boolean;
    };

/* Denormalise the confirmation date before saving or updating any case object */

function denormaliseConfirmationDate(
    aCase: CaseDocument | LeanDocument<CaseDocument>,
) {
    const confirmationEvents = _.filter(
        aCase.events,
        (e) => e.name === 'confirmed',
    );
    if (confirmationEvents.length) {
        aCase.confirmationDate = confirmationEvents[0].dateRange.start;
    }
}

export function caseWithDenormalisedConfirmationDate(
    aCase: CaseDocument | LeanDocument<CaseDocument>,
) {
    denormaliseConfirmationDate(aCase);
    return aCase;
}

caseSchema.pre('save', async function (this: CaseDocument) {
    denormaliseConfirmationDate(this);
});

caseSchema.pre('validate', async function (this: CaseDocument) {
    denormaliseConfirmationDate(this);
});

caseSchema.pre('insertMany', async function (
    next: (err?: mongoose.CallbackError | undefined) => void,
    docs: CaseDocument[],
) {
    _.forEach(docs, denormaliseConfirmationDate);
    next();
});

caseSchema.pre('updateOne', { document: true, query: false }, async function (
    this: CaseDocument,
) {
    denormaliseConfirmationDate(this);
});

export const Case = mongoose.model<CaseDocument>('Case', caseSchema);
export const RestrictedCase = mongoose.model<CaseDocument>(
    'RestrictedCase',
    caseSchema,
);

export const caseAgeRange = async (aCase: LeanDocument<CaseDocument>) => {
    return await demographicsAgeRange(aCase.demographics);
};
