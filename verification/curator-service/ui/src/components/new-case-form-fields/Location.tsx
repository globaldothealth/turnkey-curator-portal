import { Select, TextField } from 'formik-mui';

import { MenuItem } from '@mui/material';
import { FastField, useFormikContext } from 'formik';
import makeStyles from '@mui/styles/makeStyles';
import { Day0CaseFormValues } from '../../api/models/Day0Case';
import { useEffect } from 'react';
import { getAlpha3Codes, getName, alpha2ToAlpha3 } from 'i18n-iso-countries';

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
}));

export default function Location(): JSX.Element {
    const classes = styles();
    const { values, setFieldValue } = useFormikContext<Day0CaseFormValues>();

    useEffect(() => {
        if (!values.location.geocodeLocation) return;

        const countryName = getName(
            values.location.geocodeLocation.country,
            'en',
        );

        setFieldValue(
            'location.countryISO3',
            values.location.geocodeLocation.countryISO3 ||
                alpha2ToAlpha3(values.location.geocodeLocation.country),
        );
        setFieldValue('location.country', countryName);
        setFieldValue(
            'location.location',
            values.location.geocodeLocation.name || '',
        );
        // eslint-disable-next-line
    }, [values.location.geocodeLocation]);

    return (
        <div className={classes.root}>
            <FastField
                variant="outlined"
                data-testid="location.geoResolution"
                className={classes.field}
                name="location.geoResolution"
                type="text"
                label={<p>Geo resolution</p>}
                component={Select}
                isClearable="true"
                sx={{ minWidth: '13rem' }}
            >
                <MenuItem value={''}>
                    <em>None</em>
                </MenuItem>
                {['Point', 'Admin3', 'Admin2', 'Admin1', 'Country'].map(
                    (res) => (
                        <MenuItem key={res} value={res}>
                            {res}
                        </MenuItem>
                    ),
                )}
            </FastField>
            <FastField
                variant="outlined"
                data-testid="location.countryISO3"
                className={classes.field}
                name="location.countryISO3"
                type="text"
                label={<p>Country code</p>}
                component={Select}
                sx={{ minWidth: '13rem' }}
            >
                {Object.keys(getAlpha3Codes()).map((res) => (
                    <MenuItem key={res} value={res}>
                        {res}
                    </MenuItem>
                ))}
            </FastField>
            <FastField
                variant="outlined"
                className={classes.field}
                label="Country"
                name="location.country"
                type="text"
                required
                component={TextField}
                sx={{ minWidth: '13rem' }}
            />
            <FastField
                variant="outlined"
                className={classes.field}
                label="City"
                name="location.city"
                type="text"
                component={TextField}
                sx={{ minWidth: '13rem' }}
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
                component={TextField}
                sx={{ minWidth: '13rem' }}
            />
            <FastField
                variant="outlined"
                className={classes.field}
                label="Longitude"
                name={`location.geometry.longitude`}
                type="number"
                component={TextField}
                sx={{ minWidth: '13rem' }}
            />
        </div>
    );
}
