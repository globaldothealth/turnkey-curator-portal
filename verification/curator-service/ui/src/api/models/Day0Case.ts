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
    ID?: string; // ID
    Case_status: CaseStatus; // caseStatus
    Date_entry: string | null; // entryDate
    Date_last_modified: string; // lastModifiedDate

    // SOURCE
    Source: string; // source
    Source_II?: string;
    Source_III?: string;
    Source_IV?: string;
    Source_V?: string;
    Source_VI?: string;
    Source_VII?: string;

    // DEMOGRAPHICS
    // @TODO: implement age as an integer range
    Age?: string; // age
    Gender?: Gender; // gender
    Occupation?: string; // occupation
    Healthcare_worker?: YesNo; // healthcareWorker

    // LOCATION
    Country: string; // country
    Country_ISO3: string; // countryISO3
    Location?: string; // location
    City?: string; // city

    // EVENTS
    Date_onset?: string | null; // symptomsOnsetDate
    Date_confirmation?: string | null; // confirmationDate
    Confirmation_method?: string; // confirmationMethod
    Date_of_first_consult?: string | null; // firstConsultDate
    Hospitalized?: YesNo; // hospitalized
    'Reason for hospitalition'?: HospitalizationReason; // hospitalizationReason
    Date_hospitalization?: string | null; // hospitalizationDate
    Date_discharge_hospital?: string | null; // hospitalDischargeDate
    Intensive_care?: YesNo; // intensiveCare
    Date_admission_ICU?: string | null; // ICUAdmissionDate
    Date_discharge_ICU?: string | null; // ICUDischargeDate
    Home_monitoring?: YesNo; // homeMonitoring
    Isolated?: YesNo; // isolated
    Date_isolation?: string | null; // isolationDate
    Outcome?: Outcome; //outcome
    Date_death?: string | null; // deathDate
    Date_recovered?: string | null; // recoveredDate

    // SYMPTOPMS
    Symptoms?: string;

    // PRE-EXISTING CONDITIONS
    Previous_infection?: YesNo; // previousInfection
    Co_infection?: string; // coInfection
    Pre_existing_condition?: string; // preexistingCondition
    Pregnancy_status?: YesNo; // pregnancyStatus

    // TRANSMISSION
    Contact_with_case?: YesNo; // contactWithCase
    Contact_ID?: string; // contactID
    Contact_setting?: string; // contactSetting
    Contact_animal?: string; // contactAnimal
    Contact_comment?: string; // contactComment
    Transmission?: string; // transmission

    // TRAVEL HISTORY
    Travel_history?: YesNo; // travelHistory
    Travel_history_entry?: string; // travelHistoryEntry
    Travel_history_start?: string; // travelHistoryStart
    Travel_history_location?: string; // travelHistoryLocation
    Travel_history_country?: string; // travelHistoryCountry

    // GENOME SEQUENCES
    Genomics_Metadata?: string; // genomicsMetadata
    'Accession Number'?: string; // accessionNumber

    // PATHOGENS
    Pathogen: string; // pathogen

    // VACCINATION
    Vaccination?: YesNo; // vaccination
    Vaccine_name?: string; // vaccineName
    Vaccine_date?: string | null; // vaccineDate
    Vaccine_side_effects?: string; // vaccineSideEffects

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
    [key: string]: any;
}
