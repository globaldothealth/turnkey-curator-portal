import mongoose from 'mongoose';
import { uniqueStringsArrayFieldInfo } from './unique-strings-array';

export const caseReferenceSchema = new mongoose.Schema(
    {
        sourceId: {
            type: String,
            required: true,
        },
        sourceEntryId: String,
        sourceUrl: {
            type: String,
            required: true,
        },
        isGovernmentSource: {
            type: Boolean,
            required: true,
        },
        uploadIds: {
            ...uniqueStringsArrayFieldInfo,
            required: true,
        },
        additionalSources: [
            {
                sourceUrl: String,
                isGovernmentSource: Boolean,
                _id: false,
            },
        ],
    },
    { _id: false },
);

export type CaseReferenceDocument = mongoose.Document & {
    /** Foreign key to the sources collection. */
    sourceId: string;

    /** The original id of the case in the source.  */
    sourceEntryId?: string;

    /** The URL of the source of the case data at the time of ingestion. */
    sourceUrl: string;

    /** Indication whether source is a government source or not. */
    isGovernmentSource: boolean;

    /**
     * Array of UUIDs of uploads from which this case was created or updated.
     *
     * At present, this is only populated for cases created via bulk upload or
     * automated ingestion.
     */
    uploadIds: string[];

    additionalSources: [
        {
            sourceUrl: string;
            isGovernmentSource: boolean;
        },
    ];
};
