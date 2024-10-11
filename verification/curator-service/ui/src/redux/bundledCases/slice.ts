import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {fetchBulkVerificationData, verifyCaseBundle} from './thunk';
import { VerificationStatus } from '../../api/models/Case';
import { Day0Case } from '../../api/models/Day0Case';
import { SortBy, SortByOrder } from '../../constants/types';

interface BundledCasesTableState {
    isLoading: boolean;
    cases: Day0Case[];
    currentPage: number;
    nextPage: number;
    rowsPerPage: number;
    sort: {
        value: SortBy;
        order: SortByOrder;
    };
    searchQuery: string;
    total: number;
    error: string | undefined;
    excludeCasesDialogOpen: boolean;
    deleteCasesDialogOpen: boolean;
    verifyCasesDialogOpen: boolean;
    verifyCasesLoading: boolean;
    verifyCasesSuccess: boolean | undefined;
    reincludeCasesDialogOpen: boolean;
    casesSelected: string[];
    refetchData: boolean;
    verificationStatus: VerificationStatus | undefined;
    rowsAcrossPagesSelected: boolean;
}

const initialState: BundledCasesTableState = {
    isLoading: false,
    cases: [],
    currentPage: 0,
    nextPage: 1,
    rowsPerPage: 50,
    sort: {
        value: SortBy.Identifier,
        order: SortByOrder.Descending,
    },
    searchQuery: '',
    total: 0,
    error: undefined,
    excludeCasesDialogOpen: false,
    deleteCasesDialogOpen: false,
    verifyCasesDialogOpen: false,
    verifyCasesLoading: false,
    verifyCasesSuccess: undefined,
    reincludeCasesDialogOpen: false,
    casesSelected: [],
    refetchData: false,
    verificationStatus: undefined,
    rowsAcrossPagesSelected: false,
};

const bundledCasesTableSlice = createSlice({
    name: 'bulkVerificationList',
    initialState,
    reducers: {
        setCurrentPage: (state, action: PayloadAction<number>) => {
            state.currentPage = action.payload;
        },
        setRowsPerPage: (state, action: PayloadAction<number>) => {
            state.rowsPerPage = action.payload;
        },
        setSort: (
            state,
            action: PayloadAction<{ value: SortBy; order: SortByOrder }>,
        ) => {
            state.sort = action.payload;
        },
        setSearchQuery: (state, action: PayloadAction<string>) => {
            state.searchQuery = action.payload;
        },
        setCasesSelected: (state, action: PayloadAction<string[]>) => {
            state.casesSelected = action.payload;
        },
        setDeleteCasesDialogOpen: (state, action: PayloadAction<boolean>) => {
            state.deleteCasesDialogOpen = action.payload;
        },
        setVerifyCasesDialogOpen: (state, action: PayloadAction<boolean>) => {
            state.verifyCasesDialogOpen = action.payload;
        },
        setReincludeCasesDialogOpen: (
            state,
            action: PayloadAction<boolean>,
        ) => {
            state.reincludeCasesDialogOpen = action.payload;
        },
        setVerificationStatus: (
            state,
            action: PayloadAction<VerificationStatus>,
        ) => {
            state.verificationStatus = action.payload;
        },
        setRowsAcrossPagesSelected: (state, action: PayloadAction<boolean>) => {
            state.rowsAcrossPagesSelected = action.payload;
        },
    },
    extraReducers: (builder) => {
        // FETCH CASE BUNDLES
        builder.addCase(fetchBulkVerificationData.pending, (state) => {
            state.isLoading = true;
            state.error = undefined;
        });
        builder.addCase(fetchBulkVerificationData.fulfilled, (state, { payload }) => {
            state.isLoading = false;
            state.cases = payload.cases;
            state.nextPage = payload.nextPage;
            state.total = payload.total;
        });
        builder.addCase(fetchBulkVerificationData.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload
                ? action.payload
                : action.error.message;
        });
        // VERIFY CASE BUNDLES
        builder.addCase(verifyCaseBundle.pending, (state) => {
            state.verifyCasesLoading = true;
            state.verifyCasesSuccess = undefined;
        });
        builder.addCase(verifyCaseBundle.fulfilled, (state, { payload }) => {
            state.verifyCasesLoading = false;
            state.verifyCasesSuccess = true;
            state.verifyCasesDialogOpen = false;
            state.casesSelected = [];
        });
        builder.addCase(verifyCaseBundle.rejected, (state, action) => {
            state.verifyCasesLoading = false;
            state.verifyCasesSuccess = false;
        });
    },

});

// actions
export const {
    setCurrentPage,
    setRowsPerPage,
    setSort,
    setSearchQuery,
    setCasesSelected,
    setDeleteCasesDialogOpen,
    setVerifyCasesDialogOpen,
    setReincludeCasesDialogOpen,
    setVerificationStatus,
    setRowsAcrossPagesSelected,
} = bundledCasesTableSlice.actions;

export default bundledCasesTableSlice.reducer;
