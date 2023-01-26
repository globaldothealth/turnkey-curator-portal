import * as Yup from 'yup';

import { Button, LinearProgress, Typography } from '@mui/material';
import { Form, Formik } from 'formik';
import { Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import { green, grey, red } from '@mui/material/colors';

import { selectDiseaseName } from '../redux/app/selectors';
import { useAppSelector } from '../hooks/redux';
import AppModal from './AppModal';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Demographics from './new-case-form-fields/Demographics';
import ErrorIcon from '@mui/icons-material/Error';
import Events from './new-case-form-fields/Events';
import GenomeSequences from './new-case-form-fields/GenomeSequences';
import LocationForm from './new-case-form-fields/LocationForm';
import MuiAlert from '@mui/material/Alert';
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
import { Day0Case, Day0CaseFormValues } from '../api/models/Day0Case';
import axios from 'axios';
import Source, { submitSource } from './common-form-fields/Source';
import General from './new-case-form-fields/General';
import NumCases from './new-case-form-fields/NumCases';

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

const parseAge = (age?: string) => {
    if (!age) return null;

    const ageArr = age.split('-');
    if (ageArr.length === 2) {
        return { minAge: Number(ageArr[0]), maxAge: Number(ageArr[1]) };
    }

    return { age };
};

const initialValuesFromCase = (
    pathogen: string,
    c?: Day0Case,
): Day0CaseFormValues => {
    if (!c) {
        // return minimal vialable case
        return {
            caseStatus: '',
            caseReference: {
                sourceId: '',
                sourceUrl: '',
            },
            sources: {
                source: '',
                sourceII: '',
                sourceIII: '',
                sourceIV: '',
                sourceV: '',
                sourceVI: '',
                sourceVII: '',
            },
            demographics: {
                age: '',
                gender: '',
                occupation: '',
                healthcareWorker: '',
            },
            location: {
                country: '',
                countryISO3: '',
                location: '',
                city: '',
            },
            events: {
                dateEntry: null,
                dateLastModified: null,
                dateOnset: null,
                dateConfirmation: null,
                dateOfFirstConsult: null,
                dateHospitalization: null,
                dateDischargeHospital: null,
                dateAdmissionICU: null,
                dateDischargeICU: null,
                dateIsolation: null,
                dateDeath: null,
                dateRecovered: null,
                confirmationMethod: '',
                outcome: '',
                hospitalized: '',
                reasonForHospitalization: '',
                intensiveCare: '',
                homeMonitoring: '',
                isolated: '',
            },
            symptoms: [],
            preexistingConditions: {
                previousInfection: '',
                pregnancyStatus: '',
                coInfection: '',
                preexistingCondition: [],
            },
            transmission: {
                contactWithCase: '',
                contactId: '',
                contactSetting: '',
                contactAnimal: '',
                contactComment: '',
                transmission: '',
            },
            travelHistory: {
                travelHistory: '',
                travelHistoryEntry: '',
                travelHistoryStart: '',
                travelHistoryLocation: '',
                travelHistoryCountry: '',
            },
            genomeSequences: {
                genomicsMetadata: '',
                accessionNumber: '',
            },
            vaccination: {
                vaccination: '',
                vaccineName: '',
                vaccineSideEffects: [],
                vaccineDate: null,
            },
            pathogen,
            numCases: 1,
        };
    }

    return {
        ...c,
        demographics: { ...c.demographics, ...parseAge(c.demographics.age) },
        pathogen,
        symptoms: c.symptoms?.split(', '),
        vaccination: {
            ...c.vaccination,
            vaccineSideEffects: c.vaccination.vaccineSideEffects?.split(', '),
        },
        preexistingConditions: {
            ...c.preexistingConditions,
            preexistingCondition:
                c.preexistingConditions.preexistingCondition?.split(', '),
        },
    };
};

interface Props {
    initialCase?: Day0Case;
    onModalClose: () => void;
    diseaseName: string;
}

// @TODO: get 0 and 120 min/max age values from the backend.
const NewCaseValidation = Yup.object().shape(
    {
        caseStatus: Yup.string()
            .oneOf(['confirmed', 'suspected', 'discarded', 'omit_error'])
            .required(),
        caseReference: Yup.object().shape({
            sourceUrl: Yup.string().required('Required'),
            sourceName: Yup.string().when('caseReference.sourceId', {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                is: (sourceId: any) => !sourceId,
                then: Yup.string().required('Required'),
            }),
        }),
        pathogen: Yup.string().required('Required'),
        location: Yup.object().shape({
            country: Yup.string().required('Required'),
            countryISO3: Yup.string().required('Required'),
        }),
        events: Yup.object().shape({
            dateEntry: Yup.date().required('Required'),
        }),
        demographics: Yup.object().shape({
            minAge: Yup.number()
                .min(0, 'Age must be between 0 and 120')
                .max(120, 'Age must be between 0 and 120')
                .when('demographics.maxAge', {
                    is: (maxAge: number | string) =>
                        maxAge !== undefined && maxAge !== '',
                    then: Yup.number().required(
                        'Min age required in range. Minimum value is 0.',
                    ),
                }),
            maxAge: Yup.number()
                .min(0, 'Age must be between 0 and 120')
                .max(120, 'Age must be between 0 and 120')
                .when('demographics.minAge', {
                    is: (minAge: number | string) =>
                        minAge !== undefined && minAge !== '',
                    then: Yup.number()
                        .min(
                            Yup.ref('demographics.minAge'),
                            'Max age must be greater than than min age',
                        )
                        .required(
                            'Max age required in range. Maximum value is 120.',
                        ),
                }),
            age: Yup.number()
                .min(0, 'Age must be between 0 and 120')
                .max(120, 'Age must be between 0 and 120')
                .when('demographics.minAge', {
                    is: (minAge: number | string) =>
                        minAge !== undefined && minAge !== '',
                    then: Yup.number().oneOf(
                        [undefined],
                        'Cannot enter age and age range',
                    ),
                })
                .when('demographics.maxAge', {
                    is: (maxAge: number | string) =>
                        maxAge !== undefined && maxAge !== '',
                    then: Yup.number().oneOf(
                        [undefined],
                        'Cannot enter age and age range',
                    ),
                }),
        }),
        numCases: Yup.number()
            .nullable()
            .min(1, 'Must enter one or more cases'),
    },
    [['demographics.maxAge', 'demographics.minAge']],
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
    const diseaseName = useAppSelector(selectDiseaseName);

    const submitCase = async (values: Day0CaseFormValues): Promise<void> => {
        if (values.caseReference && values.caseReference.sourceId === '') {
            try {
                const newCaseReference = await submitSource({
                    name: values.caseReference.sourceName as string,
                    url: values.caseReference.sourceUrl,
                    license: values.caseReference.sourceLicense as string,
                    providerName: values.caseReference.sourceProviderName,
                    providerWebsiteUrl: values.caseReference.sourceProviderUrl,
                });
                values.caseReference.sourceId = newCaseReference.sourceId;
            } catch (e) {
                setErrorMessage(
                    `System error during source creation: ${JSON.stringify(e)}`,
                );
                return;
            }
        }

        let ageRange = '';
        const { minAge, maxAge, age } = values.demographics;
        if (age || (minAge && maxAge)) {
            ageRange = age ? age : `${minAge}-${maxAge}`;
        }

        const preexistingConditions = values.preexistingConditionsHelper || [];
        const vaccineSideEffects = values.vaccineSideEffects || [];
        const symptoms = values.symptoms || [];

        const newCase: Day0Case = {
            ...values,
            demographics: {
                ...values.demographics,
                age: ageRange,
            },
            preexistingConditions: {
                ...values.preexistingConditions,
                preexistingCondition: preexistingConditions.join(', '),
            },
            vaccination: {
                ...values.vaccination,
                vaccineSideEffects: vaccineSideEffects.join(', '),
            },
            symptoms: symptoms.join(', '),
        };

        console.log(`new case: ${JSON.stringify(newCase, null, 2)}`);

        let newCaseId = '';
        try {
            // Update or create depending on the presence of the initial case ID.
            if (props.initialCase?.caseReference.id) {
                await axios.put(
                    `/api/cases/${props.initialCase?.caseReference.id}`,
                    newCase,
                );
            } else {
                const postResponse = await axios.post(`/api/cases`, newCase);
                newCaseId = postResponse.data._id;
            }
            setErrorMessage('');
        } catch (e) {
            setErrorMessage(e.response?.data?.message || e.toString());
            return;
        }
        // Navigate to cases after successful submit
        history.push({
            pathname: '/cases',
            state: {
                newCaseIds: newCaseId,
                editedCaseIds: props.initialCase?.caseReference.id
                    ? [props.initialCase.caseReference.id]
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
        // eslint-disable-next-line
        requiredValues?: any[];
        // eslint-disable-next-line
        optionalValues?: any[];
    }): boolean => {
        // When there are no required values provided check whether any of optional values is valid
        if (!requiredValues || requiredValues.length === 0) {
            return optionalValues
                ? optionalValues.some((value) => {
                      if (value && typeof value === 'object') {
                          return value.length > 0;
                      }

                      return !!value;
                  })
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
            {diseaseName && (
                <Formik
                    initialValues={initialValuesFromCase(
                        diseaseName,
                        initialCase,
                    )}
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
                                        onClick={(): void =>
                                            scrollTo('general')
                                        }
                                    >
                                        {tableOfContentsIcon({
                                            isChecked: isChecked({
                                                requiredValues: [
                                                    values.caseStatus,
                                                    values.pathogen,
                                                ],
                                            }),
                                            hasError: hasErrors(
                                                ['caseStatus', 'pathogen'],
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
                                                    values.caseReference
                                                        .sourceUrl,
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
                                                    values.demographics.gender,
                                                    values.demographics.age,
                                                    values.demographics
                                                        .occupation,
                                                    values.demographics
                                                        .healthcareWorker,
                                                ],
                                            }),
                                            hasError: hasErrors(
                                                ['demographics'],
                                                errors,
                                                touched,
                                            ),
                                        })}
                                        {'Demographics'.toLocaleUpperCase()}
                                    </TableOfContentsRow>

                                    <TableOfContentsRow
                                        onClick={(): void =>
                                            scrollTo('location')
                                        }
                                    >
                                        {tableOfContentsIcon({
                                            isChecked: isChecked({
                                                requiredValues: [
                                                    values.location.countryISO3,
                                                    values.location
                                                        .geocodeLocation,
                                                ],
                                            }),
                                            hasError: hasErrors(
                                                ['location'],
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
                                                    values.events.dateEntry,
                                                ],
                                            }),
                                            hasError: hasErrors(
                                                ['events'],
                                                errors,
                                                touched,
                                            ),
                                        })}
                                        {'Events'.toLocaleUpperCase()}
                                    </TableOfContentsRow>
                                    <TableOfContentsRow
                                        onClick={(): void =>
                                            scrollTo('symptoms')
                                        }
                                    >
                                        {tableOfContentsIcon({
                                            isChecked: isChecked({
                                                optionalValues: [
                                                    values.symptoms,
                                                ],
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
                                                    values.preexistingConditions
                                                        .previousInfection,
                                                    values.preexistingConditions
                                                        .coInfection,
                                                    values.preexistingConditionsHelper,
                                                    values.preexistingConditions
                                                        .pregnancyStatus,
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
                                                    values.transmission
                                                        .contactWithCase,
                                                    values.transmission
                                                        .contactId,
                                                    values.transmission
                                                        .contactSetting,
                                                    values.transmission
                                                        .contactAnimal,
                                                    values.transmission
                                                        .contactComment,
                                                    values.transmission
                                                        .transmission,
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
                                                    values.travelHistory
                                                        .travelHistory,
                                                    values.travelHistory
                                                        .travelHistoryEntry,
                                                    values.travelHistory
                                                        .travelHistoryStart,
                                                    values.travelHistory
                                                        .travelHistoryLocation,
                                                    values.travelHistory
                                                        .travelHistoryCountry,
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
                                                    values.genomeSequences
                                                        .genomicsMetadata,
                                                    values.genomeSequences
                                                        .accessionNumber,
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
                                        onClick={(): void =>
                                            scrollTo('vaccines')
                                        }
                                    >
                                        {tableOfContentsIcon({
                                            isChecked: isChecked({
                                                optionalValues: [
                                                    values.vaccination
                                                        .vaccination,
                                                    values.vaccination
                                                        .vaccineName,
                                                    values.vaccination
                                                        .vaccineDate,
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
                                    {!props.initialCase && (
                                        <TableOfContentsRow
                                            onClick={(): void =>
                                                scrollTo('numCases')
                                            }
                                        >
                                            {tableOfContentsIcon({
                                                isChecked:
                                                    values.numCases !== 1,
                                                hasError: hasErrors(
                                                    ['numCases'],
                                                    errors,
                                                    touched,
                                                ),
                                            })}
                                            {'Number of cases'.toLocaleUpperCase()}
                                        </TableOfContentsRow>
                                    )}
                                </TableOfContents>
                            )}
                            <StyledForm
                                showTableOfContents={showTableOfContents}
                            >
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
                                        <Vaccines />
                                    </FormSection>
                                    {!props.initialCase && (
                                        <FormSection>
                                            <NumCases />
                                        </FormSection>
                                    )}
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
                                        sx={{
                                            marginTop: '1em',
                                            maxWidth: '80%',
                                        }}
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
            )}
        </AppModal>
    );
}
