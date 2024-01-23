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
    ContactSetting,
    ContactAnimal,
    Transmission,
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

export default function Exposure(): JSX.Element {
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
        <Scroll.Element name="exposure">
            <FieldTitle title="Exposure" tooltip={<TooltipText />} />
            <SelectField
                name="contactWithCase"
                label="Contact with case"
                values={Object.values(YesNo)}
            />
            {values.contactWithCase === YesNo.Y && (
                <>
                    <div
                        className={clsx([
                            globalClasses.fieldRow,
                            globalClasses.halfWidth,
                        ])}
                    >
                        <FastField
                            name="contactID"
                            label="Contact ID"
                            type="text"
                            component={TextField}
                            fullWidth
                        />
                    </div>
                    <SelectField
                        name="contactSetting"
                        label="Contact setting"
                        values={Object.values(ContactSetting)}
                    />
                    {values.contactSetting === ContactSetting.Other && (
                        <div
                            className={clsx([
                                globalClasses.fieldRow,
                                globalClasses.halfWidth,
                            ])}
                        >
                            <FastField
                                name="contactSettingOther"
                                label="Contact setting other"
                                type="text"
                                component={TextField}
                                fullWidth
                            />
                        </div>
                    )}
                    <SelectField
                        name="contactAnimal"
                        label="Contact Animal"
                        values={Object.values(ContactAnimal)}
                    />
                    <div
                        className={clsx([
                            globalClasses.fieldRow,
                            globalClasses.halfWidth,
                        ])}
                    >
                        <FastField
                            name="contactComment"
                            label="Contact comment"
                            type="text"
                            component={TextField}
                            fullWidth
                        />
                    </div>
                </>
            )}
            <SelectField
                name="transmission"
                label="Transmission"
                values={Object.values(Transmission)}
            />
            <SelectField
                name="travelHistory"
                label="Travel history"
                values={Object.values(YesNo)}
            />
            {values.travelHistory === YesNo.Y && (
                <>
                    <DateField
                        name="travelHistoryEntry"
                        label="Travel history entry"
                        value={values.vaccinationDate}
                        onChange={(newValue) => {
                            if (newValue) {
                                setFieldValue('travelHistoryEntry', newValue);
                            }
                        }}
                    />
                    <DateField
                        name="travelHistoryStart"
                        label="Travel history start"
                        value={values.vaccinationDate}
                        onChange={(newValue) => {
                            if (newValue) {
                                setFieldValue('travelHistoryStart', newValue);
                            }
                        }}
                    />
                    <p>Location</p>
                </>
            )}
        </Scroll.Element>
    );
}
