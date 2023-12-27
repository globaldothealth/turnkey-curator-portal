import { Select, TextField } from 'formik-mui';

import { IconButton, MenuItem, Tooltip, Typography } from '@mui/material';
import { FastField, useFormikContext, Field, ErrorMessage } from 'formik';
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
    errorMessage: {
        fontSize: '0.75em',
        color: '#FD685B',
        marginLeft: '14px',
        marginTop: '3px',
    },
}));

export default function Location(): JSX.Element {
    const countryNames = getNames('en');
    const classes = styles();
    const { values, setFieldValue, setTouched } =
        useFormikContext<Day0CaseFormValues>();
    const myObj: { [index: string]: any } = lookupTable;

    const [admin1Options, setAdmin1Options] = React.useState<string[]>([]);
    const [admin1AvailableOnMap, setAdmin1AvailableOnMap] =
        React.useState<boolean>(false);
    const [admin2Options, setAdmin2Options] = React.useState<string[]>([]);
    const [admin2AvailableOnMap, setAdmin2AvailableOnMap] =
        React.useState<boolean>(false);
    const [admin3Options, setAdmin3Options] = React.useState<string[]>([]);
    const [admin3AvailableOnMap, setAdmin3AvailableOnMap] =
        React.useState<boolean>(false);

    // Update options for admin1
    useEffect(() => {
        setAdmin1Options(
            Object.keys(myObj[values.location.countryISO3] || {}) || [],
        );
    }, [values.location.countryISO3]);

    // Update mapbox indicator for admin1
    useEffect(() => {
        if (
            values.location.admin1 &&
            admin1Options &&
            admin1Options.includes(values.location.admin1)
        ) {
            setAdmin1AvailableOnMap(true);
        } else {
            setAdmin1AvailableOnMap(false);
        }
    }, [admin1Options, values.location.admin1]);

    // Update options for admin2
    useEffect(() => {
        setAdmin2Options(
            Object.keys(
                myObj[values.location.countryISO3]?.[
                    values.location.admin1 || ''
                ] || {},
            ) || [],
        );
    }, [values.location.countryISO3, values.location.admin1]);

    // Update mapbox indicator for admin2
    useEffect(() => {
        if (
            values.location.admin2 &&
            admin2Options &&
            admin2Options.includes(values.location.admin2)
        ) {
            setAdmin2AvailableOnMap(true);
        } else {
            setAdmin2AvailableOnMap(false);
        }
    }, [admin2Options, values.location.admin2]);

    // Update options for admin3
    useEffect(() => {
        setAdmin3Options(
            myObj[values.location.countryISO3]?.[
                values.location.admin1 || ''
            ]?.[values.location.admin2 || ''] || [],
        );
    }, [
        values.location.countryISO3,
        values.location.admin1,
        values.location.admin2,
    ]);

    // Update mapbox indicator for admin3
    useEffect(() => {
        if (
            values.location.admin3 &&
            admin3Options &&
            admin3Options.includes(values.location.admin3)
        ) {
            setAdmin3AvailableOnMap(true);
        } else {
            setAdmin3AvailableOnMap(false);
        }
    }, [admin3Options, values.location.admin3]);

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
            'location.admin1',
            values.location.geocodeLocation.admin1 ||
                values.location.admin1 ||
                '',
        );
        setFieldValue(
            'location.admin2',
            values.location.geocodeLocation.admin2 ||
                values.location.admin2 ||
                '',
        );
        setFieldValue(
            'location.admin3',
            values.location.geocodeLocation.admin3 ||
                values.location.admin3 ||
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

    return (
        <>
            <div className={classes.root}>
                {/* Country */}
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
                                required={true}
                                error={!values.location.countryISO3}
                                InputProps={
                                    values.location.country
                                        ? {
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
                                        : {
                                              ...params.InputProps,
                                          }
                                }
                            />
                            {!values.location.countryISO3 && (
                                <ErrorMessage name={'caseReference.sourceUrl'}>
                                    {(msg) => (
                                        <div className={classes.errorMessage}>
                                            {msg}
                                        </div>
                                    )}
                                </ErrorMessage>
                            )}
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
                {/* Admin 1 */}
                <Autocomplete
                    className={classes.autocompleteField}
                    itemType="string"
                    getOptionLabel={(option: string): string => option}
                    options={admin1Options}
                    value={values.location.admin1}
                    onChange={(_: unknown, newValue: string | null): void => {
                        setFieldValue('location.admin1', newValue);
                    }}
                    onInputChange={(_, newInputValue, reason): void => {
                        if (reason === 'reset') {
                            setFieldValue('location.admin1', '');
                        } else setFieldValue('location.admin1', newInputValue);
                    }}
                    noOptionsText="No Admin 1 locations are represented on the map for the given Country"
                    renderInput={(params): JSX.Element => (
                        <>
                            {/* Do not use FastField here */}
                            <Field
                                {...params}
                                // Setting the name properly allows any typed value
                                // to be set in the form values, rather than only selected
                                // dropdown values. Thus we use an unused form value here.
                                name="location.admin1"
                                data-testid={'location.admin1'}
                                // Use the initial valuelocation name as a hint when untouched
                                // otherwise just use the field name.
                                label={'Admin 1'}
                                component={TextField}
                                fullWidth
                                InputProps={
                                    values.location.admin1
                                        ? {
                                              ...params.InputProps,
                                              startAdornment: (
                                                  <>
                                                      {admin1AvailableOnMap && (
                                                          <InputAdornment position="start">
                                                              <Tooltip
                                                                  title={
                                                                      'Represented on the Admin 1 Map View'
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
                                        : {
                                              ...params.InputProps,
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
                                            'Represented on the Admin 1 Map View'
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
                {/* Admin 2 */}
                <Autocomplete
                    className={classes.autocompleteField}
                    itemType="string"
                    getOptionLabel={(option: string): string => option}
                    options={
                        (values.location.countryISO3 &&
                            Object.keys(
                                myObj[values.location.countryISO3]?.[
                                    values.location.admin1 || ''
                                ] || {},
                            )) ||
                        []
                    }
                    value={values.location.admin2}
                    sx={{ width: '50%' }}
                    onChange={(_: unknown, newValue: string | null): void => {
                        setFieldValue('location.admin2', newValue);
                    }}
                    onInputChange={(_, newInputValue, reason): void => {
                        // setInputValue(newInputValue);
                        if (reason === 'reset') {
                            setFieldValue('location.admin2', '');
                        } else setFieldValue('location.admin2', newInputValue);
                    }}
                    noOptionsText="No Admin 2 locations are represented on the map for the given Admin 1 and Country"
                    renderInput={(params): JSX.Element => (
                        <>
                            {/* Do not use FastField here */}
                            <Field
                                {...params}
                                // Setting the name properly allows any typed value
                                // to be set in the form values, rather than only selected
                                // dropdown values. Thus we use an unused form value here.
                                name="location.admin2"
                                data-testid={'location.admin2'}
                                // Use the initial valuelocation name as a hint when untouched
                                // otherwise just use the field name.
                                label={'Admin 2'}
                                component={TextField}
                                fullWidth
                                InputProps={
                                    values.location.admin2
                                        ? {
                                              ...params.InputProps,
                                              startAdornment: (
                                                  <>
                                                      {admin2AvailableOnMap && (
                                                          <InputAdornment position="start">
                                                              <Tooltip
                                                                  title={
                                                                      'Represented on the Admin 2 Map View'
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
                                        : {
                                              ...params.InputProps,
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
                                            'Represented on the Admin 2 Map View'
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
                {/* Admin 3 */}
                <Autocomplete
                    className={classes.autocompleteField}
                    itemType="string"
                    getOptionLabel={(option: string): string => option}
                    options={admin3Options}
                    value={values.location.admin3}
                    onChange={(_: unknown, newValue: string | null): void => {
                        setFieldValue('location.admin3', newValue);
                    }}
                    onInputChange={(_, newInputValue, reason): void => {
                        if (reason === 'reset') {
                            setFieldValue('location.admin3', '');
                        } else setFieldValue('location.admin3', newInputValue);
                    }}
                    noOptionsText="No Admin 3 are represented on the map for the given Admin 2, Admin 1 and Country"
                    renderInput={(params): JSX.Element => (
                        <>
                            {/* Do not use FastField here */}
                            <Field
                                {...params}
                                // Setting the name properly allows any typed value
                                // to be set in the form values, rather than only selected
                                // dropdown values. Thus we use an unused form value here.
                                name="location.admin3"
                                data-testid={'location.admin3'}
                                // Use the initial valuelocation name as a hint when untouched
                                // otherwise just use the field name.
                                label={'Admin 3'}
                                component={TextField}
                                fullWidth
                                InputProps={
                                    values.location.admin3
                                        ? {
                                              ...params.InputProps,
                                              startAdornment: (
                                                  <>
                                                      {admin3AvailableOnMap && (
                                                          <InputAdornment position="start">
                                                              <Tooltip
                                                                  title={
                                                                      'Represented on the Admin 3 Map View'
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
                                        : {
                                              ...params.InputProps,
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
                                            'Represented on the Admin 3 Map View'
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
