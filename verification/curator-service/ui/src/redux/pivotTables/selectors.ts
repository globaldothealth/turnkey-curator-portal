import { RootState } from '../store';

export const selectIsLoading = (state: RootState) =>
    state.pivotTables.isLoading;
export const selectCasesByCountry = (state: RootState) =>
    state.pivotTables.casesByCountries;
export const selectTotalCases = (state: RootState) =>
    state.pivotTables.casesGlobally;
export const selectError = (state: RootState) => state.pivotTables.error;
