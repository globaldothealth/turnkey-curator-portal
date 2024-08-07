import { Request, Response } from 'express';
import { cases, restrictedCases } from '../model/case';
import {
    awsRuleDescriptionForSource,
    awsRuleNameForSource,
    awsRuleTargetIdForSource,
    awsStatementIdForSource,
    ISource,
    sources,
} from '../model/source';

import AwsBatchClient from '../clients/aws-batch-client';
import EmailClient from '../clients/email-client';
import { ObjectId } from 'mongodb';
import { logger } from '../util/logger';
import { stronglyTypeUpload } from './uploads';

/**
 * Email notification that should be sent on any update to a source.
 */
enum NotificationType {
    /**
     * Send the email that a schedule has been added.
     */
    Add = 'Add',
    /**
     * Send the email that a schedule has been removed.
     */
    Remove = 'Remove',
    /**
     * No change that requires email notification has been made.
     */
    None = 'None',
}

/**
 * SourcesController handles HTTP requests from curators and automated ingestion
 * functions related to sources of case data.
 */
export default class SourcesController {
    constructor(
        private readonly emailClient: EmailClient,
        private readonly batchClient: AwsBatchClient,
        private readonly dataServerURL: string,
    ) {}

    /**
     * List the sources.
     * Response will contain {sources: [list of sources]}
     * and potentially another nextPage: <num> if more results are available.
     * Default values of 10 for limit and 1 for page is used.
     */
    list = async (req: Request, res: Response): Promise<void> => {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        if (page < 1) {
            res.status(422).json({ message: 'page must be > 0' });
            return;
        }
        if (limit < 1) {
            res.status(422).json({ message: 'limit must be > 0' });
            return;
        }
        const filter = req.query.url
            ? {
                  'origin.url': new RegExp(req.query.url as string, 'i'),
              }
            : {};
        try {
            const [docsCursor, total] = await Promise.all([
                sources().find(filter, {
                    sort: { name: 1 },
                    skip: limit * (page - 1),
                    limit: limit + 1,
                }),
                sources().countDocuments(filter),
            ]);
            const docs = await docsCursor.toArray();
            // If we have more items than limit, add a response param
            // indicating that there is more to fetch on the next page.
            if (docs.length == limit + 1) {
                docs.splice(limit);
                res.json({
                    sources: docs,
                    nextPage: page + 1,
                    total: total,
                });
                return;
            }
            // If we fetched all available data, just return it.
            res.json({ sources: docs, total: total });
        } catch (e) {
            res.status(422).json(e);
            return;
        }
    };

    /**
     * Get sources for the acknowledgement table
     * This is a public endpoint because acknowledgement table needs to
     * be accessible without logging in
     */
    listSourcesForTable = async (req: Request, res: Response) => {
        try {
            const sourcesCursor = await sources().find(
                {},
                {
                    projection: {
                        name: 1,
                        'origin.providerName': 1,
                        'origin.providerWebsiteUrl': 1,
                        'origin.url': 1,
                        'origin.license': 1,
                    },
                },
            );
            const theSources = await sourcesCursor.toArray();
            return res.json(theSources);
        } catch (err) {
            const error = err as Error;
            logger.error('error from acknowledgements');
            logger.error(error);

            res.status(500).json(error);
            return;
        }
    };

    /**
     * Get a single source.
     */
    get = async (req: Request, res: Response): Promise<void> => {
        const doc = await sources().findOne({
            _id: new ObjectId(req.params.id),
        });
        if (!doc) {
            res.status(404).json({
                message: `source with id ${req.params.id} could not be found`,
            });
            return;
        }
        res.json(doc);
    };

    /**
     * Update a single source.
     */
    update = async (req: Request, res: Response): Promise<void> => {
        try {
            logger.info(`updating source with ID ${req.params.id}`);
            const sourceId = new ObjectId(req.params.id);
            const originalSource = await sources().findOne({ _id: sourceId });
            if (!originalSource) {
                logger.error(
                    `source with id ${req.params.id} could not be found`,
                );
                res.status(404).json({
                    message: `source with id ${req.params.id} could not be found`,
                });
                return;
            }
            if (req.body.uploads) {
                req.body.uploads = req.body.uploads.map(stronglyTypeUpload);
            }
            if (req.body._id) {
                delete req.body._id;
            }
            const update = {
                $set: {
                    ...req.body,
                },
                $unset: {},
            };
            // Undefined fields are removed from the request body by openapi
            // validator, if we want to unset the dateFilter we have to pass an
            // empty object and set it undefined ourselves here.
            if (JSON.stringify(req.body.dateFilter) === '{}') {
                update['$unset'] = {
                    dateFilter: 1,
                };
                delete update['$set'].dateFilter;
            }
            const updatedSource = await sources().findOneAndUpdate(
                { _id: sourceId },
                update,
                { returnDocument: 'after', includeResultMetadata: true },
            );
            if (!updatedSource.ok) {
                logger.error(
                    `error updating source with ID ${req.params.id}`,
                    updatedSource.lastErrorObject,
                );
            }

            const finalSource = await sources().findOne({ _id: sourceId });
            res.json(finalSource);
        } catch (err) {
            const error = err as Error;
            logger.error(`error updating source with ID ${req.params.id}`);
            logger.error(error);
            if (error.name === 'ValidationError') {
                res.status(422).json(error);
                return;
            }

            res.status(500).json(error);
            return;
        }
    };

    /**
     * Create a single source.
     */
    create = async (req: Request, res: Response): Promise<void> => {
        try {
            logger.info('inserting new source');
            const sourceId = new ObjectId();
            if (req.body.uploads) {
                req.body.uploads = req.body.uploads.map(stronglyTypeUpload);
            }
            const result = await sources().insertOne({
                _id: sourceId,
                ...req.body,
            });
            logger.info(`insert acknowledged: ${result.acknowledged}`);
            if (!result.acknowledged) {
                logger.error('error inserting source');
            }
            logger.info('inserted source');
            // now get the source back from mongo, in case any triggers changed anything
            const source = await sources().findOne({
                _id: sourceId,
            });
            res.status(201).json(source);
        } catch (err) {
            const error = err as Error;
            logger.error('error inserting source');
            logger.error(error);
            if (error.name === 'ValidationError') {
                res.status(422).json(err);
                return;
            }
            res.status(500).json(err);
        }
    };

    /**
     * Delete a single source.
     */
    del = async (req: Request, res: Response): Promise<void> => {
        const sourceId = new ObjectId(req.params.id);
        const source = await sources().findOne({ _id: sourceId });
        if (!source) {
            res.sendStatus(404);
            return;
        }

        const query = { 'caseReference.sourceId': sourceId.toHexString() };
        const count = await cases().count(query);
        const restrictedCount = await restrictedCases().count(query);
        if (count + restrictedCount !== 0) {
            res.status(403).json({
                message: 'Source still has cases and cannot be deleted.',
            });
            return;
        }

        sources().deleteOne({ _id: sourceId });
        res.status(204).end();
        return;
    };

    /** Trigger retrieval of the source's content in S3. */
    retrieve = async (req: Request, res: Response): Promise<void> => {
        try {
            const parseDateRange =
                req.query.parse_start_date && req.query.parse_end_date
                    ? {
                          start: req.query.parse_start_date as string,
                          end: req.query.parse_end_date as string,
                      }
                    : undefined;
            const output = await this.batchClient.doRetrieval(
                req.params.id,
                parseDateRange,
            );
            res.json(output);
        } catch (err) {
            res.status(500).json(err);
        }
        return;
    };

    /** Lists available parsers for automated ingestion */
    listParsers = async (req: Request, res: Response): Promise<void> => {
        try {
            const output = await this.batchClient.listParsers();
            res.json(output);
        } catch (err) {
            res.status(500).json(err);
        }
        return;
    };
}
