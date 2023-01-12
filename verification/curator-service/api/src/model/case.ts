import { Collection, ObjectId } from 'mongodb';
import db from './database';

enum CaseStatus {
    Confirmed = 'confirmed',
    Suspected = 'suspected',
    Discarded = 'discarded',
    OmitError = 'omit_error',
}

/*
 * This is a minimal case schema to support some source-related behaviour.
 * The full schema for cases is in the data service.
 */

export type ICase = {
    ID: ObjectId;
    Pathogen: string;
    Case_status: CaseStatus;
    Country: string;
    Country_ISO3: string;
    Source: string;
    Date_entry: Date;
    Date_last_modified: Date;
};

export const cases = () => db().collection('cases') as Collection<ICase>;
export const restrictedCases = () => db().collection('restrictedcases');
('');
