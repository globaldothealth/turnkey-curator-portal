import { CaseReferenceForm } from '../common-form-fields/Source';
import { Location as Loc } from '../../api/models/Case';
import { YesNo } from '../../api/models/Day0Case';

/**
 * CaseFormValues defines all the values contained in the manual case entry form.
 */
export default interface CaseFormValues {
    caseReference?: CaseReferenceForm;
    gender?: string;
    minAge?: number;
    maxAge?: number;
    age?: number;
    ethnicity?: string;
    nationalities: string[];
    occupation?: string;
    location?: Loc;
    confirmedDate: string | null;
    methodOfConfirmation?: string;
    onsetSymptomsDate: string | null;
    firstClinicalConsultationDate: string | null;
    selfIsolationDate: string | null;
    admittedToHospital?: string;
    hospitalAdmissionDate: string | null;
    admittedToIcu?: string;
    icuAdmissionDate: string | null;
    outcomeDate: string | null;
    outcome?: string;
    symptomsStatus?: string;
    symptoms: string[];
    variantName?: string;
    hasPreexistingConditions?: string;
    preexistingConditions: string[];
    transmissionRoutes: string[];
    transmissionPlaces: string[];
    transmissionLinkedCaseIds: string[];
    traveledPrior30Days?: string;
    travelHistory: Travel[];
    genomeSequences: GenomeSequence[];
    pathogens: Pathogen[];
    notes: string;
    numCases?: number;
    vaccines: Vaccine[];
    [index: string]:
        | Pathogen[]
        | Vaccine[]
        | GenomeSequence[]
        | Travel[]
        | string[]
        | CaseReferenceForm
        | Loc
        | string
        | number
        | null
        | undefined;
}

export interface Travel {
    // Used to key react elements in the UI
    reactId?: string;
    location: Loc;
    dateRange?: {
        start?: string | null;
        end?: string | null;
    };
    purpose?: string;
    methods: string[];
}

export interface GenomeSequence {
    // Used to key react elements in the UI
    reactId?: string;
    sampleCollectionDate: string | null;
    repositoryUrl?: string;
    sequenceId?: string;
    sequenceName?: string;
    sequenceLength?: number;
}

export interface Symptom {
    status: string;
    values: string[];
}

export interface Vaccine {
    // Used to key react elements in the UI
    reactId?: string;
    name: string;
    batch?: string;
    date?: Date;
    sideEffects: Symptom;
    previousInfection: YesNo;
    previousInfectionDetectionMethod?: string;
}

interface Pathogen {
    name: string;
    id: number;
}
