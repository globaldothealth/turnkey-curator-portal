import { useFormikContext } from 'formik';
import { DateField, SelectField } from '../common-form-fields/FormikFields';

import FieldTitle from '../common-form-fields/FieldTitle';
import Scroll from 'react-scroll';
import { StyledTooltip } from './StyledTooltip';
import { ParsedCase } from '../../api/models/Day0Case';
import { CaseStatus } from '../../api/models/Day0Case';
import { toUTCDate } from '../util/date';

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
    const { setFieldValue, values } = useFormikContext<ParsedCase>();

    return (
        <Scroll.Element name="general">
            <FieldTitle title="General" tooltip={<TooltipText />} />
            <SelectField
                name="caseStatus"
                label="Case status"
                values={Object.values(CaseStatus)}
                required
            />
            <DateField
                name="entryDate"
                label="Entry date"
                value={values.entryDate}
                onChange={(newValue) => {
                    setFieldValue(
                        'entryDate',
                        toUTCDate(
                            newValue ? newValue.toDateString() : undefined,
                        ),
                    );
                }}
                required
            />
        </Scroll.Element>
    );
}
