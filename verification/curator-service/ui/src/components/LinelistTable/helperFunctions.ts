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
    dateConfirmation?: string,
    age?: string,
    gender?: string,
    outcome?: string,
    dateHospitalization?: string,
    dateOnset?: string,
    source?: string,
    caseStatus?: CaseStatus | '',
) => {
    return {
        caseId: caseId || '',
        dateConfirmation: dateConfirmation || '',
        caseStatus: caseStatus || '',
        country: country || '',
        city: city || '',
        location: location || '',
        age: age || '',
        gender: gender || '',
        outcome: outcome || '',
        dateHospitalization: dateHospitalization || '',
        dateOnset: dateOnset || '',
        source: source || '',
    };
};
