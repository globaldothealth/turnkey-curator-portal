import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';

import { Role, users } from '../model/user';
import { logger } from '../util/logger';

/**
 * List the users.
 * Response will contain {users: [list of users]}
 * and potentially another nextPage: <num> if more results are available.
 * Default values of 10 for limit and 1 for page is used.
 */
export const list = async (req: Request, res: Response): Promise<void> => {
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
    try {
        const [docsCursor, total] = await Promise.all([
            users().find(
                {},
                {
                    skip: limit * (page - 1),
                    limit: limit + 1,
                },
            ),
            users().countDocuments({}),
        ]);
        const docs = await docsCursor.toArray();

        // If we have more items than limit, add a response param
        // indicating that there is more to fetch on the next page.
        if (docs.length == limit + 1) {
            docs.splice(limit);
            res.json({
                users: docs,
                nextPage: page + 1,
                total: total,
            });
            return;
        }
        // If we fetched all available data, just return it.
        res.json({ users: docs, total: total });
    } catch (e) {
        res.status(422).json(e);
        return;
    }
};

/**
 * Update a single user's roles.
 */
export const updateRoles = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const userToUpdate = await users().findOne(new ObjectId(req.params.id));

        const currentRoles = userToUpdate?.roles || [];
        const newRoles = req.body.roles;

        // User cannot have both "curator" and "junior" curator roles
        if (
            currentRoles.includes('curator') &&
            newRoles.includes('junior curator')
        ) {
            newRoles.splice(newRoles.indexOf('curator'), 1);
        } else if (
            currentRoles.includes('junior curator') &&
            newRoles.includes('curator')
        ) {
            newRoles.splice(newRoles.indexOf('junior curator'), 1);
        }

        const result = await users().findOneAndUpdate(
            { _id: new ObjectId(req.params.id) },
            { $set: { roles: newRoles } },
            {
                // Return the updated object.
                returnDocument: 'after',
                 includeResultMetadata: true,
            },
        );
        if (!result.ok || !result.value) {
            res.status(404).json({
                message: `user with id ${req.params.id} could not be found`,
            });
            return;
        }
        res.json(result.value);
    } catch (err) {
        const error = err as Error;
        // TODO interpret mongodb error: I think validation is code == 121.
        logger.error('error updating roles', error);
        if (error.name === 'ValidationError') {
            res.status(422).json(error);
            return;
        }
        res.status(500).json(error);
        return;
    }
};

/**
 * Delete a user
 */
export const deleteUser = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const result = await users().deleteOne(
            { _id: new ObjectId(req.params.id) },
        );
        console.log(result);
        if (result.deletedCount !== 1) {
            res.status(404).json({
                message: `user with id ${req.params.id} could not be found`,
            });
            return;
        }
        res.status(204).end();
        return;
    } catch (err) {
        const error = err as Error;
        logger.error('error in deleting user', error);
        res.status(500).json(error);
        return;
    }
};

/**
 * List the roles defined in the system.
 */
export const listRoles = (req: Request, res: Response): void => {
    res.json({ roles: Object.values(Role) });
};
