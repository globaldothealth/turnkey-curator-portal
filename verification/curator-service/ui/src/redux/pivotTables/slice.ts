import { createSlice } from '@reduxjs/toolkit';
import { fetchCasesByCountryPivotData } from './thunk';

export type CasesByCountry = {
    country: string;
    suspected?: number;
    confirmed?: number;
    recovered?: number;
    death?: number;
    total: number;
};

export type CasesGlobally = {
    suspected?: number;
    confirmed?: number;
    recovered?: number;
    death?: number;
    total?: number;
};

interface PivotTablesState {
    isLoading: boolean;
    casesByCountries: CasesByCountry[];
    casesGlobally: CasesGlobally;
    error: string | undefined;
}

const initialState: PivotTablesState = {
    isLoading: false,
    casesByCountries: [],
    casesGlobally: {},
    error: undefined,
};

const pivotTablesSlice = createSlice({
    name: 'pivot',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        // FETCH CASES FOR CASES BY COUNTRY PIVOT TABLE
        builder.addCase(fetchCasesByCountryPivotData.pending, (state) => {
            state.isLoading = true;
            state.error = undefined;
        });
        builder.addCase(
            fetchCasesByCountryPivotData.fulfilled,
            (state, { payload }) => {
                state.isLoading = false;
                state.casesByCountries = payload.casesByCountry;
                state.casesGlobally = payload.casesGlobally;
            },
        );
        builder.addCase(
            fetchCasesByCountryPivotData.rejected,
            (state, action) => {
                state.isLoading = false;
                state.error = action.payload
                    ? action.payload
                    : action.error.message;
            },
        );
    },
});

export default pivotTablesSlice.reducer;
