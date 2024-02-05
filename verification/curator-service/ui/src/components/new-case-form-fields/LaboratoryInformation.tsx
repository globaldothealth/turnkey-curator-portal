import React from 'react';
import clsx from 'clsx';
import Scroll from 'react-scroll';
import { FastField } from 'formik';
import { TextField } from 'formik-mui';

import FieldTitle from '../common-form-fields/FieldTitle';
import { useStyles } from './styled';
import { StyledTooltip } from './StyledTooltip';

const TooltipText = () => (
    <StyledTooltip>
        <ul>
            <li>
                <strong>Genomics metadata:</strong>
            </li>
            <li>
                <strong>Accession Number:</strong>
            </li>
        </ul>
    </StyledTooltip>
);

export default function LaboratoryInformation(): JSX.Element {
    const globalClasses = useStyles();

    return (
        <Scroll.Element name="laboratoryInformation">
            <FieldTitle
                title="Laboratory Information"
                tooltip={<TooltipText />}
            />
            <div
                className={clsx([
                    globalClasses.fieldRow,
                    globalClasses.halfWidth,
                ])}
            >
                <FastField
                    name="genomicsMetadata"
                    label="Genomics Metadata"
                    type="text"
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
                    name="accessionNumber"
                    label="Accession Number"
                    type="text"
                    component={TextField}
                    fullWidth
                />
            </div>
        </Scroll.Element>
    );
}
