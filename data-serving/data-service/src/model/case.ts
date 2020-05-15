import { DemographicsDocument, demographicsSchema } from './demographics';
import { DictionaryDocument, dictionarySchema } from './dictionary';
import { EventDocument, eventSchema } from './event';
import { LocationDocument, locationSchema } from './location';
import { PathogenDocument, pathogenSchema } from './pathogen';
import {
    OutbreakSpecificsDocument,
    outbreakSpecificsSchema,
} from './outbreak-specifics';
import {
    RevisionMetadataDocument,
    revisionMetadataSchema,
} from './revision-metadata';
import { SourceDocument, sourceSchema } from './source';
import { TravelDocument, travelSchema } from './travel';

import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';

const caseSchema = new mongoose.Schema(
    {
        chronicDisease: dictionarySchema,
        demographics: demographicsSchema,
        events: {
            type: [eventSchema],
            validator: {
                validator: function (events: [EventDocument]): boolean {
                    return events.some((e) => e.name == 'confirmed');
                },
                message: 'Must include an event with name "confirmed"',
            },
        },
        importedCase: {},
        location: locationSchema,
        revisionMetadata: {
            type: revisionMetadataSchema,
            required: 'Enter revision metadata',
        },
        notes: String,
        outbreakSpecifics: outbreakSpecificsSchema,
        pathogens: [pathogenSchema],
        source: sourceSchema,
        symptoms: dictionarySchema,
        travelHistory: [travelSchema],
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

type CaseDocument = mongoose.Document & {
    _id: ObjectId;
    chronicDisease: DictionaryDocument;
    demographics: DemographicsDocument;
    events: [EventDocument];
    importedCase: {};
    location: LocationDocument;
    revisionMetadata: RevisionMetadataDocument;
    notes: string;
    outbreakSpecifics: OutbreakSpecificsDocument;
    pathogens: [PathogenDocument];
    source: SourceDocument;
    symptoms: DictionaryDocument;
    travelHistory: [TravelDocument];
};

export const Case = mongoose.model<CaseDocument>('Case', caseSchema);
