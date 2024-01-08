import { createAsyncThunk } from '@reduxjs/toolkit';
import { Day0Case } from '../../api/models/Day0Case';
import axios from 'axios';
import { CasesByCountry, CasesGlobally } from './slice';

interface ListResponse {
    cases: Day0Case[];
    nextPage: number;
    total: number;
}

type dataCountry = {
    [key: string]: {
        confirmed?: number;
        suspected?: number;
        death?: number;
        recovered?: number;
        total: number;
    };
};

type responseData = {
    countries?: dataCountry;
    globally?: {
        confirmed?: number;
        suspected?: number;
        death?: number;
        recovered?: number;
        total: number;
    };
};

export const fetchCasesByCountryPivotData = createAsyncThunk<
    { casesByCountry: CasesByCountry[]; casesGlobally: CasesGlobally },
    string | undefined,
    { rejectValue: string }
>('pivotTables/fetchCasesByCountry', async (query, { rejectWithValue }) => {
    try {
        const response = await axios.get<ListResponse>(
            `/api/cases/countryData`,
        );
        const data = response.data as responseData;

        const casesByCountry: CasesByCountry[] = Object.keys(
            data.countries || {},
        ).map((country: string) => ({
            country,
            ...(data?.countries?.[country] || {}),
            total: data?.countries?.[country]?.total || 0,
        }));

        const casesGlobally: CasesGlobally = data.globally || {};

        return { casesByCountry, casesGlobally };
    } catch (error) {
        if (!error.response) throw error;
        return rejectWithValue(
            `Error: Request failed with status code ${error.response.status}`,
        );
    }
});
