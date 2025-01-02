import * as Yup from 'yup';

import {
    Alert as MuiAlert,
    Button,
    LinearProgress,
    Paper,
    Typography,
} from '@mui/material';
import { Form, Formik } from 'formik';
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
import PreexistingConditions from './new-case-form-fields/PreexistingConditions';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import React from 'react';
import Scroll from 'react-scroll';
import Symptoms from './new-case-form-fields/Symptoms';
import Transmission from './new-case-form-fields/Transmission';
import TravelHistory from './new-case-form-fields/TravelHistory';
import Vaccines from './new-case-form-fields/Vaccines';
import { hasKey } from './Utils';
import { useNavigate } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { Day0Case, Day0CaseFormValues } from '../api/models/Day0Case';
import axios from 'axios';
import Source, { submitSource } from './common-form-fields/Source';
import General from './new-case-form-fields/General';
import NumCases from './new-case-form-fields/NumCases';
import { toLocalDate, toUTCDate } from './util/date';

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
        // return minimal viable case
        return {
            caseStatus: '',
            comment: '',
            caseReference: {
                sourceId: '',
                sourceUrl: '',
                isGovernmentSource: false,
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
                geoResolution: undefined,
                country: '',
                countryISO3: '',
                location: '',
                admin1: '',
                admin1WikiId: '',
                admin2: '',
                admin2WikiId: '',
                admin3: '',
                admin3WikiId: '',
                geometry: {
                    latitude: undefined,
                    longitude: undefined,
                },
            },
            events: {
                dateEntry: null,
                dateReported: null,
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
            geoResolution: c.location.geoResolution || '',
            country: c.location.country || '',
            countryISO3: c.location.countryISO3 || '',
            location: c.location.location || '',
            admin1: c.location.admin1 || '',
            admin1WikiId: c.location.admin1WikiId || '',
            admin2: c.location.admin2 || '',
            admin2WikiId: c.location.admin2WikiId || '',
            admin3: c.location.admin3 || '',
            admin3WikiId: c.location.admin3WikiId || '',
            geocodeLocation: {
                country: c.location.country,
                countryISO3: c.location.countryISO3,
                name: c.location.name || '',
                geoResolution: c.location.geoResolution || '',
                admin1: c.location.admin1 || '',
                admin2: c.location.admin2 || '',
                admin3: c.location.admin3 || '',
                location: c.location.location || '',
            },
            query: c.location.query || '',
            geometry: c.location.geometry || {
                latitude: undefined,
                longitude: undefined,
            },
            comment: c.location.comment || '',
        },
        pathogen,
        symptoms: c.symptoms ? c.symptoms.split(', ') : [],
        vaccination: {
            ...c.vaccination,
            vaccineSideEffects: c.vaccination.vaccineSideEffects?.split(', '),
            vaccineDate: toLocalDate(c.vaccination.vaccineDate),
        },
        preexistingConditions: {
            ...c.preexistingConditions,
            preexistingCondition: c.preexistingConditions.preexistingCondition
                ? c.preexistingConditions.preexistingCondition.split(', ')
                : [],
        },
        travelHistory: {
            ...c.travelHistory,
            travelHistoryEntry: toLocalDate(c.travelHistory.travelHistoryEntry),
        },
        events: {
            ...c.events,
            dateEntry: toLocalDate(c.events.dateEntry),
            dateReported: toLocalDate(c.events.dateReported),
            dateOnset: toLocalDate(c.events.dateOnset),
            dateConfirmation: toLocalDate(c.events.dateConfirmation),
            dateOfFirstConsult: toLocalDate(c.events.dateOfFirstConsult),
            dateHospitalization: toLocalDate(c.events.dateHospitalization),
            dateDischargeHospital: toLocalDate(c.events.dateDischargeHospital),
            dateAdmissionICU: toLocalDate(c.events.dateAdmissionICU),
            dateDischargeICU: toLocalDate(c.events.dateDischargeICU),
            dateIsolation: toLocalDate(c.events.dateIsolation),
            dateDeath: toLocalDate(c.events.dateDeath),
            dateRecovered: toLocalDate(c.events.dateRecovered),
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
    bundleId?: string;
    onModalClose: () => void;
    diseaseName: string;
}

const sourceURLValidation = (str: string | undefined) => {
    if (!str) return false;
    if (str.length > 0) {
        const pattern = new RegExp(
            '^(https?:\\/\\/)?' + // protocol
                '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
                '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
                '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
                '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
                '(\\#[-a-z\\d_]*)?$',
            'i',
        ); // fragment locator
        return pattern.test(str);
    } else {
        return false;
    }
};

// @TODO: get 0 and 120 min/max age values from the backend.
const NewCaseValidation = Yup.object().shape(
    {
        caseStatus: Yup.string()
            .oneOf(['confirmed', 'suspected', 'discarded', 'omit_error'])
            .required('Required'),
        comment: Yup.string(),
        caseReference: Yup.object().shape({
            sourceUrl: Yup.string()
                .required('Required')
                .test('valid-url', 'Invalid URL', sourceURLValidation),
        }),
        pathogen: Yup.string().required('Required'),
        location: Yup.object().shape({
            countryISO3: Yup.string().required('Required'),
        }),
        events: Yup.object().shape({
            dateEntry: Yup.date().typeError('Required').required('Required'),
            dateReported: Yup.date().typeError('Required').required('Required'),
        }),
        demographics: Yup.object().shape({
            minAge: Yup.number()
                .min(0, 'Age must be between 0 and 120')
                .max(120, 'Age must be between 0 and 120')
                .when('demographics.maxAge', {
                    is: (maxAge: number | string) =>
                        maxAge !== undefined && maxAge !== '',
                    then: () =>
                        Yup.number().required(
                            'Min age required in range. Minimum value is 0.',
                        ),
                }),
            maxAge: Yup.number()
                .min(0, 'Age must be between 0 and 120')
                .max(120, 'Age must be between 0 and 120')
                .when('demographics.minAge', {
                    is: (minAge: number | string) =>
                        minAge !== undefined && minAge !== '',
                    then: () =>
                        Yup.number()
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
                    then: () =>
                        Yup.number().oneOf(
                            [undefined],
                            'Cannot enter age and age range',
                        ),
                })
                .when('demographics.maxAge', {
                    is: (maxAge: number | string) =>
                        maxAge !== undefined && maxAge !== '',
                    then: () =>
                        Yup.number().oneOf(
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
    const navigate = useNavigate();
    const [errorMessage, setErrorMessage] = React.useState('');
    const diseaseName = useAppSelector(selectDiseaseName);

    const submitCase = async (values: Day0CaseFormValues): Promise<void> => {
        if (values.location.geoResolution === '') {
            values.location.geoResolution = undefined;
        }
        if (values.caseReference && values.caseReference.sourceId === '') {
            try {
                const newCaseReference = await submitSource({
                    name: values.caseReference.sourceName as string,
                    url: values.caseReference.sourceUrl,
                    license: values.caseReference.sourceLicense as string,
                    providerName: values.caseReference.sourceProviderName,
                    providerWebsiteUrl: values.caseReference.sourceProviderUrl,
                    isGovernmentSource: values.caseReference.isGovernmentSource,
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
        const admin1 = values.location.admin1;
        const admin2 = values.location.admin2;
        const admin3 = values.location.admin3;
        const country = values.location.country;
        let query;
        if (values.location.geocodeLocation?.query) {
            query = values.location.geocodeLocation.query;
        } else {
            query = [admin3, admin2, admin1, country].filter(Boolean).join(',');
        }
        const location = [admin3, admin2, admin1, country]
            .filter(Boolean)
            .join(', ');

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
                dateEntry: toUTCDate(values.events.dateEntry) || null,
                dateReported: toUTCDate(values.events.dateReported) || null,
                dateOnset: toUTCDate(values.events.dateOnset),
                dateConfirmation: toUTCDate(values.events.dateConfirmation),
                confirmationMethod:
                    values.events.confirmationMethod || undefined,
                dateOfFirstConsult: toUTCDate(values.events.dateOfFirstConsult),
                hospitalized: values.events.hospitalized || undefined,
                reasonForHospitalization:
                    values.events.reasonForHospitalization || undefined,
                dateHospitalization: toUTCDate(
                    values.events.dateHospitalization,
                ),
                dateDischargeHospital: toUTCDate(
                    values.events.dateDischargeHospital,
                ),
                intensiveCare: values.events.intensiveCare || undefined,
                dateAdmissionICU: toUTCDate(values.events.dateAdmissionICU),
                dateDischargeICU: toUTCDate(values.events.dateDischargeICU),
                homeMonitoring: values.events.homeMonitoring || undefined,
                isolated: values.events.isolated || undefined,
                dateIsolation: toUTCDate(values.events.dateIsolation),
                outcome: values.events.outcome || undefined,
                dateDeath: toUTCDate(values.events.dateDeath),
                dateRecovered: toUTCDate(values.events.dateRecovered),
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
                vaccineDate: toUTCDate(values.vaccination.vaccineDate),
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
                travelHistoryEntry: toUTCDate(
                    values.travelHistory.travelHistoryEntry,
                ),
            },
            location: {
                ...values.location,
                location,
                country,
                query,
            },
            symptoms: symptoms.join(', '),
        };

        let newCaseIds = [];
        try {
            // Update case bundle
            if (props.bundleId) {
                await axios.put(`/api/cases/bundled/${props.bundleId}`, newCase);
            }
            // Update or create depending on the presence of the initial case ID.
            else if (props.initialCase?._id) {
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
            console.log(e.response)
            setErrorMessage(e.response?.data?.message || e.toString());
            return;
        }
        // Navigate to cases after successful submit
        navigate('/cases', {
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

    const initialTouched = {
        caseStatus: true,
        caseReference: { sourceUrl: true },
        location: { countryISO3: true },
        events: { dateEntry: true, dateReported: true },
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
                    initialTouched={initialTouched}
                    validationSchema={NewCaseValidation}
                    // Validating on change slows down the form too much. It will
                    // validate on blur and form submission.
                    validateOnChange={true}
                    validateOnMount={true}
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
                                                        ?.sourceUrl,
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
                                            scrollTo('location')
                                        }
                                    >
                                        {tableOfContentsIcon({
                                            isChecked: isChecked({
                                                requiredValues: [
                                                    values.location.countryISO3,
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
                                                    values.events.dateReported,
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
                                        <LocationForm />
                                    </FormSection>
                                    <FormSection>
                                        <Events />
                                    </FormSection>
                                    <FormSection>
                                        <Demographics />
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
