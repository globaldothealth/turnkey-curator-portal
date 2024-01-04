import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchCasesByCountryPivotData } from './thunk';

interface PivotTablesState {
    isLoading: boolean;
    casesByCountry: any;
    totalCases: any;
    error: string | undefined;
}

const initialState: PivotTablesState = {
    isLoading: false,
    casesByCountry: [],
    totalCases: {},
    error: undefined,
};

const pivotTablesSlice = createSlice({
    name: 'pivot',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        // FETCH CASES BY COUNTRY
        builder.addCase(fetchCasesByCountryPivotData.pending, (state) => {
            state.isLoading = true;
            state.error = undefined;
        });
        builder.addCase(
            fetchCasesByCountryPivotData.fulfilled,
            (state, { payload }) => {
                state.isLoading = false;
                state.casesByCountry = payload.casesByCountry;
                state.totalCases = payload.totalCases;
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
