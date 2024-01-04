import { RootState } from '../store';

export const selectIsLoading = (state: RootState) =>
    state.pivotTables.isLoading;
export const selectCasesByCountry = (state: RootState) =>
    state.pivotTables.casesByCountry;
export const selectError = (state: RootState) => state.pivotTables.error;
