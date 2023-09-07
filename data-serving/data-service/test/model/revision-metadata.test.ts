import { Error } from 'mongoose';
import { RevisionMetadata } from '../../src/model/revision-metadata';
import fullModel from './data/revision-metadata.full.json';
import minimalModel from './data/revision-metadata.minimal.json';

describe('validate', () => {
    it('revision metadata without revision number is invalid', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const noRevisionNumber: any = { ...minimalModel };
        delete noRevisionNumber.revisionNumber;

        return new RevisionMetadata(noRevisionNumber).validate().then(
            () => null,
            (e) => {
                expect(e).not.toBeNull();
                if (e) expect(e.name).toBe(Error.ValidationError.name);
            },
        );
    });

    it('revision metadata without creation metadata is invalid', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const noCreationMetadata: any = { ...minimalModel };
        delete noCreationMetadata.creationMetadata;

        return new RevisionMetadata(noCreationMetadata).validate().then(
            () => null,
            (e) => {
                expect(e).not.toBeNull();
                if (e) expect(e.name).toBe(Error.ValidationError.name);
            },
        );
    });

    it('revision metadata with non-integer id invalid', async () => {
        return new RevisionMetadata({
            ...minimalModel,
            ...{ revisionNumber: 2.2 },
        })
            .validate()
            .then(
                () => null,
                (e) => {
                    expect(e).not.toBeNull();
                    if (e) expect(e.name).toBe(Error.ValidationError.name);
                },
            );
    });

    it('revision edit metadata without date is invalid', async () => {
        return new RevisionMetadata({
            ...minimalModel,
            ...{ creationMetadata: { revisionNumber: 0 } },
        })
            .validate()
            .then(
                () => null,
                (e) => {
                    expect(e).not.toBeNull();
                    if (e) expect(e.name).toBe(Error.ValidationError.name);
                },
            );
    });

    it('revision metadata beyond revision 0 without update metadata is invalid', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const noUpdateMetadata: any = {
            ...fullModel,
            ...{ revisionNumber: 1 },
        };
        delete noUpdateMetadata.updateMetadata;

        return new RevisionMetadata(noUpdateMetadata).validate().then(
            () => null,
            (e) => {
                expect(e).not.toBeNull();
                if (e) expect(e.name).toBe(Error.ValidationError.name);
            },
        );
    });

    it('minimal revision metadata model is valid', async () => {
        return new RevisionMetadata(minimalModel).validate();
    });

    it('fully specified revision metadata model is valid', async () => {
        return new RevisionMetadata(fullModel).validate();
    });
});
