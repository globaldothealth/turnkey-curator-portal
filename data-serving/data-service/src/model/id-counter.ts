import mongoose from 'mongoose';

// this is the _id of a counter document
// use this _id to fetch the document
export const COUNTER_DOCUMENT_ID = 'ID COUNTER';

export const idCounterSchema = new mongoose.Schema({
    _id: String,
    count: Number,
    notes: String,
});

type IdCounterDocument = {
    _id: string;
    count: number;
    notes: string;
};

export const IdCounter = mongoose.model<IdCounterDocument>(
    'IdCounter',
    idCounterSchema,
);
