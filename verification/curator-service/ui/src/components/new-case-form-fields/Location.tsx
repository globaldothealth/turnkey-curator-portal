import { Select, TextField } from 'formik-mui';

import { IconButton, MenuItem, Tooltip, Typography } from '@mui/material';
import { FastField, useFormikContext, Field } from 'formik';
import makeStyles from '@mui/styles/makeStyles';
import { Day0CaseFormValues, GeocodeLocation } from '../../api/models/Day0Case';
import React, { useEffect } from 'react';
import {
    getName,
    alpha2ToAlpha3,
    getNames,
    alpha3ToAlpha2,
} from 'i18n-iso-countries';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import Autocomplete from '@mui/material/Autocomplete';
import lookupTable from '../../data/lookup_table.json';
import PublicIcon from '@mui/icons-material/Public';
import { InputAdornment } from '@material-ui/core';

const styles = makeStyles(() => ({
    root: {
        display: 'flex',
        flexWrap: 'wrap',
    },
    field: {
        marginRight: '1em',
        marginTop: '1em',
        width: '8em',
    },
    mapContainer: {
        textAlign: 'center',
    },
    divider: {
        marginTop: '1em',
        marginBottom: '1em',
    },
    autocompleteField: {
        marginRight: '1em',
        marginTop: '1em',
        width: '16em',
    },
    suggestion: {
        '&:hover': {
            backgroundColor: '#00000014',
        },
    },
    mapIcon: {
        color: '#0094E2',
    },
}));

export default function Location(): JSX.Element {
    const countryNames = getNames('en');
    const classes = styles();
    const { values, setFieldValue, setTouched } =
        useFormikContext<Day0CaseFormValues>();
    const myObj: { [index: string]: any } = lookupTable;

    const [regionOptions, setRegionOptions] = React.useState<string[]>([]);
    const [regionAvailableOnMap, setRegionAvailableOnMap] =
        React.useState<boolean>(false);
    const [districtOptions, setDistrictOptions] = React.useState<string[]>([]);
    const [districtAvailableOnMap, setDistrictAvailableOnMap] =
        React.useState<boolean>(false);
    const [placeOptions, setPlaceOptions] = React.useState<string[]>([]);
    const [placeAvailableOnMap, setPlaceAvailableOnMap] =
        React.useState<boolean>(false);

    // Update options for region
    useEffect(() => {
        setRegionOptions(
            Object.keys(myObj[values.location.countryISO3] || {}) || [],
        );
    }, [values.location.countryISO3]);

    // Update mapbox indicator for region
    useEffect(() => {
        if (
            values.location.region &&
            regionOptions &&
            regionOptions.includes(values.location.region)
        ) {
            setRegionAvailableOnMap(true);
        } else {
            setRegionAvailableOnMap(false);
        }
    }, [regionOptions, values.location.region]);

    // Update options for district
    useEffect(() => {
        setDistrictOptions(
            Object.keys(
                myObj[values.location.countryISO3]?.[
                    values.location.region || ''
                ] || {},
            ) || [],
        );
    }, [values.location.countryISO3, values.location.region]);

    // Update mapbox indicator for district
    useEffect(() => {
        if (
            values.location.district &&
            districtOptions &&
            districtOptions.includes(values.location.district)
        ) {
            setDistrictAvailableOnMap(true);
        } else {
            setDistrictAvailableOnMap(false);
        }
    }, [districtOptions, values.location.district]);

    // Update options for place
    useEffect(() => {
        setPlaceOptions(
            myObj[values.location.countryISO3]?.[
                values.location.region || ''
            ]?.[values.location.district || ''] || [],
        );
    }, [
        values.location.countryISO3,
        values.location.region,
        values.location.district,
    ]);

    // Update mapbox indicator for place
    useEffect(() => {
        if (
            values.location.place &&
            placeOptions &&
            placeOptions.includes(values.location.place)
        ) {
            setPlaceAvailableOnMap(true);
        } else {
            setPlaceAvailableOnMap(false);
        }
    }, [placeOptions, values.location.place]);

    useEffect(() => {
        if (!values.location.geocodeLocation) return;

        const countryName =
            getName(values.location.geocodeLocation.country, 'en') ||
            values.location.country;

        setFieldValue(
            'location.countryISO3',
            values.location.geocodeLocation.countryISO3 ||
                alpha2ToAlpha3(values.location.geocodeLocation.country) ||
                values.location.countryISO3,
        );
        setFieldValue('location.country', countryName);
        setFieldValue(
            'location.region',
            values.location.geocodeLocation.region ||
                values.location.region ||
                '',
        );
        setFieldValue(
            'location.district',
            values.location.geocodeLocation.district ||
                values.location.district ||
                '',
        );
        setFieldValue(
            'location.place',
            values.location.geocodeLocation.place ||
                values.location.place ||
                '',
        );
        setFieldValue(
            'location.location',
            values.location.geocodeLocation.name ||
                values.location.location ||
                '',
        );
        setFieldValue(
            'location.geometry.latitude',
            values.location.geocodeLocation.geometry?.latitude ||
                values.location.geometry?.latitude ||
                '',
        );
        setFieldValue(
            'location.geometry.longitude',
            values.location.geocodeLocation.geometry?.longitude ||
                values.location.geometry?.longitude ||
                '',
        );
        // eslint-disable-next-line
    }, [values.location.geocodeLocation]);

    console.log(values.location.country);
    console.log(values.location.countryISO3);

    return (
        <>
            <div className={classes.root}>
                <Autocomplete
                    className={classes.autocompleteField}
                    itemType="string"
                    getOptionLabel={(option: string): string => option}
                    options={Object.keys(countryNames)
                        .map((alpha2key) => countryNames[alpha2key])
                        .sort()}
                    value={
                        values.location.country === ''
                            ? undefined
                            : values.location.country
                    }
                    sx={{ width: '50%' }}
                    disableClearable
                    onChange={(_: unknown, newValue: string | null): void => {
                        const countryCode = alpha2ToAlpha3(
                            Object.keys(countryNames).find(
                                (key: string) => countryNames[key] === newValue,
                            ) || '',
                        );
                        setFieldValue('location.country', newValue);
                        setFieldValue('location.countryISO3', countryCode);
                    }}
                    // onBlur={(): void => setTouched({ [props.name]: true })}
                    onInputChange={(_, newInputValue): void => {
                        setFieldValue('location.country', newInputValue);
                        const countryCode = alpha2ToAlpha3(
                            Object.keys(countryNames).find(
                                (key: string) =>
                                    countryNames[key] === newInputValue,
                            ) || '',
                        );
                        if (countryCode)
                            setFieldValue('location.countryISO3', countryCode);
                        else setFieldValue('location.countryISO3', '');
                    }}
                    renderInput={(params): JSX.Element => (
                        <>
                            {/* Do not use FastField here */}
                            <Field
                                {...params}
                                // Setting the name properly allows any typed value
                                // to be set in the form values, rather than only selected
                                // dropdown values. Thus we use an unused form value here.
                                name="location.country"
                                data-testid={'location.country'}
                                // Use the initial valuelocation name as a hint when untouched
                                // otherwise just use the field name.
                                label={'Country'}
                                component={TextField}
                                fullWidth
                                InputProps={
                                    values.location.country && {
                                        ...params.InputProps,
                                        startAdornment: (
                                            <>
                                                {values.location
                                                    .countryISO3 && (
                                                    <InputAdornment position="start">
                                                        <Tooltip
                                                            title={
                                                                'Represented on the Country Map View'
                                                            }
                                                        >
                                                            <PublicIcon
                                                                className={
                                                                    classes.mapIcon
                                                                }
                                                            />
                                                        </Tooltip>
                                                    </InputAdornment>
                                                )}
                                                {
                                                    params.InputProps
                                                        .startAdornment
                                                }
                                            </>
                                        ),
                                    }
                                }
                            />
                        </>
                    )}
                    renderOption={(props, option: string): React.ReactNode => {
                        return (
                            <li {...props} className={classes.suggestion}>
                                <Typography variant="body2">
                                    <Tooltip
                                        title={
                                            'Represented on the Country Map View'
                                        }
                                    >
                                        <IconButton>
                                            <PublicIcon
                                                className={classes.mapIcon}
                                            />
                                        </IconButton>
                                    </Tooltip>
                                    {option}
                                </Typography>
                            </li>
                        );
                    }}
                />
                <Autocomplete
                    className={classes.autocompleteField}
                    itemType="string"
                    getOptionLabel={(option: string): string => option}
                    options={regionOptions}
                    value={values.location.region}
                    sx={{ width: '50%' }}
                    onChange={(_: unknown, newValue: string | null): void => {
                        // setOptions(newValue ? [newValue, ...options] : options);
                        // setValue(newValue);
                        setFieldValue('location.region', newValue);
                    }}
                    // onBlur={(): void => setTouched({ [props.name]: true })}
                    onInputChange={(_, newInputValue): void => {
                        // setInputValue(newInputValue);
                        setFieldValue('location.region', newInputValue);
                    }}
                    noOptionsText="No States are represented on the map for the given Country"
                    renderInput={(params): JSX.Element => (
                        <>
                            {/* Do not use FastField here */}
                            <Field
                                {...params}
                                // Setting the name properly allows any typed value
                                // to be set in the form values, rather than only selected
                                // dropdown values. Thus we use an unused form value here.
                                name="location.region"
                                data-testid={'location.region'}
                                // Use the initial valuelocation name as a hint when untouched
                                // otherwise just use the field name.
                                label={'Region'}
                                component={TextField}
                                fullWidth
                                InputProps={
                                    values.location.region && {
                                        ...params.InputProps,
                                        startAdornment: (
                                            <>
                                                {regionAvailableOnMap && (
                                                    <InputAdornment position="start">
                                                        <Tooltip
                                                            title={
                                                                'Represented on the State Map View'
                                                            }
                                                        >
                                                            <PublicIcon
                                                                className={
                                                                    classes.mapIcon
                                                                }
                                                            />
                                                        </Tooltip>
                                                    </InputAdornment>
                                                )}
                                                {
                                                    params.InputProps
                                                        .startAdornment
                                                }
                                            </>
                                        ),
                                    }
                                }
                            />
                        </>
                    )}
                    renderOption={(props, option: string): React.ReactNode => {
                        return (
                            <li {...props} className={classes.suggestion}>
                                <Typography variant="body2">
                                    <Tooltip
                                        title={
                                            'Represented on the Country Map View'
                                        }
                                    >
                                        <IconButton>
                                            <PublicIcon
                                                className={classes.mapIcon}
                                            />
                                        </IconButton>
                                    </Tooltip>
                                    {option}
                                </Typography>
                            </li>
                        );
                    }}
                />
                <Autocomplete
                    className={classes.autocompleteField}
                    itemType="string"
                    getOptionLabel={(option: string): string => option}
                    options={
                        (values.location.countryISO3 &&
                            Object.keys(
                                myObj[values.location.countryISO3]?.[
                                    values.location.region || ''
                                ] || {},
                            )) ||
                        []
                    }
                    value={values.location.district}
                    sx={{ width: '50%' }}
                    onChange={(_: unknown, newValue: string | null): void => {
                        // setOptions(newValue ? [newValue, ...options] : options);
                        // setValue(newValue);
                        setFieldValue('location.district', newValue);
                    }}
                    // onBlur={(): void => setTouched({ [props.name]: true })}
                    onInputChange={(_, newInputValue): void => {
                        // setInputValue(newInputValue);
                    }}
                    noOptionsText="No Regions are represented on the map for the given State and Country"
                    renderInput={(params): JSX.Element => (
                        <>
                            {/* Do not use FastField here */}
                            <Field
                                {...params}
                                // Setting the name properly allows any typed value
                                // to be set in the form values, rather than only selected
                                // dropdown values. Thus we use an unused form value here.
                                name="location.district"
                                data-testid={'location.district'}
                                // Use the initial valuelocation name as a hint when untouched
                                // otherwise just use the field name.
                                label={'District'}
                                component={TextField}
                                fullWidth
                                InputProps={
                                    values.location.district && {
                                        ...params.InputProps,
                                        startAdornment: (
                                            <>
                                                {districtAvailableOnMap && (
                                                    <InputAdornment position="start">
                                                        <Tooltip
                                                            title={
                                                                'Represented on the Region Map View'
                                                            }
                                                        >
                                                            <PublicIcon
                                                                className={
                                                                    classes.mapIcon
                                                                }
                                                            />
                                                        </Tooltip>
                                                    </InputAdornment>
                                                )}
                                                {
                                                    params.InputProps
                                                        .startAdornment
                                                }
                                            </>
                                        ),
                                    }
                                }
                            />
                        </>
                    )}
                    renderOption={(props, option: string): React.ReactNode => {
                        return (
                            <li {...props} className={classes.suggestion}>
                                <Typography variant="body2">
                                    <Tooltip
                                        title={
                                            'Represented on the Region Map View'
                                        }
                                    >
                                        <IconButton>
                                            <PublicIcon
                                                className={classes.mapIcon}
                                            />
                                        </IconButton>
                                    </Tooltip>
                                    {option}
                                </Typography>
                            </li>
                        );
                    }}
                />
                {/*<FastField*/}
                {/*    variant="outlined"*/}
                {/*    className={classes.field}*/}
                {/*    label="District"*/}
                {/*    name="location.district"*/}
                {/*    type="text"*/}
                {/*    component={TextField}*/}
                {/*    sx={{ minWidth: '13rem' }}*/}
                {/*/>*/}
                <Autocomplete
                    className={classes.autocompleteField}
                    itemType="string"
                    getOptionLabel={(option: string): string => option}
                    options={placeOptions}
                    value={values.location.place}
                    sx={{ width: '50%' }}
                    onChange={(_: unknown, newValue: string | null): void => {
                        // setOptions(newValue ? [newValue, ...options] : options);
                        // setValue(newValue);
                        setFieldValue('location.place', newValue);
                    }}
                    // onBlur={(): void => setTouched({ [props.name]: true })}
                    onInputChange={(_, newInputValue): void => {
                        // setInputValue(newInputValue);
                    }}
                    noOptionsText="No Districts are represented on the map for the given Region, State and Country"
                    renderInput={(params): JSX.Element => (
                        <>
                            {/* Do not use FastField here */}
                            <Field
                                {...params}
                                // Setting the name properly allows any typed value
                                // to be set in the form values, rather than only selected
                                // dropdown values. Thus we use an unused form value here.
                                name="location.place"
                                data-testid={'location.place'}
                                // Use the initial valuelocation name as a hint when untouched
                                // otherwise just use the field name.
                                label={'Place'}
                                component={TextField}
                                fullWidth
                                InputProps={
                                    values.location.place && {
                                        ...params.InputProps,
                                        startAdornment: (
                                            <>
                                                {placeAvailableOnMap && (
                                                    <InputAdornment position="start">
                                                        <Tooltip
                                                            title={
                                                                'Visible on mapbox map'
                                                            }
                                                        >
                                                            <PublicIcon
                                                                className={
                                                                    classes.mapIcon
                                                                }
                                                            />
                                                        </Tooltip>
                                                    </InputAdornment>
                                                )}
                                                {
                                                    params.InputProps
                                                        .startAdornment
                                                }
                                            </>
                                        ),
                                    }
                                }
                            />
                        </>
                    )}
                    renderOption={(props, option: string): React.ReactNode => {
                        return (
                            <li {...props} className={classes.suggestion}>
                                {/*<LocationOnIcon className={classes.icon} />/!**!/*/}
                                <Typography variant="body2">
                                    {option}
                                </Typography>
                            </li>
                        );
                    }}
                />
                {/*<FastField*/}
                {/*    variant="outlined"*/}
                {/*    className={classes.field}*/}
                {/*    label="Place (ex. City)"*/}
                {/*    name="location.place"*/}
                {/*    type="text"*/}
                {/*    component={TextField}*/}
                {/*    sx={{ minWidth: '13rem' }}*/}
                {/*/>*/}
                <FastField
                    variant="outlined"
                    className={classes.field}
                    label="Location"
                    name="location.location"
                    type="text"
                    component={TextField}
                    sx={{ minWidth: '13rem' }}
                />
                <FastField
                    variant="outlined"
                    className={classes.field}
                    label="Latitude"
                    name={`location.geometry.latitude`}
                    type="number"
                    // Workaround for formik + MUI issue
                    InputLabelProps={{
                        shrink: values.location.geometry?.latitude,
                    }}
                    component={TextField}
                    sx={{ minWidth: '13rem' }}
                />
                <Field
                    variant="outlined"
                    className={classes.field}
                    label="Longitude"
                    name={`location.geometry.longitude`}
                    type="number"
                    // Workaround for formik + MUI issue
                    InputLabelProps={{
                        shrink: values.location.geometry?.longitude,
                    }}
                    component={TextField}
                    sx={{ minWidth: '13rem' }}
                />
            </div>
        </>
    );
}
