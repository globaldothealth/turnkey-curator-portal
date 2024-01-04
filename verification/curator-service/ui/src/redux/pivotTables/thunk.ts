import { createAsyncThunk } from '@reduxjs/toolkit';
import { Day0Case } from '../../api/models/Day0Case';
import axios from 'axios';

interface ListResponse {
    cases: Day0Case[];
    nextPage: number;
    total: number;
}

export const fetchCasesByCountryPivotData = createAsyncThunk<
    { casesByCountry: any },
    string | undefined,
    { rejectValue: string }
>('pivotTables/fetchCasesByCountry', async (query, { rejectWithValue }) => {
    try {
        const response = await axios.get<ListResponse>(
            `/api/cases/countryData`,
        );
        const data: any = response.data;

        const casesByCountry = Object.keys(data.countries).map(
            (country: any) => ({
                country,
                ...data.countries[country],
            }),
        );

        return {
            casesByCountry,
        };
    } catch (error) {
        if (!error.response) throw error;
        return rejectWithValue(
            `Error: Request failed with status code ${error.response.status}`,
        );
    }
});
