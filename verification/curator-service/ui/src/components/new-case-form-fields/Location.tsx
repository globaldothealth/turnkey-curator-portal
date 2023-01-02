import { TextField } from 'formik-mui';

import { FastField, useFormikContext } from 'formik';
import makeStyles from '@mui/styles/makeStyles';
import { ParsedCase } from '../../api/models/Day0Case';
import { useEffect } from 'react';
import { getName } from 'i18n-iso-countries';

const styles = makeStyles(() => ({
    root: {
        display: 'flex',
        flexWrap: 'wrap',
        marginTop: '2rem',
    },
    field: {
        marginRight: '1em',
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
    const { values, setFieldValue } = useFormikContext<ParsedCase>();

    useEffect(() => {
        if (!values.geocodeLocation) return;

        const countryName = getName(values.geocodeLocation.country, 'en');

        console.log(values.geocodeLocation);
        setFieldValue('countryISO3', values.geocodeLocation.country);
        setFieldValue('country', countryName);
        setFieldValue(
            'city',
            values.geocodeLocation.administrativeAreaLevel2 || '',
        );
        setFieldValue(
            'location',
            values.geocodeLocation.administrativeAreaLevel3 || '',
        );
        // eslint-disable-next-line
    }, [values.geocodeLocation]);

    return (
        <div className={classes.root}>
            <FastField
                variant="outlined"
                className={classes.field}
                label="Country code"
                name="countryISO3"
                type="text"
                required
                component={TextField}
                sx={{ minWidth: '13rem' }}
            />
            <FastField
                variant="outlined"
                className={classes.field}
                label="Country"
                name="country"
                type="text"
                required
                component={TextField}
                sx={{ minWidth: '13rem' }}
            />
            <FastField
                variant="outlined"
                className={classes.field}
                label="City"
                name="city"
                type="text"
                component={TextField}
                sx={{ minWidth: '13rem' }}
            />
            <FastField
                variant="outlined"
                className={classes.field}
                label="Location"
                name="location"
                type="text"
                component={TextField}
                sx={{ minWidth: '13rem' }}
            />
        </div>
    );
}
