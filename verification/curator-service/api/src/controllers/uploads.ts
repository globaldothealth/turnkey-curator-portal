import { Request, Response } from 'express';

import { sources, ISource } from '../model/source';
import EmailClient from '../clients/email-client';
import { IUpload } from '../model/upload';
import { ObjectId } from 'mongodb';
import { logger } from '../util/logger';

type MaybeUpload = {
    _id?: string | ObjectId;
    created?: string | Date;
};

export const stronglyTypeUpload = (u: MaybeUpload) => {
    const upload = { ...u };
    if (!u._id) {
        upload._id = new ObjectId();
    }
    if (typeof u._id === 'string') {
        upload._id = new ObjectId(u._id);
    }
    if (!u.created) {
        upload.created = new Date();
    }
    if (typeof u.created === 'string') {
        upload.created = new Date(u.created);
    }
    return upload as IUpload;
};

/**
 * UploadsController handles single uploads, that is a batch of cases sent
 * together that can be verified by a curator together as well.
 */
export default class UploadsController {
    constructor(private readonly emailClient: EmailClient) {}

    /**
     * Creates a new upload for the source present in the req.params.sourceId.
     * The added upload is sent in the response.
     */
    create = async (req: Request, res: Response): Promise<void> => {
        try {
            const sourceId = new ObjectId(req.params.sourceId);
            logger.info(`creating new upload on source ${sourceId}`);
            const source = await sources().findOne({ _id: sourceId });
            if (!source) {
                logger.error(`requested upload for unknown source ${sourceId}`);
                res.status(404).json({
                    message: `Parent resource (source ID ${req.params.sourceId}) not found.`,
                });
                return;
            }
            const upload = stronglyTypeUpload(req.body);
            const result = await sources().findOneAndUpdate(
                { _id: sourceId },
                {
                    $push: {
                        uploads: upload,
                    },
                },
                { returnDocument: 'after', includeResultMetadata: true },
            );
            const updatedSource = result.value!;
            const update =
                updatedSource.uploads[updatedSource.uploads.length - 1];
            if (update.status === 'ERROR') {
                this.sendErrorNotification(updatedSource, update);
            }
            res.status(201).json(update);
            return;
        } catch (err) {
            const error = err as Error;
            logger.error(
                `unable to add upload to source ${req.params.sourceId}`,
            );
            logger.error(error);
            if (error.name === 'ValidationError') {
                res.status(422).json(error);
                return;
            }
            res.status(500).json(error);
        }
    };

    /**
     * Update an existing upload.
     * The updated source is sent in the response.
     */
    update = async (req: Request, res: Response): Promise<void> => {
        try {
            const sourceId = new ObjectId(req.params.sourceId);
            logger.info(
                `updating upload ${req.params.id} for source ${req.params.sourceId}`,
            );
            const source = await sources().findOne({ _id: sourceId });
            if (!source) {
                logger.error(
                    `updating upload for source ${sourceId} failed as the source can't be found`,
                );
                res.status(404).json({
                    message: `Parent resource (source ID ${req.params.sourceId}) not found.`,
                });
                return;
            }
            const upload = source.uploads?.find(
                (u: IUpload) => u._id.toString() === req.params.id,
            );
            if (!upload) {
                logger.error(
                    `Upload with ID ${req.params.id} not found in source ${req.params.sourceId}.`,
                );
                res.status(404).json({
                    message: `Upload with ID ${req.params.id} not found in source ${req.params.sourceId}.`,
                });
                return;
            }
            const uploadIndex = source.uploads.indexOf(upload);
            Object.assign(upload, req.body);

            const result = await sources().findOneAndUpdate(
                { _id: sourceId },
                {
                    $set: {
                        [`uploads.${uploadIndex}`]: upload,
                    },
                },
                { returnDocument: 'after', includeResultMetadata: true },
            );
            if (upload.status === 'ERROR') {
                this.sendErrorNotification(result.value!, upload);
            }
            res.json(result.value);
        } catch (err) {
            const error = err as Error;
            logger.error(
                `error updating upload ${req.params.id} in source ${req.params.sourceId}.`,
            );
            logger.error(error);
            if (error.name === 'ValidationError') {
                res.status(422).json(err);
                return;
            }
            res.status(500).json(err);
            return;
        }
    };

    /**
     * Lists all the uploads.
     * A default pagination of 10 items per page is used.
     */
    list = async (req: Request, res: Response): Promise<void> => {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const changesOnlyMatcher = req.query.changes_only
            ? [
                  {
                      $match: {
                          $or: [
                              { 'uploads.status': { $ne: 'SUCCESS' } },
                              { 'uploads.summary.numCreated': { $gt: 0 } },
                              { 'uploads.summary.numUpdated': { $gt: 0 } },
                          ],
                      },
                  },
              ]
            : [];
        try {
            const [uploadsCursor, totalCursor] = await Promise.all([
                sources().aggregate([
                    { $unwind: '$uploads' },
                    ...changesOnlyMatcher,
                    { $sort: { 'uploads.created': -1, name: -1 } },
                    { $skip: limit * (page - 1) },
                    { $limit: limit + 1 },
                    {
                        $project: {
                            _id: false,
                            sourceName: '$name',
                            sourceUrl: '$origin.url',
                            // isGovernmentSource: '$origin.isGovernmentSource', TODO what do we use it for?
                            upload: '$uploads',
                        },
                    },
                ]),
                sources().aggregate([
                    { $unwind: '$uploads' },
                    ...changesOnlyMatcher,
                    { $count: 'total' },
                ]),
            ]);
            const [uploads, total] = await Promise.all([
                uploadsCursor.toArray(),
                totalCursor.toArray(),
            ]);
            // If we have more items than limit, add a response param
            // indicating that there is more to fetch on the next page.
            if (uploads.length == limit + 1) {
                uploads.splice(limit);
                res.json({
                    uploads: uploads,
                    nextPage: page + 1,
                    ...total[0],
                });
                return;
            }
            // If we fetched all available data, just return it.
            res.json({ uploads: uploads, ...total[0] });
            return;
        } catch (err) {
            res.status(500).json(err);
            return;
        }
    };

    private async sendErrorNotification(
        source: ISource,
        upload: IUpload,
    ): Promise<void> {
        if (
            source.automation?.schedule &&
            source.notificationRecipients?.length > 0
        ) {
            const subject = 'Automated upload failed for source';
            const text = `An automated upload failed for the following source in G.h List;
                    \n
                    \tID: ${source._id}
                    \tName: ${source.name}
                    \tURL: ${source.origin.url}
                    \tFormat: ${source.format}
                    \tSchedule: ${source.automation.schedule.awsScheduleExpression}
                    \tParser: ${source.automation.parser?.awsLambdaArn}
                    \n
                    Upload details:
                    \n
                    \tID: ${upload._id}
                    \tError: ${upload.summary?.error}
                    \tStart: ${upload.created}`;
            await this.emailClient.send(
                source.notificationRecipients,
                subject,
                text,
            );
        }
    }
}
