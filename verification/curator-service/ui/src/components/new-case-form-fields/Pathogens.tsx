import { FastField } from 'formik';
import FieldTitle from '../common-form-fields/FieldTitle';
import Scroll from 'react-scroll';
import { TextField } from 'formik-mui';
import { useStyles } from './styled';
import clsx from 'clsx';

export default function Pathogens(): JSX.Element {
    const classes = useStyles();

    return (
        <Scroll.Element name="pathogens">
            <FieldTitle title="Pathogens" />

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
