import { TextField } from 'formik-mui';

import { FastField, useFormikContext } from 'formik';
import makeStyles from '@mui/styles/makeStyles';
import { Day0CaseFormValues } from '../../api/models/Day0Case';
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
    const { values, setFieldValue } = useFormikContext<Day0CaseFormValues>();

    useEffect(() => {
        if (!values.location.geocodeLocation) return;

        const countryName = getName(
            values.location.geocodeLocation.country,
            'en',
        );

        setFieldValue(
            'location.countryISO2',
            values.location.geocodeLocation.country,
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
                className={classes.field}
                label="Country code"
                name="location.countryISO2"
                type="text"
                required
                component={TextField}
                sx={{ minWidth: '13rem' }}
            />
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
        </div>
    );
}
