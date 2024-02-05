import React from 'react';
import clsx from 'clsx';
import Scroll from 'react-scroll';
import { FastField, useFormikContext } from 'formik';
import { TextField } from 'formik-mui';

import {
    Day0CaseFormValues,
    YesNo,
    ContactSetting,
    ContactAnimal,
    Transmission,
} from '../../api/models/Day0Case';
import FieldTitle from '../common-form-fields/FieldTitle';
import { DateField, SelectField } from '../common-form-fields/FormikFields';
import { useStyles } from './styled';
import { StyledTooltip } from './StyledTooltip';

const TooltipText = () => (
    <StyledTooltip>
        <ul>
            <li>
                <strong>Contact with case:</strong>
            </li>
            <li>
                <strong>Transmission:</strong>
            </li>
            <li>
                <strong>Travel history:</strong>
            </li>
        </ul>
    </StyledTooltip>
);

export default function Exposure(): JSX.Element {
    const globalClasses = useStyles();
    const { setFieldValue, values } = useFormikContext<Day0CaseFormValues>();

    return (
        <Scroll.Element name="exposure">
            <FieldTitle title="Exposure" tooltip={<TooltipText />} />
            <SelectField
                name="contactWithCase"
                label="Contact with case"
                values={Object.values(YesNo)}
            />
            {values.contactWithCase === YesNo.Y && (
                <>
                    <div
                        className={clsx([
                            globalClasses.fieldRow,
                            globalClasses.halfWidth,
                        ])}
                    >
                        <FastField
                            name="contactID"
                            label="Contact ID"
                            type="text"
                            component={TextField}
                            fullWidth
                        />
                    </div>
                    <SelectField
                        name="contactSetting"
                        label="Contact setting"
                        values={Object.values(ContactSetting)}
                    />
                    {values.contactSetting === ContactSetting.Other && (
                        <div
                            className={clsx([
                                globalClasses.fieldRow,
                                globalClasses.halfWidth,
                            ])}
                        >
                            <FastField
                                name="contactSettingOther"
                                label="Contact setting other"
                                type="text"
                                component={TextField}
                                fullWidth
                            />
                        </div>
                    )}
                    <SelectField
                        name="contactAnimal"
                        label="Contact Animal"
                        values={Object.values(ContactAnimal)}
                    />
                    <div
                        className={clsx([
                            globalClasses.fieldRow,
                            globalClasses.halfWidth,
                        ])}
                    >
                        <FastField
                            name="contactComment"
                            label="Contact comment"
                            type="text"
                            component={TextField}
                            fullWidth
                        />
                    </div>
                </>
            )}
            <SelectField
                name="transmission"
                label="Transmission"
                values={Object.values(Transmission)}
            />
            <SelectField
                name="travelHistory"
                label="Travel history"
                values={Object.values(YesNo)}
            />
            {values.travelHistory === YesNo.Y && (
                <>
                    <DateField
                        name="travelHistoryEntry"
                        label="Travel history entry"
                        value={values.vaccinationDate}
                        onChange={(newValue) => {
                            if (newValue) {
                                setFieldValue('travelHistoryEntry', newValue);
                            }
                        }}
                    />
                    <DateField
                        name="travelHistoryStart"
                        label="Travel history start"
                        value={values.vaccinationDate}
                        onChange={(newValue) => {
                            if (newValue) {
                                setFieldValue('travelHistoryStart', newValue);
                            }
                        }}
                    />
                    <p>Location</p>
                </>
            )}
        </Scroll.Element>
    );
}
