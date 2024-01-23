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
import {
    Gender,
    Day0CaseFormValues,
    CaseStatus,
    PathogenStatus,
    YesNo,
    SexAtBirth,
    Race,
    Ethnicity,
} from '../../api/models/Day0Case';
import { useStyles } from './styled';
import clsx from 'clsx';
import enLocaleNationalities from 'i18n-nationality/langs/en.json';
import nationalities from 'i18n-nationality';

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

export default function CaseDemographics(): JSX.Element {
    const classes = styles();
    const globalClasses = useStyles();
    const { initialValues, setFieldValue, values } =
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

    nationalities.registerLocale(enLocaleNationalities);
    console.log(Object.values(nationalities.getNames('en')));

    return (
        <Scroll.Element name="caseDemographics">
            <FieldTitle title="Case Demographics" tooltip={<TooltipText />} />
            <SelectField
                name="caseStatus"
                label="Case Status"
                values={Object.values(CaseStatus)}
            />
            <SelectField
                name="pathogenStatus"
                label="Pathogen Status"
                values={Object.values(PathogenStatus)}
            />
            <div
                className={`${globalClasses.fieldRow} ${classes.ageRow} ${globalClasses.halfWidth}`}
            >
                <FastField
                    className={classes.ageField}
                    name="minAge"
                    type="number"
                    label="Min age"
                    component={TextField}
                />
                <span className={classes.ageSeparator}>to</span>
                <FastField
                    className={classes.ageField}
                    name="maxAge"
                    type="number"
                    label="Max age"
                    component={TextField}
                />
                <span className={classes.ageSeparator}>or</span>
                <FastField
                    className={classes.ageField}
                    name="age"
                    type="number"
                    label="Age"
                    component={TextField}
                />
            </div>

            <SelectField
                name="sexAtBirth"
                label="Sex at birth"
                values={Object.values(SexAtBirth)}
            />
            {values.sexAtBirth === SexAtBirth.Other && (
                <div
                    className={clsx([
                        globalClasses.fieldRow,
                        globalClasses.halfWidth,
                    ])}
                >
                    <FastField
                        name="sexAtBirthOther"
                        label="Sex at birth other"
                        type="text"
                        component={TextField}
                        fullWidth
                    />
                </div>
            )}

            <SelectField
                name="gender"
                label="Gender"
                values={Object.values(Gender)}
            />
            {values.gender === Gender.Other && (
                <div
                    className={clsx([
                        globalClasses.fieldRow,
                        globalClasses.halfWidth,
                    ])}
                >
                    <FastField
                        name="genderOther"
                        label="Gender other"
                        type="text"
                        component={TextField}
                        fullWidth
                    />
                </div>
            )}

            <SelectField
                name="race"
                label="Race"
                values={Object.values(Race)}
            />
            {values.race === Race.Other && (
                <div
                    className={clsx([
                        globalClasses.fieldRow,
                        globalClasses.halfWidth,
                    ])}
                >
                    <FastField
                        name="raceOther"
                        label="Race other"
                        type="text"
                        component={TextField}
                        fullWidth
                    />
                </div>
            )}

            <SelectField
                name="ethnicity"
                label="Ethnicity"
                values={Object.values(Ethnicity)}
            />
            {values.ethnicity === Ethnicity.Other && (
                <div
                    className={clsx([
                        globalClasses.fieldRow,
                        globalClasses.halfWidth,
                    ])}
                >
                    <FastField
                        name="ethnicityOther"
                        label="Ethnicity other"
                        type="text"
                        component={TextField}
                        fullWidth
                    />
                </div>
            )}

            <SelectField
                name="nationality"
                label="Nationality"
                values={[
                    ...Object.values(nationalities.getNames('en')).sort(),
                    'Other',
                ]}
            />
            {values.nationality === 'Other' && (
                <div
                    className={clsx([
                        globalClasses.fieldRow,
                        globalClasses.halfWidth,
                    ])}
                >
                    <FastField
                        name="nationalityOther"
                        label="Nationality other"
                        type="text"
                        component={TextField}
                        fullWidth
                    />
                </div>
            )}

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
                                                'occupation',
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
                    name="occupation"
                    label="Occupation"
                    initialValue={initialValues.occupation}
                    multiple={false}
                    freeSolo
                    optionsLocation="https://raw.githubusercontent.com/globaldothealth/list/main/suggest/occupations.txt"
                />
            </div>
            <SelectField
                name="demographics.healthcareWorker"
                label="Healthcare worker"
                values={Object.values(YesNo)}
            />
        </Scroll.Element>
    );
}
