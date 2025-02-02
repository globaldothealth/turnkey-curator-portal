export enum CaseStatus {
    Confirmed = 'confirmed',
    Suspected = 'suspected',
    Discarded = 'discarded',
    OmitError = 'omit_error',
}

export enum Gender {
    Male = 'male',
    Female = 'female',
    Other = 'other',
}

export enum YesNo {
    Y = 'Y',
    N = 'N',
    None = '',
}

export enum HospitalizationReason {
    Monitoring = 'monitoring',
    Treatment = 'treatment',
    Unknown = 'unknown',
}

export enum Outcome {
    Recovered = 'recovered',
    Death = 'death',
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
    admin1: string;
    admin2: string;
    admin3: string;
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
    admin1?: string;
    admin1WikiId?: string;
    admin2?: string;
    admin2WikiId?: string;
    admin3?: string;
    admin3WikiId?: string;
    // this variable is needed in the API in order to geocode properly
    query?: string;
    name?: string;
    geometry?: Geometry;
    comment?: string;
}

export interface Events {
    dateEntry: Date | string | null;
    dateReported: Date | string | null;
    dateLastModified: Date | string | null;
    dateOnset?: Date | string | null;
    dateConfirmation?: Date | string | null;
    confirmationMethod?: string;
    dateOfFirstConsult?: Date | string | null;
    hospitalized?: YesNo | '';
    reasonForHospitalization?: HospitalizationReason | '';
    dateHospitalization?: Date | string | null;
    dateDischargeHospital?: Date | string | null;
    intensiveCare?: YesNo | '';
    dateAdmissionICU?: Date | string | null;
    dateDischargeICU?: Date | string | null;
    homeMonitoring?: YesNo | '';
    isolated?: YesNo | '';
    dateIsolation?: Date | string | null;
    outcome?: Outcome | '';
    dateDeath?: Date | string | null;
    dateRecovered?: Date | string | null;
}

export interface PreexistingConditions {
    previousInfection?: YesNo | '';
    coInfection?: string;
    preexistingCondition?: string;
    pregnancyStatus?: YesNo | '';
}

export interface Transmission {
    contactWithCase?: YesNo | '';
    contactId?: string;
    contactSetting?: string;
    contactAnimal?: string;
    contactComment?: string;
    transmission?: string;
}

export interface TravelHistory {
    travelHistory?: YesNo | '';
    travelHistoryEntry?: Date | string | null;
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
    _id?: string;
    caseStatus: CaseStatus | '';
    comment?: string;
    caseReference: CaseReference;
    demographics: Demographics;
    location: Location;
    events: Events;
    symptoms?: string;
    preexistingConditions: PreexistingConditions;
    transmission: Transmission;
    travelHistory: TravelHistory;
    genomeSequences: GenomeSequences;
    pathogen: string;
    vaccination: Vaccination;
    // helper values
    vaccineSideEffects?: string[];
    preexistingConditionsHelper?: string[];
    curators?: Curators;
    revisionMetadata?: RevisionMetadata;
    [key: string]:
        | CaseReference
        | Demographics
        | Location
        | Events
        | PreexistingConditions
        | Transmission
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
    vaccineDate?: Date | string | null;
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
    caseStatus: CaseStatus | '';
    comment?: string;
    caseReference: {
        sourceId: string;
        sourceUrl: string;
        isGovernmentSource: boolean;
        id?: string;
        sourceEntryId?: string;
        uploadIds?: string[];
        sourceName?: string;
        sourceLicense?: string;
        sourceProviderName?: string;
        sourceProviderUrl?: string;
        additionalSources?: {
            sourceUrl: string;
            isGovernmentSource: boolean;
        }[];
    };
    demographics: {
        minAge?: number;
        maxAge?: number;
        age?: number;
        gender?: Gender | '';
        occupation?: string;
        healthcareWorker?: YesNo | '';
    };
    location: {
        geoResolution?: string;
        country: string;
        countryISO3: string;
        location?: string;
        admin1?: string;
        admin1WikiId?: string;
        admin2?: string;
        admin2WikiId?: string;
        admin3?: string;
        admin3WikiId?: string;
        geocodeLocation?: GeocodeLocation;
        query?: string;
        geometry?: Geometry;
        comment?: string;
    };
    events: Events;
    symptoms?: string[];
    preexistingConditions: PreexistingConditionsFormValues;
    transmission: Transmission;
    travelHistory: TravelHistory;
    genomeSequences: GenomeSequences;
    pathogen: string;
    vaccination: VaccinationFormValues;
    numCases?: number;
    // helper value
    vaccineSideEffects?: string[];
    preexistingConditionsHelper?: string[];
    transmissionHelper?: string;
    occupation?: string;
    revisionMetadata?: RevisionMetadataValues;
    // eslint-disable-next-line
    [key: string]: any;
}
