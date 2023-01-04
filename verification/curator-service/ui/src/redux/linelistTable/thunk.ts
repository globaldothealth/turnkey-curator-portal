import { createAsyncThunk } from '@reduxjs/toolkit';
import { Day0Case, CaseStatus, ParsedCase } from '../../api/models/Day0Case';
import axios from 'axios';

interface ListResponse {
    cases: Day0Case[];
    nextPage: number;
    total: number;
}

export const parseCase = (day0Case: Day0Case) => {
    return {
        id: day0Case.ID,
        pathogen: day0Case.Pathogen,
        caseStatus: day0Case.Case_status,
        country: day0Case.Country,
        countryISO3: day0Case.Country_ISO3,
        location: day0Case.Location,
        city: day0Case.City,
        age: day0Case.Age,
        gender: day0Case.Gender,
        occupation: day0Case.Occupation,
        healthcareWorker: day0Case.Healthcare_worker,
        symptoms:
            day0Case.Symptoms && day0Case.symptoms !== ''
                ? day0Case.Symptoms.split(', ')
                : undefined,
        symptomsOnsetDate: day0Case.Date_onset,
        confirmationDate: day0Case.Date_confirmation,
        confirmationMethod: day0Case.Confirmation_method,
        previousInfection: day0Case.Previous_infection,
        coInfection: day0Case.Co_infection,
        preexistingCondition:
            day0Case.Pre_existing_condition &&
            day0Case.Pre_existing_condition !== ''
                ? day0Case.Pre_existing_condition.split(', ')
                : undefined,
        pregnancyStatus: day0Case.Pregnancy_status,
        vaccination: day0Case.Vaccination,
        vaccineName: day0Case.Vaccine_name,
        vaccineDate: day0Case.Vaccine_date,
        vaccineSideEffects:
            day0Case.Vaccine_side_effects &&
            day0Case.Vaccine_side_effects !== ''
                ? day0Case.Vaccine_side_effects.split(', ')
                : undefined,
        firstConsultDate: day0Case.Date_of_first_consult,
        hospitalized: day0Case.Hospitalized,
        hospitalizationReason: day0Case['Reason for hospitalition'],
        hospitalizationDate: day0Case.Date_hospitalization,
        hospitalDischargeDate: day0Case.Date_discharge_hospital,
        intensiveCare: day0Case.Intensive_care,
        ICUAdmissionDate: day0Case.Date_admission_ICU,
        ICUDischargeDate: day0Case.Date_discharge_ICU,
        homeMonitoring: day0Case.Home_monitoring,
        isolated: day0Case.Isolated,
        isolationDate: day0Case.Date_isolation,
        outcome: day0Case.Outcome,
        deathDate: day0Case.Date_death,
        recoveredDate: day0Case.Date_recovered,
        contactWithCase: day0Case.Contact_with_case,
        contactID: day0Case.Contact_ID,
        contactSetting: day0Case.Contact_setting,
        contactAnimal: day0Case.Contact_animal,
        contactComment: day0Case.Contact_comment,
        transmission: day0Case.Transmission,
        travelHistory: day0Case.Travel_history,
        travelHistoryEntry: day0Case.Travel_history_entry,
        travelHistoryStart: day0Case.Travel_history_start,
        travelHistoryLocation: day0Case.Travel_history_location,
        travelHistoryCountry: day0Case.Travel_history_country,
        genomicsMetadata: day0Case.Genomics_Metadata,
        accessionNumber: day0Case['Accession Number'],
        source: day0Case.Source,
        sourceII: day0Case.Source_II,
        SourceIII: day0Case.Source_III,
        SourceIV: day0Case.Source_IV,
        SourceV: day0Case.Source_V,
        SourceVI: day0Case.Source_VI,
        SourceVII: day0Case.Source_VII,
        entryDate: day0Case.Date_entry,
        lastModifiedDate: day0Case.Date_last_modified,
    };
};

export const fetchLinelistData = createAsyncThunk<
    { cases: ParsedCase[]; nextPage: number; total: number },
    string | undefined,
    { rejectValue: string }
>('linelist/fetchLinelistData', async (query, { rejectWithValue }) => {
    try {
        const response = await axios.get<ListResponse>(
            `/api/cases${query ? query : ''}`,
        );

        const cases = response.data.cases as Day0Case[];
        const parsedCases = cases.map((day0Case) => parseCase(day0Case));

        return {
            cases: parsedCases,
            nextPage: response.data.nextPage,
            total: response.data.total,
        };
    } catch (error) {
        if (!error.response) throw error;
        return rejectWithValue(
            `Error: Request failed with status code ${error.response.status}`,
        );
    }
});

export const changeCasesStatus = createAsyncThunk<
    { newStatus: CaseStatus; updatedIds?: string[] },
    {
        status: CaseStatus;
        caseIds?: string[];
        note?: string;
        query?: string;
    },
    { rejectValue: string }
>('linelist/changeCasesStatus', async (args, { rejectWithValue }) => {
    const { status, caseIds, note, query } = args;

    try {
        const parsedQuery =
            query && query.replace('?', '').replaceAll('=', ':');

        const response = await axios.post('/api/cases/batchStatusChange', {
            status,
            caseIds,
            note,
            query: parsedQuery,
        });

        if (response.status !== 200) throw new Error(response.data.message);

        return { newStatus: status, updatedIds: caseIds };
    } catch (error) {
        if (!error.response) throw error;

        return rejectWithValue(
            `Error: Request failed with status code ${error.response.status}`,
        );
    }
});

export const deleteCases = createAsyncThunk<
    void,
    { caseIds?: string[]; query?: string },
    { rejectValue: string }
>('linelist/deleteCases', async (args, { rejectWithValue }) => {
    const { caseIds, query } = args;

    try {
        const parsedQuery =
            query && query.replace('?', '').replaceAll('=', ':');

        const response = await axios.delete('/api/cases', {
            data: { caseIds, query: parsedQuery },
        });

        if (response.status !== 204) throw new Error(response.data.message);

        return;
    } catch (error) {
        if (!error.response) throw error;

        return rejectWithValue(
            `Error: Request failed with status code ${error.response.status}`,
        );
    }
});
