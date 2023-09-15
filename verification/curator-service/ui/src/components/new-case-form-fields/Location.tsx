import { Select, TextField } from 'formik-mui';

import { MenuItem } from '@mui/material';
import { FastField, useFormikContext } from 'formik';
import makeStyles from '@mui/styles/makeStyles';
import { Day0CaseFormValues } from '../../api/models/Day0Case';
import { useEffect } from 'react';
import {
    getAlpha3Codes,
    getName,
    alpha2ToAlpha3,
    getNames,
} from 'i18n-iso-countries';

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
    const countryNames = getNames('en');
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

    return (
        <>
            <div className={classes.root}>
                <FastField
                    variant="outlined"
                    data-testid="location.countryISO3"
                    className={classes.field}
                    name="location.countryISO3"
                    type="text"
                    label={<p>Country</p>}
                    component={Select}
                    isClearable="true"
                    sx={{ minWidth: '13rem' }}
                    onChange={(e: any) => {
                        setFieldValue(
                            'location.country',
                            getName(e.target.value, 'en'),
                        );
                    }}
                >
                    <MenuItem value={''}>
                        <em>None</em>
                    </MenuItem>
                    {Object.keys(countryNames).map((alpha2key) => {
                        const alpha3key = alpha2ToAlpha3(alpha2key);
                        return (
                            <MenuItem key={alpha3key} value={alpha3key}>
                                {countryNames[alpha2key]}
                            </MenuItem>
                        );
                    })}
                </FastField>
                <FastField
                    variant="outlined"
                    className={classes.field}
                    label="Region"
                    name="location.region"
                    type="text"
                    component={TextField}
                    sx={{ minWidth: '13rem' }}
                />
                <FastField
                    variant="outlined"
                    className={classes.field}
                    label="District"
                    name="location.district"
                    type="text"
                    component={TextField}
                    sx={{ minWidth: '13rem' }}
                />
                <FastField
                    variant="outlined"
                    className={classes.field}
                    label="Place (ex. City)"
                    name="location.place"
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
        </>
    );
}
