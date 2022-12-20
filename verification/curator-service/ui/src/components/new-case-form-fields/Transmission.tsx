import makeStyles from '@mui/styles/makeStyles';
import FieldTitle from '../common-form-fields/FieldTitle';
import { StyledTooltip } from './StyledTooltip';
import {
    FormikAutocomplete,
    SelectField,
} from '../common-form-fields/FormikFields';
import React from 'react';
import Scroll from 'react-scroll';
import axios from 'axios';
import { FastField, useFormikContext } from 'formik';
import { ParsedCase } from '../../api/models/Day0Case';
import { TextField } from 'formik-mui';
import { useStyles } from './styled';
import clsx from 'clsx';

const styles = makeStyles(() => ({
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
                <strong>Contact with case:</strong> Has the individual had
                contact with a confirmed/ probable/ suspected case (Y=Yes, N=No,
                NA=Not applicable)?
            </li>
            <li>
                <strong>Contact ID:</strong> If specified, is the case ID from
                which this patient contracted the virus.
            </li>
            {/* @TODO */}
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
            {/* @TODO */}
            <li>
                <strong>Transmission:</strong> Setting where contact occurred
                that led to transmission.
            </li>
        </ul>
    </StyledTooltip>
);

export default function Transmission(): JSX.Element {
    const { setFieldValue, initialValues, values } =
        useFormikContext<ParsedCase>();
    const [commonPlacesOfTransmission, setCommonPlacesOfTransmission] =
        React.useState([]);
    const classes = styles();
    const globalClasses = useStyles();

    React.useEffect(
        () => {
            axios
                .get('/api/cases/placesOfTransmission?limit=5')
                .then((response) =>
                    setCommonPlacesOfTransmission(
                        response.data.placesOfTransmission ?? [],
                    ),
                );
        },
        // Using [] here means this will only be called once at the beginning of the lifecycle
        [],
    );

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
