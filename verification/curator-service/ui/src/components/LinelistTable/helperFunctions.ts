export const labels = [
    'Case ID',
    'Verified',
    'Date Modified',
    'Last Modified By',
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
    dateModified: string,
    lastModifiedBy: string,
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
    comment?: string,
) => {
    return {
        age: age || '',
        caseId: caseId || '',
        caseStatus: caseStatus || '',
        comment: comment || '',
        country: country || '',
        dateEntry: dateEntry || '',
        dateHospitalization: dateHospitalization || '',
        dateModified: dateModified || '',
        dateOnset: dateOnset || '',
        dateReported: dateReported || '',
        district: district || '',
        gender: gender || '',
        lastModifiedBy: lastModifiedBy || '',
        location: location || '',
        outcome: outcome || '',
        place: place || '',
        region: region || '',
        source: source || '',
        verified: verified || false,
    };
};
