import clsx from 'clsx';
import { FastField, useFormikContext } from 'formik';
import { TextField } from 'formik-mui';
import Scroll from 'react-scroll';

import { Day0CaseFormValues } from '../../api/models/Day0Case';
import { DateField, SelectField } from '../common-form-fields/FormikFields';
import FieldTitle from '../common-form-fields/FieldTitle';
import { useStyles } from './styled';
import { StyledTooltip } from './StyledTooltip';

const hasTravelledValues = ['Y', 'N', 'NA'];

const TooltipText = () => (
    <StyledTooltip>
        <ul>
            <li>
                <strong>Travel history:</strong> Whether individual has travel
                history, domestic and/or international (Y=Yes, N=No, NA=Not
                applicable).
                <ul>
                    <li>
                        If you select yes then you will be able to fill in more
                        details as to the location and details of the travel.{' '}
                    </li>
                    <li>
                        If the source does not provide information on if the
                        case traveled select unknown.
                    </li>
                </ul>
            </li>
            <li>
                <strong>Travel history entry:</strong> Date when individual
                entered the country.
            </li>
            <li>
                <strong>Travel history start:</strong> Free text describing
                travel.
            </li>
            <li>
                <strong>Travel history location:</strong> Last known location
                where individual had travelled from.
            </li>
            <li>
                <strong>Travel history country:</strong> Last known country
                where individual had travelled from.
            </li>
        </ul>
    </StyledTooltip>
);

export default function TravelHistory(): JSX.Element {
    const { values, setValues } = useFormikContext<Day0CaseFormValues>();
    const { classes } = useStyles();

    return (
        <Scroll.Element name="travelHistory">
            <FieldTitle title="Travel History" tooltip={<TooltipText />} />
            <SelectField
                name="travelHistory.travelHistory"
                label="Travel history"
                values={hasTravelledValues}
            />
            {values.travelHistory.travelHistory === 'Y' && (
                <>
                    <DateField
                        name="travelHistory.travelHistoryEntry"
                        label="Travel history entry"
                        value={values.travelHistory.travelHistoryEntry}
                        onChange={(newValue) => {
                            setValues({
                                ...values,
                                travelHistory: {
                                    ...values.travelHistory,
                                    travelHistoryEntry:
                                        newValue || null,
                                },
                            });
                        }}
                    />
                    <div
                        className={clsx([classes.fieldRow, classes.halfWidth])}
                    >
                        <FastField
                            name="travelHistory.travelHistoryStart"
                            type="text"
                            label="Travel history start"
                            component={TextField}
                            fullWidth
                        />
                    </div>
                    <div
                        className={clsx([classes.fieldRow, classes.halfWidth])}
                    >
                        <FastField
                            name="travelHistory.travelHistoryLocation"
                            type="text"
                            label="Travel history location"
                            component={TextField}
                            fullWidth
                        />
                    </div>
                    <div
                        className={clsx([classes.fieldRow, classes.halfWidth])}
                    >
                        <FastField
                            name="travelHistory.travelHistoryCountry"
                            type="text"
                            label="Travel history country"
                            component={TextField}
                            fullWidth
                        />
                    </div>
                </>
            )}
        </Scroll.Element>
    );
}
