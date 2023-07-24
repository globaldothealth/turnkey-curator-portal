import { DateField, SelectField } from '../common-form-fields/FormikFields';

import FieldTitle from '../common-form-fields/FieldTitle';
import { StyledTooltip } from './StyledTooltip';
import Scroll from 'react-scroll';
import { FastField, useFormikContext } from 'formik';
import { TextField } from 'formik-mui';
import { Outcome, Day0CaseFormValues } from '../../api/models/Day0Case';
import { useStyles } from './styled';
import clsx from 'clsx';

const yesNoUndefined = ['Y', 'N', 'NA'];

const outcomes = ['recovered', 'death'];

const TooltipText = () => (
    <StyledTooltip>
        <ul>
            <li>
                <strong>Confirmed case date:</strong> Enter the date the case
                was confirmed.
                <ul>
                    <li>
                        This is a required field so a date must be provided to
                        submit the entry.
                    </li>
                    <li>
                        If the data source does not provide a date for when the
                        case was confirmed, then the date of case reporting will
                        be used instead. If there is no date of confirmed case
                        please enter the date the source reports the case
                        instead.
                    </li>
                </ul>
            </li>
            <li>
                <strong>Method of confirmation:</strong> Provide the type of
                method used to confirm the case.
            </li>
            <li>
                <strong>Onset of symptoms date:</strong> Enter the date if
                reported for the onset of symptoms. Leave blank if not reported.
            </li>
            <li>
                <strong>First clinical consultation date:</strong> Enter the
                date of the first clinical consultation of any type reported by
                the patient.
                <ul>
                    <li>
                        This could be visiting a doctor or nurse or calling a
                        healthcare helpline to report their symptoms /
                        condition.
                    </li>
                    <li>
                        If no clinical consultation was sought, or the source
                        does not provide any details, leave blank.
                    </li>
                </ul>
            </li>
            <li>
                <strong>Home monitoring:</strong> Enter if the case was home
                monitoring.
            </li>
            <li>
                <strong>Isolated:</strong> Enter if the case went into
                isolation.
            </li>
            <li>
                <strong>Isolation date:</strong> Enter the date the case was
                isolated.
            </li>
            <li>
                <strong>Hospital admission:</strong> Enter if the case was
                admitted to hospital.
            </li>
            <li>
                <strong>Hospital admission date:</strong> Enter the date the
                case was admitted to hospital
            </li>
            <li>
                <strong>Hospital discharge date:</strong> Enter the date the
                case was discharged from hospital.
            </li>
            <li>
                <strong>Intensive care:</strong> Enter if the case was in
                intensive care.
            </li>
            <li>
                <strong>ICU admission date:</strong> Enter the date the case was
                admitted to ICU.
            </li>
            <li>
                <strong>ICU discharge date:</strong> Enter the date the case was
                discharged from hospital.
            </li>
            <li>
                <strong>Outcome:</strong> Enter the outcome of the case.
            </li>
            <li>
                <strong>Date of death:</strong> Enter the date the case died.
            </li>
            <li>
                <strong>Date of recovery:</strong> Enter the date the case
                recovered.
            </li>
        </ul>
    </StyledTooltip>
);

export default function Events(): JSX.Element {
    const { values, setFieldValue } = useFormikContext<Day0CaseFormValues>();
    const classes = useStyles();

    return (
        <Scroll.Element name="events">
            <FieldTitle
                title="Events"
                interactive
                widetooltip
                tooltip={<TooltipText />}
            />
            <DateField
                name="events.dateEntry"
                label="Entry date"
                value={values.events.dateEntry}
                onChange={(newValue) => {
                    if (newValue) {
                        setFieldValue('events.dateEntry', newValue);
                    }
                }}
                required
            />
            <DateField
                name="events.dateConfirmation"
                label="Confirmed case date"
                value={values.events.dateConfirmation}
                onChange={(newValue) => {
                    if (newValue) {
                        setFieldValue('events.dateConfirmation', newValue);
                    }
                }}
            />
            <div className={clsx([classes.fieldRow, classes.halfWidth])}>
                <FastField
                    name="events.confirmationMethod"
                    label="Method of confirmation"
                    type="text"
                    component={TextField}
                    fullWidth
                />
            </div>
            <DateField
                name="events.dateOnset"
                label="Onset of symptoms date"
                value={values.events.dateOnset}
                onChange={(newValue) => {
                    if (newValue) {
                        setFieldValue('events.dateOnset', newValue);
                    }
                }}
            />
            <DateField
                name="events.dateOfFirstConsult"
                label="First clinical consultation date"
                value={values.events.dateOfFirstConsult}
                onChange={(newValue) => {
                    if (newValue) {
                        setFieldValue('events.dateOfFirstConsult', newValue);
                    }
                }}
            />
            <SelectField
                name="events.homeMonitoring"
                label="Home monitoring"
                values={yesNoUndefined}
            />
            <SelectField
                name="events.isolated"
                label="Isolated"
                values={yesNoUndefined}
            />
            {values.events.isolated === 'Y' && (
                <DateField
                    name="events.dateIsolation"
                    label="Date of isolation"
                    value={values.events.dateIsolation}
                    onChange={(newValue) => {
                        if (newValue) {
                            setFieldValue('events.dateIsolation', newValue);
                        }
                    }}
                />
            )}
            <SelectField
                name="events.hospitalized"
                label="Hospital admission"
                values={yesNoUndefined}
            />
            {values.events.hospitalized === 'Y' && (
                <>
                    <DateField
                        name="events.dateHospitalization"
                        label="Hospital admission date"
                        value={values.events.dateHospitalization}
                        onChange={(newValue) => {
                            if (newValue) {
                                setFieldValue(
                                    'events.dateHospitalization',
                                    newValue,
                                );
                            }
                        }}
                    />
                    <DateField
                        name="events.dateDischargeHospital"
                        label="Hospital discharge date"
                        value={values.events.dateDischargeHospital}
                        onChange={(newValue) => {
                            if (newValue) {
                                setFieldValue(
                                    'events.dateDischargeHospital',
                                    newValue,
                                );
                            }
                        }}
                    />
                </>
            )}
            <SelectField
                name="events.intensiveCare"
                label="Intensive care"
                values={yesNoUndefined}
            />
            {values.events.intensiveCare === 'Y' && (
                <>
                    <DateField
                        name="events.dateAdmissionICU"
                        label="ICU admission date"
                        value={values.events.dateAdmissionICU}
                        onChange={(newValue) => {
                            if (newValue) {
                                setFieldValue(
                                    'events.dateAdmissionICU',
                                    newValue,
                                );
                            }
                        }}
                    />
                    <DateField
                        name="events.dateDischargeICU"
                        label="ICU discharge date"
                        value={values.events.dateDischargeICU}
                        onChange={(newValue) => {
                            if (newValue) {
                                setFieldValue(
                                    'events.dateDischargeICU',
                                    newValue,
                                );
                            }
                        }}
                    />
                </>
            )}
            <SelectField
                name="events.outcome"
                label="Outcome"
                values={outcomes}
            />
            {values.events.outcome === Outcome.Recovered && (
                <DateField
                    name="events.dateRecovered"
                    label="Date of recovery"
                    value={values.events.dateRecovered}
                    onChange={(newValue) => {
                        if (newValue) {
                            setFieldValue('events.dateRecovered', newValue);
                        }
                    }}
                />
            )}
            {values.events.outcome === Outcome.Death && (
                <DateField
                    name="events.dateDeath"
                    label="Date of death"
                    value={values.events.dateDeath}
                    onChange={(newValue) => {
                        if (newValue) {
                            setFieldValue('events.dateDeath', newValue);
                        }
                    }}
                />
            )}
        </Scroll.Element>
    );
}
