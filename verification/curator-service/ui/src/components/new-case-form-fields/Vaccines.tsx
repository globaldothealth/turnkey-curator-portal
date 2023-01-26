import { FastField, useFormikContext } from 'formik';
import { DateField, SelectField } from '../common-form-fields/FormikFields';
import FieldTitle from '../common-form-fields/FieldTitle';
import { StyledTooltip } from './StyledTooltip';
import Scroll from 'react-scroll';
import { TextField } from 'formik-mui';
import { VaccineSideEffects } from './Symptoms';
import { Day0CaseFormValues } from '../../api/models/Day0Case';
import { useStyles } from './styled';
import clsx from 'clsx';
import { toUTCDate } from '../util/date';

const TooltipText = () => (
    <StyledTooltip>
        <ul>
            <li>
                <strong>Vaccination:</strong> Has the individual received a dose
                of vaccine (Y=Yes, N=No, NA=Not applicable)?
            </li>
            <li>
                <strong>Vaccine name:</strong> Name of the first vaccine.
            </li>
            <li>
                <strong>Vaccine date:</strong> Date of first vaccination.
            </li>
            <li>
                <strong>Vaccine side effects:</strong> list of symptoms
                experienced after receiving the vaccine.
            </li>
        </ul>
    </StyledTooltip>
);

export default function Vaccines(): JSX.Element {
    const { values, setValues } = useFormikContext<Day0CaseFormValues>();
    const globalClasses = useStyles();

    return (
        <Scroll.Element name="vaccines">
            <FieldTitle
                title="Vaccines"
                interactive
                tooltip={<TooltipText />}
            />
            <SelectField
                name="vaccination.vaccination"
                label="Vaccination"
                values={['Y', 'N', 'NA']}
            />
            {values.vaccination.vaccination === 'Y' && (
                <>
                    <div
                        className={clsx([
                            globalClasses.fieldRow,
                            globalClasses.halfWidth,
                        ])}
                    >
                        <FastField
                            name="vaccination.vaccineName"
                            type="text"
                            label="Vaccine name"
                            component={TextField}
                            fullWidth
                        />
                    </div>
                    <DateField
                        name="vaccination.vaccineDate"
                        label="Vaccine date"
                        value={values.vaccination.vaccineDate}
                        onChange={(newValue) => {
                            setValues({
                                ...values,
                                vaccination: {
                                    ...values.vaccination,
                                    vaccineDate: toUTCDate(
                                        newValue
                                            ? newValue.toDateString()
                                            : undefined,
                                    ),
                                },
                            });
                        }}
                    />
                    <VaccineSideEffects />
                </>
            )}
        </Scroll.Element>
    );
}
