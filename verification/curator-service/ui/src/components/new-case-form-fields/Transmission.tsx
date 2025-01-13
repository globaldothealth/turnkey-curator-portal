import clsx from 'clsx';
import { FastField, useFormikContext } from 'formik';
import { TextField } from 'formik-mui';
import Scroll from 'react-scroll';

import { Day0CaseFormValues, YesNo } from '../../api/models/Day0Case';
import FieldTitle from '../common-form-fields/FieldTitle';
import {
    FormikAutocomplete,
    SelectField,
} from '../common-form-fields/FormikFields';
import { useStyles } from './styled';
import { StyledTooltip } from './StyledTooltip';

const TooltipText = () => (
    <StyledTooltip>
        <ul>
            <li>
                <strong>Contact with case:</strong> Has the individual had
                contact with a confirmed/ probable/ suspected case (Y=Yes, N=No,
                NA=Not applicable)?
            </li>
            <li>
                <strong>Contact ID:</strong> If specified, is the case ID from
                which this patient contracted the virus.
            </li>
            <li>
                <strong>Contact setting:</strong> Setting where contact occurred
                that led to transmission.
            </li>
            <li>
                <strong>Contact animal:</strong> Whether the individual has
                known contact with animals.
            </li>
            <li>
                <strong>Contact comment:</strong> Free text describing any
                additional contact information.
            </li>
            <li>
                <strong>Transmission:</strong> Setting where contact occurred
                that led to transmission.
            </li>
        </ul>
    </StyledTooltip>
);

export default function Transmission(): JSX.Element {
    const { initialValues } = useFormikContext<Day0CaseFormValues>();
    const { classes } = useStyles();

    return (
        <Scroll.Element name="transmission">
            <FieldTitle title="Transmission" tooltip={<TooltipText />} />
            <SelectField
                name="transmission.contactWithCase"
                label="Contact with case"
                values={Object.values(YesNo)}
            />
            <div className={clsx([classes.fieldRow, classes.halfWidth])}>
                <FastField
                    name="transmission.contactId"
                    type="text"
                    label="Contact ID"
                    component={TextField}
                    fullWidth
                />
            </div>
            <div className={clsx([classes.fieldRow, classes.halfWidth])}>
                <FastField
                    name="transmission.contactSetting"
                    type="text"
                    label="Contact setting"
                    component={TextField}
                    fullWidth
                />
            </div>
            <div className={clsx([classes.fieldRow, classes.halfWidth])}>
                <FastField
                    name="transmission.contactAnimal"
                    type="text"
                    label="Contact animal"
                    component={TextField}
                    fullWidth
                />
            </div>
            <div className={clsx([classes.fieldRow, classes.halfWidth])}>
                <FastField
                    name="transmission.contactComment"
                    type="text"
                    label="Contact comment"
                    component={TextField}
                    fullWidth
                />
            </div>
            <div className={classes.fieldRow}>
                <FormikAutocomplete
                    name="transmissionHelper"
                    freeSolo
                    label="Transmission"
                    multiple={false}
                    initialValue={initialValues.transmission.transmission}
                    optionsLocation="https://raw.githubusercontent.com/globaldothealth/list/main/suggest/route_of_transmission.txt"
                />
            </div>
        </Scroll.Element>
    );
}
