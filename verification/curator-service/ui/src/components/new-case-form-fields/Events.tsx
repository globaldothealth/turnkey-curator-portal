import { DateField, SelectField } from '../common-form-fields/FormikFields';

import FieldTitle from '../common-form-fields/FieldTitle';
import { StyledTooltip } from './StyledTooltip';
import Scroll from 'react-scroll';
import { FastField, useFormikContext } from 'formik';
import { TextField } from 'formik-mui';
import { Outcome, ParsedCase } from '../../api/models/Day0Case';
import { format } from 'date-fns';
import { useStyles } from './styled';
import clsx from 'clsx';
import { toUTCDate } from '../util/date';

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
    const { values, setFieldValue } = useFormikContext<ParsedCase>();
    const classes = useStyles();

    console.log(values);

    return (
        <Scroll.Element name="events">
            <FieldTitle
                title="Events"
                interactive
                widetooltip
                tooltip={<TooltipText />}
            />
            <DateField
                name="confirmationDate"
                label="Confirmed case date"
                value={values.confirmationDate}
                onChange={(newValue) => {
                    setFieldValue(
                        'confirmationDate',
                        toUTCDate(
                            newValue ? newValue.toDateString() : undefined,
                        ),
                    );
                }}
            />
            <div className={clsx([classes.fieldRow, classes.halfWidth])}>
                <FastField
                    name="confirmationMethod"
                    label="Method of confirmation"
                    type="text"
                    component={TextField}
                    fullWidth
                />
            </div>
            <DateField
                name="symptomsOnsetDate"
                label="Onset of symptoms date"
                value={values.symptomsOnsetDate}
                onChange={(newValue) => {
                    setFieldValue(
                        'symptomsOnsetDate',
                        toUTCDate(
                            newValue ? newValue.toDateString() : undefined,
                        ),
                    );
                }}
            />
            <DateField
                name="firstConsultDate"
                label="First clinical consultation date"
                value={values.firstConsultDate}
                onChange={(newValue) => {
                    setFieldValue(
                        'firstConsultDate',
                        toUTCDate(
                            newValue ? newValue.toDateString() : undefined,
                        ),
                    );
                }}
            />
            <SelectField
                name="homeMonitoring"
                label="Home monitoring"
                values={yesNoUndefined}
            />
            <SelectField
                name="isolated"
                label="Isolated"
                values={yesNoUndefined}
            />
            {values.isolated === 'Y' && (
                <DateField
                    name="isolationDate"
                    label="Date of isolation"
                    value={values.isolationDate}
                    onChange={(newValue) => {
                        setFieldValue(
                            'isolationDate',
                            toUTCDate(
                                newValue ? newValue.toDateString() : undefined,
                            ),
                        );
                    }}
                />
            )}
            <SelectField
                name="hospitalized"
                label="Hospital admission"
                values={yesNoUndefined}
            />
            {values.hospitalized === 'Y' && (
                <>
                    <DateField
                        name="hospitalizationDate"
                        label="Hospital admission date"
                        value={values.hospitalizationDate}
                        onChange={(newValue) => {
                            setFieldValue(
                                'hospitalAdmissionDate',
                                toUTCDate(
                                    newValue
                                        ? newValue.toDateString()
                                        : undefined,
                                ),
                            );
                        }}
                    />
                    <DateField
                        name="hospitalDischargeDate"
                        label="Hospital discharge date"
                        value={values.hospitalDischargeDate}
                        onChange={(newValue) => {
                            setFieldValue(
                                'hospitalDischargeDate',
                                toUTCDate(
                                    newValue
                                        ? newValue.toDateString()
                                        : undefined,
                                ),
                            );
                        }}
                    />
                </>
            )}
            <SelectField
                name="intensiveCare"
                label="Intensive care"
                values={yesNoUndefined}
            />
            {values.intensiveCare === 'Y' && (
                <>
                    <DateField
                        name="ICUAdmissionDate"
                        label="ICU admission date"
                        value={values.ICUAdmissionDate}
                        onChange={(newValue) => {
                            setFieldValue(
                                'ICUAdmissionDate',
                                toUTCDate(
                                    newValue
                                        ? newValue.toDateString()
                                        : undefined,
                                ),
                            );
                        }}
                    />
                    <DateField
                        name="ICUDischargeDate"
                        label="ICU discharge date"
                        value={values.ICUDischargeDate}
                        onChange={(newValue) => {
                            setFieldValue(
                                'ICUDischargeDate',
                                toUTCDate(
                                    newValue
                                        ? newValue.toDateString()
                                        : undefined,
                                ),
                            );
                        }}
                    />
                </>
            )}
            <SelectField name="outcome" label="Outcome" values={outcomes} />
            {values.outcome === Outcome.Recovered && (
                <DateField
                    name="recoveredDate"
                    label="Date of recovery"
                    value={values.recoveredDate}
                    onChange={(newValue) => {
                        setFieldValue(
                            'recoveredDate',
                            toUTCDate(
                                newValue ? newValue.toDateString() : undefined,
                            ),
                        );
                    }}
                />
            )}
            {values.outcome === Outcome.Death && (
                <DateField
                    name="deathDate"
                    label="Date of death"
                    value={values.deathDate}
                    onChange={(newValue) => {
                        setFieldValue(
                            'deathDate',
                            toUTCDate(
                                newValue ? newValue.toDateString() : undefined,
                            ),
                        );
                    }}
                />
            )}
        </Scroll.Element>
    );
}
