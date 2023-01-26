import FieldTitle from '../common-form-fields/FieldTitle';
import { FormikAutocomplete } from '../common-form-fields/FormikFields';
import { StyledTooltip } from './StyledTooltip';
import Scroll from 'react-scroll';
import { SelectField } from '../common-form-fields/FormikFields';
import { FastField, useFormikContext } from 'formik';
import { TextField } from 'formik-mui';
import { Day0CaseFormValues } from '../../api/models/Day0Case';
import { useStyles } from './styled';
import clsx from 'clsx';

const hasPreexistingConditionsValues = ['Y', 'N', 'NA'];

const TooltipText = () => (
    <StyledTooltip>
        <ul>
            <li>
                <strong>Previous infection:</strong> Enter if the case was
                tested positive for the infection prior to the most recent
                diagnosis.
            </li>
            <li>
                <strong>Co infection:</strong> Specify the pathogen that the
                case tested positive for.
            </li>
            <li>
                <strong>Pre-existing conditions:</strong> Enter any pre-existing
                medical conditions.
            </li>
            <ul>
                <li>
                    You can either manually search in the field by typing and
                    selecting each from the prepopulated list.
                </li>
                <li>
                    You can select multiple pre-existing conditions per case.
                </li>
            </ul>
            <li>
                <strong>Pregnancy status:</strong> Enter if the case is pregnant
                or post-partum.
            </li>
        </ul>
    </StyledTooltip>
);

export default function PreexistingConditions(): JSX.Element {
    const { initialValues } = useFormikContext<Day0CaseFormValues>();
    const classes = useStyles();

    return (
        <Scroll.Element name="preexistingConditions">
            <FieldTitle
                title="Pre-existing conditions"
                tooltip={<TooltipText />}
            />
            <SelectField
                name="preexistingConditions.previousInfection"
                label="Previous infection"
                values={hasPreexistingConditionsValues}
            />

            <div className={clsx([classes.fieldRow, classes.halfWidth])}>
                <FastField
                    name="preexistingConditions.coInfection"
                    type="text"
                    label="Co infection"
                    component={TextField}
                    fullWidth
                />
            </div>
            <div className={classes.fieldRow}>
                <FormikAutocomplete
                    name="preexistingConditionsHelper"
                    label="Pre-existing conditions"
                    initialValue={
                        initialValues.preexistingConditions
                            .preexistingCondition || undefined
                    }
                    multiple
                    optionsLocation="https://raw.githubusercontent.com/globaldothealth/list/main/suggest/preexisting_conditions.txt"
                />
            </div>
            <SelectField
                name="preexistingConditions.pregnancyStatus"
                label="Pregnancy status"
                values={hasPreexistingConditionsValues}
            />
        </Scroll.Element>
    );
}
