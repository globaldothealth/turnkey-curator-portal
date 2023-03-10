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
            demographics: {
                minAge: undefined,
                maxAge: undefined,
                age: undefined,
                gender: '',
                occupation: '',
                healthcareWorker: '',
            },
            location: {
                country: '',
                countryISO2: '',
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
                travelHistoryEntry: null,
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
        demographics: {
            ...c.demographics,
            minAge:
                c.demographics?.ageRange?.start !==
                c.demographics?.ageRange?.end
                    ? c.demographics?.ageRange?.start
                    : undefined,
            maxAge:
                c.demographics?.ageRange?.start !==
                c.demographics?.ageRange?.end
                    ? c.demographics?.ageRange?.end
                    : undefined,
            age:
                c.demographics?.ageRange?.start ===
                c.demographics?.ageRange?.end
                    ? c.demographics?.ageRange?.start
                    : undefined,
        },
        location: {
            ...c.location,
            geocodeLocation: {
                country: c.location.countryISO2,
                administrativeAreaLevel1: '',
                administrativeAreaLevel2: '',
                administrativeAreaLevel3: '',
                name: c.location.name || '',
                geoResolution: '',
                place: c.location.location || '',
            },
        },
        pathogen,
        symptoms: c.symptoms ? c.symptoms.split(', ') : [],
        vaccination: {
            ...c.vaccination,
            vaccineSideEffects: c.vaccination.vaccineSideEffects?.split(', '),
            vaccineDate: c.vaccination.vaccineDate || null,
        },
        preexistingConditions: {
            ...c.preexistingConditions,
            preexistingCondition: c.preexistingConditions.preexistingCondition
                ? c.preexistingConditions.preexistingCondition.split(', ')
                : [],
        },
        travelHistory: {
            ...c.travelHistory,
            travelHistoryEntry: c.travelHistory.travelHistoryEntry || null,
        },
        events: {
            ...c.events,
            dateOnset: c.events.dateOnset || null,
            dateConfirmation: c.events.dateConfirmation || null,
            dateOfFirstConsult: c.events.dateOfFirstConsult || null,
            dateHospitalization: c.events.dateHospitalization || null,
            dateDischargeHospital: c.events.dateDischargeHospital || null,
            dateAdmissionICU: c.events.dateAdmissionICU || null,
            dateDischargeICU: c.events.dateDischargeICU || null,
            dateIsolation: c.events.dateIsolation || null,
            dateDeath: c.events.dateDeath || null,
            dateRecovered: c.events.dateRecovered || null,
        },
        preexistingConditionsHelper: c.preexistingConditions
            .preexistingCondition
            ? c.preexistingConditions.preexistingCondition.split(', ')
            : [],
        transmissionHelper: c.transmission.transmission,
        vaccineSideEffects: c.vaccination.vaccineSideEffects
            ? c.vaccination.vaccineSideEffects.split(', ')
            : [],
        occupation: c.demographics.occupation,
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
            sourceName: Yup.string().when('sourceId', {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                is: (sourceId: any) => !sourceId,
                then: Yup.string().required('Required'),
            }),
        }),
        pathogen: Yup.string().required('Required'),
        location: Yup.object().shape({
            country: Yup.string().required('Required'),
            countryISO2: Yup.string().required('Required'),
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

        const ageRange = values.demographics.age
            ? {
                  start: Number(values.demographics.age),
                  end: Number(values.demographics.age),
              }
            : {
                  start: Number(values.demographics.minAge),
                  end: Number(values.demographics.maxAge),
              };

        const preexistingConditions = values.preexistingConditionsHelper || [];
        const vaccineSideEffects = values.vaccineSideEffects || [];
        const symptoms = values.symptoms || [];
        const city = values.location.city;
        const country = values.location.country;
        let query = '';
        if (values.location.geocodeLocation?.query) {
            query = values.location.geocodeLocation.query;
        } else {
            query = city ? `${city}, ${country}` : country;
        }

        const newCase: Day0Case = {
            ...values,
            demographics: {
                ...values.demographics,
                occupation: values.occupation,
                ageRange:
                    values.demographics.age ||
                    (values.demographics.minAge && values.demographics.minAge)
                        ? ageRange
                        : undefined,
                gender: values.demographics.gender || undefined,
                healthcareWorker:
                    values.demographics.healthcareWorker || undefined,
            },
            events: {
                ...values.events,
                dateOnset: values.events.dateOnset || undefined,
                dateConfirmation: values.events.dateConfirmation || undefined,
                confirmationMethod:
                    values.events.confirmationMethod || undefined,
                dateOfFirstConsult:
                    values.events.dateOfFirstConsult || undefined,
                hospitalized: values.events.hospitalized || undefined,
                reasonForHospitalization:
                    values.events.reasonForHospitalization || undefined,
                dateHospitalization:
                    values.events.dateHospitalization || undefined,
                dateDischargeHospital:
                    values.events.dateDischargeHospital || undefined,
                intensiveCare: values.events.intensiveCare || undefined,
                dateAdmissionICU: values.events.dateAdmissionICU || undefined,
                dateDischargeICU: values.events.dateDischargeICU || undefined,
                homeMonitoring: values.events.homeMonitoring || undefined,
                isolated: values.events.isolated || undefined,
                dateIsolation: values.events.dateIsolation || undefined,
                outcome: values.events.outcome || undefined,
                dateDeath: values.events.dateDeath || undefined,
                dateRecovered: values.events.dateRecovered || undefined,
            },
            preexistingConditions: {
                ...values.preexistingConditions,
                preexistingCondition: preexistingConditions.join(', '),
                previousInfection:
                    values.preexistingConditions.previousInfection || undefined,
                pregnancyStatus:
                    values.preexistingConditions.pregnancyStatus || undefined,
            },
            vaccination: {
                ...values.vaccination,
                vaccineSideEffects: vaccineSideEffects.join(', '),
                vaccination: values.vaccination.vaccination || undefined,
                vaccineDate: values.vaccination.vaccineDate || undefined,
            },
            transmission: {
                ...values.transmission,
                transmission: values.transmissionHelper,
                contactWithCase:
                    values.transmission.contactWithCase || undefined,
            },
            travelHistory: {
                ...values.travelHistory,
                travelHistory: values.travelHistory.travelHistory || undefined,
                travelHistoryEntry:
                    values.travelHistory.travelHistoryEntry || undefined,
            },
            location: {
                ...values.location,
                query,
            },
            symptoms: symptoms.join(', '),
        };

        let newCaseIds = [];
        try {
            // Update or create depending on the presence of the initial case ID.
            if (props.initialCase?._id) {
                await axios.put(
                    `/api/cases/${props.initialCase?._id}`,
                    newCase,
                );
            } else {
                const numCases = values.numCases ?? 1;
                const postResponse = await axios.post(
                    `/api/cases?num_cases=${numCases}`,
                    newCase,
                );
                if (numCases === 1) {
                    newCaseIds = [postResponse.data._id];
                } else {
                    newCaseIds = postResponse.data.cases.map(
                        (c: Day0Case) => c._id,
                    );
                }
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
                newCaseIds: newCaseIds,
                editedCaseIds: props.initialCase?._id
                    ? [props.initialCase._id]
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
                                                    values.location.countryISO2,
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
                                            hasSourceEntryId
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
