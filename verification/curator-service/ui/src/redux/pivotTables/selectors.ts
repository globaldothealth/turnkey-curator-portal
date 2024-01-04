import { RootState } from '../store';

export const selectIsLoading = (state: RootState) =>
    state.pivotTables.isLoading;
export const selectCasesByCountry = (state: RootState) =>
    state.pivotTables.casesByCountry;
export const selectTotalCases = (state: RootState) =>
    state.pivotTables.totalCases;
export const selectError = (state: RootState) => state.pivotTables.error;
