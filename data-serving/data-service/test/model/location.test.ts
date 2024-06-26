import { LocationDocument, locationSchema } from '../../src/model/location';

import { Error } from 'mongoose';
import fullModel from './data/location.full.json';
import minimalModel from './data/location.minimal.json';
import mongoose from 'mongoose';

const Location = mongoose.model<LocationDocument>('Location', locationSchema);

describe('validate', () => {
    it.skip('a location without a geo resolution is invalid', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const noGeoResolution: any = { ...minimalModel };
        delete noGeoResolution.geoResolution;

        return new Location(noGeoResolution).validate().then(
            () => null,
            (e) => {
                expect(e).not.toBeNull();
                if (e) expect(e.name).toBe(Error.ValidationError.name);
            },
        );
    });

    // Geometry will be added back in a new ticket
    it.skip('a location without a geometry is invalid', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const noGeometry: any = { ...minimalModel };
        delete noGeometry.geometry;

        return new Location(noGeometry).validate().then(
            () => null,
            (e) => {
                expect(e).not.toBeNull();
                if (e) expect(e.name).toBe(Error.ValidationError.name);
            },
        );
    });

    it.skip('a location without a name is invalid', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const noName: any = { ...minimalModel };
        delete noName.name;

        return new Location(noName).validate().then(
            () => null,
            (e) => {
                expect(e).not.toBeNull();
                if (e) expect(e.name).toBe(Error.ValidationError.name);
            },
        );
    });

    it.skip('a geometry without a longitude is invalid', async () => {
        return new Location({
            ...minimalModel,
            geometry: {
                latitude: 40.6,
            },
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

    it.skip('a geometry without a latitude is invalid', async () => {
        return new Location({
            ...minimalModel,
            geometry: {
                longitude: -73.9,
            },
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

    it('a minimal location is valid', async () => {
        return new Location(minimalModel).validate();
    });

    it('a fully specified location is valid', async () => {
        return new Location(fullModel).validate();
    });
});
