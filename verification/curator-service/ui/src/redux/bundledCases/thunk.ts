import { createAsyncThunk } from '@reduxjs/toolkit';
import { Day0Case } from '../../api/models/Day0Case';
import axios from 'axios';

interface ListResponse {
    caseBundles: Day0Case[];
    nextPage: number;
    total: number;
}

export const fetchBundlesData = createAsyncThunk<
    { cases: Day0Case[]; nextPage: number; total: number },
    string | undefined,
    { rejectValue: string }
>('bundleOperationsList/fetchBundlesData', async (query, { rejectWithValue }) => {

    try {
        const response = await axios.get<ListResponse>(
            `/api/cases/bundled${query ? query : ''}`,
        );

        const cases = response.data.caseBundles as Day0Case[];

        return {
            cases,
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

export const verifyCaseBundle = createAsyncThunk<
    void,
    { caseBundleIds?: string[]; query?: string },
    { rejectValue: string }
>('linelist/deleteCases', async (args, { rejectWithValue }) => {
    const { caseBundleIds, query } = args;

    try {
        const parsedQuery =
            query && query.replace('?', '').replaceAll('=', ':');

        const response = await axios.post('/api/cases/verify/bundled', {
            data: { caseBundleIds, query: parsedQuery },
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
