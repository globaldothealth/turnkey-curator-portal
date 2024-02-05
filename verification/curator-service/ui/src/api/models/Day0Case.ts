export enum CaseStatus {
    Confirmed = 'confirmed',
    Probable = 'probable',
    Suspected = 'suspected',
    Discarded = 'discarded',
    OmitError = 'omit_error',
}

export enum PathogenStatus {
    Endemic = 'endemic',
    Emerging = 'emerging',
    Unknown = 'unknown',
}

export enum SexAtBirth {
    Male = 'male',
    Female = 'female',
    Other = 'other',
}

export enum Gender {
    Man = 'man',
    Woman = 'woman',
    Transgender = 'transgender',
    NonBinary = 'non-binary',
    Other = 'other',
}

export enum Race {
    NaHaOrOtPaIs = 'Native Hawaiian or Other Pacific Islander',
    Asian = 'Asian',
    AmInOrAlNa = 'American Indian or Alaska Native',
    BlOrAfAm = 'Black or African American',
    White = 'White',
    Other = 'Other',
}

export enum Ethnicity {
    HisOrLat = 'Hispanic or Latino',
    NotHisOrLat = 'Not Hispanic or Latino',
    Other = 'other',
}

export enum YesNo {
    Y = 'Y',
    N = 'N',
    NA = 'NA',
}

export enum ContactSetting {
    House = 'HOUSE',
    Work = 'WORK',
    School = 'SCHOOL',
    Health = 'HEALTH',
    Party = 'PARTY',
    Bar = 'BAR',
    Large = 'LARGE',
    LargeContact = 'LARGECONTACT',
    Other = 'OTHER',
    Unknown = 'UNK',
}

export enum ContactAnimal {
    Pet = 'PET',
    PetRodents = 'PETRODENTS',
    Wild = 'WILD',
    WildRodents = 'WILDRODENTS',
    Other = 'OTHER',
}

export enum Transmission {
    Animal = 'ANIMAL',
    Hai = 'HAI',
    Lab = 'LAB',
    MTCT = 'MTCT',
    Other = 'OTHER',
    Fomite = 'FOMITE',
    PTP = 'PTP',
    Sex = 'SEX',
    Transfusion = 'TRANSFU',
    Unknown = 'UNK',
}

export enum HospitalizationReason {
    Monitoring = 'monitoring',
    Treatment = 'treatment',
    Unknown = 'unknown',
}

export enum Outcome {
    Recovered = 'recovered',
    Death = 'death',
    OngoingPostAcuteCondition = 'ongoing post-acute condition',
}

export interface CaseReference {
    sourceId: string;
    sourceUrl: string;
    isGovernmentSource: boolean;
    id?: string;
    sourceEntryId?: string;
    uploadIds?: string[];
    additionalSources?: {
        sourceUrl: string;
        isGovernmentSource: boolean;
    }[];
}

export interface Demographics {
    ageRange?: {
        start: number;
        end: number;
    };
    gender?: Gender | '';
    occupation?: string;
    healthcareWorker?: YesNo | '';
}

export interface GeocodeLocation {
    country: string;
    countryISO3: string;
    administrativeAreaLevel1?: string;
    administrativeAreaLevel2?: string;
    administrativeAreaLevel3?: string;
    geoResolution: string;
    name: string;
    region: string;
    district: string;
    place: string;
    location: string;
    // Set this field to perform geocoding and fill the rest of the location object.
    query?: string;
    // Optional to hint geocoding results.
    limitToResolution?: string;
    geometry?: Geometry;
}

export interface Geometry {
    longitude?: number;
    latitude?: number;
}

export interface Location {
    geoResolution?: string;
    country: string;
    countryISO3: string;
    location?: string;
    region?: string;
    district?: string;
    place?: string;
    // this variable is needed in the API in order to geocode properly
    query?: string;
    name?: string;
    geometry?: Geometry;
    comment?: string;
}

export interface Events {
    dateEntry: string | null;
    dateReported: string | null;
    dateLastModified: string | null;
    dateOnset?: string | null;
    dateConfirmation?: string | null;
    confirmationMethod?: string;
    dateOfFirstConsult?: string | null;
    hospitalized?: YesNo | '';
    reasonForHospitalization?: HospitalizationReason | '';
    dateHospitalization?: string | null;
    dateDischargeHospital?: string | null;
    intensiveCare?: YesNo | '';
    dateAdmissionICU?: string | null;
    dateDischargeICU?: string | null;
    homeMonitoring?: YesNo | '';
    isolated?: YesNo | '';
    dateIsolation?: string | null;
    outcome?: Outcome | '';
    dateDeath?: string | null;
    dateRecovered?: string | null;
}

export interface PreexistingConditions {
    previousInfection?: YesNo | '';
    coInfection?: string;
    preexistingCondition?: string;
    pregnancyStatus?: YesNo | '';
}

export interface Transmission_old {
    contactWithCase?: YesNo | '';
    contactId?: string;
    contactSetting?: string;
    contactAnimal?: string;
    contactComment?: string;
    transmission?: string;
}

export interface TravelHistory {
    travelHistory?: YesNo | '';
    travelHistoryEntry?: string | null;
    travelHistoryStart?: string;
    travelHistoryLocation?: string;
    travelHistoryCountry?: string;
}

export interface GenomeSequences {
    genomicsMetadata?: string;
    accessionNumber?: string;
}

export interface Vaccination {
    vaccination?: YesNo | '';
    vaccineName?: string;
    vaccineDate?: string | null;
    vaccineSideEffects?: string;
}

// this is not an official day 0 case schema field but it has
// to have such properties in order to work with the API
export interface ISource {
    sourceUrl: string;
    isGovernmentSource: string;
    sourceId: string;
    sourceName?: string;
    sourceLicense?: string;
    sourceProviderName?: string;
    sourceProviderUrl?: string;
    sourceEntryId?: string;
}

export interface CuratorData {
    name?: string;
    email: string;
}

export interface Curators {
    createdBy: CuratorData;
    verifiedBy?: CuratorData;
}

export interface RevisionMetadata {
    revisionNumber: number;
    creationMetadata: {
        curator: string;
        date?: string;
    };
    updateMetadata: {
        curator: string;
        date?: string;
        notes?: string;
    };
}

export interface Day0Case {
    // Case Demographics
    _id?: string;
    caseStatus: CaseStatus | '';
    pathogen: string;
    pathogenStatus: PathogenStatus | undefined;
    age: string;
    sexAtBirth: SexAtBirth | undefined;
    sexAtBirthOther: string | '';
    gender: Gender | undefined;
    genderOther: string | '';
    race: Race | undefined;
    raceOther: string | '';
    ethnicity: Ethnicity | undefined;
    ethnicityOther: string | '';
    nationality: string | '';
    nationalityOther: string | '';
    occupation: string | '';
    healthcareWorker: YesNo | undefined;
    // Medical History
    previousInfection: YesNo | undefined;
    coInfection: string[];
    preexistingCondition: string[];
    pregnancyStatus: YesNo | undefined;
    vaccination: YesNo | undefined;
    vaccineName: string | '';
    vaccineDate: string | null;
    vaccineSideEffects: string[];
    // Clinical Presentation
    symptoms: string[];
    dateReport: string | null;
    dateOnset: string | null;
    dateConfirmation: string | null;
    confirmationMethod: string | '';
    dateOfFirstConsultation: string | null;
    hospitalised: YesNo | undefined;
    reasonForHospitalisation: string[];
    dateHospitalisation: string | null;
    dateDischargeHospital: string | null;
    intensiveCare: YesNo | undefined;
    dateAdmissionICU: string | null;
    dateDischargeICU: string | null;
    homeMonitoring: YesNo | undefined;
    isolated: YesNo | undefined;
    dateIsolation: string | null;
    outcome: Outcome | undefined;
    dateDeath: string | null;
    dateRecovery: string | null;
    // Exposure
    contactWithCase: YesNo | undefined;
    contactID: string | '';
    contactSetting: ContactSetting | undefined;
    contactSettingOther: string | '';
    contactAnimal: ContactAnimal | undefined;
    contactComment: string | '';
    transmission: Transmission | undefined;
    travelHistory: YesNo | undefined;
    travelHistoryEntry: string | null;
    travelHistoryStart: string | null;
    travelHistoryLocation: Location;
    // Laboratory Information
    genomicsMetadata: string | '';
    accessionNumber: string | '';
    // Source Information
    source: string | '';
    sourceII: string | '';
    sourceIII: string | '';
    sourceIV: string | '';
    dateEntry: string | null;
    dateLastModified: string | null;
    // caseReference: CaseReference;
    // demographics: Demographics;
    // events: Events;
    // symptoms?: string;
    // preexistingConditions: PreexistingConditions;
    // transmission: Transmission;
    // travelHistory: TravelHistory;
    // genomeSequences: GenomeSequences;
    // vaccination: Vaccination;
    comment: string | '';
    // helper values
    location: Location;
    preexistingConditionsHelper?: string[];
    curators?: Curators;
    revisionMetadata?: RevisionMetadata;
    [key: string]:
        | CaseReference
        | Demographics
        | Location
        | Events
        | PreexistingConditions
        | Transmission_old
        | TravelHistory
        | GenomeSequences
        | Vaccination
        | Curators
        | RevisionMetadata
        | string
        | string[]
        | number
        | undefined
        | null;
}

interface PreexistingConditionsFormValues {
    previousInfection?: YesNo | '';
    coInfection?: string;
    preexistingCondition?: string[];
    pregnancyStatus?: YesNo | '';
}

interface VaccinationFormValues {
    vaccination?: YesNo | '';
    vaccineName?: string;
    vaccineDate?: string | null;
    vaccineSideEffects?: string[];
}

interface RevisionMetadataValues {
    revisionNumber: number;
    creationMetadata: {
        curator: string;
    };
    updateMetadata: {
        curator: string;
    };
}

// contains all the fields present in manual case entry form
export interface Day0CaseFormValues {
    // Case Demographics
    caseStatus: CaseStatus | '';
    pathogen: string;
    pathogenStatus: PathogenStatus | '';
    age: string;
    sexAtBirth: SexAtBirth | '';
    sexAtBirthOther: string | '';
    gender: Gender | '';
    genderOther: string | '';
    race: Race | '';
    raceOther: string | '';
    ethnicity: Ethnicity | '';
    ethnicityOther: string | '';
    nationality: string | '';
    nationalityOther: string | '';
    occupation: string | '';
    healthcareWorker: YesNo | '';
    comment: string | '';
    // Medical History
    previousInfection: YesNo | '';
    coInfection: string[];
    preexistingCondition: string[];
    pregnancyStatus: YesNo | '';
    vaccination: YesNo | '';
    vaccineName: string | '';
    vaccineDate: string | null;
    vaccineSideEffects: string[];
    // Clinical Presentation
    symptoms: string[];
    dateReport: string | null;
    dateOnset: string | null;
    dateConfirmation: string | null;
    confirmationMethod: string | '';
    dateOfFirstConsultation: string | null;
    hospitalised: YesNo | '';
    reasonForHospitalisation: string[];
    dateHospitalisation: string | null;
    dateDischargeHospital: string | null;
    intensiveCare: YesNo | '';
    dateAdmissionICU: string | null;
    dateDischargeICU: string | null;
    homeMonitoring: YesNo | '';
    isolated: YesNo | '';
    dateIsolation: string | null;
    outcome: Outcome | '';
    dateDeath: string | null;
    dateRecovery: string | null;
    // Exposure
    contactWithCase: YesNo | '';
    contactID: string | '';
    contactSetting: ContactSetting | '';
    contactSettingOther: string | '';
    contactAnimal: ContactAnimal | '';
    contactComment: string | '';
    transmission: Transmission | '';
    travelHistory: YesNo | '';
    travelHistoryEntry: string | null;
    travelHistoryStart: string | null;
    travelHistoryLocation: Location;
    // Laboratory Information
    genomicsMetadata: string | '';
    accessionNumber: string | '';
    // Source Information
    source: string | '';
    sourceII: string | '';
    sourceIII: string | '';
    sourceIV: string | '';
    dateEntry: string | null;
    dateLastModified: string | null;
    // comment?: string;
    // caseReference: {
    //     sourceId: string;
    //     sourceUrl: string;
    //     isGovernmentSource: boolean;
    //     id?: string;
    //     sourceEntryId?: string;
    //     uploadIds?: string[];
    //     sourceName?: string;
    //     sourceLicense?: string;
    //     sourceProviderName?: string;
    //     sourceProviderUrl?: string;
    //     additionalSources?: {
    //         sourceUrl: string;
    //         isGovernmentSource: boolean;
    //     }[];
    // };
    // demographics: {
    //     minAge?: number;
    //     maxAge?: number;
    //     age?: number;
    //     gender?: Gender | '';
    //     occupation?: string;
    //     healthcareWorker?: YesNo | '';
    // };
    location: {
        geoResolution?: string;
        country: string;
        countryISO3: string;
        location?: string;
        region?: string;
        district?: string;
        place?: string;
        geocodeLocation?: GeocodeLocation;
        query?: string;
        geometry?: Geometry;
        comment?: string;
    };
    // events: Events;
    // symptoms?: string[];
    // preexistingConditions: PreexistingConditionsFormValues;
    // transmission: Transmission;
    // travelHistory: TravelHistory;
    // genomeSequences: GenomeSequences;
    // vaccination: VaccinationFormValues;
    numCases?: number;
    // helper value
    // vaccineSideEffects?: string[];
    preexistingConditionsHelper?: string[];
    transmissionHelper?: string;
    revisionMetadata?: RevisionMetadataValues;
    // eslint-disable-next-line
    [key: string]: any;
}
