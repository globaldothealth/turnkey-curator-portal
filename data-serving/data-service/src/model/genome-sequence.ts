import mongoose from 'mongoose';

export const genomeSequenceSchema = new mongoose.Schema(
    {
        genomicsMetadata: String,
        accessionNumber: String,
    },
    { _id: false },
);

export type GenomeSequenceDocument = mongoose.Document & {
    genomicsMetadata: string;
    accessionNumber: string;
};
