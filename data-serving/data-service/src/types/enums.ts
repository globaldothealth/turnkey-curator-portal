export enum CaseStatus {
    Confirmed = 'confirmed',
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

export enum YesNo {
    Y = 'Y',
    N = 'N',
    NA = 'NA',
}
