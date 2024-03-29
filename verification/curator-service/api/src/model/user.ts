import bcrypt from 'bcrypt';
import { ObjectId, Collection } from 'mongodb';
import db from './database';

export enum Role {
    Admin = 'admin',
    Curator = 'curator',
    JuniorCurator = 'junior curator',
}

interface IUserPublicFields {
    id: string;
    name?: string;
    email: string;
    googleID?: string;
    roles: string[];
    picture?: string;
    newsletterAccepted?: boolean;
    apiKey?: string;
}

export type IUser = IUserPublicFields & {
    _id: ObjectId;
    password?: string;
    downloads?: [
        {
            timestamp: Date;
            format?: string;
            query?: string;
        },
    ];
};

export async function isUserPasswordValid(
    user: IUser,
    password: string,
): Promise<boolean> {
    if (!password) return false;
    if (!user.password) return false;
    const compare = await bcrypt.compare(password, user.password);
    return compare;
}

export function userPublicFields(
    user: IUser | undefined,
): IUserPublicFields | undefined {
    if (!user) return undefined;
    return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        googleID: user.googleID,
        roles: user.roles,
        picture: user.picture,
        newsletterAccepted: user.newsletterAccepted,
        apiKey: user.apiKey,
    };
}

export const users = () => db().collection('users') as Collection<IUser>;
export const sessions = () => db().collection('sessions');
