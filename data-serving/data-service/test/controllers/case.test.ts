import { Day0Case } from '../../src/model/day0-case';
import { CaseStatus } from '../../src/types/enums';
import { CaseRevision } from '../../src/model/case-revision';
import { Demographics, Gender } from '../../src/model/demographics';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from './../../src/index';
import fullCase from './../model/data/case.full.json';
import minimalCase from './../model/data/case.minimal.json';
import caseMustGeocode from './../model/data/case.mustgeocode.json';
import mongoose from 'mongoose';
import request from 'supertest';
import { setupServer } from 'msw/node';
import {
    seed as seedFakeGeocodes,
    clear as clearFakeGeocodes,
    handlers,
} from '../mocks/handlers';
import fs from 'fs';
import { AgeBucket } from '../../src/model/age-bucket';
import { User, UserDocument } from '../../src/model/user';
import { Role } from '../../src/types/enums';

let mongoServer: MongoMemoryServer;

const curatorName = 'Casey Curatorio';
const curatorUserEmail = 'case_curator@global.health';

const curatorMetadata = { curator: { email: curatorUserEmail } };

const minimalRequest = {
    ...minimalCase,
    ...curatorMetadata,
};

let minimalDay0CaseData = { ...minimalCase };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let fullDay0CaseData: any;

const invalidRequest = {
    ...minimalRequest,
    demographics: { ageRange: { start: 400 } },
};

const realDate = Date.now;
const mockLocationServer = setupServer(...handlers);
let curator: UserDocument;

function stringParser(res: request.Response) {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
        res.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
        res.on('error', (err: Error) => reject(err));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
}

async function createAgeBuckets() {
    await new AgeBucket({
        start: 0,
        end: 0,
    }).save();
    for (let start = 1; start <= 116; start += 5) {
        const end = start + 4;
        await new AgeBucket({
            start,
            end,
        }).save();
    }
}

beforeAll(async () => {
    mockLocationServer.listen({ onUnhandledRequest: 'bypass' });
    mongoServer = new MongoMemoryServer();
    await createAgeBuckets();
    curator = await User.create({
        name: curatorName,
        email: curatorUserEmail,
        roles: [Role.Curator],
    });
    minimalDay0CaseData = {
        ...minimalDay0CaseData,
        ...{ curators: { createdBy: curatorMetadata.curator } },
        ...{
            revisionMetadata: {
                revisionNumber: 0,
                creationMetadata: {
                    curator: curatorUserEmail,
                },
            },
        },
    };
    fullDay0CaseData = {
        ...fullCase,
        ...{ curators: { createdBy: curatorMetadata.curator } },
        ...{
            revisionMetadata: {
                revisionNumber: 0,
                creationMetadata: {
                    curator: curatorUserEmail,
                },
            },
        },
    };
    global.Date.now = jest.fn(() => new Date('2020-12-12T12:12:37Z').getTime());
});

beforeEach(async () => {
    clearFakeGeocodes();
    await Day0Case.deleteMany({});
    return CaseRevision.deleteMany({});
});

afterEach(() => {
    mockLocationServer.resetHandlers();
});

afterAll(async () => {
    await AgeBucket.deleteMany({});
    mockLocationServer.close();
    global.Date.now = realDate;
    return mongoServer.stop();
});

describe('GET', () => {
    it('one present item should return 200 OK', async () => {
        const c = new Day0Case(minimalDay0CaseData);
        await c.save();
        const res = await request(app)
            .get(`/api/cases/${c._id}`)
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body[0]._id).toEqual(c._id);
    });
    it('one absent item should return 404 NOT FOUND', () => {
        return request(app).get('/api/cases/123456789').expect(404);
    });
    it('should not show the sourceEntryId for a case', async () => {
        const c = new Day0Case(minimalDay0CaseData);
        c.caseReference.sourceEntryId = 'Sourcey McSourceFace';
        await c.save();
        const res = await request(app).get(`/api/cases/${c._id}`).expect(200);
        expect(res.body[0].caseReference.sourceEntryId).toBeUndefined();
    });
    it('should convert age bucket to age range', async () => {
        const c = new Day0Case(minimalDay0CaseData);
        const bucket = await AgeBucket.findOne({});
        c.demographics.ageBuckets = [bucket!._id];
        await c.save();
        const res = await request(app).get(`/api/cases/${c._id}`).expect(200);
        expect(res.body[0].demographics.ageRange.start).toEqual(bucket!.start);
        expect(res.body[0].demographics.ageRange.end).toEqual(bucket!.end);
    });
    describe('list', () => {
        it('should return 200 OK', () => {
            return request(app)
                .get('/api/cases')
                .expect('Content-Type', /json/)
                .expect(200);
        });
        it('should paginate', async () => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for (const i of Array.from(Array(15).keys())) {
                const c = new Day0Case(minimalDay0CaseData);
                await c.save();
            }
            // Fetch first page.
            let res = await request(app)
                .get('/api/cases?page=1&limit=10&sort_by=default')
                .expect(200)
                .expect('Content-Type', /json/);
            expect(res.body.cases).toHaveLength(10);

            // Second page is expected.
            expect(res.body.nextPage).toEqual(2);
            expect(res.body.total).toEqual(15);

            // Fetch second page.
            res = await request(app)
                .get(`/api/cases?page=${res.body.nextPage}&limit=10`)
                .expect(200)
                .expect('Content-Type', /json/);
            expect(res.body.cases).toHaveLength(5);

            // No continuation expected.
            expect(res.body.nextPage).toBeUndefined();
            expect(res.body.total).toEqual(15);

            // Fetch inexistant page.
            res = await request(app)
                .get('/api/cases?page=42&limit=10')
                .expect(200)
                .expect('Content-Type', /json/);
            expect(res.body.cases).toHaveLength(0);

            // No continuation expected.
            expect(res.body.nextPage).toBeUndefined();
        });
        it('should search by date—less than', async () => {
            const c = new Day0Case(fullDay0CaseData);
            await c.save();
            const res = await request(app)
                .get(
                    `/api/cases?page=1&limit=10&q=${encodeURIComponent(
                        'dateConfirmedTo:',
                    )}${fullCase.events.dateConfirmation}`,
                )
                .expect(200);
            expect(res.body.cases).toHaveLength(0);
        });
        it('should search by date—greater than', async () => {
            const c = new Day0Case(fullDay0CaseData);
            await c.save();
            const res = await request(app)
                .get(
                    `/api/cases?page=1&limit=10&q=${encodeURIComponent(
                        'dateConfirmedFrom:',
                    )}${fullCase.events.dateEntry}`,
                )
                .expect(200);
            expect(res.body.cases).toHaveLength(1);
        });
        it('should use age buckets in results', async () => {
            const c = new Day0Case(minimalDay0CaseData);
            const aBucket = await AgeBucket.findOne({});
            c.demographics.ageBuckets = [aBucket!._id];
            await c.save();
            const res = await request(app)
                .get('/api/cases?page=1&limit=10')
                .expect(200)
                .expect('Content-Type', /json/);
            expect(res.body.cases[0].demographics.ageRange.start).toEqual(
                aBucket!.start,
            );
            expect(res.body.cases[0].demographics.ageRange.end).toEqual(
                aBucket!.end,
            );
        });
        describe('keywords', () => {
            beforeEach(async () => {
                const c = new Day0Case(minimalDay0CaseData);
                c.location.countryISO3 = 'DEU';
                c.set('demographics.occupation', 'engineer');
                await c.save();
            });
            it('returns no case if no match', async () => {
                const res = await request(app)
                    .get('/api/cases?page=1&limit=1&q=country%3ACHX')
                    .expect(200)
                    .expect('Content-Type', /json/);
                expect(res.body.cases).toHaveLength(0);
                expect(res.body.total).toEqual(0);
            });
            it('returns the case if matches', async () => {
                await request(app)
                    .get('/api/cases?page=1&limit=1&q=country%3ADEU')
                    .expect(200, /DE/)
                    .expect('Content-Type', /json/);
            });
            it('returns no case if no wildcard match', async () => {
                const res = await request(app)
                    .get('/api/cases?page=1&limit=1&q=place%3A%2A')
                    .expect('Content-Type', /json/);
                expect(res.body.cases).toHaveLength(0);
                expect(res.body.total).toEqual(0);
            });
            it('returns the case if non case sensitive matches', async () => {
                await request(app)
                    .get('/api/cases?page=1&limit=1&q=country%3Adeu')
                    .expect(200, /DE/)
                    .expect('Content-Type', /json/);
            });
            it('Search for matching country and something else that does not match', async () => {
                const res = await request(app)
                    .get(
                        '/api/cases?page=1&limit=1&q=country%3ADE%20occupation%3Anope',
                    )
                    .expect(200)
                    .expect('Content-Type', /json/);
                expect(res.body.cases).toHaveLength(0);
                expect(res.body.total).toEqual(0);
            });
            it('Search for matching country and something else that also matches', async () => {
                await request(app)
                    .get(
                        '/api/cases?page=1&limit=1&q=country%3ADEU%20occupation%3Aengineer',
                    )
                    .expect(200, /engineer/)
                    .expect('Content-Type', /json/);
            });
            it('Search for multiple occurrences of the same keyword', async () => {
                await request(app)
                    .get(
                        '/api/cases?page=1&limit=1&q=country%3ADEU%20country%3APE',
                    )
                    .expect(200, /DE/)
                    .expect('Content-Type', /json/);
            });
        });
        it('rejects invalid searches', (done) => {
            request(app).get('/api/cases?q=country%3A').expect(422, done);
        });
        it('rejects negative page param', (done) => {
            request(app).get('/api/cases?page=-7').expect(400, done);
        });
        it('rejects negative limit param', (done) => {
            request(app).get('/api/cases?page=1&limit=-2').expect(400, done);
        });
    });

    describe('list symptoms', () => {
        it('should return 200 OK', () => {
            return request(app).get('/api/cases/symptoms?limit=5').expect(200);
        });
        // @TODO - Once the symptoms will be stored as array in DB this test will work
        it.skip('should show most frequently used symptoms', async () => {
            for (let i = 1; i <= 5; i++) {
                const c = new Day0Case(minimalDay0CaseData);
                c.set({
                    symptoms: Array.from(
                        Array(i),
                        (_, index) => `symptom${index + 1}`,
                    ),
                });
                await c.save();
            }
            const res = await request(app)
                .get('/api/cases/symptoms?limit=3')
                .expect(200);
            expect(res.body.symptoms).toEqual([
                'symptom1',
                'symptom2',
                'symptom3',
            ]);
        });
        it('rejects negative limit param', (done) => {
            request(app).get('/api/cases/symptoms?limit=-2').expect(400, done);
        });
    });

    describe('list occupations', () => {
        it('should return 200 OK', () => {
            return request(app)
                .get('/api/cases/occupations?limit=5')
                .expect(200);
        });
        it('should show most frequently used occupations', async () => {
            for (let i = 1; i <= 4; i++) {
                const c = new Day0Case(minimalDay0CaseData);
                c.set({
                    demographics: {
                        occupation: 'occupation 1',
                    },
                });
                await c.save();
            }
            for (let i = 1; i <= 3; i++) {
                const c = new Day0Case(minimalDay0CaseData);
                c.set({
                    demographics: {
                        occupation: 'occupation 2',
                    },
                });
                await c.save();
            }
            for (let i = 1; i <= 2; i++) {
                const c = new Day0Case(minimalDay0CaseData);
                c.set({
                    demographics: {
                        occupation: 'occupation 3',
                    },
                });
                await c.save();
            }
            const c = new Day0Case(minimalDay0CaseData);
            c.set({
                demographics: {
                    occupation: 'occupation 4',
                },
            });
            await c.save();
            const res = await request(app)
                .get('/api/cases/occupations?limit=3')
                .expect(200);
            expect(res.body.occupations).toEqual([
                'occupation 1',
                'occupation 2',
                'occupation 3',
            ]);
        });
        it('rejects negative limit param', (done) => {
            request(app)
                .get('/api/cases/occupations?limit=-2')
                .expect(400, done);
        });
    });
});

describe('POST', () => {
    // beforeEach(() => {
    //     seedFakeGeocodes('Canada', {
    //         country: 'CAN',
    //         geoResolution: 'Country',
    //         geometry: { latitude: 42.42, longitude: 11.11 },
    //         name: 'Canada',
    //     });
    // });
    it('create with input missing required properties should return 400', () => {
        return request(app).post('/api/cases').send({}).expect(400);
    });
    it('create with required properties but invalid input should return 422', () => {
        seedFakeGeocodes('Canada', {
            country: 'CA',
            geoResolution: 'Country',
            geometry: { latitude: 42.42, longitude: 11.11 },
            name: 'Canada',
        });

        return request(app).post('/api/cases').send(invalidRequest).expect(422);
    });
    it('rejects negative num_cases param', () => {
        return request(app)
            .post('/api/cases?num_cases=-2')
            .send(minimalRequest)
            .expect(400);
    });
    it('create with valid input should return 201 OK', async () => {
        seedFakeGeocodes('Canada', {
            country: 'CA',
            geoResolution: 'Country',
            geometry: { latitude: 42.42, longitude: 11.11 },
            name: 'Canada',
        });

        await request(app)
            .post('/api/cases')
            .send({
                ...minimalRequest,
                curators: { createdBy: curator._id },
            })
            .expect('Content-Type', /json/)
            .expect(201);
        expect(await Day0Case.collection.countDocuments()).toEqual(1);
    });
    it('create with only required location fields should complete geoResolution with "Country"', async () => {
        const minimalLocationRequest = {
            ...minimalRequest,
            location: {
                countryISO3: 'USA',
                country: 'United States of America',
                query: 'United States of America',
            },
        };

        const expectedLocation = {
            country: 'United States of America',
            geoResolution: 'Country',
            countryISO3: 'USA',
            query: 'United States of America',
        };

        const res = await request(app)
            .post('/api/cases')
            .send({
                ...minimalLocationRequest,
                curators: { createdBy: curator._id },
            })
            .expect('Content-Type', /json/)
            .expect(201);

        expect(res.body.location).toEqual(expectedLocation);
    });
    it('create with location containing admin1 should complete geoResolution with "Admin1"', async () => {
        const minimalLocationRequest = {
            ...minimalRequest,
            location: {
                countryISO3: 'USA',
                country: 'United States of America',
                admin1: 'Florida',
                query: 'Florida, United States of America',
            },
        };

        const expectedLocation = {
            country: 'United States of America',
            geoResolution: 'Admin1',
            countryISO3: 'USA',
            admin1: 'Florida',
            query: 'Florida, United States of America',
        };

        const res = await request(app)
            .post('/api/cases')
            .send({
                ...minimalLocationRequest,
                curators: { createdBy: curator._id },
            })
            .expect('Content-Type', /json/)
            .expect(201);

        expect(res.body.location).toEqual(expectedLocation);
    });
    it('create with location containing admin2 should complete geoResolution with "Admin2"', async () => {
        const minimalLocationRequest = {
            ...minimalRequest,
            location: {
                countryISO3: 'USA',
                country: 'United States of America',
                admin1: 'Florida',
                admin2: 'Collier County',
                query: 'Collier County, Florida, United States of America',
            },
        };

        const expectedLocation = {
            country: 'United States of America',
            geoResolution: 'Admin2',
            countryISO3: 'USA',
            admin1: 'Florida',
            admin2: 'Collier County',
            query: 'Collier County, Florida, United States of America',
        };

        const res = await request(app)
            .post('/api/cases')
            .send({
                ...minimalLocationRequest,
                curators: { createdBy: curator._id },
            })
            .expect('Content-Type', /json/)
            .expect(201);

        expect(res.body.location).toEqual(expectedLocation);
    });
    it('create with location containing admin3 should complete geoResolution with "Admin3"', async () => {
        const minimalLocationRequest = {
            ...minimalRequest,
            location: {
                countryISO3: 'USA',
                country: 'United States of America',
                admin1: 'Florida',
                admin2: 'Collier County',
                admin3: 'Naples',
                query: 'Naples, Collier County, Florida, United States of America',
            },
        };

        const expectedLocation = {
            country: 'United States of America',
            geoResolution: 'Admin3',
            countryISO3: 'USA',
            admin1: 'Florida',
            admin2: 'Collier County',
            admin3: 'Naples',
            query: 'Naples, Collier County, Florida, United States of America',
        };

        const res = await request(app)
            .post('/api/cases')
            .send({
                ...minimalLocationRequest,
                curators: { createdBy: curator._id },
            })
            .expect('Content-Type', /json/)
            .expect(201);

        expect(res.body.location).toEqual(expectedLocation);
    });
    it('create with location containing geometry should complete geoResolution with "Point"', async () => {
        const minimalLocationRequest = {
            ...minimalRequest,
            location: {
                countryISO3: 'USA',
                country: 'United States of America',
                admin1: 'Florida',
                admin2: 'Collier County',
                admin3: 'Naples',
                geometry: {
                    latitude: 26.1295,
                    longitude: -81.8056,
                },
                query: 'Naples, Collier County, Florida, United States of America',
            },
        };

        const expectedLocation = {
            country: 'United States of America',
            geoResolution: 'Point',
            countryISO3: 'USA',
            admin1: 'Florida',
            admin2: 'Collier County',
            admin3: 'Naples',
            geometry: {
                latitude: 26.1295,
                longitude: -81.8056,
            },
            query: 'Naples, Collier County, Florida, United States of America',
        };

        const res = await request(app)
            .post('/api/cases')
            .send({
                ...minimalLocationRequest,
                curators: { createdBy: curator._id },
            })
            .expect('Content-Type', /json/)
            .expect(201);

        expect(res.body.location).toEqual(expectedLocation);
    });
    it('create with overrided geoResolution', async () => {
        seedFakeGeocodes('Canada', {
            country: 'CAN',
            geoResolution: 'Country',
            geometry: { latitude: 42.42, longitude: 11.11 },
            name: 'Canada',
        });

        const minimalLocationRequest = {
            ...minimalRequest,
            location: {
                countryISO3: 'CAN',
                country: 'Canada',
                query: 'Canada',
                geoResolution: 'Admin3',
            },
        };

        const expectedLocation = {
            country: 'Canada',
            countryISO3: 'CAN',
            geoResolution: 'Admin3',
            query: 'Canada',
        };

        const res = await request(app)
            .post('/api/cases')
            .send({
                ...minimalLocationRequest,
                curators: { createdBy: curator._id },
            })
            .expect('Content-Type', /json/)
            .expect(201);

        expect(res.body.location).toEqual(expectedLocation);
    });
    it('create with valid input should bucket the age range', async () => {
        seedFakeGeocodes('Canada', {
            country: 'CAN',
            geoResolution: 'Country',
            geometry: { latitude: 42.42, longitude: 11.11 },
            name: 'Canada',
        });

        await request(app)
            .post('/api/cases')
            .send({ ...minimalRequest, curators: { createdBy: curator._id } })
            .expect('Content-Type', /json/)
            .expect(201);
        const theCase = await Day0Case.findOne({});
        // case has range 40-50, should be bucketed into 36-40, 41-45, 46-50
        expect(theCase!.demographics.ageBuckets).toHaveLength(3);
    });
    it('GETting the POSTed case should return an age range', async () => {
        seedFakeGeocodes('Canada', {
            country: 'CAN',
            geoResolution: 'Country',
            geometry: { latitude: 42.42, longitude: 11.11 },
            name: 'Canada',
        });

        const theCase = await request(app)
            .post('/api/cases')
            .send({ ...minimalRequest, curators: { createdBy: curator._id } })
            .expect('Content-Type', /json/)
            .expect(201);

        const res = await request(app)
            .get(`/api/cases/${theCase.body._id}`)
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body[0].demographics.ageRange).toEqual({
            start: 36,
            end: 50,
        });
    });
    it('create many cases with valid input should return 201 OK', async () => {
        seedFakeGeocodes('Canada', {
            country: 'CAN',
            geoResolution: 'Country',
            geometry: { latitude: 42.42, longitude: 11.11 },
            name: 'Canada',
        });

        const res = await request(app)
            .post('/api/cases?num_cases=3')
            .send({ ...minimalRequest, curators: { createdBy: curator._id } })
            .expect('Content-Type', /json/)
            .expect(201);
        expect(res.body.cases).toHaveLength(3);
        expect(await Day0Case.collection.countDocuments()).toEqual(3);
    });
    // it.skip('create with valid input should result in correct creation metadata', async () => {
    //     const res = await request(app)
    //         .post('/api/cases')
    //         .send(minimalRequest)
    //         .expect('Content-Type', /json/)
    //         .expect(201);

    //     expect(res.body.revisionMetadata.revisionNumber).toEqual(0);
    //     expect(res.body.revisionMetadata.creationMetadata.curator).toEqual(
    //         minimalRequest.curator.email,
    //     );
    //     expect(res.body).not.toHaveProperty('curator');
    // });
    it('create with valid input should not create case revision', async () => {
        seedFakeGeocodes('Canada', {
            country: 'CAN',
            geoResolution: 'Country',
            geometry: { latitude: 42.42, longitude: 11.11 },
            name: 'Canada',
        });

        await request(app)
            .post('/api/cases')
            .send({ ...minimalRequest, curators: { createdBy: curator._id } })
            .expect('Content-Type', /json/)
            .expect(201);
        expect(await CaseRevision.collection.countDocuments()).toEqual(0);
    });
    it('create with input missing required properties and validate_only should return 400', async () => {
        return request(app)
            .post('/api/cases?validate_only=true')
            .send({})
            .expect(400);
    });
    it('create with valid input and validate_only should not save case', async () => {
        seedFakeGeocodes('Canada', {
            country: 'CAN',
            geoResolution: 'Country',
            geometry: { latitude: 42.42, longitude: 11.11 },
            name: 'Canada',
        });

        const res = await request(app)
            .post('/api/cases?validate_only=true')
            .send({ ...minimalRequest, curators: { createdBy: curator._id } })
            .expect('Content-Type', /json/)
            .expect(201);

        expect(await Day0Case.collection.countDocuments()).toEqual(0);
        expect(res.body._id).toBe(undefined);
    });
    it('batch upsert with no body should return 415', () => {
        return request(app).post('/api/cases/batchUpsert').expect(415);
    });
    it('batch upsert with no cases should return 400', () => {
        return request(app).post('/api/cases/batchUpsert').send({}).expect(400);
    });
    it('batch upsert with only valid cases should return 200 with counts', async () => {
        seedFakeGeocodes('Canada', {
            country: 'CAN',
            geoResolution: 'Country',
            geometry: { latitude: 42.42, longitude: 11.11 },
            name: 'Canada',
        });

        seedFakeGeocodes('France', {
            country: 'FR',
            geoResolution: 'Country',
            geometry: { latitude: 42.42, longitude: 11.11 },
            name: 'France',
        });

        const newCaseWithoutEntryId = new Day0Case(minimalCase);
        const newCaseWithEntryId = new Day0Case(fullCase);
        newCaseWithEntryId.caseReference.sourceEntryId = 'newId';

        const changedCaseWithEntryId_ = new Day0Case(fullCase);
        await changedCaseWithEntryId_.save();
        const changedCaseWithEntryId = new Day0Case(fullCase);
        changedCaseWithEntryId.pathogen = 'Pneumonia';

        const unchangedCaseWithEntryId_ = new Day0Case(fullCase);
        unchangedCaseWithEntryId_.caseReference.sourceEntryId =
            'unchangedEntryId';
        unchangedCaseWithEntryId_.location.country = 'FR';
        await unchangedCaseWithEntryId_.save();
        const unchangedCaseWithEntryId = new Day0Case(fullCase);
        unchangedCaseWithEntryId.caseReference.sourceEntryId =
            'unchangedEntryId';
        unchangedCaseWithEntryId.location.country = 'FR';

        const res = await request(app)
            .post('/api/cases/batchUpsert')
            .send({
                cases: [
                    newCaseWithoutEntryId,
                    newCaseWithEntryId,
                    changedCaseWithEntryId,
                    unchangedCaseWithEntryId,
                ],
                ...curatorMetadata,
            })
            .expect(200);

        const unchangedDbCase = await Day0Case.findById(
            unchangedCaseWithEntryId_._id,
        );
        expect(unchangedDbCase?.toJSON()).toEqual(
            unchangedCaseWithEntryId_.toJSON(),
        );
        expect(res.body.numCreated).toBe(2); // Both new cases were created.
        expect(res.body.numUpdated).toBe(1); // Only changed case was updated.
    });
    it('batch upsert with same case twice should not update anything', async () => {
        seedFakeGeocodes('Canada', {
            country: 'CAN',
            geoResolution: 'Country',
            geometry: { latitude: 42.42, longitude: 11.11 },
            name: 'Canada',
        });

        const newCaseWithEntryId = new Day0Case(minimalCase);
        newCaseWithEntryId.caseReference.sourceEntryId = 'newId';

        const res = await request(app)
            .post('/api/cases/batchUpsert')
            .send({
                cases: [newCaseWithEntryId],
                ...curatorMetadata,
            })
            .expect(200);

        expect(res.body.numCreated).toBe(1); // Exactly one case created.
        expect(res.body.numUpdated).toBe(0); // No case was updated.

        const secondRes = await request(app)
            .post('/api/cases/batchUpsert')
            .send({
                cases: [
                    newCaseWithEntryId, // same case again!
                ],
                ...curatorMetadata,
            })
            .expect(200);

        expect(secondRes.body.numCreated).toBe(0); // No case created this time.
        expect(res.body.numUpdated).toBe(0); // No case was updated either.
    });

    // @TODO
    it.skip('batch upsert should add uploadId to field array', async () => {
        seedFakeGeocodes('France', {
            country: 'FR',
            geoResolution: 'Country',
            geometry: { latitude: 42.42, longitude: 11.11 },
            name: 'France',
        });

        const newUploadIds = ['012301234567890123456789'];

        const newCaseWithoutEntryId = new Day0Case(minimalCase);
        newCaseWithoutEntryId.caseReference.uploadIds = newUploadIds;
        const newCaseWithEntryId = new Day0Case(fullCase);
        newCaseWithEntryId.caseReference.sourceEntryId = 'newId';
        newCaseWithEntryId.caseReference.uploadIds = newUploadIds;

        const changedCaseWithEntryId = new Day0Case(fullCase);
        await changedCaseWithEntryId.save();
        changedCaseWithEntryId.caseReference.uploadIds = newUploadIds;
        changedCaseWithEntryId.pathogen = 'Pneumonia';

        const unchangedCaseWithEntryId = new Day0Case(fullCase);
        unchangedCaseWithEntryId.caseReference.sourceEntryId =
            'unchangedEntryId';
        const unchangedCaseUploadIds =
            unchangedCaseWithEntryId.caseReference.uploadIds;
        await unchangedCaseWithEntryId.save();
        unchangedCaseWithEntryId.caseReference.uploadIds = newUploadIds;

        const res = await request(app)
            .post('/api/cases/batchUpsert')
            .send({
                cases: [
                    newCaseWithoutEntryId,
                    newCaseWithEntryId,
                    changedCaseWithEntryId,
                    unchangedCaseWithEntryId,
                ],
                ...curatorMetadata,
            })
            .expect(200);

        const unchangedDbCase = await Day0Case.findById(
            unchangedCaseWithEntryId._id,
        );
        // Upload ids were not changed for unchanged case.
        expect(unchangedDbCase?.caseReference?.uploadIds).toHaveLength(3);
        expect(unchangedDbCase?.caseReference?.uploadIds[0]).toEqual(
            unchangedCaseUploadIds[0],
        );
        expect(unchangedDbCase?.caseReference?.uploadIds[1]).toEqual(
            unchangedCaseUploadIds[1],
        );
        expect(res.body.numCreated).toBe(2); // Both new cases were created.
        expect(res.body.numUpdated).toBe(1); // Only changed case was updated.

        // Upload ids were added for changed case.
        const changedDbCase = await Day0Case.findById(
            changedCaseWithEntryId._id,
        );
        expect(changedDbCase?.caseReference?.uploadIds).toHaveLength(3);
        expect(changedDbCase?.caseReference?.uploadIds[0]).toEqual(
            newUploadIds[0],
        );
        expect(changedDbCase?.caseReference?.uploadIds[1]).toEqual(
            unchangedCaseUploadIds[0],
        );
        expect(changedDbCase?.caseReference?.uploadIds[2]).toEqual(
            unchangedCaseUploadIds[1],
        );
    });
    it('batch upsert should set the age buckets', async () => {
        seedFakeGeocodes('France', {
            country: 'FR',
            geoResolution: 'Country',
            geometry: { latitude: 42.42, longitude: 11.11 },
            name: 'France',
        });

        const res = await request(app)
            .post('/api/cases/batchUpsert')
            .send({
                cases: [fullCase],
                ...curatorMetadata,
            })
            .expect(200);

        expect(res.body.numCreated).toBe(1); // A new case was created.
        expect(res.body.numUpdated).toBe(0); // No case was updated.

        const updatedCaseInDb = await Day0Case.find()
            .sort({ _id: -1 })
            .limit(1); // latest case
        expect(updatedCaseInDb[0]?.demographics.ageBuckets).toHaveLength(3);
    });
    it('geocodes everything that is necessary', async () => {
        seedFakeGeocodes('Canada', {
            country: 'CAN',
            geoResolution: 'Country',
            geometry: { latitude: 42.42, longitude: 11.11 },
            name: 'Canada',
        });
        await request(app)
            .post('/api/cases')
            .send({
                ...caseMustGeocode,
                ...curatorMetadata,
            })
            .expect(201)
            .expect('Content-Type', /json/);
        expect(
            await Day0Case.collection.findOne({ 'location.name': 'CA' }),
        ).toBeDefined();
    });
    // Now geocoding is not performed after submitting form
    it.skip('throws if cannot geocode', async () => {
        await request(app)
            .post('/api/cases')
            .send({
                ...caseMustGeocode,
                ...curatorMetadata,
            })
            .expect(404, /Geocode not found/)
            .expect('Content-Type', /json/);
    });
    // @TODO: Case revisions functionality is missing for now
    it.skip('batch upsert should result in case revisions of existing cases', async () => {
        seedFakeGeocodes('Canada', {
            country: 'CAN',
            geoResolution: 'Country',
            geometry: { latitude: 42.42, longitude: 11.11 },
            name: 'Canada',
        });

        const existingCase = new Day0Case(fullDay0CaseData);
        await existingCase.save();
        existingCase.pathogen = 'Pneumonia';

        await request(app)
            .post('/api/cases/batchUpsert')
            .send({
                cases: [existingCase, minimalCase],
                ...curatorMetadata,
            });

        expect(await CaseRevision.collection.countDocuments()).toEqual(1);
    });
    it('batch upsert with any invalid case should return 207', async () => {
        seedFakeGeocodes('Canada', {
            country: 'CAN',
            geoResolution: 'Country',
            geometry: { latitude: 42.42, longitude: 11.11 },
            name: 'Canada',
        });

        const res = await request(app)
            .post('/api/cases/batchUpsert')
            .send({
                cases: [minimalDay0CaseData, invalidRequest],
                ...curatorMetadata,
            })
            .expect(207, /Day0Case validation failed/);
        expect(res.body.numCreated).toEqual(1);
    });
    it('batch upsert with empty cases should return 400', async () => {
        return request(app)
            .post('/api/cases/batchUpsert')
            .send({ cases: [] })
            .expect(400);
    });
});

describe('download', () => {
    it('should return 200 OK', async () => {
        const destination = './test_return.csv';
        const fileStream = fs.createWriteStream(destination);

        const c = new Day0Case(minimalDay0CaseData);
        c.set({ 'events.dateLastModified': '2025-01-12T12:00:00.000Z' });
        await c.save();
        const c2 = new Day0Case(fullDay0CaseData);
        c2.set({ 'events.dateLastModified': '2025-01-13T12:00:00.000Z' });
        await c2.save();
        await new Promise<void>((resolve, reject): void => {
            const req = request(app)
                .post('/api/cases/download')
                .send({ format: 'csv' })
                .expect('Content-Type', 'text/csv')
                .expect(200)
                .parse(stringParser);

            const responseStream = req.pipe(fileStream);
            responseStream.on('finish', () => {
                const text: string = fs
                    .readFileSync(destination)
                    .toString('utf-8');
                expect(text).toContain(
                    '_id,caseReference.additionalSources,caseReference.isGovernmentSource,caseReference.sourceUrl,caseStatus,demographics.ageRange.end,demographics.ageRange.start,demographics.gender,demographics.healthcareWorker,demographics.occupation,events.confirmationMethod,events.dateAdmissionICU,events.dateConfirmation,events.dateDeath,events.dateDischargeHospital,events.dateDischargeICU,events.dateEntry,events.dateHospitalization,events.dateIsolation,events.dateLastModified,events.dateOfFirstConsult,events.dateOnset,events.dateRecovered,events.dateReported,events.homeMonitoring,events.hospitalized,events.intensiveCare,events.isolated,events.outcome,events.reasonForHospitalization,genomeSequences.accessionNumber,genomeSequences.genomicsMetadata,location.admin1,location.admin2,location.admin3,location.country,location.countryISO3,location.location,location.query,pathogen,preexistingConditions.coInfection,preexistingConditions.preexistingCondition,preexistingConditions.pregnancyStatus,preexistingConditions.previousInfection,symptoms,transmission.contactAnimal,transmission.contactComment,transmission.contactId,transmission.contactSetting,transmission.contactWithCase,transmission.transmission,travelHistory.travelHistory,travelHistory.travelHistoryCountry,travelHistory.travelHistoryEntry,travelHistory.travelHistoryLocation,travelHistory.travelHistoryStart,vaccination.vaccination,vaccination.vaccineDate,vaccination.vaccineName,vaccination.vaccineSideEffects',
                );
                expect(text).toContain(String(c._id));
                expect(text).toContain(c.caseStatus);
                expect(text).toContain('2025-01-12');
                expect(text).toContain(c.caseReference.sourceId);
                expect(text).toContain(String(c2._id));
                expect(text).toContain(c2.caseStatus);
                expect(text).toContain('2025-01-13');
                expect(text).toContain(c2.caseReference.sourceId);

                resolve();
            });
        });
    });
    it('should use the age buckets in the download', async () => {
        const destination = './test_buckets.csv';
        const fileStream = fs.createWriteStream(destination);

        const c = new Day0Case(minimalDay0CaseData);
        await c.save();

        const responseStream = request(app)
            .post('/api/cases/download')
            .send({ format: 'csv' })
            .expect('Content-Type', 'text/csv')
            .expect(200)
            .parse(stringParser);

        responseStream.pipe(fileStream);
        responseStream.on('finish', () => {
            const text: string = fs.readFileSync(destination).toString('utf-8');
            expect(text).toContain('35');
            expect(text).toContain('50');

            fs.unlinkSync(destination);
        });
    });
    it('rejects invalid searches', (done) => {
        request(app)
            .post('/api/cases/download')
            .send({
                query: 'country:',
                format: 'csv',
            })
            .expect(422, done);
    });
    it('rejects request bodies with query and caseIds', async () => {
        const c = new Day0Case(minimalDay0CaseData);
        await c.save();

        await request(app)
            .post('/api/cases/download')
            .send({
                query: 'country:India',
                caseIds: [c._id],
                format: 'csv',
            })
            .expect(400);
    });
    it('should filter results with caseIDs', async () => {
        const destination = './test_filter_caseIDs.csv';
        const fileStream = fs.createWriteStream(destination);

        const matchingCase = new Day0Case(minimalDay0CaseData);
        await matchingCase.save();

        const matchingCase2 = new Day0Case(minimalDay0CaseData);
        await matchingCase2.save();

        const unmatchedCase = new Day0Case(minimalDay0CaseData);
        await unmatchedCase.save();

        const responseStream = request(app)
            .post('/api/cases/download')
            .send({
                caseIds: [matchingCase._id, matchingCase2._id],
                format: 'csv',
            })
            .expect('Content-Type', 'text/csv')
            .expect(200)
            .parse(stringParser);

        responseStream.pipe(fileStream);
        responseStream.on('finish', () => {
            const text: string = fs.readFileSync(destination).toString('utf-8');
            expect(text).toContain(
                '_id,caseReference.additionalSources,caseReference.sourceEntryId,caseReference.sourceId',
            );
            expect(text).toContain(matchingCase._id);
            expect(text).toContain(matchingCase2._id);
            expect(text).not.toContain(unmatchedCase._id);

            fs.unlinkSync(destination);
        });
    });
    // @TODO
    it.skip('should filter results with text query', async () => {
        // Simulate index creation used in unit tests, in production they are
        // setup by the migrations and such indexes are not present by
        // default in the in memory mongo spawned by unit tests.
        const destination = './test_filter_text_query.csv';
        const fileStream = fs.createWriteStream(destination);

        await mongoose.connection.collection('cases').createIndex({
            notes: 'text',
        });

        const matchingCase = new Day0Case(minimalDay0CaseData);
        const matchingNotes = 'matching';
        await matchingCase.save();

        const unmatchedCase = new Day0Case(minimalDay0CaseData);
        const unmatchedNotes = 'unmatched';
        await unmatchedCase.save();

        const responseStream = request(app)
            .post('/api/cases/download')
            .send({
                query: matchingNotes,
                format: 'csv',
            })
            .expect('Content-Type', 'text/csv')
            .expect(200)
            .parse(stringParser);

        responseStream.pipe(fileStream);
        responseStream.on('finish', () => {
            const text: string = fs.readFileSync(destination).toString('utf-8');
            expect(text).toContain(
                '_id,caseReference.additionalSources,caseReference.sourceEntryId,caseReference.sourceId',
            );
            expect(text).toContain(matchingNotes);
            expect(text).toContain(matchingCase._id);
            expect(text).toContain(matchingNotes);
            expect(text).not.toContain(unmatchedCase._id);
            expect(text).not.toContain(unmatchedNotes);

            fs.unlinkSync(destination);
        });
    });
    it('should filter results with keyword query', async () => {
        const destination = './test_filter_keyword_query.csv';
        const fileStream = fs.createWriteStream(destination);

        const matchedCase = new Day0Case(minimalDay0CaseData);
        matchedCase.location.country = 'DE';
        matchedCase.set('demographics.occupation', 'engineer');
        await matchedCase.save();

        const unmatchedCase = new Day0Case(minimalDay0CaseData);
        await unmatchedCase.save();

        const responseStream = request(app)
            .post('/api/cases/download')
            .send({
                query: 'country:DE',
                format: 'csv',
            })
            .expect('Content-Type', 'text/csv')
            .expect(200)
            .parse(stringParser);

        responseStream.pipe(fileStream);
        responseStream.on('finish', () => {
            const text: string = fs.readFileSync(destination).toString('utf-8');
            expect(text).toContain(
                '_id,caseReference.additionalSources,caseReference.sourceEntryId,caseReference.sourceId',
            );
            expect(text).toContain('DE');
            expect(text).toContain(matchedCase._id);
            expect(text).not.toContain(unmatchedCase._id);

            fs.unlinkSync(destination);
        });
    });
});
it('should return results in proper format', async () => {
    const matchedCase = new Day0Case(minimalDay0CaseData);
    matchedCase.location.country = 'DE';
    await matchedCase.save();

    //CSV
    await request(app)
        .post('/api/cases/download')
        .send({
            query: 'country:DE',
            format: 'csv',
        })
        .expect('Content-Type', 'text/csv')
        .expect(200);

    //TSV
    await request(app)
        .post('/api/cases/download')
        .send({
            query: 'country:DE',
            format: 'tsv',
        })
        .expect('Content-Type', 'text/tsv')
        .expect(200);

    //JSON
    await request(app)
        .post('/api/cases/download')
        .send({
            query: 'country:DE',
            format: 'json',
        })
        .expect('Content-Type', 'application/json')
        .expect(200);
});

describe('PUT', () => {
    it('update present item should return 200 OK', async () => {
        const c = new Day0Case(minimalDay0CaseData);
        await c.save();

        const newStatus = 'suspected';
        const res = await request(app)
            .put(`/api/cases/${c._id}`)
            .send({ ...curatorMetadata, caseStatus: newStatus })
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body.caseStatus).toEqual(newStatus);
    });
    it('update present item with new age range should change the age buckets', async () => {
        const c = new Day0Case(minimalDay0CaseData);
        await c.save();

        const newAgeRange = {
            start: 6,
            end: 7,
        };
        const res = await request(app)
            .put(`/api/cases/${c._id}`)
            .send({
                ...curatorMetadata,
                demographics: {
                    ageRange: newAgeRange,
                },
            })
            .expect('Content-Type', /json/)
            .expect(200);
        expect(res.body.demographics.ageRange.start).toEqual(6);
        expect(res.body.demographics.ageRange.end).toEqual(10);
    });
    it('update present item should create case revision', async () => {
        const c = new Day0Case(minimalDay0CaseData);
        await c.save();

        const newComment = 'abc';
        await request(app)
            .put(`/api/cases/${c._id}`)
            .send({ ...curatorMetadata, comment: newComment })
            .expect('Content-Type', /json/)
            .expect(200);

        expect(await CaseRevision.collection.countDocuments()).toEqual(1);
        expect(
            JSON.parse(JSON.stringify((await CaseRevision.find())[0].case)),
        ).toEqual(JSON.parse(JSON.stringify(c.toObject())));
    });
    it('invalid update present item should return 422', async () => {
        const c = new Day0Case(minimalDay0CaseData);
        await c.save();

        return request(app)
            .put(`/api/cases/${c._id}`)
            .send({ ...curatorMetadata, location: {} })
            .expect(422);
    });
    it('update absent item should return 404 NOT FOUND', () => {
        return request(app)
            .put('/api/cases/123456789')
            .send(curatorMetadata)
            .expect(404);
    });
    it('update many items should return 200 OK', async () => {
        const c = new Day0Case(minimalDay0CaseData);
        await c.save();
        const c2 = new Day0Case(minimalDay0CaseData);
        await c2.save();
        await new Day0Case(minimalDay0CaseData).save();

        const newStatus = 'suspected';
        const newStatus2 = 'omit_error';
        const res = await request(app)
            .post('/api/cases/batchUpdate')
            .send({
                ...curatorMetadata,
                cases: [
                    { _id: c._id, caseStatus: newStatus },
                    { _id: c2._id, caseStatus: newStatus2 },
                ],
            })
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body.numModified).toEqual(2);
        const cases = await Day0Case.find();
        expect(cases[0].caseStatus).toEqual(newStatus);
        expect(cases[1].caseStatus).toEqual(newStatus2);
    });
    it('update many items should update the age buckets', async () => {
        const c = new Day0Case(minimalDay0CaseData);
        await c.save();

        const ageRange = {
            start: 1,
            end: 9,
        };

        const res = await request(app)
            .post('/api/cases/batchUpdate')
            .send({
                ...curatorMetadata,
                cases: [
                    {
                        _id: c._id,
                        demographics: {
                            ageRange,
                        },
                    },
                ],
            })
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body.numModified).toEqual(1);
        const cases = await Day0Case.find();
        expect(cases[0].demographics.ageBuckets).toHaveLength(2);
    });
    it('update many items without _id should return 422', async () => {
        const c = new Day0Case(minimalDay0CaseData);
        await c.save();
        const c2 = new Day0Case(minimalDay0CaseData);
        await c2.save();
        await new Day0Case(minimalDay0CaseData).save();

        const newStatus = 'suspected';
        const newStatus2 = 'omit_error';
        await request(app)
            .post('/api/cases/batchUpdate')
            .send({
                ...curatorMetadata,
                cases: [
                    { _id: c._id, caseStatus: newStatus },
                    { caseStatus: newStatus2 },
                ],
            })
            .expect('Content-Type', /json/)
            .expect(422);
    });
    // @TODO - refactor update by query functionality
    it.skip('update many items from query should return 200 OK', async () => {
        // Simulate index creation used in unit tests, in production they are
        // setup by the migrations script and such indexes are not present by
        // default in the in memory mongo spawned by unit tests.
        await mongoose.connection.collection('cases').createIndex({
            notes: 'text',
        });

        const c = new Day0Case(minimalDay0CaseData);
        c.caseStatus = CaseStatus.Suspected;
        await c.save();
        const c2 = new Day0Case(minimalDay0CaseData);
        c2.caseStatus = CaseStatus.Suspected;
        await c2.save();
        const c3 = new Day0Case(minimalDay0CaseData);
        const unchangedStatus = CaseStatus.Confirmed;
        c3.caseStatus = unchangedStatus;
        await c3.save();

        const newStatus = CaseStatus.OmitError;
        const res = await request(app)
            .post('/api/cases/batchUpdateQuery')
            .send({
                ...curatorMetadata,
                query: 'test case',
                case: { caseStatus: newStatus },
            })
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body.numModified).toEqual(2);
        const cases = await Day0Case.find();
        expect(cases[0].caseStatus).toEqual(newStatus);
        expect(cases[1].caseStatus).toEqual(newStatus);
        expect(cases[2].caseStatus).toEqual(unchangedStatus);
    });
    it('update many items with query without case should return 400', async () => {
        await request(app)
            .post('/api/cases/batchUpdateQuery')
            .send({
                ...curatorMetadata,
                query: 'test case',
            })
            .expect(400);
    });
    it('batchUpdateQuery without query should return 400', async () => {
        await request(app)
            .post('/api/cases/batchUpdateQuery')
            .send({
                ...curatorMetadata,
                case: { notes: 'new notes' },
            })
            .expect(400);
    });
    it('upsert present item should return 200 OK', async () => {
        const c = new Day0Case(minimalDay0CaseData);
        const sourceId = '5ea86423bae6982635d2e1f8';
        const entryId = 'def456';
        c.set('caseReference.sourceId', sourceId);
        c.set('caseReference.sourceEntryId', entryId);
        await c.save();

        const newStatus = CaseStatus.Suspected;
        const res = await request(app)
            .put('/api/cases')
            .send({
                caseReference: {
                    sourceId: sourceId,
                    sourceEntryId: entryId,
                    sourceUrl: 'cdc.gov',
                    isGovernmentSource: false,
                },
                caseStatus: newStatus,
                ...curatorMetadata,
            })
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body.caseStatus).toEqual(newStatus);
        expect(await c.collection.countDocuments()).toEqual(1);
    });
    it('upsert present item should update the age buckets', async () => {
        const c = new Day0Case(minimalDay0CaseData);
        const sourceId = '5ea86423bae6982635d2e1f8';
        const entryId = 'def456';
        c.set('caseReference.sourceId', sourceId);
        c.set('caseReference.sourceEntryId', entryId);
        await c.save();

        const ageRange = {
            start: 12,
            end: 13,
        };
        await request(app)
            .put('/api/cases')
            .send({
                caseReference: {
                    sourceId: sourceId,
                    sourceEntryId: entryId,
                    sourceUrl: 'cdc.gov',
                    isGovernmentSource: false,
                },
                demographics: {
                    ageRange,
                },
                ...curatorMetadata,
            })
            .expect('Content-Type', /json/)
            .expect(200);

        const updatedCase = await Day0Case.findOne({});
        expect(updatedCase?.demographics.ageBuckets).toHaveLength(1);
    });
    it('upsert present item should create case revision', async () => {
        const c = new Day0Case(minimalDay0CaseData);
        const sourceId = '5ea86423bae6982635d2e1f8';
        const entryId = 'def456';
        c.set('caseReference.sourceId', sourceId);
        c.set('caseReference.sourceEntryId', entryId);
        await c.save();

        const newStatus = CaseStatus.Suspected;
        return request(app)
            .put('/api/cases')
            .send({
                caseReference: {
                    sourceId: sourceId,
                    sourceEntryId: entryId,
                    sourceUrl: 'cdc.gov',
                    isGovernmentSource: false,
                },
                caseStatus: newStatus,
                ...curatorMetadata,
            })
            .expect('Content-Type', /json/)
            .expect(200);
    });

    it('upsert present item should result in update metadata', async () => {
        const c = new Day0Case(minimalDay0CaseData);
        const sourceId = '5ea86423bae6982635d2e1f8';
        const entryId = 'def456';
        c.set('caseReference.sourceId', sourceId);
        c.set('caseReference.sourceEntryId', entryId);
        await c.save();

        const newStatus = CaseStatus.Suspected;
        await request(app)
            .put('/api/cases')
            .send({
                caseReference: {
                    sourceId: sourceId,
                    sourceEntryId: entryId,
                    sourceUrl: 'cdc.gov',
                    isGovernmentSource: false,
                },
                caseStatus: newStatus,
                ...curatorMetadata,
            })
            .expect('Content-Type', /json/)
            .expect(200);

        expect(await CaseRevision.collection.countDocuments()).toEqual(1);
        // I needed to parse it using JSON to and from string to avoid issues with comparing object in strict mode
        expect(
            JSON.parse(JSON.stringify((await CaseRevision.find())[0].case)),
        ).toEqual(JSON.parse(JSON.stringify(c.toObject())));
    });
    it('upsert new item should return 201 CREATED', async () => {
        seedFakeGeocodes('Canada', {
            country: 'CAN',
            geoResolution: 'Country',
            geometry: { latitude: 42.42, longitude: 11.11 },
            name: 'Canada',
        });

        return request(app)
            .put('/api/cases')
            .send({ ...minimalRequest, curators: { createdBy: curator._id } })
            .expect('Content-Type', /json/)
            .expect(201);
    });
    it('upsert new item should not create a case revision', async () => {
        seedFakeGeocodes('Canada', {
            country: 'CAN',
            geoResolution: 'Country',
            geometry: { latitude: 42.42, longitude: 11.11 },
            name: 'Canada',
        });

        await request(app)
            .put('/api/cases')
            .send({ ...minimalRequest, curators: { createdBy: curator._id } })
            .expect('Content-Type', /json/)
            .expect(201);

        expect(await CaseRevision.collection.countDocuments()).toEqual(0);
    });
    it('upsert items without sourceEntryId should return 201 CREATED', async () => {
        seedFakeGeocodes('Canada', {
            country: 'CAN',
            geoResolution: 'Country',
            geometry: { latitude: 42.42, longitude: 11.11 },
            name: 'Canada',
        });

        // NB: Minimal case does not have a sourceEntryId.
        const firstUniqueCase = new Day0Case(minimalDay0CaseData);
        await firstUniqueCase.save();

        await request(app)
            .put('/api/cases')
            .send({ ...minimalCase, ...curatorMetadata })
            .expect('Content-Type', /json/)
            .expect(201);

        expect(await Day0Case.collection.countDocuments()).toEqual(2);
    });
    it('upsert new item without required fields should return 400', () => {
        return request(app).put('/api/cases').send({}).expect(400);
    });
    it('upsert new item with invalid input should return 422', () => {
        seedFakeGeocodes('Canada', {
            country: 'CAN',
            geoResolution: 'Country',
            geometry: { latitude: 42.42, longitude: 11.11 },
            name: 'Canada',
        });

        return request(app).put('/api/cases').send(invalidRequest).expect(422);
    });
    it('invalid upsert present item should return 422', async () => {
        const c = new Day0Case(minimalDay0CaseData);
        const sourceId = '5ea86423bae6982635d2e1f8';
        const entryId = 'def456';
        c.set('caseReference.sourceId', sourceId);
        c.set('caseReference.sourceEntryId', entryId);
        await c.save();

        return request(app)
            .put('/api/cases')
            .send({
                caseReference: {
                    sourceId: sourceId,
                    sourceEntryId: entryId,
                    sourceUrl: 'cdc.gov',
                },
                location: {},
                ...curatorMetadata,
            })
            .expect(422);
    });
});

describe('DELETE', () => {
    it('delete present item should return 204 OK', async () => {
        const c = new Day0Case(minimalDay0CaseData);
        await c.save();

        await request(app).delete(`/api/cases/${c._id}`).expect(204);

        expect(await CaseRevision.collection.countDocuments()).toEqual(1);
        // I needed to parse it using JSON to and from string to avoid issues with comparing object in strict mode
        expect(
            JSON.parse(JSON.stringify((await CaseRevision.find())[0].case)),
        ).toEqual(JSON.parse(JSON.stringify(c.toObject())));
    });
    it('delete absent item should return 404 NOT FOUND', () => {
        return request(app).delete('/api/cases/123456789').expect(404);
    });
    it('delete multiple cases cannot specify caseIds and query', async () => {
        const c = await new Day0Case(minimalDay0CaseData).save();
        const c2 = await new Day0Case(minimalDay0CaseData).save();
        expect(await Day0Case.collection.countDocuments()).toEqual(2);

        await request(app)
            .delete('/api/cases')
            .send({ caseIds: [c._id, c2._id], query: 'test' })
            .expect(400);
    });
    it('delete multiple cases cannot send without request body', async () => {
        await request(app).delete('/api/cases').expect(415);
    });
    it('delete multiple cases cannot send empty request body', async () => {
        await request(app).delete('/api/cases').send({}).expect(400);
    });
    it('delete multiple cases cannot send empty query', async () => {
        await request(app).delete('/api/cases').send({ query: '' }).expect(400);
    });
    it('delete multiple cases cannot send whitespace only query', async () => {
        await request(app)
            .delete('/api/cases')
            .send({ query: ' ' })
            .expect(400);
    });
    it('delete multiple cases with caseIds should return 204 OK', async () => {
        const c = await new Day0Case(minimalDay0CaseData).save();
        const c2 = await new Day0Case(minimalDay0CaseData).save();
        expect(await Day0Case.collection.countDocuments()).toEqual(2);

        await request(app)
            .delete('/api/cases')
            .send({ caseIds: [c._id, c2._id] })
            .expect(204);
        expect(await Day0Case.collection.countDocuments()).toEqual(0);

        expect(await CaseRevision.collection.countDocuments()).toEqual(2);
        // I needed to parse it using JSON to and from string to avoid issues with comparing object in strict mode
        expect(
            JSON.parse(JSON.stringify((await CaseRevision.find())[0].case)),
        ).toEqual(JSON.parse(JSON.stringify(c.toObject())));
        expect(
            JSON.parse(JSON.stringify((await CaseRevision.find())[1].case)),
        ).toEqual(JSON.parse(JSON.stringify(c2.toObject())));
    });
    // @TODO text index not present in the new case schema
    it.skip('delete multiple cases with query should return 204 OK', async () => {
        // Simulate index creation used in unit tests, in production they are
        // setup by the migrations and such indexes are not present by
        // default in the in memory mongo spawned by unit tests.
        await mongoose.connection.collection('cases').createIndex({
            'demographics.gender': -1,
        });

        const c = new Day0Case(minimalDay0CaseData);
        c.demographics = new Demographics({ gender: Gender.Female });
        await c.save();
        const c2 = new Day0Case(minimalDay0CaseData);
        c2.demographics = new Demographics({ gender: Gender.Male });
        await c2.save();
        await new Day0Case(minimalDay0CaseData).save();
        expect(await Day0Case.collection.countDocuments()).toEqual(3);

        // Unmatched query deletes no cases
        await request(app)
            .delete('/api/cases')
            .send({ query: 'at home' })
            .expect(204);
        expect(await Day0Case.collection.countDocuments()).toEqual(3);
        await request(app)
            .delete('/api/cases')
            .send({ query: 'gender:Male' })
            .expect(204);
        expect(await Day0Case.collection.countDocuments()).toEqual(3);
        await request(app)
            .delete('/api/cases')
            .send({ query: 'gender:Male' })
            .expect(204);
        expect(await Day0Case.collection.countDocuments()).toEqual(3);
        expect(await CaseRevision.collection.countDocuments()).toEqual(0);

        // Deletes matched queries
        await request(app)
            .delete('/api/cases')
            .send({ query: 'gender:Female' })
            .expect(204);
        expect(await Day0Case.collection.countDocuments()).toEqual(2);

        expect(await CaseRevision.collection.countDocuments()).toEqual(1);
        expect((await CaseRevision.find())[0].case).toMatchObject(c.toObject());

        await request(app)
            .delete('/api/cases')
            .send({ query: 'gender:Female' })
            .expect(204);
        expect(await Day0Case.collection.countDocuments()).toEqual(1);

        expect(await CaseRevision.collection.countDocuments()).toEqual(2);
        expect((await CaseRevision.find())[0].case).toMatchObject(c.toObject());
        expect((await CaseRevision.find())[1].case).toMatchObject(
            c2.toObject(),
        );
    });
    it('delete multiple cases cannot go over threshold', async () => {
        // Simulate index creation used in unit tests, in production they are
        // setup by the migrations and such indexes are not present by
        // default in the in memory mongo spawned by unit tests.
        await mongoose.connection.collection('day0cases').createIndex(
            {
                'demographics.gender': -1,
            },
            { collation: { locale: 'en_US', strength: 2 } },
        );

        await Promise.all([
            new Day0Case(minimalDay0CaseData)
                .set('demographics.gender', Gender.Female)
                .save(),
            new Day0Case(minimalDay0CaseData)
                .set('demographics.gender', Gender.Female)
                .save(),
            new Day0Case(minimalDay0CaseData)
                .set('demographics.gender', Gender.Female)
                .save(),
        ]);
        expect(await Day0Case.collection.countDocuments()).toEqual(3);
        await request(app)
            .delete('/api/cases')
            .send({ query: 'gender:female', maxCasesThreshold: 2 })
            .expect(422, /more than the maximum allowed/);
        expect(await Day0Case.collection.countDocuments()).toEqual(3);
        expect(await CaseRevision.collection.countDocuments()).toEqual(0);
    });
});

describe('countryData', () => {
    it('should correctly return cardinalities for existing data 200 OK', async () => {
        const c = new Day0Case({
            ...minimalDay0CaseData,
            events: {
                dateEntry: '2019-12-03',
                dateReported: '2019-12-03',
                outcome: 'recovered',
            },
        });
        await c.save();
        const c1 = new Day0Case({
            ...minimalDay0CaseData,
            caseStatus: 'suspected',
            events: {
                dateEntry: '2019-12-03',
                dateReported: '2019-12-03',
            },
        });
        await c1.save();
        const c2 = new Day0Case({
            ...minimalDay0CaseData,
            location: { country: 'Poland', countryISO3: 'POL' },
            events: {
                dateEntry: '2019-12-03',
                dateReported: '2019-12-03',
                outcome: 'death',
            },
        });
        await c2.save();
        const c3 = new Day0Case({
            ...minimalDay0CaseData,
            location: { country: 'Poland', countryISO3: 'POL' },
            caseStatus: 'suspected',
            events: {
                dateEntry: '2019-12-03',
                dateReported: '2019-12-03',
                outcome: 'death',
            },
        });
        await c3.save();
        const res = await request(app)
            .get('/api/cases/countryData')
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body).toEqual({
            countries: {
                Canada: { confirmed: 1, recovered: 1, suspected: 1, total: 2 },
                Poland: { confirmed: 1, death: 2, suspected: 1, total: 2 },
            },
            globally: {
                confirmed: 2,
                death: 2,
                total: 4,
                recovered: 1,
                suspected: 2,
            },
        });
    });

    it('should correctly return cardinalities for one case 200 OK', async () => {
        const c = new Day0Case({
            ...minimalDay0CaseData,
        });
        await c.save();
        const res = await request(app)
            .get('/api/cases/countryData')
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body).toEqual({
            countries: {
                Canada: { confirmed: 1, total: 1 },
            },
            globally: {
                confirmed: 1,
                total: 1,
            },
        });
    });

    it('should correctly return empty when there is no data 200 OK', async () => {
        const res = await request(app)
            .get('/api/cases/countryData')
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body).toEqual({});
    });
});
