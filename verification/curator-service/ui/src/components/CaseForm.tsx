import * as Yup from 'yup';

import { Button, LinearProgress, Typography } from '@mui/material';
import { FastField, Form, Formik } from 'formik';
import { Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import { green, grey, red } from '@mui/material/colors';

import AppModal from './AppModal';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Demographics from './new-case-form-fields/Demographics';
import ErrorIcon from '@mui/icons-material/Error';
import Events from './new-case-form-fields/Events';
import GenomeSequences from './new-case-form-fields/GenomeSequences';
import LocationForm from './new-case-form-fields/LocationForm';
import MuiAlert from '@mui/material/Alert';
import Pathogens from './new-case-form-fields/Pathogens';
import PreexistingConditions from './new-case-form-fields/PreexistingConditions';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import React from 'react';
import Scroll from 'react-scroll';
import Symptoms from './new-case-form-fields/Symptoms';
import Transmission from './new-case-form-fields/Transmission';
import TravelHistory from './new-case-form-fields/TravelHistory';
import Vaccines from './new-case-form-fields/Vaccines';
import { hasKey } from './Utils';
import { useHistory } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { CaseStatus, ParsedCase, Day0Case } from '../api/models/Day0Case';
import TextField from '@mui/material/TextField';
import { toUTCDate } from './util/date';
import axios from 'axios';
import Source from './common-form-fields/Source';
import General from './new-case-form-fields/General';

const TableOfContents = styled('nav')(() => ({
    position: 'fixed',
}));

const TableOfContentsRow = styled('div')(() => ({
    alignItems: 'center',
    display: 'flex',
}));

const StyledForm = styled('div', {
    shouldForwardProp: (prop) => prop !== 'showTableOfContents',
})<{ showTableOfContents: boolean }>(({ showTableOfContents }) => ({
    ...(showTableOfContents && {
        paddingLeft: '18em',
    }),
}));

const FormSection = styled(Paper)(() => ({
    padding: '0.5em 1em 1em',
    margin: '2em 0',
}));

const initialValuesFromCase = (c?: ParsedCase) => {
    if (!c) {
        return {
            id: undefined,
            pathogen: 'COVID-19',
            caseStatus: undefined,
            country: '',
            countryISO3: '',
            location: '',
            // geocodeLocation is a helper value used in places autocomplete
            geocodeLocation: undefined,
            city: '',
            age: '',
            gender: undefined,
            occupation: '',
            healthcareWorker: undefined,
            symptoms: undefined,
            symptomsOnsetDate: null,
            confirmationDate: null,
            confirmationMethod: '',
            previousInfection: undefined,
            coInfection: '',
            preexistingCondition: undefined,
            pregnancyStatus: undefined,
            vaccination: undefined,
            vaccineName: '',
            vaccineDate: null,
            vaccineSideEffects: undefined,
            firstConsultDate: null,
            hospitalized: undefined,
            hospitalizationReason: undefined,
            hospitalizationDate: null,
            hospitalDischargeDate: null,
            intensiveCare: undefined,
            ICUAdmissionDate: null,
            ICUDischargeDate: null,
            homeMonitoring: undefined,
            isolated: undefined,
            isolationDate: null,
            outcome: undefined,
            deathDate: null,
            recoveredDate: null,
            contactWithCase: undefined,
            contactID: undefined,
            contactSetting: '',
            contactAnimal: '',
            contactComment: '',
            transmission: '',
            travelHistory: undefined,
            travelHistoryEntry: '',
            travelHistoryStart: '',
            travelHistoryLocation: '',
            travelHistoryCountry: '',
            genomicsMetadata: '',
            accessionNumber: '',
            source: '',
            sourceII: '',
            sourceIII: '',
            sourceIV: '',
            sourceV: '',
            sourceVI: '',
            sourceVII: '',
            entryDate: null,
            lastModifiedDate: null,
        };
    }

    return c;
};

interface Props {
    initialCase?: ParsedCase;
    onModalClose: () => void;
    diseaseName: string;
}

// @TODO: get 0 and 120 min/max age values from the backend.
const NewCaseValidation = Yup.object().shape(
    {
        caseStatus: Yup.string()
            .oneOf(['confirmed', 'suspected', 'discarded', 'omit_error'])
            .required(),
        pathogen: Yup.string().required('Required'),
        country: Yup.string().required('Required'),
        countryISO3: Yup.string().required('Required'),
        entryDate: Yup.date().required('Required'),
        source: Yup.string().required('Required'),
        minAge: Yup.number()
            .min(0, 'Age must be between 0 and 120')
            .max(120, 'Age must be between 0 and 120')
            .when('maxAge', {
                is: (maxAge: number | string) =>
                    maxAge !== undefined && maxAge !== '',
                then: Yup.number().required(
                    'Min age required in range. Minimum value is 0.',
                ),
            }),
        maxAge: Yup.number()
            .min(0, 'Age must be between 0 and 120')
            .max(120, 'Age must be between 0 and 120')
            .when('minAge', {
                is: (minAge: number | string) =>
                    minAge !== undefined && minAge !== '',
                then: Yup.number()
                    .min(
                        Yup.ref('minAge'),
                        'Max age must be greater than than min age',
                    )
                    .required(
                        'Max age required in range. Maximum value is 120.',
                    ),
            }),
        age: Yup.number()
            .min(0, 'Age must be between 0 and 120')
            .max(120, 'Age must be between 0 and 120')
            .when('minAge', {
                is: (minAge: number | string) =>
                    minAge !== undefined && minAge !== '',
                then: Yup.number().oneOf(
                    [undefined],
                    'Cannot enter age and age range',
                ),
            })
            .when('maxAge', {
                is: (maxAge: number | string) =>
                    maxAge !== undefined && maxAge !== '',
                then: Yup.number().oneOf(
                    [undefined],
                    'Cannot enter age and age range',
                ),
            }),
    },
    [['maxAge', 'minAge']],
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hasErrors(fields: string[], errors: any, touched: any): boolean {
    for (const field of fields) {
        if (
            hasKey(touched, field) &&
            touched[field] &&
            hasKey(errors, field) &&
            errors[field] !== undefined
        ) {
            return true;
        }
    }
    return false;
}

export default function CaseForm(props: Props): JSX.Element {
    const { initialCase } = props;
    const theme = useTheme();
    const showTableOfContents = useMediaQuery(theme.breakpoints.up('sm'));
    const history = useHistory();
    const [errorMessage, setErrorMessage] = React.useState('');

    const submitCase = async (values: ParsedCase): Promise<void> => {
        console.log(values);
        if (!values.caseStatus) return;
        console.log('Im here');

        const ageRange = values.age
            ? values.age
            : `${values.minAge}-${values.maxAge}`;

        const newCase: Day0Case = {
            Case_status: values.caseStatus,
            Date_entry:
                values.entryDate || toUTCDate(new Date().toDateString())!,
            Date_last_modified: toUTCDate(new Date().toDateString())!,
            Source: values.caseReference.inputValue,
            Source_II: values.sourceII,
            Source_III: values.sourceIII,
            Source_IV: values.sourceIV,
            Source_V: values.sourceV,
            Source_VI: values.sourceVI,
            Source_VII: values.sourceVII,
            Age: ageRange,
            Gender: values.gender,
            Occupation: values.occupation,
            Healthcare_worker: values.healthcareWorker,
            Country: values.country,
            Country_ISO3: values.countryISO3,
            Location: values.location,
            City: values.city,
            Date_onset: values.symptomsOnsetDate,
            Date_confirmation: values.confirmationDate,
            Confirmation_method: values.confirmationMethod,
            Date_of_first_consult: values.firstConsultDate,
            Hospitalized: values.hospitalized,
            'Reason for hospitalition': values.hospitalizationReason,
            Date_hospitalization: values.hospitalizationDate,
            Date_discharge_hospital: values.hospitalDischargeDate,
            Intensive_care: values.intensiveCare,
            Date_admission_ICU: values.ICUAdmissionDate,
            Date_discharge_ICU: values.ICUDischargeDate,
            Home_monitoring: values.homeMonitoring,
            Isolated: values.isolated,
            Date_isolation: values.isolationDate,
            Outcome: values.outcome,
            Date_death: values.deathDat,
            Date_recovered: values.recoveredDate,
            Symptoms: values.symptoms ? values.symptoms.join(', ') : undefined,
            Previous_infection: values.previousInfection,
            Co_infection: values.coInfection,
            Pre_existing_condition: values.preexistingCondition
                ? values.preexistingCondition.join(', ')
                : undefined,
            Pregnancy_status: values.pregnancyStatus,
            Contact_with_case: values.contactWithCase,
            Contact_ID: values.contactID,
            Contact_setting: values.contactSetting,
            Contact_animal: values.contactAnimal,
            Contact_comment: values.contactComment,
            Transmission: values.transmission,
            Travel_history: values.travelHistory,
            Travel_history_entry: values.travelHistoryEntry,
            Travel_history_start: values.travelHistoryStart,
            Travel_history_location: values.travelHistoryLocation,
            Travel_history_country: values.travelHistoryCountry,
            Genomics_Metadata: values.genomicsMetadata,
            'Accession Number': values.accessionNumber,
            Pathogen: values.pathogen,
            Vaccination: values.vaccination,
            Vaccine_name: values.vaccineName,
            Vaccine_date: values.vaccineDate,
            Vaccine_side_effects: values.vaccineSideEffects
                ? values.vaccineSideEffects.join(', ')
                : undefined,
        };
        let newCaseId = '';
        try {
            // Update or create depending on the presence of the initial case ID.
            if (props.initialCase?.id) {
                await axios.put(`/api/cases/${props.initialCase?.id}`, newCase);
            } else {
                const postResponse = await axios.post(`/api/cases`, newCase);

                newCaseId = postResponse.data._id;
            }
            setErrorMessage('');
            console.log('success');
        } catch (e) {
            console.log('error');
            setErrorMessage(e.response?.data?.message || e.toString());
            return;
        }
        // Navigate to cases after successful submit
        history.push({
            pathname: '/cases',
            state: {
                newCaseIds: newCaseId,
                editedCaseIds: props.initialCase?.id
                    ? [props.initialCase.id]
                    : [],
            },
        });
    };

    const tableOfContentsIcon = (opts: {
        isChecked: boolean;
        hasError: boolean;
    }): JSX.Element => {
        return opts.hasError ? (
            <ErrorIcon
                data-testid="error-icon"
                style={{
                    color: red[500],
                    margin: '0.25em 0.5em',
                }}
            />
        ) : opts.isChecked ? (
            <CheckCircleIcon
                data-testid="check-icon"
                style={{
                    color: green[500],
                    margin: '0.25em 0.5em',
                }}
            />
        ) : (
            <RadioButtonUncheckedIcon
                style={{
                    color: grey[500],
                    margin: '0.25em 0.5em',
                }}
            />
        );
    };

    const scrollTo = (name: string): void => {
        Scroll.scroller.scrollTo(name, {
            duration: 100,
            smooth: true,
            offset: -64, // Account for header height
            containerId: 'scroll-container',
        });
    };

    const isChecked = ({
        requiredValues,
        optionalValues,
    }: {
        requiredValues?: any[];
        optionalValues?: any[];
    }): boolean => {
        // When there are no required values provided check whether any of optional values is valid
        if (!requiredValues || requiredValues.length === 0) {
            return optionalValues
                ? optionalValues.some((value) => !!value)
                : false;
        }

        // Otherwise check if all the required values are valid
        return requiredValues.every((value) => !!value);
    };

    return (
        <AppModal
            title={
                props.initialCase
                    ? 'Edit case'
                    : `Create new ${props.diseaseName} line list case`
            }
            onModalClose={props.onModalClose}
        >
            <Formik
                initialValues={initialValuesFromCase(initialCase)}
                validationSchema={NewCaseValidation}
                // Validating on change slows down the form too much. It will
                // validate on blur and form submission.
                validateOnChange={false}
                onSubmit={submitCase}
            >
                {({
                    submitForm,
                    isSubmitting,
                    values,
                    errors,
                    touched,
                }): JSX.Element => (
                    <>
                        {showTableOfContents && (
                            <TableOfContents>
                                <TableOfContentsRow
                                    onClick={(): void => scrollTo('general')}
                                >
                                    {tableOfContentsIcon({
                                        isChecked: isChecked({
                                            requiredValues: [
                                                values.caseStatus,
                                                values.entryDate,
                                            ],
                                        }),
                                        hasError: hasErrors(
                                            ['caseStatus', 'entryDate'],
                                            errors,
                                            touched,
                                        ),
                                    })}
                                    {'General'.toLocaleUpperCase()}
                                </TableOfContentsRow>
                                <TableOfContentsRow
                                    onClick={(): void => scrollTo('source')}
                                >
                                    {tableOfContentsIcon({
                                        isChecked: isChecked({
                                            requiredValues: [
                                                values.caseReference,
                                            ],
                                        }),
                                        hasError: hasErrors(
                                            ['caseReference'],
                                            errors,
                                            touched,
                                        ),
                                    })}
                                    {'Source'.toLocaleUpperCase()}
                                </TableOfContentsRow>
                                <TableOfContentsRow
                                    onClick={(): void =>
                                        scrollTo('demographics')
                                    }
                                >
                                    {tableOfContentsIcon({
                                        isChecked: isChecked({
                                            optionalValues: [
                                                values.gender,
                                                values.age,
                                                values.occupation,
                                                values.healthcareWorker,
                                            ],
                                        }),
                                        hasError: hasErrors(
                                            [
                                                'gender',
                                                'age',
                                                'occupation',
                                                'healthcareWorker',
                                            ],
                                            errors,
                                            touched,
                                        ),
                                    })}
                                    {'Demographics'.toLocaleUpperCase()}
                                </TableOfContentsRow>

                                <TableOfContentsRow
                                    onClick={(): void => scrollTo('location')}
                                >
                                    {tableOfContentsIcon({
                                        isChecked: isChecked({
                                            requiredValues: [
                                                values.countryISO3,
                                                values.geocodeLocation,
                                            ],
                                        }),
                                        hasError: hasErrors(
                                            ['location', 'city', 'countryISO3'],
                                            errors,
                                            touched,
                                        ),
                                    })}
                                    {'Location'.toLocaleUpperCase()}
                                </TableOfContentsRow>
                                <TableOfContentsRow
                                    onClick={(): void => scrollTo('events')}
                                >
                                    {tableOfContentsIcon({
                                        isChecked: isChecked({
                                            requiredValues: [
                                                values.confirmationDate,
                                            ],
                                        }),
                                        hasError: hasErrors(
                                            [
                                                'confirmationDate',
                                                'confirmationMethod',
                                                'symptomsOnsetDate',
                                                'firstConsultDate',
                                                'isolated',
                                                'isolationDate',
                                                'hospitalized',
                                                'hospitalizationReason',
                                                'hospitalizationDate',
                                                'hospitalizationDischargeDate',
                                                'intensiveCare',
                                                'ICUAdmissionDate',
                                                'ICUDischargeDate',
                                                'outcome',
                                                'deathDate',
                                                'recoveredDate',
                                            ],
                                            errors,
                                            touched,
                                        ),
                                    })}
                                    {'Events'.toLocaleUpperCase()}
                                </TableOfContentsRow>
                                <TableOfContentsRow
                                    onClick={(): void => scrollTo('symptoms')}
                                >
                                    {tableOfContentsIcon({
                                        isChecked: isChecked({
                                            optionalValues: [values.symptoms],
                                        }),
                                        hasError: hasErrors(
                                            ['symptoms'],
                                            errors,
                                            touched,
                                        ),
                                    })}
                                    {'Symptoms'.toLocaleUpperCase()}
                                </TableOfContentsRow>
                                <TableOfContentsRow
                                    onClick={(): void =>
                                        scrollTo('preexistingConditions')
                                    }
                                >
                                    {tableOfContentsIcon({
                                        isChecked: isChecked({
                                            optionalValues: [
                                                values.previousInfection,
                                                values.coInfection,
                                                values.preexistingCondition,
                                                values.pregnancyStatus,
                                            ],
                                        }),
                                        hasError: hasErrors(
                                            [
                                                'previousInfection',
                                                'coInfection',
                                                'preexistingCondition',
                                                'pregnancyStatus',
                                            ],
                                            errors,
                                            touched,
                                        ),
                                    })}
                                    {'Preexisting conditions'.toLocaleUpperCase()}
                                </TableOfContentsRow>
                                <TableOfContentsRow
                                    onClick={(): void =>
                                        scrollTo('transmission')
                                    }
                                >
                                    {tableOfContentsIcon({
                                        isChecked: isChecked({
                                            optionalValues: [
                                                values.contactWithCase,
                                                values.contactID,
                                                values.contactSetting,
                                                values.contactAnimal,
                                                values.contactComment,
                                                values.transmission,
                                            ],
                                        }),
                                        hasError: hasErrors(
                                            [
                                                'contactWithCase',
                                                'contactID',
                                                'contactSetting',
                                                'contactAnimal',
                                                'contactComment',
                                                'transmission',
                                            ],
                                            errors,
                                            touched,
                                        ),
                                    })}
                                    {'Transmission'.toLocaleUpperCase()}
                                </TableOfContentsRow>
                                <TableOfContentsRow
                                    onClick={(): void =>
                                        scrollTo('travelHistory')
                                    }
                                >
                                    {tableOfContentsIcon({
                                        isChecked: isChecked({
                                            optionalValues: [
                                                values.travelHistory,
                                                values.travelHistoryEntry,
                                                values.travelHistoryStart,
                                                values.travelHistoryLocation,
                                                values.travelHistoryCountry,
                                            ],
                                        }),
                                        hasError: hasErrors(
                                            [
                                                'travelHistory',
                                                'travelHistoryEntry',
                                                'travelHistoryStart',
                                                'travelHistoryLocation',
                                                'travelHistoryCountry',
                                            ],
                                            errors,
                                            touched,
                                        ),
                                    })}
                                    {'Travel History'.toLocaleUpperCase()}
                                </TableOfContentsRow>
                                <TableOfContentsRow
                                    onClick={(): void =>
                                        scrollTo('genomeSequences')
                                    }
                                >
                                    {tableOfContentsIcon({
                                        isChecked: isChecked({
                                            optionalValues: [
                                                values.genomicsMetadata,
                                                values.accessionNumber,
                                            ],
                                        }),
                                        hasError: hasErrors(
                                            [
                                                'genomicsMetadata',
                                                'accessionNumber',
                                            ],
                                            errors,
                                            touched,
                                        ),
                                    })}
                                    {'Genome Sequences'.toLocaleUpperCase()}
                                </TableOfContentsRow>
                                <TableOfContentsRow
                                    onClick={(): void => scrollTo('pathogens')}
                                >
                                    {tableOfContentsIcon({
                                        isChecked: isChecked({
                                            requiredValues: [values.pathogen],
                                        }),
                                        hasError: hasErrors(
                                            ['pathogen'],
                                            errors,
                                            touched,
                                        ),
                                    })}
                                    {'Pathogens'.toLocaleUpperCase()}
                                </TableOfContentsRow>
                                <TableOfContentsRow
                                    onClick={(): void => scrollTo('vaccines')}
                                >
                                    {tableOfContentsIcon({
                                        isChecked: isChecked({
                                            optionalValues: [
                                                values.vaccination,
                                                values.vaccineName,
                                                values.vaccineDate,
                                                values.vaccineSideEffects,
                                            ],
                                        }),
                                        hasError: hasErrors(
                                            [
                                                'vaccination',
                                                'vaccineName',
                                                'vaccineDate',
                                                'vaccineSideEffects',
                                            ],
                                            errors,
                                            touched,
                                        ),
                                    })}
                                    {'Vaccines'.toLocaleUpperCase()}
                                </TableOfContentsRow>
                                {/* {!props.initialCase && (
                                    <TableOfContentsRow
                                        onClick={(): void =>
                                            scrollTo('numCases')
                                        }
                                    >
                                        {tableOfContentsIcon({
                                            isChecked: values.numCases !== 1,
                                            hasError: hasErrors(
                                                ['numCases'],
                                                errors,
                                                touched,
                                            ),
                                        })}
                                        {'Number of cases'.toLocaleUpperCase()}
                                    </TableOfContentsRow>
                                )} */}
                            </TableOfContents>
                        )}
                        <StyledForm showTableOfContents={showTableOfContents}>
                            <Typography variant="h4">
                                Enter the details for{' '}
                                {props.initialCase
                                    ? 'an existing case'
                                    : 'a new case'}
                            </Typography>
                            <Typography variant="body2">
                                Complete all available data for the case.
                                Required fields are marked.
                            </Typography>
                            <Form>
                                <FormSection>
                                    <General />
                                </FormSection>
                                <FormSection>
                                    <Source
                                        initialValue={values.caseReference}
                                        withAdditioanlSources
                                    />
                                </FormSection>
                                <FormSection>
                                    <Demographics />
                                </FormSection>
                                <FormSection>
                                    <LocationForm />
                                </FormSection>
                                <FormSection>
                                    <Events />
                                </FormSection>
                                <FormSection>
                                    <Symptoms />
                                </FormSection>
                                <FormSection>
                                    <PreexistingConditions />
                                </FormSection>
                                <FormSection>
                                    <Transmission />
                                </FormSection>
                                <FormSection>
                                    <TravelHistory />
                                </FormSection>
                                <FormSection>
                                    <GenomeSequences />
                                </FormSection>
                                <FormSection>
                                    <Pathogens />
                                </FormSection>
                                <FormSection>
                                    <Vaccines />
                                </FormSection>
                                {isSubmitting && (
                                    <LinearProgress
                                        sx={{ marginBottom: '1rem' }}
                                    />
                                )}
                                <Button
                                    variant="contained"
                                    color="primary"
                                    disableElevation
                                    data-testid="submit"
                                    disabled={isSubmitting}
                                    onClick={submitForm}
                                >
                                    {props.initialCase
                                        ? 'Submit case edit'
                                        : 'Submit case'}
                                </Button>
                                <Button
                                    sx={{ marginLeft: '1em' }}
                                    color="primary"
                                    variant="outlined"
                                    onClick={props.onModalClose}
                                >
                                    Cancel
                                </Button>
                            </Form>
                            {errorMessage && (
                                <MuiAlert
                                    sx={{ marginTop: '1em', maxWidth: '80%' }}
                                    elevation={6}
                                    variant="filled"
                                    severity="error"
                                >
                                    {errorMessage}
                                </MuiAlert>
                            )}
                        </StyledForm>
                    </>
                )}
            </Formik>
        </AppModal>
    );
}
