import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchCasesByCountryPivotData } from './thunk';
import { VerificationStatus } from '../../api/models/Case';
import { Day0Case } from '../../api/models/Day0Case';
import { SortBy, SortByOrder } from '../../constants/types';

interface PivotTablesState {
    isLoading: boolean;
    casesByCountry: any;
    error: string | undefined;
}

const initialState: PivotTablesState = {
    isLoading: false,
    casesByCountry: [],
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
