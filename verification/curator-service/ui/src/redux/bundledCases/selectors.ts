import { RootState } from '../store';

export const selectIsLoading = (state: RootState) => state.bundledCases.isLoading;
export const selectCases = (state: RootState) => state.bundledCases.cases;
export const selectCurrentPage = (state: RootState) =>
    state.bundledCases.currentPage;
export const selectNextPage = (state: RootState) => state.bundledCases.nextPage;
export const selectTotalCases = (state: RootState) => state.bundledCases.total;
export const selectError = (state: RootState) => state.bundledCases.error;
export const selectRowsPerPage = (state: RootState) =>
    state.bundledCases.rowsPerPage;
export const selectSort = (state: RootState) => state.bundledCases.sort;
export const selectSearchQuery = (state: RootState) =>
    state.bundledCases.searchQuery;
export const selectExcludeCasesDialogOpen = (state: RootState) =>
    state.bundledCases.excludeCasesDialogOpen;
export const selectCasesSelected = (state: RootState) =>
    state.bundledCases.casesSelected;
export const selectDeleteCasesDialogOpen = (state: RootState) =>
    state.bundledCases.deleteCasesDialogOpen;
export const selectVerifyCasesDialogOpen = (state: RootState) =>
    state.bundledCases.verifyCasesDialogOpen;
export const selectVerifyCasesLoading = (state: RootState) =>
    state.bundledCases.verifyCasesLoading;
export const selectVerifyCasesSuccess = (state: RootState) =>
    state.bundledCases.verifyCasesSuccess;
export const selectReincludeCasesDialogOpen = (state: RootState) =>
    state.bundledCases.reincludeCasesDialogOpen;
export const selectRefetchData = (state: RootState) =>
    state.bundledCases.refetchData;
export const selectVerificationStatus = (state: RootState) =>
    state.bundledCases.verificationStatus;
export const selectRowsAcrossPages = (state: RootState) =>
    state.bundledCases.rowsAcrossPagesSelected;
