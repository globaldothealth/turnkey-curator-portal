import mongoose from 'mongoose';
import { YesNo } from '../types/enums';

export const transmissionSchema = new mongoose.Schema(
    {
        contactWithCase: {
            type: String,
            enum: YesNo,
        },
        contactId: String,
        contactSetting: String,
        contactAnimal: String,
        contactComment: String,
        transmission: String,
    },
    { _id: false },
);

export type TransmissionDocument = mongoose.Document & {
    contactWithCase: YesNo;
    contactId: string;
    contactSetting: string;
    contactAnimal: string;
    contactComment: string;
    transmission: string;
};
