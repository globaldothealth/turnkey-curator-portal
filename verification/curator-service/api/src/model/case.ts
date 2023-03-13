import { Collection } from 'mongodb';
import db from './database';

export enum CaseStatus {
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
    pathogen: string;
    caseStatus: CaseStatus;
    location: {
        country: string;
        countryISO2: string;
    };
    caseReference: {
        sourceId: string;
        sourceUrl: string;
    };
    events: {
        dateEntry: Date;
    };
};

export const cases = () => db().collection('cases') as Collection<ICase>;
export const restrictedCases = () => db().collection('restrictedcases');
