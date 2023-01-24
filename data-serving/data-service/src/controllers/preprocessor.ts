import { Day0Case, CaseDocument } from '../model/day0-case';
import { NextFunction, Request, Response } from 'express';
import {
    casesMatchingSearchQuery,
    findCasesWithCaseReferenceData,
} from './case';

import { CaseRevision } from '../model/case-revision';
import { DocumentQuery } from 'mongoose';
import _ from 'lodash';

export const getCase = async (
    request: Request,
): Promise<CaseDocument | null> => {
    const source = request.body?.Source;

    if (
        (request.method == 'PUT' || request.method == 'DELETE') &&
        request.params?.id
    ) {
        // Update or delete.
        return Day0Case.findById(request.params.id);
    } else if (
        request.method == 'PUT' &&
        source &&
        source.sourceId &&
        source.sourceEntryId
    ) {
        // Upsert.
        // TODO: Upserts should only generate update metadata if there is a
        // diff with what's already in the database.
        return Day0Case.findOne({
            'source.sourceId': source.sourceId,
            'source.sourceEntryId': source.sourceEntryId,
        });
    }

    return null;
};

// Remove cases from the request that don't need to be updated.
export const batchUpsertDropUnchangedCases = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    const existingCasesByCaseRefCombo = new Map(
        (await findCasesWithCaseReferenceData(request))
            .filter((c) => c && c.Source)
            .map((c) => [c.Source.sourceId + ':' + c.Source.sourceEntryId, c]),
    );

    for (let i = 0; i < request.body.cases.length; i++) {
        const c = request.body.cases[i];
        if (c.Source?.sourceId && c.Source?.sourceEntryId) {
            const existingCase = existingCasesByCaseRefCombo.get(
                c.Source.sourceId + ':' + c.Source.sourceEntryId,
            );
            if (existingCase !== undefined && existingCase.equalsJSON(c)) {
                request.body.cases.splice(i, 1);
                i--;
            }
        }
    }

    next();
};

// Set appropriate values for the revision metadata and uploadids fields.
export const setBatchUpsertFields = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    const curatorEmail = request.body.curator.email;

    // Find and map existing cases by sourceId:sourceEntryId.
    const existingCasesByCaseRefCombo = new Map(
        (await findCasesWithCaseReferenceData(request))
            .filter((c) => c && c.Source)
            .map((c) => [c.Source.sourceId + ':' + c.Source.sourceEntryId, c]),
    );

    // TODO: Type request Cases.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    request.body.cases.forEach((c: any) => {
        // If case is present, add uploadIds to existing list of uploadIds
        if (c.Source.uploadIds && c.Source.sourceId && c.Source.sourceEntryId) {
            const existingCaseUploadIds = existingCasesByCaseRefCombo.get(
                c.Source.sourceId + ':' + c.Source.sourceEntryId,
            )?.Source?.uploadIds;
            if (existingCaseUploadIds) {
                c.Source.uploadIds = _.union(
                    c.Source.uploadIds,
                    existingCaseUploadIds,
                );
            }
        }
    });
    // Clean up the additional metadata that falls outside the `case` entity.
    delete request.body.curator;

    next();
};

export const findCasesToUpdate = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    // Find all cases matching the query
    const matchedCases = await (casesMatchingSearchQuery({
        searchQuery: request.body.query,
        count: false,
    }) as DocumentQuery<CaseDocument[], CaseDocument, unknown>).exec();

    // Set those case ids to be updated with the request case.
    // TODO: Type request Cases.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const casesToUpdate = matchedCases.map((c: any) => {
        return { _id: c._id, ...request.body.case };
    });
    request.body.cases = casesToUpdate;

    // Delete no longer used fields
    delete request.body.query;
    delete request.body.case;

    next();
};

export const findCasesForSource = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    // find the appropriate cases
    const cases = await Day0Case.find({
        'caseReference.sourceId': request.query.sourceId?.toString(),
    });
    request.body.cases = cases;
    // and store the curator email
    request.body.curator = {
        email: request.query.email,
    };

    next();
};

export const createCaseRevision = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    const c = await getCase(request);

    if (c) {
        await new CaseRevision({
            case: c,
        }).save();
    }

    next();
};

export const batchDeleteCheckThreshold = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    if (request.body.query) {
        const maxCasesThreshold = request.body['maxCasesThreshold'];
        if (maxCasesThreshold) {
            const total = await casesMatchingSearchQuery({
                searchQuery: request.body.query,
                count: true,
                limit: maxCasesThreshold + 1,
            });
            if (total > Number(maxCasesThreshold)) {
                response.status(422).json({
                    message: `query ${request.body.query} will delete ${total} cases which is more than the maximum allowed of ${maxCasesThreshold}, only admins are not subject to the maximum number of cases restriction. Please contact one if you wish to move forward with the deletion.`,
                });
                return;
            }
        }
    }

    next();
};

export const createBatchDeleteCaseRevisions = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    let casesToDelete: { case: CaseDocument }[];
    if (request.body.caseIds !== undefined) {
        casesToDelete = (
            await Day0Case.find({
                _id: {
                    $in: request.body.caseIds,
                },
            }).exec()
        ).map((c) => {
            return {
                case: c,
            };
        });
    } else {
        const casesQuery = casesMatchingSearchQuery({
            searchQuery: request.body.query,
            count: false,
        });
        casesToDelete = (await Day0Case.find(casesQuery).exec()).map((c) => {
            return {
                case: c,
            };
        });
    }

    await CaseRevision.insertMany(casesToDelete, {
        ordered: false,
        rawResult: true,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore Mongoose types don't include the `lean` option from its
        // documentation: https://mongoosejs.com/docs/api.html#model_Model.insertMany
        lean: true,
    });

    next();
};

export const createBatchUpsertCaseRevisions = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    const casesToUpsert = (await findCasesWithCaseReferenceData(request)).map(
        (c) => {
            return {
                case: c,
            };
        },
    );

    try {
        await CaseRevision.insertMany(casesToUpsert, {
            ordered: false,
            rawResult: true,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore Mongoose types don't include the `lean` option from its
            // documentation: https://mongoosejs.com/docs/api.html#model_Model.insertMany
            lean: true,
        });
    } catch (err) {
        console.log('Failed to insert some case revisions');
        console.log(err);
    }

    next();
};

export const createBatchUpdateCaseRevisions = async (
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> => {
    const casesToUpdate = (
        await Day0Case.find({
            _id: {
                // TODO: Type request Cases.
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                $in: request.body.cases.map((c: any) => c._id),
            },
        }).exec()
    ).map((c) => {
        return {
            case: c,
        };
    });

    try {
        await CaseRevision.insertMany(casesToUpdate, {
            ordered: false,
            rawResult: true,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore Mongoose types don't include the `lean` option from its
            // documentation: https://mongoosejs.com/docs/api.html#model_Model.insertMany
            lean: true,
        });
    } catch (err) {
        console.log('Failed to insert some case revisions');
        console.log(err);
    }

    next();
};
