import React from 'react';
import { FastField, useFormikContext } from 'formik';
import {
    FormikAutocomplete,
    SelectField,
} from '../common-form-fields/FormikFields';

import { Chip } from '@mui/material';
import FieldTitle from '../common-form-fields/FieldTitle';
import Scroll from 'react-scroll';
import { TextField } from 'formik-mui';
import { StyledTooltip } from './StyledTooltip';
import axios from 'axios';
import makeStyles from '@mui/styles/makeStyles';
import { Gender, Day0CaseFormValues } from '../../api/models/Day0Case';
import { useStyles } from './styled';

const styles = makeStyles(() => ({
    ageRow: {
        alignItems: 'baseline',
        display: 'flex',
    },
    ageField: {
        width: '8em',
    },
    ageSeparator: {
        margin: '0 2em',
    },
    select: {
        width: '8em',
    },
    chip: {
        margin: '0.5em',
    },
    section: {
        marginBottom: '1em',
    },
}));

const TooltipText = () => (
    <StyledTooltip>
        <ul>
            <li>
                <strong>Gender:</strong> Enter the Gender of the case provided.
                If no gender is provided select Unknown.
            </li>
            <li>
                <strong>Age:</strong> Enter the age of the case.
                <ul>
                    <li>
                        To reduce the risk of identifying an individual from
                        their case record, the age will automatically be
                        converted into one or more bucketed groups: infants
                        (&lt;1 year), 1-5 years, 6-10 years, and so on.
                    </li>
                    <li>
                        If a range is provided enter in the min and max fields.
                    </li>
                    <li>
                        If an exact age is provided enter it in the age field.
                    </li>
                    <li>
                        Note: If the data source provides an age range such as
                        65{'>'} or 65+ then set the minimum age value as 65 and
                        the maximum age value to 120 (the maximum allowed age
                        value).
                    </li>
                </ul>
            </li>
            <li>
                <strong>Occupation:</strong> Enter the Occupation of the case.
                If no data is provided leave blank.
            </li>
            <li>
                <strong>Healthcare worker:</strong> Choose whether the case is a
                healthcare worker
            </li>
        </ul>
    </StyledTooltip>
);

export default function Demographics(): JSX.Element {
    const classes = styles();
    const globalClasses = useStyles();
    const { initialValues, setFieldValue } =
        useFormikContext<Day0CaseFormValues>();
    const [commonOccupations, setCommonOccupations] = React.useState([]);

    React.useEffect(
        () => {
            axios
                .get('/api/cases/occupations?limit=10')
                .then((response) =>
                    setCommonOccupations(response.data.occupations ?? []),
                );
        },
        // Using [] here means this will only be called once at the beginning of the lifecycle
        [],
    );

    return (
        <Scroll.Element name="demographics">
            <FieldTitle title="Demographics" tooltip={<TooltipText />} />
            <SelectField
                name="demographics.gender"
                label="Gender"
                values={Object.values(Gender)}
            />
            <div className={`${globalClasses.fieldRow} ${classes.ageRow}`}>
                <FastField
                    className={classes.ageField}
                    name="demographics.minAge"
                    type="number"
                    label="Min age"
                    component={TextField}
                />
                <span className={classes.ageSeparator}>to</span>
                <FastField
                    className={classes.ageField}
                    name="demographics.maxAge"
                    type="number"
                    label="Max age"
                    component={TextField}
                />
                <span className={classes.ageSeparator}>or</span>
                <FastField
                    className={classes.ageField}
                    name="demographics.age"
                    type="number"
                    label="Age"
                    component={TextField}
                />
            </div>
            {commonOccupations.length > 0 && (
                <>
                    <div className={classes.section}>
                        Frequently added occupations
                    </div>
                    <div className={classes.section}>
                        {commonOccupations.map(
                            (occupation) =>
                                occupation && (
                                    <Chip
                                        key={occupation}
                                        className={classes.chip}
                                        label={occupation}
                                        onClick={(): void =>
                                            setFieldValue(
                                                'demographics.occupation',
                                                occupation,
                                            )
                                        }
                                    />
                                ),
                        )}
                    </div>
                </>
            )}
            <div className={globalClasses.fieldRow}>
                <FormikAutocomplete
                    name="demographics.occupation"
                    label="Occupation"
                    initialValue={initialValues.demographics.occupation}
                    multiple={false}
                    freeSolo
                    optionsLocation="https://raw.githubusercontent.com/globaldothealth/list/main/suggest/occupations.txt"
                />
            </div>
            <SelectField
                name="demographics.healthcareWorker"
                label="Healthcare worker"
                values={['Y', 'N', 'NA']}
            />
        </Scroll.Element>
    );
}
