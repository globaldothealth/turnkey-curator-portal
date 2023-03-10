export const labels = [
    'Case ID',
    'Entry date',
    'Case status',
    'Country',
    'City',
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
    country: string,
    city?: string,
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
