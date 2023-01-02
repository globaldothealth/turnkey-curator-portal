import FieldTitle from '../common-form-fields/FieldTitle';
import { StyledTooltip } from './StyledTooltip';
import {
    FormikAutocomplete,
    SelectField,
} from '../common-form-fields/FormikFields';
import Scroll from 'react-scroll';
import { FastField, useFormikContext } from 'formik';
import { ParsedCase } from '../../api/models/Day0Case';
import { TextField } from 'formik-mui';
import { useStyles } from './styled';
import clsx from 'clsx';

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
    const { initialValues } = useFormikContext<ParsedCase>();
    const globalClasses = useStyles();

    return (
        <Scroll.Element name="transmission">
            <FieldTitle title="Transmission" tooltip={<TooltipText />} />
            <SelectField
                name="contactWithCase"
                label="Contact with case"
                values={['Y', 'N', 'NA']}
            />
            <div
                className={clsx([
                    globalClasses.fieldRow,
                    globalClasses.halfWidth,
                ])}
            >
                <FastField
                    name="contactID"
                    type="text"
                    label="Contact ID"
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
                    name="contactSetting"
                    type="text"
                    label="Contact setting"
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
                    name="contactAnimal"
                    type="text"
                    label="Contact animal"
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
                    name="contactComment"
                    type="text"
                    label="Contact comment"
                    component={TextField}
                    fullWidth
                />
            </div>
            <div className={globalClasses.fieldRow}>
                <FormikAutocomplete
                    name="transmission"
                    freeSolo
                    label="Transmission"
                    multiple={false}
                    initialValue={initialValues.transmission}
                    optionsLocation="https://raw.githubusercontent.com/globaldothealth/list/main/suggest/route_of_transmission.txt"
                />
            </div>
        </Scroll.Element>
    );
}
