import { ObjectId } from 'mongodb';
import _ from 'lodash';
import mongoose, { LeanDocument } from 'mongoose';
import { CaseReferenceDocument, caseReferenceSchema } from './case-reference';
import {
    demographicsAgeRange,
    DemographicsDocument,
    DemographicsDTO,
    demographicsSchema,
} from './demographics';
import { EventsDocument, EventsSchema } from './events';
import { LocationDocument, locationSchema } from './location';
import {
    GenomeSequenceDocument,
    genomeSequenceSchema,
} from './genome-sequence';
import { TravelHistoryDocument, travelHistorySchema } from './travel-history';
import { TransmissionDocument, transmissionSchema } from './transmission';
import { VaccineDocument, vaccineSchema } from './vaccine';
import {
    PreexistingConditionsDocument,
    preexistingConditionsSchema,
} from './preexisting-conditions';
import { CaseStatus } from '../types/enums';
import { IdCounter, COUNTER_DOCUMENT_ID } from '../model/id-counter';

/*
 * There are separate types for case for data storage (the mongoose document) and
 * for data transfer (CaseDTO). The DTO only has an age range, and is what the cases
 * controller receives and transmits over the network. The mongoose document has both an age
 * range and age buckets, and is what gets written to the database. The end goal is that the
 * mongoose document only has age buckets, and that the cases controller converts between the
 * two so that outside you only see a single age range.
 */

// this is not an official day 0 case schema field but it has
// to be declared for specific use cases
export const sourceSchema = new mongoose.Schema({
    sourceId: { type: String, required: true },
    sourceUrl: {
        type: String,
        required: true,
    },
    sourceName: String,
    sourceLicense: String,
    sourceProviderName: String,
    sourceProviderUrl: String,
    sourceEntryId: String,
    uploadIds: [String],
    sourceIsGovernmental: Boolean,
});

export const curatorsSchema = new mongoose.Schema(
    {
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    },
    { _id: false },
);

export type CuratorsDocument = mongoose.Document & {
    verifiedBy?: {
        name?: string;
        email: string;
    };
    createdBy: {
        name?: string;
        email: string;
    };
};

export const caseSchema = new mongoose.Schema(
    {
        _id: Number,
        caseStatus: {
            type: CaseStatus,
            required: true,
        },
        pathogen: {
            type: String,
            required: true,
        },
        caseReference: {
            type: caseReferenceSchema,
            required: true,
        },
        demographics: demographicsSchema,
        location: locationSchema,
        events: EventsSchema,
        symptoms: String,
        preexistingConditions: preexistingConditionsSchema,
        transmission: transmissionSchema,
        travelHistory: travelHistorySchema,
        genomeSequences: genomeSequenceSchema,
        vaccination: vaccineSchema,
        curators: curatorsSchema,
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

caseSchema.pre('save', async function (next) {
    if (this._id == undefined) {
        const idCounter = await IdCounter.findByIdAndUpdate(
            COUNTER_DOCUMENT_ID,
            { $inc: { count: 1 } },
        );
        if (!idCounter) throw new Error('ID counter document not found');
        this._id = idCounter.count;
    }
    next();
});

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
    const other = new Day0Case(jsonCase).toJSON() as any;

    return (
        _.isEqual(thisJson.caseStatus, other.caseStatus) &&
        _.isEqual(thisJson.demographics, other.demographics) &&
        _.isEqual(thisJson.events, other.events) &&
        _.isEqual(thisJson.genomeSequences, other.genomeSequences) &&
        _.isEqual(thisJson.location, other.location) &&
        _.isEqual(thisJson.pathogen, other.pathogen) &&
        _.isEqual(
            thisJson.preexistingConditions,
            other.preexistingConditions,
        ) &&
        _.isEqual(thisJson.symptoms, other.symptoms) &&
        _.isEqual(thisJson.transmission, other.transmission) &&
        _.isEqual(thisJson.travelHistory, other.travelHistory) &&
        _.isEqual(thisJson.vaccination, other.vaccination)
    );
};

export interface ISource {
    sourceUrl: string;
    sourceId: string;
    sourceName?: string;
    sourceLicense?: string;
    sourceProviderName?: string;
    sourceProviderUrl?: string;
    sourceEntryId?: string;
    uploadIds: string[];
}

export type ICase = {
    caseStatus: CaseStatus;
    pathogen: string;
    symptoms: string;
    dateLastModified: string;
    caseReference: CaseReferenceDocument;
    events: EventsDocument;
    location: LocationDocument;
    preexistingConditions: PreexistingConditionsDocument;
    transmission: TransmissionDocument;
    travelHistory: TravelHistoryDocument;
    genomeSequences: GenomeSequenceDocument;
    vaccination: VaccineDocument;
    curators: CuratorsDocument;
};

export type CaseDTO = ICase & {
    demographics?: DemographicsDTO;
    curator: { email: string };
};

export type CaseDocument = mongoose.Document &
    ICase & {
        _id: ObjectId;
        demographics: DemographicsDocument;
        // TODO: Type request Cases.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        equalsJSON(jsonCase: any): boolean;
    };

caseSchema.pre('save', async function (this: CaseDocument) {
    this.dateLastModified = new Date().toUTCString();
});

caseSchema.pre('insertMany', async function (
    next: (err?: mongoose.CallbackError | undefined) => void,
    docs: CaseDocument[],
) {
    docs.forEach((doc) => {
        doc.dateLastModified = new Date().toUTCString();
    });
    next();
});

caseSchema.pre('updateOne', async function (this: CaseDocument) {
    this.dateLastModified = new Date().toUTCString();
});

export const Day0Case = mongoose.model<CaseDocument>('Day0Case', caseSchema);

export const caseAgeRange = async (aCase: LeanDocument<CaseDocument>) => {
    return await demographicsAgeRange(aCase.demographics);
};
