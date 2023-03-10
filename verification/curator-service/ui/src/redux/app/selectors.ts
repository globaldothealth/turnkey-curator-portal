import { ChipData } from '../../components/App';
import { RootState } from '../store';

export const selectFilterBreadcrumbs: (state: RootState) => ChipData[] = (
    state,
) => state.app.filterBreadcrumbs;
export const selectIsLoading: (state: RootState) => boolean = (state) =>
    state.app.isLoading;
export const selectVersion: (state: RootState) => string = (state) =>
    state.app.version;
export const selectEnv: (state: RootState) => string = (state) => state.app.env;
export const selectDiseaseName: (state: RootState) => string = (state) =>
    state.app.diseaseName;
