import React from 'react';
import { FormikAutocomplete } from '../common-form-fields/FormikFields';

import { Chip } from '@mui/material';
import FieldTitle from '../common-form-fields/FieldTitle';
import { StyledTooltip } from './StyledTooltip';
import Scroll from 'react-scroll';
import axios from 'axios';
import makeStyles from '@mui/styles/makeStyles';
import { useFormikContext } from 'formik';
import { Day0CaseFormValues } from '../../api/models/Day0Case';

const useStyles = makeStyles(() => ({
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
                <strong>Symptoms:</strong> Select the symptoms reported for the
                case.
                <ul>
                    <li>
                        You can either manually search in the field by typing
                        and selecting each from the prepopulated list or click
                        the most common symptom from the list below.
                    </li>
                    <li>
                        You can select multiple symptoms per case as reported by
                        the source. Try and be as specific as possible.
                    </li>
                </ul>
            </li>
        </ul>
    </StyledTooltip>
);

interface SymptomListProps {
    title: string;
    collectionName: string;
}

function SymptomList(props: SymptomListProps): JSX.Element {
    const { values, initialValues, setFieldValue } =
        useFormikContext<Day0CaseFormValues>();
    const [commonSymptoms, setCommonSymptoms] = React.useState([]);

    React.useEffect(
        () => {
            axios
                .get('/api/cases/symptoms?limit=5')
                .then((response) =>
                    setCommonSymptoms(response.data.symptoms ?? []),
                );
        },
        // Using [] here means this will only be called once at the beginning of the lifecycle
        [],
    );

    const classes = useStyles();

    const rawInitialValues = initialValues[props.collectionName];
    const splittedValues =
        rawInitialValues && String(rawInitialValues).split(', ');

    return (
        <Scroll.Element name={props.collectionName}>
            <FieldTitle title={props.title} tooltip={<TooltipText />} />
            {commonSymptoms.length > 0 && (
                <>
                    <div className={classes.section}>
                        Frequently added symptoms
                    </div>
                    <div className={classes.section}>
                        {commonSymptoms.map((symptom) => (
                            <Chip
                                key={symptom}
                                className={classes.chip}
                                label={symptom}
                                onClick={(): void => {
                                    if (
                                        values.symptoms &&
                                        !values.symptoms.includes(symptom)
                                    ) {
                                        setFieldValue(
                                            props.collectionName,
                                            values.symptoms &&
                                                values.symptoms.length > 0
                                                ? values.symptoms.concat(
                                                      `, ${symptom}`,
                                                  )
                                                : symptom,
                                        );
                                    }
                                }}
                            />
                        ))}
                    </div>
                </>
            )}
            <FormikAutocomplete
                name={props.collectionName}
                label={props.title}
                initialValue={splittedValues || undefined}
                multiple
                freeSolo
                optionsLocation="https://raw.githubusercontent.com/globaldothealth/list/main/suggest/symptoms.txt"
            />
        </Scroll.Element>
    );
}

const Symptoms: () => JSX.Element = () => (
    <SymptomList title="Symptoms" collectionName="symptoms" />
);

export const VaccineSideEffects: () => JSX.Element = () => (
    // <SymptomList
    //     title="Side Effects"
    //     collectionName="vaccination.vaccineSideEffects"
    // />
    <></>
);

export default Symptoms;
