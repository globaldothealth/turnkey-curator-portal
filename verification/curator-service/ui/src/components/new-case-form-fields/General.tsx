import { SelectField } from '../common-form-fields/FormikFields';

import FieldTitle from '../common-form-fields/FieldTitle';
import Scroll from 'react-scroll';
import { StyledTooltip } from './StyledTooltip';
import { CaseStatus } from '../../api/models/Day0Case';
import clsx from 'clsx';
import { useStyles } from './styled';
import { FastField } from 'formik';
import { TextField } from 'formik-mui';

const TooltipText = () => (
    <StyledTooltip>
        <ul>
            <li>
                <strong>Case status:</strong> Status of a case. Cases which are
                discarded were previously suspected but have now been confirmed
                negative, and should be excluded from case counts. Cases which
                are omit_error were incorrectly added and should be dismissed
                from any data interpretation.
            </li>
            <li>
                <strong>Entry date:</strong> Date case was entered into line
                list.
            </li>
        </ul>
    </StyledTooltip>
);

export default function General(): JSX.Element {
    const classes = useStyles();

    return (
        <Scroll.Element name="general">
            <FieldTitle title="General" tooltip={<TooltipText />} />
            <SelectField
                name="caseStatus"
                label="Case status"
                values={Object.values(CaseStatus)}
                required
            />

            <div className={clsx([classes.fieldRow, classes.halfWidth])}>
                <FastField
                    name="pathogen"
                    type="text"
                    label="Pathogen"
                    disabled
                    component={TextField}
                    fullWidth
                />
            </div>
        </Scroll.Element>
    );
}
