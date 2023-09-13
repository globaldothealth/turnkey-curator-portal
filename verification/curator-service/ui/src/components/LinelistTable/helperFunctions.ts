export const labels = [
    'Case ID',
    'Verified',
    'Entry date',
    'Case status',
    'Country',
    'Place',
    'Location',
    'Age',
    'Gender',
    'Outcome',
    'Hospitalization date',
    'Symptoms onset date',
    'Source URL',
];

export const createData = (
    caseId: string,
    verified: boolean,
    country: string,
    place?: string,
    location?: string,
    dateEntry?: string,
    age?: string,
    gender?: string,
    outcome?: string,
    dateHospitalization?: string,
    dateOnset?: string,
    source?: string,
    caseStatus?: string,
) => {
    return {
        caseId: caseId || '',
        dateEntry: dateEntry || '',
        caseStatus: caseStatus || '',
        country: country || '',
        place: place || '',
        location: location || '',
        age: age || '',
        gender: gender || '',
        outcome: outcome || '',
        dateHospitalization: dateHospitalization || '',
        dateOnset: dateOnset || '',
        source: source || '',
        verified: verified || false,
    };
};
