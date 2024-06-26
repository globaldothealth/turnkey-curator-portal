import clsx from 'clsx';
import { FastField } from 'formik';
import { TextField } from 'formik-mui';
import Scroll from 'react-scroll';

import { CaseStatus } from '../../api/models/Day0Case';
import { SelectField } from '../common-form-fields/FormikFields';
import FieldTitle from '../common-form-fields/FieldTitle';
import { useStyles } from './styled';
import { StyledTooltip } from './StyledTooltip';

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
            <li>
                <strong>Curator's comment:</strong> Comment added by curator,
                visible only in turnkey system, not downloadable.
            </li>
        </ul>
    </StyledTooltip>
);

export default function General(): JSX.Element {
    const { classes } = useStyles();

    return (
        <Scroll.Element name="general">
            <FieldTitle title="General" tooltip={<TooltipText />} />
            <SelectField
                name="caseStatus"
                label="Case status"
                values={Object.values(CaseStatus)}
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
            <div className={clsx([classes.fieldRow, classes.halfWidth])}>
                <FastField
                    data-testid="comment"
                    name="comment"
                    type="text"
                    multiline
                    label="Curator's comment"
                    component={TextField}
                    fullWidth
                />
            </div>
        </Scroll.Element>
    );
}
