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
import lookupTable from '../../data/lookup_table.json';

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

export default function Location(): JSX.Element {
    const countryNames = getNames('en');
    const classes = styles();
    const { values, setFieldValue } = useFormikContext<Day0CaseFormValues>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lookupTableData: { [index: string]: any } = lookupTable;

    const [selectedCountry, setSelectedCountry] = React.useState<string>('');
    const [selectedAdmin1, setSelectedAdmin1] = React.useState<string>('');
    const [selectedAdmin2, setSelectedAdmin2] = React.useState<string>('');
    const [selectedAdmin3, setSelectedAdmin3] = React.useState<string>('');

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
            Object.keys(lookupTableData[values.location.countryISO3] || {}) ||
                [],
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                lookupTableData[values.location.countryISO3]?.[
                    values.location.admin1 || ''
                ] || {},
            ) || [],
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            lookupTableData[values.location.countryISO3]?.[
                values.location.admin1 || ''
            ]?.[values.location.admin2 || ''] || [],
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        setSelectedAdmin1(
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
        setSelectedAdmin2(
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
        setSelectedAdmin3(
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
                        getOptionLabel={(option: string): string => option}
                        options={admin1Options}
                        value={selectedAdmin1}
                        onChange={(
                            _: unknown,
                            newValue: string | null,
                        ): void => {
                            setFieldValue('location.admin1', newValue);
                            setSelectedAdmin1(newValue || '');
                        }}
                        onInputChange={(_, newInputValue, reason): void => {
                            if (reason === 'clear') {
                                setFieldValue('location.admin1', '');
                                setSelectedAdmin1('');
                            } else {
                                setFieldValue('location.admin1', newInputValue);
                                setSelectedAdmin1(newInputValue || '');
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
                            option: string,
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
                                        {option}
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
                        getOptionLabel={(option: string): string => option}
                        options={
                            (values.location.countryISO3 &&
                                Object.keys(
                                    lookupTableData[
                                        values.location.countryISO3
                                    ]?.[values.location.admin1 || ''] || {},
                                )) ||
                            []
                        }
                        value={selectedAdmin2}
                        sx={{ width: '50%' }}
                        onChange={(
                            _: unknown,
                            newValue: string | null,
                        ): void => {
                            setFieldValue('location.admin2', newValue);
                            setSelectedAdmin2(newValue || '');
                        }}
                        onInputChange={(_, newInputValue, reason): void => {
                            // setInputValue(newInputValue);
                            if (reason === 'clear') {
                                setFieldValue('location.admin2', '');
                                setSelectedAdmin2('');
                            } else {
                                setFieldValue('location.admin2', newInputValue);
                                setSelectedAdmin2(newInputValue || '');
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
                            option: string,
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
                                        {option}
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
                        itemType="string"
                        getOptionLabel={(option: string): string => option}
                        options={admin3Options}
                        value={selectedAdmin3}
                        onChange={(
                            _: unknown,
                            newValue: string | null,
                        ): void => {
                            setFieldValue('location.admin3', newValue);
                            setSelectedAdmin3(newValue || '');
                        }}
                        onInputChange={(_, newInputValue, reason): void => {
                            if (reason === 'clear') {
                                setFieldValue('location.admin3', '');
                                setSelectedAdmin3('');
                            } else {
                                setFieldValue('location.admin3', newInputValue);
                                setSelectedAdmin3(newInputValue || '');
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
                            option: string,
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
                                        {option}
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
