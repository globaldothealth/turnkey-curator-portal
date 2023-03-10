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
    NA = 'NA',
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
    id?: string;
    sourceEntryId?: string;
    uploadIds?: string[];
    additionalSources?: {
        sourceUrl: string;
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
    administrativeAreaLevel1: string;
    administrativeAreaLevel2: string;
    administrativeAreaLevel3: string;
    geoResolution: string;
    name: string;
    place: string;
    // Set this field to perform geocoding and fill the rest of the location object.
    query?: string;
    // Optional to hint geocoding results.
    limitToResolution?: string;
}

export interface Location {
    country: string;
    countryISO2: string;
    location?: string;
    city?: string;
    // this variable is needed in the API in order to geocode properly
    query?: string;
    name?: string;
}

export interface Events {
    dateEntry: string | null;
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
    sourceId: string;
    sourceName?: string;
    sourceLicense?: string;
    sourceProviderName?: string;
    sourceProviderUrl?: string;
    sourceEntryId?: string;
}

export interface Day0Case {
    _id?: string;
    caseStatus: CaseStatus | '';
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

// contains all the fields present in manual case entry form
export interface Day0CaseFormValues {
    caseStatus: CaseStatus | '';
    caseReference: {
        sourceId: string;
        sourceUrl: string;
        id?: string;
        sourceEntryId?: string;
        uploadIds?: string[];
        sourceName?: string;
        sourceLicense?: string;
        sourceProviderName?: string;
        sourceProviderUrl?: string;
        additionalSources?: {
            sourceUrl: string;
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
        country: string;
        countryISO2: string;
        location?: string;
        city?: string;
        geocodeLocation?: GeocodeLocation;
        query?: string;
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
    // eslint-disable-next-line
    [key: string]: any;
}
