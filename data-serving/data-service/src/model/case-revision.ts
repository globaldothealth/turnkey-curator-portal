import { CaseDocument, caseSchema } from './day0-case';

import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';

const caseRevisionSchema = new mongoose.Schema({
    case: {
        type: caseSchema,
        required: true,
    },
}).index(
    { 'case._id': 1, 'case.revisionMetadata.revisionNumber': -1 },
    { unique: true },
);

export type CaseRevisionDocument = {
    _id: ObjectId;
    case: CaseDocument;
};

export const CaseRevision = mongoose.model<CaseRevisionDocument>(
    'CaseRevision',
    caseRevisionSchema,
);
