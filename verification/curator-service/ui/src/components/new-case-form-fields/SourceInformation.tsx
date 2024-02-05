import React from 'react';
import clsx from 'clsx';
import Scroll from 'react-scroll';
import { FastField, useFormikContext } from 'formik';
import { TextField } from 'formik-mui';

import { Day0CaseFormValues } from '../../api/models/Day0Case';
import FieldTitle from '../common-form-fields/FieldTitle';
import { DateField } from '../common-form-fields/FormikFields';
import { useStyles } from './styled';
import { StyledTooltip } from './StyledTooltip';

const TooltipText = () => (
    <StyledTooltip>
        <ul>
            <li>
                <strong>Source:</strong>
            </li>
            <li>
                <strong>Date entry:</strong>
            </li>
            <li>
                <strong>Date last modified:</strong>
            </li>
        </ul>
    </StyledTooltip>
);

export default function SourceInformation(): JSX.Element {
    const globalClasses = useStyles();
    const { setFieldValue, values } = useFormikContext<Day0CaseFormValues>();

    return (
        <Scroll.Element name="sourceInformation">
            <FieldTitle title="Source Information" tooltip={<TooltipText />} />
            <div
                className={clsx([
                    globalClasses.fieldRow,
                    globalClasses.halfWidth,
                ])}
            >
                <FastField
                    name="source"
                    label="Source"
                    type="text"
                    component={TextField}
                    fullWidth
                />
            </div>
            {values.source !== '' && (
                <div
                    className={clsx([
                        globalClasses.fieldRow,
                        globalClasses.halfWidth,
                    ])}
                >
                    <FastField
                        name="sourceII"
                        label="Source II"
                        type="text"
                        component={TextField}
                        fullWidth
                    />
                </div>
            )}
            {values.sourceII !== '' && (
                <div
                    className={clsx([
                        globalClasses.fieldRow,
                        globalClasses.halfWidth,
                    ])}
                >
                    <FastField
                        name="sourceIII"
                        label="Source III"
                        type="text"
                        component={TextField}
                        fullWidth
                    />
                </div>
            )}
            {values.sourceIII !== '' && (
                <div
                    className={clsx([
                        globalClasses.fieldRow,
                        globalClasses.halfWidth,
                    ])}
                >
                    <FastField
                        name="sourceIV"
                        label="Source IV"
                        type="text"
                        component={TextField}
                        fullWidth
                    />
                </div>
            )}
            <DateField
                name="dateEntry"
                label="Date entry"
                value={values.vaccinationDate}
                onChange={(newValue) => {
                    if (newValue) {
                        setFieldValue('dateEntry', newValue);
                    }
                }}
            />
            <DateField
                name="dateLastModified"
                label="Date last modified"
                value={values.vaccinationDate}
                onChange={(newValue) => {
                    if (newValue) {
                        setFieldValue('dateLastModified', newValue);
                    }
                }}
            />
        </Scroll.Element>
    );
}
