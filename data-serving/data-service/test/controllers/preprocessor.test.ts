import { Request, Response } from 'express';
import {
    batchDeleteCheckThreshold,
    batchUpsertDropUnchangedCases,
    createBatchDeleteCaseRevisions,
    createBatchUpdateCaseRevisions,
    createBatchUpsertCaseRevisions,
    createCaseRevision,
    setBatchUpsertFields,
} from '../../src/controllers/preprocessor';

import { Day0Case } from '../../src/model/day0-case';
import { CaseRevision } from '../../src/model/case-revision';
import { Demographics } from '../../src/model/demographics';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../src/index';
import minimalCase from './../model/data/case.minimal.json';
import mongoose from 'mongoose';
import supertest from 'supertest';

let mongoServer: MongoMemoryServer;
let dateNowSpy: any;

beforeAll(() => {
    mongoServer = new MongoMemoryServer();
    dateNowSpy = jest
        .spyOn(Date, 'now')
        .mockImplementation(() => Date.parse('2020-03-03'));
});

beforeEach(async () => {
    supertest.agent(app);
    await Day0Case.deleteMany({});
    return CaseRevision.deleteMany({});
});

afterAll(() => {
    dateNowSpy.mockRestore();
    return mongoServer.stop();
});

describe('create', () => {
    it('does not create a case revision', async () => {
        const requestBody = {
            ...minimalCase,
            curator: { email: 'creator@gmail.com' },
        };
        const nextFn = jest.fn();
        await createCaseRevision(
            { body: requestBody, method: 'POST' } as Request,
            {} as Response,
            nextFn,
        );

        expect(nextFn).toHaveBeenCalledTimes(1);
        expect(await CaseRevision.collection.countDocuments()).toEqual(0);
    });
});

describe('update', () => {
    it('creates a case revision', async () => {
        const c = new Day0Case({
            ...minimalCase,
            revisionMetadata: {
                revisionNumber: 0,
                creationMetadata: {
                    curator: 'creator@gmail.com',
                    date: Date.parse('2020-01-01'),
                },
            },
        });
        await c.save();

        const requestBody = {
            ...minimalCase,
            curator: { email: 'updater@gmail.com' },
        };
        const nextFn = jest.fn();
        await createCaseRevision(
            {
                body: requestBody,
                method: 'PUT',
                params: { id: c._id },
            } as Request<any>,
            {} as Response,
            nextFn,
        );

        expect(nextFn).toHaveBeenCalledTimes(1);
        expect(await CaseRevision.collection.countDocuments()).toEqual(1);
        expect((await CaseRevision.find())[0].case).toMatchObject(c.toObject());
    });
});

describe('upsert', () => {
    it('with no existing case does not create a case revision', async () => {
        const upsertCase = {
            ...minimalCase,
            caseReference: {
                ...minimalCase.caseReference,
                sourceEntryId: 'case_id',
            },
        };
        const requestBody = {
            ...upsertCase,
            curator: { email: 'creator@gmail.com' },
        };
        const nextFn = jest.fn();
        await createCaseRevision(
            { body: requestBody, method: 'PUT' } as Request,
            {} as Response,
            nextFn,
        );

        expect(nextFn).toHaveBeenCalledTimes(1);
        expect(await CaseRevision.collection.countDocuments()).toEqual(0);
    });
    it('with existing case creates a case revision', async () => {
        const upsertCase = {
            ...minimalCase,
            caseReference: {
                ...minimalCase.caseReference,
                sourceEntryId: 'case_id',
            },
        };
        const c = new Day0Case({
            ...upsertCase,
            revisionMetadata: {
                revisionNumber: 0,
                creationMetadata: {
                    curator: 'creator@gmail.com',
                    date: Date.parse('2020-01-01'),
                },
            },
        });
        await c.save();

        const requestBody = {
            ...upsertCase,
            curator: { email: 'updater@gmail.com' },
        };
        const nextFn = jest.fn();
        await createCaseRevision(
            { body: requestBody, method: 'PUT' } as Request,
            {} as Response,
            nextFn,
        );

        expect(nextFn).toHaveBeenCalledTimes(1);
        expect(await CaseRevision.collection.countDocuments()).toEqual(1);
        expect((await CaseRevision.find())[0].case).toMatchObject(c.toObject());
    });
});
describe('batch upsert', () => {
    it('with existing cases creates case revisions', async () => {
        const existingCase = {
            ...minimalCase,
            caseReference: {
                ...minimalCase.caseReference,
                sourceEntryId: 'case_id_exists',
            },
        };
        const c = new Day0Case({
            ...existingCase,
            revisionMetadata: {
                revisionNumber: 0,
                creationMetadata: {
                    curator: 'creator@gmail.com',
                    date: Date.parse('2020-01-01'),
                },
            },
        });
        await c.save();

        const newCase = {
            ...minimalCase,
            caseReference: {
                ...minimalCase.caseReference,
                sourceEntryId: 'case_id_new',
            },
        };

        const requestBody = {
            cases: [existingCase, newCase],
            curator: { email: 'updater@gmail.com' },
        };
        const nextFn = jest.fn();
        await createBatchUpsertCaseRevisions(
            { body: requestBody, method: 'PUT' } as Request,
            {} as Response,
            nextFn,
        );

        expect(nextFn).toHaveBeenCalledTimes(1);
        expect(await CaseRevision.collection.countDocuments()).toEqual(1);
        expect((await CaseRevision.find())[0].case).toMatchObject(c.toObject());
    });
    it('removes cases from request that would not be updated', async () => {
        const existingCase = {
            ...minimalCase,
            caseReference: {
                ...minimalCase.caseReference,
                sourceEntryId: 'case_id_exists',
            },
        };
        const existingCase2 = {
            ...minimalCase,
            caseReference: {
                ...minimalCase.caseReference,
                sourceEntryId: 'case_id_exists2',
            },
        };
        const newCase = {
            ...minimalCase,
            caseReference: {
                ...minimalCase.caseReference,
                sourceEntryId: 'case_id_exists3',
            },
        };
        const c = new Day0Case({
            ...existingCase,
            revisionMetadata: {
                revisionNumber: 0,
                creationMetadata: {
                    curator: 'creator@gmail.com',
                    date: Date.parse('2020-01-01'),
                },
            },
        });
        await c.save();
        const c2 = new Day0Case({
            ...existingCase2,
            revisionMetadata: {
                revisionNumber: 0,
                creationMetadata: {
                    curator: 'creator@gmail.com',
                    date: Date.parse('2020-01-01'),
                },
            },
        });
        await c2.save();

        const requestBody = {
            cases: [existingCase, existingCase2, newCase],
            curator: { email: 'updater@gmail.com' },
        };
        const nextFn = jest.fn();
        await batchUpsertDropUnchangedCases(
            { body: requestBody, method: 'PUT' } as Request,
            {} as Response,
            nextFn,
        );

        expect(nextFn).toHaveBeenCalledTimes(1);
        expect(requestBody).toEqual({
            cases: [newCase],
            curator: {
                email: 'updater@gmail.com',
            },
        });
    });
});
describe('batch update', () => {
    it('with existing cases creates case revisions', async () => {
        const c = new Day0Case({
            ...minimalCase,
            revisionMetadata: {
                revisionNumber: 0,
                creationMetadata: {
                    curator: 'creator@gmail.com',
                    date: Date.parse('2020-01-01'),
                },
            },
        });
        await c.save();

        const c2 = new Day0Case({
            ...minimalCase,
            revisionMetadata: {
                revisionNumber: 1,
                updateMetadata: {
                    curator: 'test@gmail.com',
                    date: Date.now(),
                },
                creationMetadata: {
                    curator: 'creator2@gmail.com',
                    date: Date.parse('2020-01-01'),
                },
            },
        });
        await c2.save();

        const requestBody = {
            cases: [
                { ...minimalCase, _id: c._id },
                { ...minimalCase, _id: c2._id },
            ],
            curator: { email: 'updater@gmail.com' },
        };
        const nextFn = jest.fn();
        await createBatchUpdateCaseRevisions(
            { body: requestBody, method: 'POST' } as Request,
            {} as Response,
            nextFn,
        );

        expect(nextFn).toHaveBeenCalledTimes(1);
        expect(await CaseRevision.collection.countDocuments()).toEqual(2);
        expect((await CaseRevision.find())[0].case).toMatchObject(c.toObject());
        expect((await CaseRevision.find())[1].case).toMatchObject(
            c2.toObject(),
        );
    });
    describe('batch delete', () => {
        it('creates case revisions from caseIds', async () => {
            const c = await new Day0Case(minimalCase).save();
            const c2 = await new Day0Case(minimalCase).save();

            const requestBody = { caseIds: [c._id, c2._id] };
            const nextFn = jest.fn();
            await createBatchDeleteCaseRevisions(
                { body: requestBody, method: 'DELETE' } as Request,
                {} as Response,
                nextFn,
            );

            expect(nextFn).toHaveBeenCalledTimes(1);
            expect(await CaseRevision.collection.countDocuments()).toEqual(2);
            expect((await CaseRevision.find())[0].case).toMatchObject(
                c.toObject(),
            );
            expect((await CaseRevision.find())[1].case).toMatchObject(
                c2.toObject(),
            );
        });
        it('creates case revisions from query', async () => {
            const c = new Day0Case(minimalCase);
            c.demographics = new Demographics({ gender: 'female' });
            await c.save();
            const c2 = new Day0Case(minimalCase);
            c2.demographics = new Demographics({ gender: 'female' });
            await c2.save();
            await new Day0Case(minimalCase).save();

            const requestBody = { query: 'gender:female' };
            const nextFn = jest.fn();
            await createBatchDeleteCaseRevisions(
                { body: requestBody, method: 'DELETE' } as Request,
                {} as Response,
                nextFn,
            );

            expect(nextFn).toHaveBeenCalledTimes(1);
            expect(await CaseRevision.collection.countDocuments()).toEqual(2);
            expect((await CaseRevision.find())[0].case).toMatchObject(
                c.toObject(),
            );
            expect((await CaseRevision.find())[1].case).toMatchObject(
                c2.toObject(),
            );
        });
        it('does not call next function if over threshold', async () => {
            // Simulate index creation used in unit tests, in production they are
            // setup by the migrations and such indexes are not present by
            // default in the in memory mongo spawned by unit tests.
            await mongoose.connection.collection('cases').createIndex(
                {
                    'demographics.gender': -1,
                },
                { collation: { locale: 'en_US', strength: 2 } },
            );

            await Promise.all([
                new Day0Case(minimalCase)
                    .set('demographics.gender', 'female')
                    .save(),
                new Day0Case(minimalCase)
                    .set('demographics.gender', 'female')
                    .save(),
                new Day0Case(minimalCase)
                    .set('demographics.gender', 'female')
                    .save(),
            ]);

            const requestBody = {
                query: 'gender:female',
                maxCasesThreshold: 2,
            };
            const nextFn = jest.fn();
            await batchDeleteCheckThreshold(
                { body: requestBody, method: 'DELETE' } as Request,
                {
                    status: function (_) {
                        return this;
                    },
                    json: function (_) {
                        return this;
                    },
                } as Response<any>,
                nextFn,
            );

            expect(nextFn).toHaveBeenCalledTimes(0);
        });
    });
    describe('delete', () => {
        it('creates case revision', async () => {
            const c = await new Day0Case(minimalCase).save();

            const nextFn = jest.fn();
            await createCaseRevision(
                {
                    method: 'DELETE',
                    params: { id: c._id },
                } as Request<any>,
                {} as Response,
                nextFn,
            );

            expect(nextFn).toHaveBeenCalledTimes(1);
            expect(await CaseRevision.collection.countDocuments()).toEqual(1);
            expect((await CaseRevision.find())[0].case).toMatchObject(
                c.toObject(),
            );
        });
    });
});
