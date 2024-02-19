import { FastField, useFormikContext, Field, ErrorMessage } from 'formik';
import { TextField } from 'formik-mui';
import { getName, alpha2ToAlpha3, getNames } from 'i18n-iso-countries';
import { InputAdornment } from '@material-ui/core';
import PublicIcon from '@mui/icons-material/Public';
import {
    Autocomplete,
    Grid,
    IconButton,
    Tooltip,
    Typography,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import React, { useEffect } from 'react';

import { Day0CaseFormValues } from '../../api/models/Day0Case';
import axios from 'axios';

const styles = makeStyles(() => ({
    autocompleteField: { width: '100%' },
    field: { width: '100%' },
    halfWidth: { marginTop: '1em', width: '50%' },
    mapIcon: { color: '#0094E2' },
    suggestion: {
        '&:hover': {
            backgroundColor: '#00000014',
        },
    },
    errorMessage: {
        fontSize: '0.75em',
        color: '#FD685B',
        marginLeft: '14px',
        marginTop: '3px',
    },
}));

type adminEntry = {
    name: string;
    wiki: string;
};

export default function Location(): JSX.Element {
    const countryNames = getNames('en');
    const classes = styles();
    const { values, setFieldValue, initialValues } =
        useFormikContext<Day0CaseFormValues>();

    const [selectedCountry, setSelectedCountry] = React.useState<string>(
        initialValues?.location?.country || '',
    );
    const [admin1Entries, setAdmin1Entries] = React.useState(
        [] as adminEntry[],
    );
    const [admin2Entries, setAdmin2Entries] = React.useState(
        [] as adminEntry[],
    );
    const [admin3Entries, setAdmin3Entries] = React.useState(
        [] as adminEntry[],
    );
    const [selectedAdmin1, setSelectedAdmin1] = React.useState<adminEntry>(
        (initialValues?.location?.admin1 &&
            initialValues?.location?.admin1WikiId && {
                name: initialValues?.location?.admin1,
                wiki: initialValues?.location?.admin1WikiId,
            }) || { name: '', wiki: '' },
    );
    const [selectedAdmin2, setSelectedAdmin2] = React.useState<adminEntry>(
        (initialValues?.location?.admin2 &&
            initialValues?.location?.admin2WikiId && {
                name: initialValues?.location?.admin2,
                wiki: initialValues?.location?.admin2WikiId,
            }) || { name: '', wiki: '' },
    );
    const [selectedAdmin3, setSelectedAdmin3] = React.useState<adminEntry>(
        (initialValues?.location?.admin3 &&
            initialValues?.location?.admin3WikiId && {
                name: initialValues?.location?.admin3,
                wiki: initialValues?.location?.admin3WikiId,
            }) || { name: '', wiki: '' },
    );

    const [admin1AvailableOnMap, setAdmin1AvailableOnMap] =
        React.useState<boolean>(false);
    const [admin2AvailableOnMap, setAdmin2AvailableOnMap] =
        React.useState<boolean>(false);
    const [admin3AvailableOnMap, setAdmin3AvailableOnMap] =
        React.useState<boolean>(false);

    // Update options for admin1
    useEffect(() => {
        if (values.location.countryISO3) {
            axios
                .get('/api/geocode/admin1', {
                    params: { admin0: values.location.countryISO3 },
                })
                .then((response) => setAdmin1Entries(response.data));
        }
    }, [values.location.countryISO3]);

    // Update options for admin2
    useEffect(() => {
        if (values.location.admin1WikiId) {
            axios
                .get('/api/geocode/admin2', {
                    params: { admin1WikiId: values.location.admin1WikiId },
                })
                .then((response) => setAdmin2Entries(response.data));
        }
    }, [values.location.admin1WikiId]);

    // Update options for admin3
    useEffect(() => {
        if (values.location.admin2WikiId) {
            axios
                .get('/api/geocode/admin3', {
                    params: { admin2WikiId: values.location.admin2WikiId },
                })
                .then((response) => setAdmin3Entries(response.data));
        }
    }, [values.location.admin2WikiId]);

    // Update mapbox indicator for admin1
    useEffect(() => {
        setAdmin1AvailableOnMap(!!values.location.admin1WikiId);
    }, [values.location.admin1WikiId]);

    // Update mapbox indicator for admin2
    useEffect(() => {
        setAdmin2AvailableOnMap(!!values.location.admin2WikiId);
    }, [values.location.admin2WikiId]);

    // Update mapbox indicator for admin3
    useEffect(() => {
        setAdmin3AvailableOnMap(!!values.location.admin3WikiId);
    }, [values.location.admin3WikiId]);

    useEffect(() => {
        if (!values.location.geocodeLocation) return;
        console.log(values.location.geocodeLocation);

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
        setSelectedCountry(countryName);
        setFieldValue(
            'location.admin1',
            values.location.geocodeLocation.admin1 ||
                values.location.admin1 ||
                '',
        );
        // setSelectedAdmin1(
        //     values.location.geocodeLocation.admin1 ||
        //         values.location.admin1 ||
        //         '',
        // ); TODO unmock
        setFieldValue(
            'location.admin2',
            values.location.geocodeLocation.admin2 ||
                values.location.admin2 ||
                '',
        );
        // setSelectedAdmin2(
        //     values.location.geocodeLocation.admin2 ||
        //         values.location.admin2 ||
        //         '',
        // );
        setFieldValue(
            'location.admin3',
            values.location.geocodeLocation.admin3 ||
                values.location.admin3 ||
                '',
        );
        // setSelectedAdmin3(
        //     values.location.geocodeLocation.admin3 ||
        //         values.location.admin3 ||
        //         '',
        // );
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [values.location.geocodeLocation]);

    return (
        <div className={classes.halfWidth}>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    {/* Country */}
                    <Autocomplete
                        className={classes.autocompleteField}
                        itemType="string"
                        getOptionLabel={(option: string): string => option}
                        options={Object.keys(countryNames)
                            .map((alpha2key) => countryNames[alpha2key])
                            .sort()}
                        value={selectedCountry}
                        disableClearable
                        defaultValue={initialValues.location.country}
                        onChange={(
                            _: unknown,
                            newValue: string | null,
                        ): void => {
                            const countryCode = alpha2ToAlpha3(
                                Object.keys(countryNames).find(
                                    (key: string) =>
                                        countryNames[key] === newValue,
                                ) || '',
                            );
                            setSelectedCountry(newValue || '');
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
                            if (countryCode) {
                                setFieldValue(
                                    'location.countryISO3',
                                    countryCode,
                                );
                            } else setFieldValue('location.countryISO3', '');
                            setSelectedCountry(newInputValue || '');
                        }}
                        renderInput={(params): JSX.Element => (
                            <>
                                {/* Do not use FastField here */}
                                <Field
                                    {...params}
                                    name="location.country"
                                    data-testid={'location.country'}
                                    label={'Country'}
                                    component={TextField}
                                    fullWidth
                                    required
                                    error={!values.location.countryISO3}
                                    InputProps={
                                        selectedCountry
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
                                {!selectedCountry && (
                                    <ErrorMessage
                                        name={'caseReference.sourceUrl'}
                                    >
                                        {(msg) => (
                                            <div
                                                className={classes.errorMessage}
                                            >
                                                {msg}
                                            </div>
                                        )}
                                    </ErrorMessage>
                                )}
                            </>
                        )}
                        renderOption={(
                            props,
                            option: string,
                        ): React.ReactNode => {
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
                </Grid>
                <Grid item xs={6}>
                    {/* Admin 1 */}
                    <Autocomplete
                        className={classes.autocompleteField}
                        itemType="string"
                        getOptionLabel={(option: adminEntry): string =>
                            option.name
                        }
                        options={admin1Entries}
                        value={selectedAdmin1}
                        onChange={(
                            _: unknown,
                            newValue: adminEntry | null,
                        ): void => {
                            setFieldValue('location.admin1', newValue?.name);
                            setFieldValue(
                                'location.admin1WikiId',
                                newValue?.wiki,
                            );
                            setSelectedAdmin1(
                                newValue || { name: '', wiki: '' },
                            );
                        }}
                        onInputChange={(_, newInputValue, reason): void => {
                            if (reason === 'clear') {
                                setFieldValue('location.admin1', '');
                                // setSelectedAdmin1('');
                            } else {
                                setFieldValue('location.admin1', newInputValue);
                                // setSelectedAdmin1(newInputValue || '');
                            }
                        }}
                        noOptionsText="No Admin 1 locations are represented on the map for the given Country"
                        renderInput={(params): JSX.Element => (
                            <Field
                                {...params}
                                name="location.admin1"
                                data-testid={'location.admin1'}
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
                        )}
                        renderOption={(
                            props,
                            option: adminEntry,
                        ): React.ReactNode => {
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
                                        {option.name}
                                    </Typography>
                                </li>
                            );
                        }}
                    />
                </Grid>
                <Grid item xs={6}>
                    {/* Admin 2 */}
                    <Autocomplete
                        className={classes.autocompleteField}
                        itemType="string"
                        getOptionLabel={(option: adminEntry): string =>
                            option.name
                        }
                        options={admin2Entries}
                        value={selectedAdmin2}
                        sx={{ width: '50%' }}
                        onChange={(
                            _: unknown,
                            newValue: adminEntry | null,
                        ): void => {
                            setFieldValue('location.admin2', newValue?.name);
                            setFieldValue(
                                'location.admin2WikiId',
                                newValue?.wiki,
                            );
                            setSelectedAdmin2(
                                newValue || { name: '', wiki: '' },
                            );
                        }}
                        onInputChange={(_, newInputValue, reason): void => {
                            // setInputValue(newInputValue);
                            if (reason === 'clear') {
                                setFieldValue('location.admin2', '');
                                // setSelectedAdmin2('');
                            } else {
                                setFieldValue('location.admin2', newInputValue);
                                // setSelectedAdmin2(newInputValue || '');
                            }
                        }}
                        noOptionsText="No Admin 2 locations are represented on the map for the given Admin 1 and Country"
                        renderInput={(params): JSX.Element => (
                            <Field
                                {...params}
                                name="location.admin2"
                                data-testid={'location.admin2'}
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
                        )}
                        renderOption={(
                            props,
                            option: adminEntry,
                        ): React.ReactNode => {
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
                                        {option.name}
                                    </Typography>
                                </li>
                            );
                        }}
                    />
                </Grid>
                <Grid item xs={6}>
                    {/* Admin 3 */}
                    <Autocomplete
                        className={classes.autocompleteField}
                        // itemType="any"
                        options={admin3Entries}
                        value={selectedAdmin3}
                        getOptionLabel={(option: adminEntry): string =>
                            option ? option.name : ''
                        }
                        onChange={(
                            _: unknown,
                            newValue: adminEntry | null,
                        ): void => {
                            setFieldValue('location.admin3', newValue?.name);
                            setFieldValue(
                                'location.admin3WikiId',
                                newValue?.wiki,
                            );
                            setSelectedAdmin3(
                                newValue || { name: '', wiki: '' },
                            );
                        }}
                        onInputChange={(_, newInputValue, reason): void => {
                            if (reason === 'clear') {
                                setFieldValue('location.admin3', '');
                                // setSelectedAdmin3('');
                            } else {
                                setFieldValue('location.admin3', newInputValue);
                                // setSelectedAdmin3(newInputValue || '');
                            }
                        }}
                        noOptionsText="No Admin 3 are represented on the map for the given Admin 2, Admin 1 and Country"
                        renderInput={(params): JSX.Element => (
                            <Field
                                {...params}
                                name="location.admin3"
                                data-testid={'location.admin3'}
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
                        )}
                        renderOption={(
                            props,
                            option: adminEntry,
                        ): React.ReactNode => {
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
                                        {option.name}
                                    </Typography>
                                </li>
                            );
                        }}
                    />
                </Grid>
                <Grid item xs={6}>
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
                </Grid>
                <Grid item xs={6}>
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
                </Grid>
            </Grid>
        </div>
    );
}
