import { configureStore, combineReducers } from '@reduxjs/toolkit';

import appReducer from './app/slice';
import authReducer from './auth/slice';
import filtersReducer from './filters/slice';
import acknowledgmentDataReducer from './acknowledgmentData/slice';
import linelistTableReducer from './linelistTable/slice';
import pivotTablesReducer from './pivotTables/slice';
import { SortBy, SortByOrder } from '../constants/types';
import validateEnv from '../util/validate-env';
import { Role } from '../api/models/User';

const env = validateEnv();

export const rootReducer = combineReducers({
    app: appReducer,
    auth: authReducer,
    filters: filtersReducer,
    acknowledgment: acknowledgmentDataReducer,
    linelist: linelistTableReducer,
    pivotTables: pivotTablesReducer,
});

const store = configureStore({
    reducer: rootReducer,
});

// For testing purposes
export const initialLoggedInState: RootState = {
    app: {
        isLoading: false,
        filterBreadcrumbs: [],
        version: '1.0',
        env: 'local',
        diseaseName: env.VITE_APP_DISEASE_NAME,
    },
    filters: {
        modalOpen: false,
        countryList: [],
        activeFilterInput: '',
        error: '',
        isLoading: false,
    },
    auth: {
        isLoading: false,
        error: undefined,
        changePasswordResponse: undefined,
        user: {
            id: '1',
            googleID: '42',
            name: 'Alice Smith',
            email: 'foo@bar.com',
            roles: [Role.Admin, Role.Curator],
        },
        forgotPasswordPopupOpen: false,
        passwordReset: false,
        resetPasswordEmailSent: false,
        snackbar: {
            isOpen: false,
            message: '',
        },
    },
    acknowledgment: {
        acknowledgmentData: [],
        error: undefined,
        isLoading: false,
    },
    linelist: {
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
        reincludeCasesDialogOpen: false,
        casesSelected: [],
        refetchData: false,
        verificationStatus: undefined,
        rowsAcrossPagesSelected: false,
    },
    pivotTables: {
        isLoading: false,
        casesByCountries: [],
        casesGlobally: {},
        error: undefined,
    },
};

export type RootState = ReturnType<typeof store.getState>;
export type AppState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

export default store;
