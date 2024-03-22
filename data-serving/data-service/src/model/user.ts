import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

export type IUser = {
    name: string;
    email: string;
    roles: string[];
};

export type UserDocument = mongoose.Document &
    IUser & {
        _id: ObjectId;
    };

export const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    roles: [String],
});

export const User = mongoose.model<UserDocument>('User', userSchema);
