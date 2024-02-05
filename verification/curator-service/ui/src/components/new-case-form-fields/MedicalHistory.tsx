import React from 'react';
import clsx from 'clsx';
import Scroll from 'react-scroll';
import { FastField, useFormikContext } from 'formik';
import { TextField } from 'formik-mui';

import { Day0CaseFormValues, YesNo } from '../../api/models/Day0Case';
import FieldTitle from '../common-form-fields/FieldTitle';
import {
    DateField,
    FormikAutocomplete,
    SelectField,
} from '../common-form-fields/FormikFields';
import { useStyles } from './styled';
import { StyledTooltip } from './StyledTooltip';

const TooltipText = () => (
    <StyledTooltip>
        <ul>
            <li>
                <strong>Previous infection:</strong>
            </li>
            <li>
                <strong>Co-infection:</strong>
            </li>
            <li>
                <strong>Pre-Exsisting Conditions:</strong>
            </li>
            <li>
                <strong>Pregnacy Status:</strong>
            </li>
            <li>
                <strong>Vaccination:</strong>
            </li>
        </ul>
    </StyledTooltip>
);

export default function MedicalHistory(): JSX.Element {
    const globalClasses = useStyles();
    const { setFieldValue, values } = useFormikContext<Day0CaseFormValues>();

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
