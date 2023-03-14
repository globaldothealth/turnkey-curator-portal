import { useState, useEffect } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { useFormik } from 'formik';
import useMediaQuery from '@mui/material/useMediaQuery';
import { filtersToURL, URLToFilters } from '../util/searchQuery';
import { hasAnyRole } from '../util/helperFunctions';

import {
    Dialog,
    DialogContent,
    DialogTitle,
    TextField,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    OutlinedInput,
    IconButton,
} from '@mui/material';
import { Alert } from '@mui/material';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchCountries } from '../../redux/filters/thunk';
import {
    countryList,
    isLoading,
    filterError,
} from '../../redux/filters/selectors';
import { selectUser } from '../../redux/auth/selectors';
import {
    selectModalOpen,
    selectActiveFilterInput,
} from '../../redux/filters/selectors';
import { setModalOpen, setActiveFilterInput } from '../../redux/filters/slice';
import { codeForCountry } from '../util/countryNames';
import CloseIcon from '@mui/icons-material/Close';
import { useStyles } from './styled';
import { sendCustomGtmEvent } from '../util/helperFunctions';
import { Gender, Outcome } from '../../api/models/Day0Case';

interface FiltersModalProps {
    showModalAlert: boolean;
    closeAlert: (flag: boolean) => void;
}

export interface FilterFormValues {
    gender?: Gender;
    country?: string;
    city?: string;
    location?: string;
    occupation?: string;
    outcome?: Outcome;
    dateConfirmedFrom?: string;
    dateConfirmedTo?: string;
    caseId?: string;
    sourceUrl?: string;
}

interface FilterFormErrors {
    dateConfirmedFrom?: string | null;
    dateConfirmedTo?: string | null;
}

export default function FiltersDialog({
    showModalAlert,
    closeAlert,
}: FiltersModalProps): JSX.Element {
    const dispatch = useAppDispatch();
    const classes = useStyles();
    const location = useLocation();
    const history = useHistory();

    const [formValues, setFormValues] = useState<FilterFormValues>(
        URLToFilters(location.search),
    );

    // Check screen size
    const isSmallScreen = useMediaQuery('(max-height:800px)');
    const inputSize = isSmallScreen ? 'small' : 'medium';

    const loadingState = useAppSelector(isLoading);
    const error = useAppSelector(filterError);
    const user = useAppSelector(selectUser);
    const modalOpen = useAppSelector(selectModalOpen);
    const activeFilterInput = useAppSelector(selectActiveFilterInput);

    useEffect(() => {
        dispatch(fetchCountries());
    }, [dispatch]);

    const countries = useAppSelector(countryList);

    useEffect(() => {
        const newFilters = URLToFilters(location.search);
        if (!newFilters) return;

        setFormValues(newFilters);
    }, [location.search]);

    const validateForm = (values: FilterFormValues) => {
        const errors: FilterFormErrors = {};

        if (
            values.dateConfirmedTo &&
            new Date(values.dateConfirmedTo) > new Date()
        ) {
            errors.dateConfirmedTo = "Date confirmed to can't be a future date";
        }

        if (
            values.dateConfirmedFrom &&
            new Date(values.dateConfirmedFrom) > new Date()
        ) {
            errors.dateConfirmedFrom =
                "Date confirmed from can't be a future date";
        }

        return errors;
    };

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: formValues,
        validate: validateForm,
        validateOnChange: true,
        onSubmit: (values: FilterFormValues) => {
            Object.values(values).map((value) =>
                typeof value === 'string' ? value.trim() : value,
            );
            handleSetModalAlert();
            dispatch(setModalOpen(false));

            const searchQuery = filtersToURL(values);

            console.log(searchQuery);

            sendCustomGtmEvent('filters_applied', { query: searchQuery });

            history.push({ pathname: '/cases', search: searchQuery });
        },
    });

    // Reset focus on change
    useEffect(() => {
        if (activeFilterInput === '') return;

        dispatch(setActiveFilterInput(''));

        // eslint-disable-next-line
    }, [formik.values]);

    const handleClearFiltersClick = () => {
        setFormValues({});
        formik.resetForm();
    };

    const handleSetModalAlert = () => {
        closeAlert(false);
    };

    const closeAndResetAlert = () => {
        dispatch(setModalOpen(false));
        closeAlert(false);
    };

    const getMaxDate = () => {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        let month: number | string = currentDate.getMonth() + 1;
        let day: number | string = currentDate.getDate();

        if (month < 10) {
            month = `0${month}`;
        }

        if (day < 10) {
            day = `0${day}`;
        }

        return `${year}-${month}-${day}`;
    };

    return (
        <Dialog open={modalOpen} maxWidth={'xl'} onClose={closeAndResetAlert}>
            <DialogTitle>
                Apply filters
                <IconButton
                    aria-label="close"
                    className={classes.closeButton}
                    onClick={() => dispatch(setModalOpen(false))}
                    size="large"
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            {showModalAlert && (
                <Alert
                    severity="info"
                    onClose={() => {
                        handleSetModalAlert();
                    }}
                    className={classes.alertBox}
                >
                    Please do not use filters in the Search Bar, use them here
                    instead.
                </Alert>
            )}
            <DialogContent className={classes.dialogContent}>
                <form className={classes.root} onSubmit={formik.handleSubmit}>
                    {/* GENERAL */}
                    <div>
                        <FormControl
                            variant="outlined"
                            className={classes.formControl}
                            size={inputSize}
                        >
                            <InputLabel id="gender-label">Gender</InputLabel>
                            <Select
                                autoFocus={activeFilterInput === 'gender'}
                                labelId="gender-label"
                                id="gender"
                                name="gender"
                                label="Gender"
                                value={formik.values.gender || ''}
                                onChange={formik.handleChange}
                            >
                                <MenuItem value="notProvided">
                                    Not provided
                                </MenuItem>
                                {Object.values(Gender).map((value) => (
                                    <MenuItem key={value} value={value}>
                                        {value}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl
                            variant="outlined"
                            className={classes.formControl}
                            size={inputSize}
                        >
                            <InputLabel id="country-label">Country</InputLabel>
                            {!error && (
                                <Select
                                    autoFocus={activeFilterInput === 'country'}
                                    labelId="country-label"
                                    id="country"
                                    name="country"
                                    label="Country"
                                    value={formik.values.country || ''}
                                    onChange={formik.handleChange}
                                    disabled={loadingState}
                                    data-testid="country-select"
                                >
                                    <MenuItem value="">None</MenuItem>
                                    {countries.map((country: string) => (
                                        <MenuItem
                                            value={codeForCountry(country)}
                                            key={codeForCountry(country)}
                                        >
                                            {country}
                                        </MenuItem>
                                    ))}
                                </Select>
                            )}
                        </FormControl>
                    </div>

                    {/* LOCATION ADMIN */}
                    <div>
                        <FormControl
                            variant="outlined"
                            className={classes.textField}
                            size={inputSize}
                        >
                            <InputLabel htmlFor="city">City</InputLabel>
                            <OutlinedInput
                                autoFocus={activeFilterInput === 'city'}
                                id="city"
                                type="text"
                                label="City"
                                name="city"
                                value={formik.values.city || ''}
                                onChange={formik.handleChange}
                            />
                        </FormControl>
                        <FormControl
                            variant="outlined"
                            className={classes.textField}
                            size={inputSize}
                        >
                            <InputLabel htmlFor="location">Location</InputLabel>
                            <OutlinedInput
                                autoFocus={activeFilterInput === 'location'}
                                id="location"
                                type="text"
                                label="Location"
                                name="location"
                                value={formik.values.location || ''}
                                onChange={formik.handleChange}
                            />
                        </FormControl>
                    </div>

                    <div className={classes.divider} />

                    <div>
                        <TextField
                            autoFocus={activeFilterInput === 'occupation'}
                            id="occupation"
                            label="Occupation"
                            name="occupation"
                            type="text"
                            variant="outlined"
                            size={inputSize}
                            value={formik.values.occupation || ''}
                            onChange={formik.handleChange}
                            error={
                                formik.touched.occupation &&
                                Boolean(formik.errors.occupation)
                            }
                            helperText={
                                formik.touched.occupation &&
                                formik.errors.occupation
                            }
                        />
                        <FormControl
                            variant="outlined"
                            className={classes.formControl}
                            size={inputSize}
                        >
                            <InputLabel id="outcome-label">Outcome</InputLabel>
                            {!error && (
                                <Select
                                    autoFocus={activeFilterInput === 'outcome'}
                                    labelId="outcome-label"
                                    id="outcome"
                                    name="outcome"
                                    label="Outcome"
                                    value={formik.values.outcome || ''}
                                    onChange={formik.handleChange}
                                    disabled={loadingState}
                                >
                                    <MenuItem value="">Not selected</MenuItem>
                                    {Object.values(Outcome).map((value) => (
                                        <MenuItem key={value} value={value}>
                                            {value}
                                        </MenuItem>
                                    ))}
                                </Select>
                            )}
                        </FormControl>
                    </div>

                    <div>
                        <TextField
                            autoFocus={
                                activeFilterInput === 'dateConfirmedFrom'
                            }
                            id="dateConfirmedFrom"
                            label="Date confirmed from"
                            name="dateConfirmedFrom"
                            type="date"
                            variant="outlined"
                            // This makes sure that only 4 digits can be entered as a year
                            InputProps={{
                                inputProps: { max: getMaxDate() },
                            }}
                            size={inputSize}
                            InputLabelProps={{ shrink: true }}
                            value={formik.values.dateConfirmedFrom || ''}
                            onChange={formik.handleChange}
                            error={
                                formik.touched.dateConfirmedFrom &&
                                Boolean(formik.errors.dateConfirmedFrom)
                            }
                            helperText={
                                formik.touched.dateConfirmedFrom &&
                                formik.errors.dateConfirmedFrom
                            }
                        />
                        <TextField
                            autoFocus={activeFilterInput === 'dateConfirmedTo'}
                            id="dateConfirmedTo"
                            label="Date confirmed to"
                            name="dateConfirmedTo"
                            type="date"
                            variant="outlined"
                            // This makes sure that only 4 digits can be entered as a year
                            InputProps={{
                                inputProps: { max: getMaxDate() },
                            }}
                            size={inputSize}
                            InputLabelProps={{ shrink: true }}
                            value={formik.values.dateConfirmedTo || ''}
                            onChange={formik.handleChange}
                            error={
                                formik.touched.dateConfirmedTo &&
                                Boolean(formik.errors.dateConfirmedTo)
                            }
                            helperText={
                                formik.touched.dateConfirmedTo &&
                                formik.errors.dateConfirmedTo
                            }
                        />
                    </div>

                    {hasAnyRole(user, ['curator']) && (
                        <>
                            <div className={classes.divider} />

                            <div>
                                <TextField
                                    autoFocus={activeFilterInput === 'caseId'}
                                    id="caseId"
                                    label="Case ID"
                                    name="caseId"
                                    type="text"
                                    variant="outlined"
                                    size={inputSize}
                                    value={formik.values.caseId || ''}
                                    onChange={formik.handleChange}
                                    error={
                                        formik.touched.caseId &&
                                        Boolean(formik.errors.caseId)
                                    }
                                    helperText={
                                        formik.touched.caseId &&
                                        formik.errors.caseId
                                    }
                                />
                            </div>
                        </>
                    )}

                    <div className={classes.searchBtnContainer}>
                        <Button
                            color="primary"
                            variant="outlined"
                            type="button"
                            size={inputSize}
                            onClick={handleClearFiltersClick}
                        >
                            Clear filters
                        </Button>

                        <Button
                            color="primary"
                            variant="contained"
                            type="submit"
                            data-test-id="search-by-filter-button"
                            name="filterButton"
                            id="start-filtering"
                            size={inputSize}
                            className={classes.searchBtn}
                        >
                            Apply
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
