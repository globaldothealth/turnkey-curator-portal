import React from 'react';
import { FastField, useFormikContext } from 'formik';
import {
    DateField,
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

export default function MedicalHistory(): JSX.Element {
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
        <Scroll.Element name="medicalHistory">
            <FieldTitle title="Medical History" tooltip={<TooltipText />} />
            <SelectField
                name="previousInfection"
                label="Previous Infection"
                values={Object.values(YesNo)}
            />
            <div className={clsx([globalClasses.fieldRow])}>
                <FormikAutocomplete
                    name={'coInfection'}
                    label={'Co-Infection'}
                    initialValue={undefined}
                    multiple
                    freeSolo
                    // optionsLocation="https://raw.githubusercontent.com/globaldothealth/list/main/suggest/symptoms.txt" // TODO unmock this
                />
            </div>
            <div className={clsx([globalClasses.fieldRow])}>
                <FormikAutocomplete
                    name={'preExistingConditions'}
                    label={'Pre-Existing Conditions'}
                    initialValue={undefined}
                    multiple
                    freeSolo
                    // optionsLocation="https://raw.githubusercontent.com/globaldothealth/list/main/suggest/symptoms.txt" // TODO unmock this
                />
            </div>
            <SelectField
                name="pregnancyStatus"
                label="Pregnancy Status"
                values={Object.values(YesNo)}
            />
            <SelectField
                name="vaccination"
                label="Vaccination"
                values={Object.values(YesNo)}
            />
            {values.vaccination === YesNo.Y && (
                <>
                    <div
                        className={clsx([
                            globalClasses.fieldRow,
                            globalClasses.halfWidth,
                        ])}
                    >
                        <FastField
                            name="vaccineName"
                            label="Vaccine Name"
                            type="text"
                            component={TextField}
                            fullWidth
                        />
                    </div>
                    <DateField
                        name="vaccinationDate"
                        label="Vaccination date"
                        value={values.vaccinationDate}
                        onChange={(newValue) => {
                            if (newValue) {
                                setFieldValue('vaccinationDate', newValue);
                            }
                        }}
                    />
                    <div className={clsx([globalClasses.fieldRow])}>
                        <FormikAutocomplete
                            name={'vaccinationSideEffects'}
                            label={'Vaccination Side Effects'}
                            initialValue={undefined}
                            multiple
                            freeSolo
                            // optionsLocation="https://raw.githubusercontent.com/globaldothealth/list/main/suggest/symptoms.txt" // TODO unmock this
                        />
                    </div>
                </>
            )}
        </Scroll.Element>
    );
}
