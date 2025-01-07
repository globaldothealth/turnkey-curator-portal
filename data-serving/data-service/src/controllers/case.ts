import {
    caseAgeRange,
    CaseDocument,
    CaseDTO,
    Day0Case,
    CuratorsDocument,
} from '../model/day0-case';
import caseFields from '../model/fields.json';
import { CaseStatus, Role } from '../types/enums';
import mongoose, { Error, Query } from 'mongoose';
import { ObjectId } from 'mongodb';
import { GeocodeOptions, Geocoder, Resolution } from '../geocoding/geocoder';
import { NextFunction, Request, Response } from 'express';
import parseSearchQuery, { ParsingError } from '../util/search';
import {
    denormalizeFields,
    removeBlankHeader,
    SortBy,
    SortByOrder,
} from '../util/case';
import { logger } from '../util/logger';
import stringify from 'csv-stringify/lib/sync';
import _, { forEach } from 'lodash';
import { AgeBucket } from '../model/age-bucket';
import { COUNTER_DOCUMENT_ID, IdCounter } from '../model/id-counter';
import { User } from '../model/user';

class GeocodeNotFoundError extends Error {}

class InvalidParamError extends Error {}

type BatchValidationErrors = { index: number; message: string }[];

const caseFromDTO = async (receivedCase: CaseDTO) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const aCase: any = receivedCase;
    if (receivedCase.demographics?.ageRange) {
        // won't be many age buckets, so fetch all of them.
        const allBuckets = await AgeBucket.find({});
        const caseStart = receivedCase.demographics?.ageRange.start;
        const caseEnd = receivedCase.demographics?.ageRange.end;
        validateCaseAges(caseStart, caseEnd);
        aCase.demographics.ageBuckets = allBuckets
            .filter((b) => {
                const bucketContainsStart =
                    b.start <= caseStart && b.end >= caseStart;
                const bucketContainsEnd =
                    b.start <= caseEnd && b.end >= caseEnd;
                const bucketWithinCaseRange =
                    b.start > caseStart && b.end < caseEnd;
                return (
                    bucketContainsStart ||
                    bucketContainsEnd ||
                    bucketWithinCaseRange
                );
            })
            .map((b) => b._id);
    }

    const geometry = aCase.location?.geometry;
    if (!geometry || !geometry.latitude || !geometry.longitude)
        delete aCase.location.geometry;

    const user = await User.findOne({ email: receivedCase.curator?.email });
    if (user) {
        logger.info(`User: ${JSON.stringify(user)}`);
        if (
            user.roles.includes(Role.JuniorCurator) ||
            user.roles.includes(Role.Curator)
        ) {
            aCase.curators = {
                createdBy: {
                    name: user.name || '',
                    email: user.email,
                },
            };
        } //else if (user.roles.includes(Role.Curator) || user.roles.includes(Role.Admin)) {
        //     aCase.curators = {
        //         createdBy: {
        //             name: user.name || '',
        //             email: user.email
        //         },
        //         verifiedBy: {
        //             name: user.name || '',
        //             email: user.email
        //         },
        //     };
        // }
    }

    return aCase;
};

const dtoFromCase = async (storedCase: CaseDocument) => {
    let dto = (storedCase as unknown) as CaseDTO;
    const ageRange = await caseAgeRange(storedCase);
    const creator = await User.findOne({
        _id: storedCase.curators?.createdBy,
    });

    let verifier;
    if (storedCase.curators?.verifiedBy) {
        verifier = await User.findOne({
            _id: storedCase.curators.verifiedBy,
        });
    }

    if (ageRange) {
        if (creator) {
            if (verifier) {
                dto = {
                    ...dto,
                    curators: {
                        createdBy: {
                            email: creator.email,
                            name: creator.name,
                        },
                        verifiedBy: {
                            email: verifier.email,
                            name: verifier.name,
                        },
                    } as CuratorsDocument,
                };
            } else {
                dto = {
                    ...dto,
                    curators: {
                        createdBy: {
                            email: creator.email,
                            name: creator.name,
                        },
                    } as CuratorsDocument,
                };
            }
        }
        dto = {
            ...dto,
            demographics: {
                ...dto.demographics!,
                ageRange,
            },
        };

        // although the type system can't see it, there's an ageBuckets property on the demographics DTO now
        delete ((dto as unknown) as {
            demographics: { ageBuckets?: [ObjectId] };
        }).demographics.ageBuckets;
    }

    return dto;
};

// After updating mongoose upserting and creating changed and data fields were missing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fillEmpty = (caseData: any) => {
    if (!caseData.vaccination) caseData.vaccination = {};
    if (!caseData.vaccination.vaccineName)
        caseData.vaccination.vaccineName = '';
    if (!caseData.vaccination.vaccineSideEffects)
        caseData.vaccination.vaccineSideEffects = '';

    if (!caseData.transmission) caseData.transmission = {};
    if (!caseData.transmission.contactId) caseData.transmission.contactId = '';
    if (!caseData.transmission.contactSetting)
        caseData.transmission.contactSetting = '';
    if (!caseData.transmission.contactAnimal)
        caseData.transmission.contactAnimal = '';
    if (!caseData.transmission.contactComment)
        caseData.transmission.contactComment = '';

    if (!caseData.travelHistory) caseData.travelHistory = {};
    if (!caseData.travelHistory.travelHistoryStart)
        caseData.travelHistory.travelHistoryStart = '';
    if (!caseData.travelHistory.travelHistoryLocation)
        caseData.travelHistory.travelHistoryLocation = '';
    if (!caseData.travelHistory.travelHistoryCountry)
        caseData.travelHistory.travelHistoryCountry = '';

    if (!caseData.genomeSequences) caseData.genomeSequences = {};
    if (!caseData.genomeSequences.genomicsMetadata)
        caseData.genomeSequences.genomicsMetadata = '';
    if (!caseData.genomeSequences.accessionNumber)
        caseData.genomeSequences.accessionNumber = '';

    if (!caseData.preexistingConditions) caseData.preexistingConditions = {};
    if (!caseData.preexistingConditions.coInfection)
        caseData.preexistingConditions.coInfection = '';
    if (!caseData.preexistingConditions.preexistingCondition)
        caseData.preexistingConditions.preexistingCondition = '';
    return caseData;
};

// For operations that change any of the value a new version needs to be created
const updatedRevisionMetadata = (
    day0Case: CaseDocument,
    curator: string,
    note?: string,
) => {
    return {
        creationMetadata: day0Case.revisionMetadata.creationMetadata,
        updateMetadata: {
            curator: curator,
            note: note,
            date: Date.now(),
        },
        revisionNumber: day0Case.revisionMetadata.revisionNumber + 1,
    };
};

export class CasesController {
    private csvHeaders: string[];
    constructor(private readonly geocoders: Geocoder[]) {
        this.csvHeaders = [];
        this.init();
    }

    init(): CasesController {
        this.csvHeaders = caseFields;
        this.csvHeaders = removeBlankHeader(this.csvHeaders);
        this.csvHeaders.sort((a, b) =>
            a.localeCompare(b, undefined, { sensitivity: 'base' }),
        );

        return this;
    }

    /**
     * Get a specific case.
     *
     * Handles HTTP GET /api/cases/:id.
     */
    get = async (req: Request, res: Response): Promise<void> => {
        const c = await Day0Case.find({
            _id: req.params.id,
        }).lean();

        if (c.length === 0) {
            res.status(404).send({
                message: `Day0Case with ID ${req.params.id} not found.`,
            });
            return;
        }

        c.forEach((aCase: CaseDocument) => {
            delete aCase.caseReference.sourceEntryId;
        });

        res.json(await Promise.all(c.map((aCase) => dtoFromCase(aCase))));
    };

    /**
     * Get a specific case bundle.
     *
     * Handles HTTP GET /api/cases/bundled/:id.
     */
    getBundled = async (req: Request, res: Response): Promise<void> => {
        const c = await Day0Case.find({
            bundleId: req.params.id,
        }).lean();

        if (c.length === 0) {
            res.status(404).send({
                message: `Day0Case bundle with ID ${req.params.id} not found.`,
            });
            return;
        }

        c.forEach((aCase: CaseDocument) => {
            delete aCase.caseReference.sourceEntryId;
        });

        res.json(await Promise.all(c.map((aCase) => dtoFromCase(aCase))));
    };

    /**
     * Streams requested cases to client (curator service).
     * Doesn't return cases from the restricted collection.
     *
     * Handles HTTP POST /api/cases/download.
     */
    download = async (req: Request, res: Response): Promise<void> => {
        if (req.body.query && req.body.caseIds) {
            res.status(400).json({ message: 'Bad request' });
            return;
        }

        logger.debug(
            `Streaming case data in format ${req.body.format} matching query ${req.body.query} for correlation ID ${req.body.correlationId}`,
        );

        const queryLimit = Number(req.body.limit);

        // Goofy Mongoose types require this.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let cursor: any;
        try {
            // Stream from mongoose directly into response
            // Use provided query and limit, if provided
            if (req.body.query) {
                logger.debug('Request body with query');
                cursor = casesMatchingSearchQuery({
                    searchQuery: req.body.query as string,
                    count: false,
                    limit: queryLimit,
                })
                    .collation({ locale: 'en_US', strength: 2 })
                    .cursor();
            } else if (req.body.caseIds && queryLimit) {
                logger.debug('Request body with case IDs and limit');
                cursor = Day0Case.find({
                    _id: { $in: req.body.caseIds },
                })
                    .lean()
                    .limit(queryLimit)
                    .collation({
                        locale: 'en_US',
                        strength: 2,
                    })
                    .cursor();
            } else if (req.body.caseIds) {
                logger.debug('Request body with case IDs and no limit');
                cursor = Day0Case.find({
                    _id: { $in: req.body.caseIds },
                })
                    .lean()
                    .collation({
                        locale: 'en_US',
                        strength: 2,
                    })
                    .cursor();
            } else if (queryLimit) {
                logger.debug('Request body with limit and no case IDs');
                cursor = Day0Case.find()
                    .lean()
                    .limit(queryLimit)
                    .collation({
                        locale: 'en_US',
                        strength: 2,
                    })
                    .cursor();
            } else {
                logger.debug('Request body with no query, limit, or case IDs');
                cursor = Day0Case.find()
                    .lean()
                    .collation({
                        locale: 'en_US',
                        strength: 2,
                    })
                    .cursor();
            }

            const date = new Date().toISOString().slice(0, 10);
            const request_description = req.body.query
                ? req.body.query.replace(/[:\s]/g, '_')
                : 'requested_cases';
            const filename = `gh_${date}_${request_description}`;

            let doc: CaseDocument;

            // assume default format is CSV
            const format = req.body.format ?? 'csv';

            if (format == 'csv' || format == 'tsv') {
                res.setHeader('Content-Type', `text/${format}`);
                res.setHeader(
                    'Content-Disposition',
                    `attachment; filename="${filename}.${format}"`,
                );
                const delimiter: string = format == 'tsv' ? '\t' : ',';

                const columnsString = this.csvHeaders.join(delimiter);
                res.write(columnsString);
                res.write('\n');

                doc = await cursor.next();
                while (doc != null) {
                    delete doc.caseReference.sourceEntryId;
                    const caseDTO = await dtoFromCase(doc);
                    delete caseDTO.comment;
                    const stringifiedCase = stringify([caseDTO], {
                        header: false,
                        columns: this.csvHeaders,
                        delimiter: delimiter,
                        cast: {
                            date: (value: Date) => {
                                if (value) {
                                    return new Date(value)
                                        .toISOString()
                                        .split('T')[0];
                                }
                                return value;
                            },
                        },
                    });
                    res.write(stringifiedCase);
                    doc = await cursor.next();
                }
                res.end();
            } else if (format == 'json') {
                res.setHeader('Content-Type', 'application/json');
                res.setHeader(
                    'Content-Disposition',
                    `attachment; filename="${filename}.json"`,
                );
                res.write('[');
                doc = await cursor.next();
                while (doc != null) {
                    delete doc.caseReference.sourceEntryId;
                    const normalizedDoc = await denormalizeFields(doc);
                    res.write(JSON.stringify(normalizedDoc));
                    doc = await cursor.next();
                    if (doc != null) {
                        res.write(',');
                    }
                }
                res.write(']');
                res.end();
            } else {
                const message = `Invalid format requested ${format}`;
                logger.error(message);
                res.status(400).json(message);
                return;
            }
        } catch (err) {
            if (err instanceof ParsingError) {
                logger.error(`ParsingError: ${err}`);
                res.status(422).json({ message: err.message });
                return;
            }
            logger.error(`Error streaming case data: ${err}`);
            res.status(500).json(
                'A server error occurred while streaming case data',
            );
            return;
        }
        logger.info(
            `Request with correlation ID ${req.body.correlationId} succeeded`,
        );
    };

    /**
     * List all cases.
     *
     * Handles HTTP GET /api/cases.
     */
    list = async (req: Request, res: Response): Promise<void> => {
        logger.debug('List method entrypoint');
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const countLimit = Number(req.query.count_limit) || 10000;
        const sortBy = String(req.query.sort_by) || 'default';
        const sortByOrder = String(req.query.order) || 'ascending';
        const verificationStatus =
            Boolean(req.query.verification_status) || undefined;

        logger.debug('Got query params');

        if (page < 1) {
            res.status(422).json({ message: 'page must be > 0' });
            return;
        }
        if (limit < 1) {
            res.status(422).json({ message: 'limit must be > 0' });
            return;
        }
        // Filter query param looks like &q=some%20search%20query
        if (
            typeof req.query.q !== 'string' &&
            typeof req.query.q !== 'undefined'
        ) {
            res.status(422).json({ message: 'q must be a unique string' });
            return;
        }

        logger.debug('Got past 422s');
        try {
            const casesQuery = casesMatchingSearchQuery({
                searchQuery: req.query.q || '',
                count: false,
                verificationStatus: verificationStatus,
            }) as Query<CaseDocument[], CaseDocument, unknown>;
            const countQuery = casesMatchingSearchQuery({
                searchQuery: req.query.q || '',
                count: true,
                verificationStatus: verificationStatus,
            });

            const sortByKeyword = sortBy as SortBy;

            const sortedQuery = casesQuery.sort({
                [sortByKeyword]: sortByOrder === SortByOrder.Ascending ? 1 : -1,
            });

            // Do a fetch of documents and another fetch in parallel for total documents
            // count used in pagination.
            const [docs, total] = await Promise.all([
                sortedQuery
                    .skip(limit * (page - 1))
                    .limit(limit)
                    .lean()
                    .collation({
                        locale: 'en_US',
                        strength: 2,
                    }),
                countQuery.collation({
                    locale: 'en_US',
                    strength: 2,
                }),
            ]);

            const dtos = await Promise.all(docs.map(dtoFromCase));
            logger.debug('got results');
            // total is actually stored in a count index in mongo, so the query is fast.
            // however to maintain existing behaviour, only return the count limit
            const reportedTotal = Math.min(total, countLimit);
            // If we have more items than limit, add a response param
            // indicating that there is more to fetch on the next page.
            if (total > limit * page) {
                res.json({
                    cases: dtos,
                    nextPage: page + 1,
                    total: reportedTotal,
                });
                logger.debug('Got multiple pages of results');
                return;
            }
            // If we fetched all available data, just return it.
            logger.debug('Got one page of results');
            res.json({ cases: dtos, total: reportedTotal });
        } catch (e) {
            if (e instanceof ParsingError) {
                logger.error(`Parsing error ${e.message}`);
                res.status(422).json({ message: e.message });
                return;
            }
            logger.error('non-parsing error for query:');
            logger.error(req.query);
            if (e instanceof Error) logger.error(e);
            res.status(500).json(e);
            return;
        }
    };

    /**
     * List all case bundles.
     *
     * Handles HTTP GET /api/cases/bundled.
     */
    listBundled = async (req: Request, res: Response): Promise<void> => {
        logger.debug('List method entrypoint');
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const countLimit = Number(req.query.count_limit) || 10000;
        const sortBy = String(req.query.sort_by) || 'default';
        const sortByOrder = String(req.query.order) || 'ascending';
        const verificationStatus =
            req.query.verification_status !== undefined
                ? Boolean(req.query.verification_status)
                : undefined;

        logger.debug('Got query params');

        if (page < 1) {
            res.status(422).json({ message: 'page must be > 0' });
            return;
        }
        if (limit < 1) {
            res.status(422).json({ message: 'limit must be > 0' });
            return;
        }
        // Filter query param looks like &q=some%20search%20query
        if (
            typeof req.query.q !== 'string' &&
            typeof req.query.q !== 'undefined'
        ) {
            res.status(422).json({ message: 'q must be a unique string' });
            return;
        }

        logger.debug('Got past 422s');
        try {
            const pipeline = [];
            const totalCountPipeline = [];
            if (verificationStatus !== undefined) {
                pipeline.push({
                    $match: {
                        'curators.verifiedBy': { $exists: verificationStatus },
                    },
                });
                totalCountPipeline.push({
                    $match: {
                        'curators.verifiedBy': { $exists: verificationStatus },
                    },
                });
            }
            pipeline.push({
                $group: {
                    _id: '$bundleId',
                    caseCount: { $sum: 1 },
                    caseIds: { $push: '$_id' },
                    verificationStatus: {
                        $push: {
                            $cond: {
                                if: { $ifNull: ['$curators.verifiedBy', false] },
                                then: true,
                                else: false,
                            },
                        },
                    },
                    dateModified: {
                        $first: '$revisionMetadata.updateMetadata.date',
                    },
                    dateCreated: {
                        $first: '$revisionMetadata.creationMetadata.date',
                    },
                    modifiedBy: {
                        $first: '$revisionMetadata.updateMetadata.curator',
                    },
                    createdBy: {
                        $first: '$revisionMetadata.creationMetadata.curator',
                    },
                    caseStatus: { $first: '$caseStatus' }, //addToSet can be used instead of first for edited cases
                    dateEntry: { $first: '$events.dateEntry' },
                    dateReported: { $first: '$events.dateReported' },
                    countryISO3: { $first: '$location.countryISO3' },
                    country: { $first: '$location.country' },
                    admin1: { $first: '$location.admin1' },
                    admin2: { $first: '$location.admin2' },
                    admin3: { $first: '$location.admin3' },
                    location: { $first: '$location.location' },
                    ageRange: { $first: '$demographics.ageRange' },
                    gender: { $first: '$demographics.gender' },
                    outcome: { $first: '$events.outcome' },
                    dateHospitalization: {
                        $first: '$events.dateHospitalization',
                    },
                    dateOnset: { $first: '$events.dateOnset' },
                    sourceUrl: { $first: '$caseReference.sourceUrl' },
                },
            });
            totalCountPipeline.push({ $group: { _id: '$bundleId' } });
            const bundledCases = await Day0Case.aggregate(pipeline)
                .skip(limit * (page - 1))
                .limit(limit);
            const totalCount = (await Day0Case.aggregate(totalCountPipeline))
                .length;

            res.json({ caseBundles: bundledCases, total: totalCount });
        } catch (e) {
            if (e instanceof ParsingError) {
                logger.error(`Parsing error ${e.message}`);
                res.status(422).json({ message: e.message });
                return;
            }
            logger.error('non-parsing error for query:');
            logger.error(req.query);
            if (e instanceof Error) logger.error(e);
            res.status(500).json(e);
            return;
        }
    };

    /**
     * Get table data for Cases by Country.
     *
     * Handles HTTP GET /api/cases/countryData.
     */
    countryData = async (req: Request, res: Response): Promise<void> => {
        logger.debug('Get cases by country method entrypoint');

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const countriesData: any = {};
            // Get total case cardinality
            const grandTotalCount = await Day0Case.countDocuments({
                caseStatus: {
                    $nin: [CaseStatus.OmitError, CaseStatus.Discarded],
                },
            });
            if (grandTotalCount === 0) {
                res.status(200).json({});
                return;
            }

            // Get cardinality of case statuses by country
            const countriesStatusCounts = await Day0Case.aggregate([
                {
                    $match: {
                        caseStatus: {
                            $nin: [CaseStatus.OmitError, CaseStatus.Discarded],
                        },
                    },
                },
                {
                    $group: {
                        _id: {
                            country: '$location.country',
                            caseStatus: '$caseStatus',
                        },
                        totalCount: { $sum: 1 },
                    },
                },
                {
                    $group: {
                        _id: '$_id.country',
                        caseStatus: {
                            $push: {
                                k: '$_id.caseStatus',
                                v: '$totalCount',
                            },
                        },
                        total: { $sum: '$totalCount' },
                    },
                },
                {
                    $project: {
                        caseStatus: { $arrayToObject: '$caseStatus' },
                        total: 1,
                    },
                },
            ]);

            forEach(countriesStatusCounts, (countryStatusCounts) => {
                countriesData[countryStatusCounts._id] = {};
                forEach(
                    Object.keys(countryStatusCounts.caseStatus),
                    (statusName) => {
                        countriesData[countryStatusCounts._id][statusName] =
                            countryStatusCounts.caseStatus[statusName];
                    },
                );
                countriesData[countryStatusCounts._id].total =
                    countryStatusCounts.total;
            });

            // Get cardinality of outcomes by country
            const countriesOutcomeCounts = await Day0Case.aggregate([
                {
                    $match: {
                        'events.outcome': {
                            $exists: true,
                            $ne: null,
                        },
                        caseStatus: {
                            $nin: [CaseStatus.OmitError, CaseStatus.Discarded],
                        },
                    },
                },
                {
                    $group: {
                        _id: {
                            country: '$location.country',
                            outcome: '$events.outcome',
                        },
                        totalCount: { $sum: 1 },
                    },
                },
                {
                    $group: {
                        _id: '$_id.country',
                        outcome: {
                            $push: {
                                $cond: [
                                    { $not: ['$_id.outcome'] },
                                    null,
                                    {
                                        k: '$_id.outcome',
                                        v: '$totalCount',
                                    },
                                ],
                            },
                        },
                    },
                },
                {
                    $addFields: {
                        outcome: {
                            $filter: {
                                input: '$outcome',
                                as: 'd',
                                cond: {
                                    $ne: ['$$d', null],
                                },
                            },
                        },
                    },
                },
                {
                    $project: {
                        outcome: { $arrayToObject: '$outcome' },
                        totalCount: 1,
                    },
                },
            ]);

            if (countriesOutcomeCounts.length > 0) {
                forEach(countriesOutcomeCounts, (countryOutcomeCounts) => {
                    if (countryOutcomeCounts?.outcome) {
                        forEach(
                            Object.keys(countryOutcomeCounts.outcome),
                            (outcomeName) => {
                                countriesData[countryOutcomeCounts._id][
                                    outcomeName
                                ] = countryOutcomeCounts.outcome[outcomeName];
                            },
                        );
                    }
                });
            }

            // Get cardinality of case statuses total
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const totalStatusCount: any = await Day0Case.aggregate([
                {
                    $match: {
                        caseStatus: {
                            $nin: [CaseStatus.OmitError, CaseStatus.Discarded],
                        },
                    },
                },
                {
                    $group: {
                        _id: '$caseStatus',
                        count: {
                            $sum: 1,
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        root: { $push: { k: '$_id', v: '$count' } },
                    },
                },
                {
                    $replaceRoot: { newRoot: { $arrayToObject: '$root' } },
                },
            ]);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const totalCounts: any = {};
            forEach(Object.keys(totalStatusCount[0]), (statusName) => {
                totalCounts[statusName] = totalStatusCount[0][statusName];
            });

            // Get cardinality of outcomes total
            const totalOutcomeCount = await Day0Case.aggregate([
                {
                    $match: {
                        caseStatus: {
                            $nin: [CaseStatus.OmitError, CaseStatus.Discarded],
                        },
                    },
                },
                {
                    $match: {
                        'events.outcome': {
                            $exists: true,
                            $ne: null,
                        },
                    },
                },
                {
                    $group: {
                        _id: '$events.outcome',
                        count: {
                            $sum: 1,
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        root: { $push: { k: '$_id', v: '$count' } },
                    },
                },
                {
                    $replaceRoot: { newRoot: { $arrayToObject: '$root' } },
                },
            ]);

            if (totalOutcomeCount.length > 0) {
                forEach(Object.keys(totalOutcomeCount[0]), (outcomeName) => {
                    totalCounts[outcomeName] =
                        totalOutcomeCount[0][outcomeName];
                });
            }

            res.status(200).json({
                countries: countriesData,
                globally: {
                    total: grandTotalCount,
                    ...totalCounts,
                },
            });
        } catch (e) {
            if (e instanceof Error) logger.error(e);
            console.log(e);
            res.status(500).json(e);
            return;
        }
    };

    /**
     * Create one or many identical cases.
     *
     * Handles HTTP POST /api/cases.
     */
    create = async (req: Request, res: Response): Promise<void> => {
        const numCases = Number(req.query.num_cases) || 1;

        try {
            this.addGeoResolution(req);
            const currentDate = Date.now();
            const curator = req.body.curator.email;
            const bundleId = new mongoose.Types.ObjectId();
            const receivedCase = {
                ...req.body,
                bundleId,
                revisionMetadata: {
                    revisionNumber: 0,
                    creationMetadata: {
                        curator,
                        date: currentDate,
                    },
                    updateMetadata: {
                        curator,
                        date: currentDate,
                        notes: 'Creation',
                    },
                },
            } as CaseDTO;

            const c = fillEmpty(new Day0Case(await caseFromDTO(receivedCase)));

            let result;
            if (req.query.validate_only) {
                await c.validate();
                result = c;
            } else {
                if (numCases === 1) {
                    result = await c.save();
                } else {
                    const newCases: CaseDocument[] = [];
                    for (let i = 0; i < numCases; i++) {
                        const multiCaseInstance = new Day0Case(
                            await caseFromDTO(receivedCase),
                        );
                        newCases.push(await multiCaseInstance.save());
                    }
                    result = { cases: newCases };
                }
            }

            res.status(201).json(result);
        } catch (e) {
            const err = e as Error;
            if (err.name === 'MongoServerError') {
                logger.error((e as any).errInfo);
                res.status(422).json({
                    message: (err as any).errInfo,
                });
                return;
            }
            if (err instanceof GeocodeNotFoundError) {
                res.status(404).json({
                    message: err.message,
                });
                return;
            }
            if (
                err.name === 'ValidationError' ||
                err instanceof InvalidParamError
            ) {
                logger.error('validation error');
                logger.error(err);
                res.status(422).json(err);
                return;
            }
            logger.error(err);
            res.status(500).json(err);
            return;
        }
    };

    /**
     * Verify case.
     *
     * Handles HTTP POST /api/cases/verify/:id.
     */
    verify = async (req: Request, res: Response): Promise<void> => {
        const c = await Day0Case.findOne({
            _id: req.params.id,
        });

        if (!c) {
            res.status(404).send({
                message: `Day0Case with ID ${req.params.id} not found.`,
            });
            return;
        }

        const verifier = await User.findOne({
            email: req.body.curator.email,
        });
        if (!verifier) {
            res.status(404).send({
                message: `Verifier with email ${req.body.curator.email} not found.`,
            });
            return;
        } else {
            c.set({
                curators: {
                    createdBy: c.curators.createdBy,
                    verifiedBy: verifier._id,
                },
                revisionMetadata: updatedRevisionMetadata(
                    c,
                    req.body.curator.email,
                    'Case Verification',
                ),
            });
            await c.save();
            const responseCase = await Day0Case.find({
                _id: req.params.id,
            }).lean();
            res.json(
                await Promise.all(
                    responseCase.map((aCase) => dtoFromCase(aCase)),
                ),
            );
            return;
        }
    };

    /**
     * Verify case bundle.
     *
     * Handles HTTP POST /api/cases/verify/bundled/:id.
     */
    verifyBundled = async (req: Request, res: Response): Promise<void> => {
        const caseBundleIds = req.body.data.caseBundleIds.map(
            (caseBundleId: string) => new mongoose.Types.ObjectId(caseBundleId),
        );
        const verifierEmail = req.body.curator.email;
        const c = await Day0Case.find({
            bundleId: { $in: caseBundleIds },
        });

        if (!c) {
            res.status(404).send({
                message: `Day0Case with ID ${req.params.id} not found.`,
            });
            return;
        }

        const verifier = await User.findOne({ email: verifierEmail });

        if (!verifier) {
            res.status(404).send({
                message: `Verifier with email ${verifierEmail} not found.`,
            });
        } else {
            const updateData = Date.now();
            await Day0Case.updateMany(
                { bundleId: { $in: caseBundleIds } },
                {
                    $set: {
                        'curators.verifiedBy': verifier,
                        'revisionMetadata.updateMetadata': {
                            curator: verifierEmail,
                            note: 'Case Verification',
                            date: updateData,
                        },
                    },
                    $inc: { 'revisionMetadata.revisionNumber': 1 },
                },
            );
            res.status(204).end();
        }
    };

    /**
     * Batch validates cases.
     */
    private batchValidate = async (
        // We're about to validate the cases, cannot type them yet.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cases: any[],
    ): Promise<BatchValidationErrors> => {
        const errors: { index: number; message: string }[] = [];
        // Do not parallelize these requests as it causes an out of memory error
        // for a large number of cases. However this does take a long time to run
        // sequentially, so if Mongo creates a batch validate method that should be used here.
        for (let index = 0; index < cases.length; index++) {
            const c = cases[index];
            const ageStart = c.demographics?.ageRange?.start;
            const ageEnd = c.demographics?.ageRange?.end;
            try {
                validateCaseAges(ageStart, ageEnd);
            } catch (e) {
                const err = e as Error;
                errors.push({ index, message: err.message });
                continue;
            }
            await new Day0Case(c).validate().catch((e) => {
                errors.push({ index: index, message: e.message });
            });
        }
        return errors;
    };

    /**
     * Perform geocoding for each case (of multiple `cases` specified in the
     * request body), in accordance with the above geocoding logic.
     *
     * TODO: https://github.com/globaldothealth/list/issues/1131 rate limit.
     */
    batchGeocode = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        const geocodeErrors: { index: number; message: string }[] = [];
        try {
            // Do not parallelize these requests as it causes an out of memory error
            // for a large number of cases.
            for (let index = 0; index < req.body.cases.length; index++) {
                const c = req.body.cases[index];
                try {
                    await this.geocode({
                        body: c,
                    });
                } catch (err) {
                    if (err instanceof GeocodeNotFoundError) {
                        geocodeErrors.push({
                            index: index,
                            message: err.message,
                        });
                    } else if (err instanceof InvalidParamError) {
                        geocodeErrors.push({
                            index: index,
                            message: err.message,
                        });
                    }
                }
            }
            if (geocodeErrors.length > 0) {
                res.status(207).send({
                    phase: 'GEOCODE',
                    numCreated: 0,
                    numUpdated: 0,
                    errors: geocodeErrors,
                });
                return;
            }

            next();
        } catch (e) {
            res.send(e);
        }
    };

    /**
     * Batch upserts cases.
     *
     * Handles HTTP POST /api/cases/batchUpsert.
     *
     * Batch validate the cases then if no errors have happened performs the batch
     * upsert.
     */
    batchUpsert = async (req: Request, res: Response): Promise<void> => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let errors: any = [];
        try {
            // Batch validate cases first.
            logger.info('batchUpsert: entrypoint');
            const cases = req.body.cases;
            errors = await this.batchValidate(cases);
            logger.info('batchUpsert: validated cases');

            if (errors.length > 0) {
                // drop any invalid cases but don't give up yet: upsert the remainder
                const badCases = _.orderBy(errors, 'index', 'desc').map(
                    (o) => o.index,
                );
                badCases.forEach((i) => {
                    cases.splice(i, 1);
                });
                logger.info(
                    `batchUpsert: dropped ${errors.length} invalid cases`,
                );
            }
            logger.info('batchUpsert: splitting cases by sourceID');
            logger.info('batchUpsert: preparing bulk write');

            const setId = async (c: CaseDocument) => {
                const idCounter = await IdCounter.findByIdAndUpdate(
                    COUNTER_DOCUMENT_ID,
                    { $inc: { count: 1 } },
                );
                if (!idCounter)
                    throw new Error('ID counter document not found');
                c._id = idCounter.count;
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const upsertLambda = async (c: any) => {
                delete c.caseCount;
                c.bundleId = new mongoose.Types.ObjectId();
                c = await caseFromDTO(c as CaseDTO);

                if (
                    c.caseReference?.sourceId &&
                    c.caseReference?.sourceEntryId
                ) {
                    const day0case = await Day0Case.findOne({
                        'caseReference.sourceId': c.caseReference.sourceId,
                        'caseReference.sourceEntryId':
                            c.caseReference.sourceEntryId,
                    });
                    if (day0case) {
                        return {
                            updateOne: {
                                filter: {
                                    'caseReference.sourceId':
                                        c.caseReference.sourceId,
                                    'caseReference.sourceEntryId':
                                        c.caseReference.sourceEntryId,
                                },
                                update: c,
                            },
                        };
                    }
                }

                await setId(c);
                return {
                    insertOne: {
                        document: fillEmpty(c),
                    },
                };
            };

            const unrestrictedBulkWriteResult = await Day0Case.bulkWrite(
                await Promise.all(cases.map(upsertLambda)),
                { ordered: false },
            );

            logger.info('batchUpsert: finished bulk write');
            const status = errors.length > 0 ? 207 : 200;
            res.status(status).json({
                phase: 'UPSERT',
                numCreated:
                    (unrestrictedBulkWriteResult.insertedCount || 0) +
                    (unrestrictedBulkWriteResult.upsertedCount || 0),
                numUpdated: unrestrictedBulkWriteResult.modifiedCount || 0,
                errors,
            });
            return;
        } catch (e) {
            const err = e as Error;
            if (err.message == 'Invalid BulkOperation, Batch cannot be empty') {
                res.status(200).json({
                    phase: 'UPSERT',
                    numCreated: 0,
                    numUpdated: 0,
                    errors: errors,
                });
                return;
            } else {
                if (err.name === 'ValidationError') {
                    logger.error(err);
                    res.status(422).json(err);
                    return;
                }
                logger.error(err);
                res.status(500).json(err);
                return;
            }
        }
    };

    /**
     * Update a specific case.
     *
     * Handles HTTP PUT /api/cases/:id.
     */
    update = async (req: Request, res: Response): Promise<void> => {
        const numCases = req.query.numCases || 1;
        logger.error('==========');
        logger.error(`${numCases}`);
        logger.error('==========');
        try {
            const c = await Day0Case.findById(req.params.id);
            if (!c) {
                res.status(404).send({
                    message: `Day0Case with ID ${req.params.id} not found.`,
                });
                return;
            }
            const caseDetails = await caseFromDTO(req.body);

            c.set({
                ...caseDetails,
                revisionMetadata: updatedRevisionMetadata(
                    c,
                    req.body.curator.email,
                    'Case Update',
                ),
            });
            await c.save();

            res.json(await dtoFromCase(c));
        } catch (err) {
            if (err instanceof Error) {
                if (err.name === 'ValidationError') {
                    res.status(422).json(err);
                    return;
                } else {
                    res.status(500).json(err);
                }
            } else {
                res.status(500).json(err);
            }
            return;
        }
    };

    /**
     * Update a specific case bundle.
     *
     * Handles HTTP PUT /api/cases/bundled/:id.
     */
    updateBundled = async (req: Request, res: Response): Promise<void> => {
        try {
            const cs = await Day0Case.find({ bundleId: req.params.id });

            if (!cs) {
                res.status(404).send({
                    message: `Day0Case bundle with ID ${req.params.id} not found.`,
                });
                return;
            }
            const caseDetails = await caseFromDTO(req.body);
            delete caseDetails._id;
            delete caseDetails.revisionMetadata;

            for (const c of cs) {
                c.set({
                    ...caseDetails,
                    revisionMetadata: updatedRevisionMetadata(
                        c,
                        req.body.curator.email,
                        'Case Update',
                    ),
                });
                await c.save();
            }

            res.json(await dtoFromCase(cs[0]));
        } catch (err) {
            logger.error(err as any);
            if (err instanceof Error) {
                if (err.name === 'ValidationError') {
                    res.status(422).json(err);
                    return;
                } else {
                    res.status(500).json(err);
                }
            } else {
                res.status(500).json(err);
            }
            return;
        }
    };

    /**
     * Updates multiple cases.
     *
     * Handles HTTP POST /api/cases/batchUpdate.
     */
    batchUpdate = async (req: Request, res: Response): Promise<void> => {
        // Consider defining a type for the request-format cases.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!req.body.cases.every((c: any) => c._id)) {
            res.status(422).json({
                message: 'Every case must specify its _id',
            });
            return;
        }
        try {
            const cases: CaseDocument[] = [];

            for (const c in req.body.cases) {
                const caseDoc = await caseFromDTO(req.body.cases[c] as CaseDTO);
                const aCase = await Day0Case.findOne({ _id: caseDoc._id });
                if (aCase) {
                    cases.push(caseDoc);
                } else {
                    res.status(400).json({
                        error: `case with id ${caseDoc._id} not present to update`,
                    });
                    return;
                }
            }
            const caseLambda = (c: CaseDocument) => ({
                updateOne: {
                    filter: {
                        _id: c._id,
                    },
                    update: c,
                },
            });
            const bulkWriteResult = await Day0Case.bulkWrite(
                // Consider defining a type for the request-format cases.
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                cases.map(caseLambda),
                { ordered: false },
            );
            res.json({
                numModified: bulkWriteResult.modifiedCount || 0,
            });
        } catch (err) {
            res.status(500).json(err);
            return;
        }
    };

    /**
     * Upserts a case based on a compound index of
     * caseReference.{dataSourceId, dataEntryId}.
     *
     * On success, the returned status code indicates whether than item was created
     * (201) or updated (200).
     *
     * Handles HTTP PUT /api/cases.
     */
    upsert = async (req: Request, res: Response): Promise<void> => {
        try {
            const c = await Day0Case.findOne({
                'caseReference.sourceId': req.body.caseReference?.sourceId,
                'caseReference.sourceEntryId':
                    req.body.caseReference?.sourceEntryId,
            });
            if (
                req.body.caseReference?.sourceId &&
                req.body.caseReference?.sourceEntryId &&
                c
            ) {
                const update = await caseFromDTO(req.body as CaseDTO);
                c.set(update);
                const result = await c.save();
                res.status(200).json(result);
                return;
            } else {
                // Geocode new cases.
                await this.geocode(req);
                const update = await caseFromDTO(req.body as CaseDTO);
                const c = new Day0Case(update);
                const result = await c.save();
                res.status(201).json(result);
                return;
            }
        } catch (e) {
            const err = e as Error;
            if (err instanceof GeocodeNotFoundError) {
                res.status(404).json({ message: err.message });
            }
            if (
                err.name === 'ValidationError' ||
                err instanceof InvalidParamError
            ) {
                res.status(422).json(err.message);
                return;
            }
            res.status(500).json(err.message);
            return;
        }
    };

    /**
     * Deletes multiple cases.
     *
     * Handles HTTP DELETE /api/cases.
     */
    batchDel = async (req: Request, res: Response): Promise<void> => {
        if (req.body.caseIds !== undefined) {
            for (const i in req.body.caseIds) {
                const deleted = await Day0Case.findByIdAndDelete(
                    req.body.caseIds[i],
                );
                if (!deleted) {
                    res.status(404).send({
                        message: `Day0Case with ID ${req.body.caseIds[i]} not found.`,
                    });
                    return;
                }
            }
            res.status(204).end();
            return;
        }

        const casesQuery = casesMatchingSearchQuery({
            searchQuery: req.body.query,
            count: false,
        }).collation({ locale: 'en_US', strength: 2 });
        try {
            await Day0Case.deleteMany(casesQuery);
            res.status(204).end();
        } catch (err) {
            if (err instanceof Error) logger.error(err);
            res.status(500).json(err);
        }
    };

    /**
     * Delete a specific case.
     *
     * Handles HTTP DELETE /api/cases/:id.
     */
    del = async (req: Request, res: Response): Promise<void> => {
        const c = await Day0Case.findByIdAndDelete(req.params.id, req.body);
        if (!c) {
            res.status(404).send({
                message: `Day0Case with ID ${req.params.id} not found.`,
            });
            return;
        }
        res.status(204).end();
    };

    /**
     * Deletes multiple case bundles.
     *
     * Handles HTTP DELETE /api/cases/bundled.
     */
    batchDelBundled = async (req: Request, res: Response): Promise<void> => {
        if (req.body.bundleIds !== undefined) {
            logger.error(req.body);
            const deleted = await Day0Case.deleteMany({
                bundleId: { $in: req.body.bundleIds },
            });
            if (!deleted) {
                res.status(404).send({
                    message: `Day0Case with specified bundle IDs not found.`,
                });
                return;
            }

            res.status(204).end();
            return;
        }
        logger.error(req.body);
        res.status(500).end();
    };

    /**
     * Geocodes a single location.
     * @param location The location data.
     * @param canBeFuzzy The location is allowed to be "fuzzy", in which case it may not get geocoded.
     * @returns The geocoded location.
     * @throws GeocodeNotFoundError if no geocode could be found.
     * @throws InvalidParamError if location.query is not specified and location
     *         is not complete already.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async geocodeLocation(
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        location: any,
        canBeFuzzy: boolean,
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    ): Promise<any> {
        if (!location?.query) {
            if (canBeFuzzy) {
                // no problem, just give back what we received
                return location;
            }
            throw new InvalidParamError(
                'location.query must be specified to be able to geocode',
            );
        }

        const opts: GeocodeOptions = {};

        if (location['limitToResolution']) {
            opts.limitToResolution = [];
            location['limitToResolution']
                .split(',')
                .forEach((supplied: string) => {
                    const resolution =
                        Resolution[supplied as keyof typeof Resolution];
                    if (!resolution) {
                        throw new InvalidParamError(
                            `invalid limitToResolution: ${supplied}`,
                        );
                    }
                    opts.limitToResolution?.push(resolution);
                });
        }

        if (location['limitToCountry']) {
            opts.limitToCountry = location['limitToCountry']
                .split(',')
                .filter((countryCode: string) => countryCode.length === 2);
        }

        for (const geocoder of this.geocoders) {
            const features = await geocoder.geocode(location?.query, opts);
            if (features.length === 0) {
                continue;
            }
            // Currently a 1:1 match between the GeocodeResult and the data service API.
            // We also store the original query to match it later on and help debugging.
            let found_location = features[0];

            // If latitude and longitude was specified by used we want to use it
            // and set geoResolution to Point
            if (location?.geometry?.latitude && location.geometry?.longitude) {
                found_location = {
                    ...found_location,
                    geometry: location.geometry,
                    geoResolution: Resolution.Point,
                };
            }

            // If geoResolution was provided by curator we want to use it
            if (location?.geoResolution) {
                found_location = {
                    ...found_location,
                    geoResolution: location.geoResolution,
                };
            }
            return {
                query: location?.query,
                ...found_location,
            };
        }
        throw new GeocodeNotFoundError(
            `Geocode not found for ${location.query}`,
        );
    }

    /**
     * Geocodes request content if no lat lng were provided.
     * This geocodes both case location and case travel locations if specified.
     *
     * @throws GeocodeNotFoundError if no geocode could be found.
     * @throws InvalidParamError if location.query is not specified and location
     *         is not complete already.
     */
    // For batch requests, the case body is nested.
    // While we could define a type here, the right change is probably to use a
    // batch geocoding API for such cases.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async geocode(req: Request | any): Promise<void> {
        const locationObject = await this.geocodeLocation(
            req.body['location'],
            false,
        );

        req.body['location'] = { ...req.body['location'], ...locationObject };
    }

    private addGeoResolution(req: Request | any): void {
        const location = req.body.location;
        if (location.geoResolution) return;
        if (location.geometry?.longitude && location.geometry?.latitude) {
            req.body.location.geoResolution = 'Point';
        } else if (location.admin3) {
            req.body.location.geoResolution = 'Admin3';
        } else if (location.admin2) {
            req.body.location.geoResolution = 'Admin2';
        } else if (location.admin1) {
            req.body.location.geoResolution = 'Admin1';
        } else if (location.country) {
            req.body.location.geoResolution = 'Country';
        }
    }
}

// Returns a mongoose query for all cases matching the given search query.
// If count is true, it returns a query for the number of cases matching
// the search query.
export const casesMatchingSearchQuery = (opts: {
    searchQuery: string;
    count: boolean;
    limit?: number;
    verificationStatus?: boolean;
    // Goofy Mongoose types require this.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): any => {
    // set data limit to 10K by default
    const countLimit = opts.limit ? opts.limit : 10000;
    const parsedSearch = parseSearchQuery(opts.searchQuery);
    let queryOpts;
    if (opts.verificationStatus) {
        queryOpts = parsedSearch.fullTextSearch
            ? {
                  $text: { $search: parsedSearch.fullTextSearch },
                  'curators.verifiedBy': { $exists: opts.verificationStatus },
              }
            : { 'curators.verifiedBy': { $exists: opts.verificationStatus } };
    } else {
        queryOpts = parsedSearch.fullTextSearch
            ? {
                  $text: { $search: parsedSearch.fullTextSearch },
              }
            : {};
    }

    // Always search with case-insensitivity.
    const casesQuery: Query<CaseDocument[], CaseDocument> = Day0Case.find(
        queryOpts,
    );

    const countQuery: Query<number, CaseDocument> = Day0Case.countDocuments(
        queryOpts,
    ).limit(countLimit);

    // Fill in keyword filters.
    parsedSearch.filters.forEach((f) => {
        if (f.values.length == 1) {
            const searchTerm = f.values[0];
            if (searchTerm === '*') {
                casesQuery.where(f.path).exists(true);
                countQuery.where(f.path).exists(true);
            } else if (f.dateOperator) {
                casesQuery.where({
                    [f.path]: {
                        [f.dateOperator]: f.values[0],
                    },
                });
                countQuery.where({
                    [f.path]: {
                        [f.dateOperator]: f.values[0],
                    },
                });
            } else if (
                f.path === 'demographics.gender' &&
                f.values[0] === 'notProvided'
            ) {
                casesQuery.where(f.path).exists(false);
                countQuery.where(f.path).exists(false);
            } else {
                casesQuery.where(f.path).equals(f.values[0]);
                countQuery.where(f.path).equals(f.values[0]);
            }
        } else {
            casesQuery.where(f.path).in(f.values);
            countQuery.where(f.path).in(f.values);
        }
    });
    return opts.count ? countQuery : casesQuery.lean();
};

// Returns a mongoose query for all cases matching the given search query.
// If count is true, it returns a query for the number of cases matching
// the search query.
export const bundledCasesMatchingSearchQuery = (opts: {
    searchQuery: string;
    count: boolean;
    limit?: number;
    verificationStatus?: boolean;
    // Goofy Mongoose types require this.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): any => {
    // set data limit to 10K by default
    const countLimit = opts.limit ? opts.limit : 10000;
    const parsedSearch = parseSearchQuery(opts.searchQuery);
    let queryOpts;
    if (opts.verificationStatus) {
        queryOpts = parsedSearch.fullTextSearch
            ? {
                  $text: { $search: parsedSearch.fullTextSearch },
                  'curators.verifiedBy': { $exists: opts.verificationStatus },
              }
            : { 'curators.verifiedBy': { $exists: opts.verificationStatus } };
    } else {
        queryOpts = parsedSearch.fullTextSearch
            ? {
                  $text: { $search: parsedSearch.fullTextSearch },
              }
            : {};
    }

    // Always search with case-insensitivity.
    const casesQuery: Query<CaseDocument[], CaseDocument> = Day0Case.find(
        queryOpts,
    );

    const countQuery: Query<number, CaseDocument> = Day0Case.countDocuments(
        queryOpts,
    ).limit(countLimit);

    // Fill in keyword filters.
    parsedSearch.filters.forEach((f) => {
        if (f.values.length == 1) {
            const searchTerm = f.values[0];
            if (searchTerm === '*') {
                casesQuery.where(f.path).exists(true);
                countQuery.where(f.path).exists(true);
            } else if (f.dateOperator) {
                casesQuery.where({
                    [f.path]: {
                        [f.dateOperator]: f.values[0],
                    },
                });
                countQuery.where({
                    [f.path]: {
                        [f.dateOperator]: f.values[0],
                    },
                });
            } else if (
                f.path === 'demographics.gender' &&
                f.values[0] === 'notProvided'
            ) {
                casesQuery.where(f.path).exists(false);
                countQuery.where(f.path).exists(false);
            } else {
                casesQuery.where(f.path).equals(f.values[0]);
                countQuery.where(f.path).equals(f.values[0]);
            }
        } else {
            casesQuery.where(f.path).in(f.values);
            countQuery.where(f.path).in(f.values);
        }
    });
    return opts.count ? countQuery : casesQuery.lean();
};

/**
 * Find IDs of existing cases that have {caseReference.sourceId,
 * caseReference.sourceEntryId} combinations matching any cases in the provided
 * request.
 *
 * This is used in batchUpsert. Background:
 *
 *   While MongoDB does return IDs of created documents, it doesn't do so
 *   for modified documents (e.g. cases updated via upsert calls). In
 *   order to (necessarily) provide that information, we'll query existing
 *   cases, filtering on provided case reference data, in order to provide
 *   an accurate list of updated case IDs.
 */
// @TODO
export const findCasesWithCaseReferenceData = async (
    req: Request,
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    fieldsToSelect: any = undefined,
): Promise<CaseDocument[]> => {
    const providedCaseReferenceData = req.body.cases
        .filter(
            // Day0Case data should be validated prior to this point.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (c: any) =>
                c.caseReference?.sourceId && c.caseReference?.sourceEntryId,
        )
        // Day0Case data should be validated prior to this point.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((c: any) => {
            return {
                'caseReference.sourceId': c.caseReference.sourceId,
                'caseReference.sourceEntryId': c.caseReference.sourceEntryId,
            };
        });

    if (providedCaseReferenceData.length > 0) {
        if (fieldsToSelect === undefined)
            return Day0Case.find().or(providedCaseReferenceData).exec();
        else
            return Day0Case.find()
                .or(providedCaseReferenceData)
                .select(fieldsToSelect)
                .exec();
    } else {
        return [];
    }
};

/**
 * Find IDs of existing cases that have {caseReference.sourceId,
 * caseReference.sourceEntryId} combinations matching any cases in the provided
 * request.
 *
 * This is used in batchUpsert. Background:
 *
 *   While MongoDB does return IDs of created documents, it doesn't do so
 *   for modified documents (e.g. cases updated via upsert calls). In
 *   order to (necessarily) provide that information, we'll query existing
 *   cases, filtering on provided case reference data, in order to provide
 *   an accurate list of updated case IDs.
 */
export const findCaseIdsWithCaseReferenceData = async (
    req: Request,
): Promise<string[]> => {
    return (
        await findCasesWithCaseReferenceData(
            req,
            /* fieldsToSelect= */ { _id: 1 },
        )
    ).map((c) => String(c._id));
};

/**
 * List most frequently used symptoms.
 *
 * Handles HTTP GET /api/cases/symptoms.
 */
// @TODO - Store symptoms as array in MongoDB
export const listSymptoms = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const limit = Number(req.query.limit);
    try {
        const symptoms = await Day0Case.aggregate([
            { $unwind: '$symptoms.values' },
            { $sortByCount: '$symptoms.values' },
            { $sort: { count: -1, _id: 1 } },
        ]).limit(limit);
        res.json({
            symptoms: symptoms.map((symptomObject) => symptomObject._id),
        });
        return;
    } catch (e) {
        if (e instanceof Error) logger.error(e);
        res.status(500).json(e);
        return;
    }
};

/**
 * List most frequently used places of transmission.
 *
 * Handles HTTP GET /api/cases/placesOfTransmission.
 */
// @TODO
export const listPlacesOfTransmission = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const limit = Number(req.query.limit);
    try {
        const placesOfTransmission = await Day0Case.aggregate([
            { $unwind: '$transmission.places' },
            { $sortByCount: '$transmission.places' },
            { $sort: { count: -1, _id: 1 } },
        ]).limit(limit);
        res.json({
            placesOfTransmission: placesOfTransmission.map(
                (placeOfTransmissionObject) => placeOfTransmissionObject._id,
            ),
        });
        return;
    } catch (e) {
        if (e instanceof Error) logger.error(e);
        res.status(500).json(e);
        return;
    }
};

/**
 * List most frequently used occupations.
 *
 * Handles HTTP GET /api/cases/occupations.
 */
// @TODO
export const listOccupations = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const limit = Number(req.query.limit);
    try {
        const occupations = await Day0Case.aggregate([
            { $sortByCount: '$demographics.occupation' },
            { $sort: { count: -1, _id: 1 } },
        ]).limit(limit);
        for (let i = 0; i < occupations.length; i++) {
            if (occupations[i]._id === null) {
                occupations.splice(i, 1);
            }
        }
        res.json({
            occupations: occupations.map(
                (occupationObject) => occupationObject._id,
            ),
        });
        return;
    } catch (e) {
        if (e instanceof Error) logger.error(e);
        res.status(500).json(e);
        return;
    }
};

/**
 * List most frequently used location comments.
 *
 * Handles HTTP GET /api/cases/location-comments.
 */
export const listLocationComments = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const limit = Number(req.query.limit);
    try {
        const locationComments = await Day0Case.aggregate([
            { $unwind: '$location.comment' },
            { $sortByCount: '$location.comment' },
            { $sort: { count: -1, _id: 1 } },
        ]).limit(limit);
        for (let i = 0; i < locationComments.length; i++) {
            if (locationComments[i]._id === null) {
                locationComments.splice(i, 1);
            }
        }
        res.json({
            locationComments: locationComments.map(
                (locationCommentsObject) => locationCommentsObject._id,
            ),
        });
        return;
    } catch (e) {
        if (e instanceof Error) logger.error(e);
        res.status(500).json(e);
        return;
    }
};

function validateCaseAges(caseStart: number, caseEnd: number) {
    if (
        caseStart < 0 ||
        caseEnd < caseStart ||
        caseStart > 120 ||
        caseEnd > 120
    ) {
        throw new InvalidParamError(
            `Day0Case validation failed: age range ${caseStart}-${caseEnd} invalid (must be within 0-120)`,
        );
    }
}
