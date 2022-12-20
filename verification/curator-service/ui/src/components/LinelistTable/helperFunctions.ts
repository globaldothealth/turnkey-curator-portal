import { CaseStatus } from '../../api/models/Day0Case';

export const labels = [
    'Case ID',
    'Confirmation date',
    'Case status',
    'Country',
    'City',
    'Location',
    'Age',
    'Gender',
    'Outcome',
    'Hospitalization date/period',
    'Symptoms onset date',
    'Source URL',
];

export const createData = (
    caseId: string,
    country: string,
    city?: string,
    location?: string,
    confirmationDate?: string,
    age?: string,
    gender?: string,
    outcome?: string,
    hospitalizationDate?: string,
    symptomsOnsetDate?: string,
    sourceUrl?: string,
    caseStatus?: CaseStatus,
) => {
    return {
        caseId: caseId || '',
        confirmationDate: confirmationDate || '',
        caseStatus: caseStatus || '',
        country: country || '',
        city: city || '',
        location: location || '',
        age: age || '',
        gender: gender || '',
        outcome: outcome || '',
        hospitalizationDate: hospitalizationDate || '',
        symptomsOnsetDate: symptomsOnsetDate || '',
        sourceUrl: sourceUrl || '',
    };
};
