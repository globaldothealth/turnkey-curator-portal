import { PathogenDocument, pathogenSchema } from '../../src/model/pathogen';

import { Error } from 'mongoose';
import fullModel from './data/pathogen.full.json';
import minimalModel from './data/pathogen.minimal.json';
import mongoose from 'mongoose';

const Pathogen = mongoose.model<PathogenDocument>('Pathogen', pathogenSchema);

describe('validate', () => {
    it('a pathogen without a name is invalid', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const missingName: any = { ...minimalModel };
        delete missingName.name;

        return new Pathogen(missingName).validate().then(
            () => null,
            (e) => {
                expect(e).not.toBeNull();
                if (e) expect(e.name).toBe(Error.ValidationError.name);
            },
        );
    });

    it('a pathogen without an id is invalid', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const missingId: any = { ...minimalModel };
        delete missingId.id;

        return new Pathogen(missingId).validate().then(
            () => null,
            (e) => {
                expect(e).not.toBeNull();
                if (e) expect(e.name).toBe(Error.ValidationError.name);
            },
        );
    });

    it('a non-integer pathogen id is invalid', async () => {
        return new Pathogen({ ...minimalModel, id: 1.1 }).validate().then(
            () => null,
            (e) => {
                expect(e).not.toBeNull();
                if (e) expect(e.name).toBe(Error.ValidationError.name);
            },
        );
    });

    it('a minimal pathogen is valid', async () => {
        return new Pathogen(minimalModel).validate();
    });

    it('a fully specified pathogen is valid', async () => {
        return new Pathogen(fullModel).validate();
    });
});
