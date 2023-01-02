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

export interface Day0Case {
    // GENERAL
    ID?: string;
    Case_status: CaseStatus;
    Date_entry: string | null;
    Date_last_modified: string;

    // SOURCE
    Source: string; // source
    Source_II?: string;
    Source_III?: string;
    Source_IV?: string;
    Source_V?: string;
    Source_VI?: string;
    Source_VII?: string;

    // DEMOGRAPHICS
    Age?: string;
    Gender?: Gender;
    Occupation?: string;
    Healthcare_worker?: YesNo;

    // LOCATION
    Country: string;
    Country_ISO3: string;
    Location?: string;
    City?: string;

    // EVENTS
    Date_onset?: string | null;
    Date_confirmation?: string | null;
    Confirmation_method?: string;
    Date_of_first_consult?: string | null;
    Hospitalized?: YesNo;
    'Reason for hospitalition'?: HospitalizationReason;
    Date_hospitalization?: string | null;
    Date_discharge_hospital?: string | null;
    Intensive_care?: YesNo;
    Date_admission_ICU?: string | null;
    Date_discharge_ICU?: string | null;
    Home_monitoring?: YesNo;
    Isolated?: YesNo;
    Date_isolation?: string | null;
    Outcome?: Outcome;
    Date_death?: string | null;
    Date_recovered?: string | null;

    // SYMPTOPMS
    Symptoms?: string;

    // PRE-EXISTING CONDITIONS
    Previous_infection?: YesNo;
    Co_infection?: string;
    Pre_existing_condition?: string;
    Pregnancy_status?: YesNo;

    // TRANSMISSION
    Contact_with_case?: YesNo;
    Contact_ID?: string;
    Contact_setting?: string;
    Contact_animal?: string;
    Contact_comment?: string;
    Transmission?: string;

    // TRAVEL HISTORY
    Travel_history?: YesNo;
    Travel_history_entry?: string;
    Travel_history_start?: string;
    Travel_history_location?: string;
    Travel_history_country?: string;

    // GENOME SEQUENCES
    Genomics_Metadata?: string;
    'Accession Number'?: string;

    // PATHOGENS
    Pathogen: string;

    // VACCINATION
    Vaccination?: YesNo;
    Vaccine_name?: string;
    Vaccine_date?: string | null;
    Vaccine_side_effects?: string;

    [key: string]:
        | HospitalizationReason
        | YesNo
        | Gender
        | Outcome
        | CaseStatus
        | string
        | string
        | number
        | undefined
        | null;
}

export interface ParsedCase {
    id?: string;
    pathogen: string;
    caseStatus: CaseStatus | undefined;
    country: string;
    countryISO3: string;
    location?: string;
    city?: string;
    age?: string;
    gender?: Gender;
    occupation?: string;
    healthcareWorker?: YesNo;
    symptoms?: string[] | undefined;
    symptomsOnsetDate?: string | null;
    confirmationDate?: string | null;
    confirmationMethod?: string;
    previousInfection?: YesNo;
    coInfection?: string;
    preexistingCondition?: string[] | undefined;
    pregnancyStatus?: YesNo;
    vaccination?: YesNo;
    vaccineName?: string;
    vaccineDate?: string | null;
    vaccineSideEffects?: string[] | undefined;
    firstConsultDate?: string | null;
    hospitalized?: YesNo;
    hospitalizationReason?: HospitalizationReason;
    hospitalizationDate?: string | null;
    hospitalDischargeDate?: string | null;
    intensiveCare?: YesNo;
    ICUAdmissionDate?: string | null;
    ICUDischargeDate?: string | null;
    homeMonitoring?: YesNo;
    isolated?: YesNo;
    isolationDate?: string | null;
    outcome?: Outcome;
    deathDate?: string | null;
    recoveredDate?: string | null;
    contactWithCase?: YesNo;
    contactID?: string;
    contactSetting?: string;
    contactAnimal?: string;
    contactComment?: string;
    transmission?: string;
    travelHistory?: YesNo;
    travelHistoryEntry?: string;
    travelHistoryStart?: string;
    travelHistoryLocation?: string;
    travelHistoryCountry?: string;
    genomicsMetadata?: string;
    accessionNumber?: string;
    source: string;
    sourceII?: string;
    sourceIII?: string;
    sourceIV?: string;
    sourceV?: string;
    sourceVI?: string;
    sourceVII?: string;
    entryDate: string | null;
    lastModifiedDate: string | null;
    // eslint-disable-next-line
    [key: string]: any;
}
