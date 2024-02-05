import React from 'react';
import clsx from 'clsx';
import Scroll from 'react-scroll';
import { FastField, useFormikContext } from 'formik';
import { TextField } from 'formik-mui';

import { Day0CaseFormValues, YesNo, Outcome } from '../../api/models/Day0Case';
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
                <strong>Symptoms:</strong>
            </li>
            <li>
                <strong>Date report:</strong>
            </li>
            <li>
                <strong>Date onset:</strong>
            </li>
            <li>
                <strong>Date confirmation:</strong>
            </li>
            <li>
                <strong>Confirmation method:</strong>
            </li>
            <li>
                <strong>Date of first consultation:</strong>
            </li>
            <li>
                <strong>Hospitalised:</strong>
            </li>
            <li>
                <strong>Intensive care:</strong>
            </li>
            <li>
                <strong>Home monitoring:</strong>
            </li>
            <li>
                <strong>Isolated:</strong>
            </li>
            <li>
                <strong>Outcome:</strong>
            </li>
        </ul>
    </StyledTooltip>
);

export default function ClinicalPresentation(): JSX.Element {
    const globalClasses = useStyles();
    const { setFieldValue, values, errors } =
        useFormikContext<Day0CaseFormValues>();

    return (
        <Scroll.Element name="clinicalPresentation">
            <FieldTitle
                title="Clinical Presentation"
                tooltip={<TooltipText />}
            />
            <div className={`${globalClasses.fieldRow}`}>
                <FormikAutocomplete
                    name={'symptoms'}
                    label={'Symptoms'}
                    initialValue={values.symptoms || undefined}
                    multiple
                    freeSolo
                    optionsLocation="https://raw.githubusercontent.com/globaldothealth/list/main/suggest/symptoms.txt"
                />
            </div>
            <DateField
                name="dateReport"
                label="Date report"
                value={values.vaccinationDate}
                onChange={(newValue) => {
                    if (newValue) {
                        setFieldValue('dateReport', newValue);
                    }
                }}
                errorMessage={errors.dateReport}
            />
            <DateField
                name="dateOnset"
                label="Date onset"
                value={values.vaccinationDate}
                onChange={(newValue) => {
                    if (newValue) {
                        setFieldValue('dateOnset', newValue);
                    }
                }}
            />
            <DateField
                name="dateConfirmation"
                label="Date confirmation"
                value={values.vaccinationDate}
                onChange={(newValue) => {
                    if (newValue) {
                        setFieldValue('dateConfirmation', newValue);
                    }
                }}
            />
            <div
                className={clsx([
                    globalClasses.fieldRow,
                    globalClasses.halfWidth,
                ])}
            >
                <FastField
                    name="confirmationMethod"
                    label="Confirmation method"
                    type="text"
                    component={TextField}
                    fullWidth
                />
            </div>
            <DateField
                name="dateOfFirstConsultation"
                label="Date of first consultation"
                value={values.vaccinationDate}
                onChange={(newValue) => {
                    if (newValue) {
                        setFieldValue('dateOfFirstConsultation', newValue);
                    }
                }}
            />
            <SelectField
                name="hospitalised"
                label="Hospitalised"
                values={Object.values(YesNo)}
            />
            {values.hospitalised === YesNo.Y && (
                <>
                    <div className={`${globalClasses.fieldRow}`}>
                        <FormikAutocomplete
                            name={'reasonForHospitalisation'}
                            label={'Reason for hospitalisation'}
                            initialValue={
                                values.reasonForHospitalisation || undefined
                            }
                            multiple
                            optionsList={['monitoring', 'treatement']}
                        />
                    </div>
                    <DateField
                        name="dateHospitalisation"
                        label="Date hospitalisation"
                        value={values.vaccinationDate}
                        onChange={(newValue) => {
                            if (newValue) {
                                setFieldValue('dateHospitalisation', newValue);
                            }
                        }}
                    />
                    <DateField
                        name="dateDischargeHospital"
                        label="Date discharge hospital"
                        value={values.vaccinationDate}
                        onChange={(newValue) => {
                            if (newValue) {
                                setFieldValue(
                                    'dateDischargeHospital',
                                    newValue,
                                );
                            }
                        }}
                    />
                </>
            )}
            <SelectField
                name="intensiveCare"
                label="Intensive care"
                values={Object.values(YesNo)}
            />
            {values.intensiveCare === YesNo.Y && (
                <>
                    <DateField
                        name="dateAdmissionICU"
                        label="Date admission ICU"
                        value={values.vaccinationDate}
                        onChange={(newValue) => {
                            if (newValue) {
                                setFieldValue('dateAdmissionICU', newValue);
                            }
                        }}
                    />
                    <DateField
                        name="dateDischargeICU"
                        label="Date discharge ICU"
                        value={values.vaccinationDate}
                        onChange={(newValue) => {
                            if (newValue) {
                                setFieldValue('dateDischargeICU', newValue);
                            }
                        }}
                    />
                </>
            )}
            <SelectField
                name="homeMonitoring"
                label="Home monitoring"
                values={Object.values(YesNo)}
            />
            <SelectField
                name="isolated"
                label="Isolated"
                values={Object.values(YesNo)}
            />
            {values.isolated === YesNo.Y && (
                <DateField
                    name="dateIsolation"
                    label="Date isolation"
                    value={values.vaccinationDate}
                    onChange={(newValue) => {
                        if (newValue) {
                            setFieldValue('dateIsolation', newValue);
                        }
                    }}
                />
            )}
            <SelectField
                name="outcome"
                label="Outcome"
                values={Object.values(Outcome)}
            />
            {values.outcome === Outcome.Death && (
                <DateField
                    name="dateDeath"
                    label="Date death"
                    value={values.vaccinationDate}
                    onChange={(newValue) => {
                        if (newValue) {
                            setFieldValue('dateDeath', newValue);
                        }
                    }}
                />
            )}
            {values.outcome === Outcome.Recovered && (
                <DateField
                    name="dateRecovered"
                    label="Date recovered"
                    value={values.vaccinationDate}
                    onChange={(newValue) => {
                        if (newValue) {
                            setFieldValue('dateRecovered', newValue);
                        }
                    }}
                />
            )}
        </Scroll.Element>
    );
}
