import { DateField, SelectField } from '../common-form-fields/FormikFields';
import { FastField, useFormikContext } from 'formik';

import FieldTitle from '../common-form-fields/FieldTitle';
import { StyledTooltip } from './StyledTooltip';
import Scroll from 'react-scroll';
import makeStyles from '@mui/styles/makeStyles';
import { ParsedCase } from '../../api/models/Day0Case';
import { format } from 'date-fns';
import { TextField } from 'formik-mui';
import { useStyles } from './styled';
import clsx from 'clsx';
import { toUTCDate } from '../util/date';

const styles = makeStyles(() => ({
    travelLocationTitle: {
        alignItems: 'center',
        display: 'flex',
    },
    spacer: {
        flex: '1',
    },
    fieldRow: {
        marginBottom: '2em',
    },
    fieldRowTop: {
        marginTop: '2em',
    },
}));

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
    const { values, initialValues, setValues } = useFormikContext<ParsedCase>();
    const classes = styles();
    const globalClasses = useStyles();

    return (
        <Scroll.Element name="travelHistory">
            <FieldTitle title="Travel History" tooltip={<TooltipText />} />
            <SelectField
                name="travelHistory"
                label="Travel history"
                values={hasTravelledValues}
            />
            {values.travelHistory === 'Y' && (
                <>
                    <DateField
                        name="travelHistoryEntry"
                        label="Travel history entry"
                        value={values.travelHistoryEntry}
                        onChange={(newValue) => {
                            setValues({
                                ...values,
                                travelHistoryEntry: toUTCDate(
                                    newValue
                                        ? newValue.toDateString()
                                        : undefined,
                                ),
                            });
                        }}
                    />
                    <div
                        className={clsx([
                            globalClasses.fieldRow,
                            globalClasses.halfWidth,
                        ])}
                    >
                        <FastField
                            name="travelHistoryStart"
                            type="text"
                            label="Travel history start"
                            component={TextField}
                            fullWidth
                        />
                    </div>
                    <div
                        className={clsx([
                            globalClasses.fieldRow,
                            globalClasses.halfWidth,
                        ])}
                    >
                        <FastField
                            name="travelHistoryLocation"
                            type="text"
                            label="Travel history location"
                            component={TextField}
                            fullWidth
                        />
                    </div>
                    <div
                        className={clsx([
                            globalClasses.fieldRow,
                            globalClasses.halfWidth,
                        ])}
                    >
                        <FastField
                            name="travelHistoryCountry"
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
