export const labels = [
    'Case ID',
    'Verified',
    'Entry date',
    'Reported date',
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
    region?: string,
    district?: string,
    place?: string,
    location?: string,
    dateEntry?: string,
    dateReported?: string,
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
        dateReported: dateReported || '',
        caseStatus: caseStatus || '',
        country: country || '',
        region: region || '',
        district: district || '',
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
