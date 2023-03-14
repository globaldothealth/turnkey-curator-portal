import {
    GenomeSequenceDocument,
    genomeSequenceSchema,
} from '../../src/model/genome-sequence';

import fullModel from './data/genome-sequence.full.json';
import minimalModel from './data/genome-sequence.minimal.json';
import mongoose from 'mongoose';

const GenomeSequence = mongoose.model<GenomeSequenceDocument>(
    'GenomeSequence',
    genomeSequenceSchema,
);

describe('validate', () => {
    it('minimal genome sequence model is valid', async () => {
        return new GenomeSequence(minimalModel).validate();
    });

    it('fully specified genome sequence model is valid', async () => {
        return new GenomeSequence(fullModel).validate();
    });
});
