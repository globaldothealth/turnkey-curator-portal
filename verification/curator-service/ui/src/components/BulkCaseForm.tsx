import * as Yup from 'yup';

import { useState } from 'react';
import { Button, CircularProgress, Typography } from '@mui/material';
import {
    CaseReference,
    CaseStatus,
    Gender,
    Outcome,
    HospitalizationReason,
    YesNo,
    Day0Case,
} from '../api/models/Day0Case';
import { Form, Formik } from 'formik';
import Papa, { ParseLocalConfig, ParseResult } from 'papaparse';
import Source, { submitSource } from './common-form-fields/Source';

import Alert from '@mui/material/Alert';
import AppModal from './AppModal';
import BulkCaseFormValues from './bulk-case-form-fields/BulkCaseFormValues';
import CaseValidationError from './bulk-case-form-fields/CaseValidationError';
import FileUpload from './bulk-case-form-fields/FileUpload';
import { Paper } from '@mui/material';
import ValidationErrorList from './bulk-case-form-fields/ValidationErrorList';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import makeStyles from '@mui/styles/makeStyles';

// Return type isn't meaningful.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const useStyles = makeStyles((theme) => ({
    headerBlurb: {
        maxWidth: '70%',
        paddingBottom: '3em',
        paddingTop: '1em',
    },
    headerText: {
        marginTop: '2em',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        paddingLeft: '3em',
        paddingRight: '4em',
    },
    formSection: {
        paddingBottom: '2em',
    },
    allFormSections: {
        marginBottom: '2em',
        maxWidth: '60%',
        paddingLeft: '1em',
        paddingRight: '1em',
        paddingTop: '0.5em',
    },
    statusMessage: {
        marginTop: '2em',
        maxWidth: '80%',
    },
    uploadFeedback: {
        paddingBottom: '4em',
    },
    uploadBar: {
        alignItems: 'center',
        display: 'flex',
        height: '4em',
        marginTop: 'auto',
    },
    cancelButton: {
        marginLeft: '1em',
    },
    progressIndicator: {
        alignItems: 'center',
        display: 'flex',
    },
    progressText: {
        marginLeft: '1em',
    },
}));

interface BulkCaseFormProps {
    onModalClose: () => void;
}

interface AgeRange {
    start?: number;
    end?: number;
}

/**
 * Flattened case representation.
 *
 * Composed of fields present in the standardized manual upload CSV. Comments
 * denote sections of the canonical case object to which fields correspond,
 * where applicable.
 * Variant of concern has been added, which wasn't in the CSV.
 */
interface RawParsedCase {
    // Interface index
    [key: string]: string | number | boolean | undefined;

    caseStatus: CaseStatus;
    pathogen: string;

    // CaseReference
    // sourceId and sourceUrl are provided elsewhere in the form
    sourceEntryId?: string;

    // Demographics
    gender?: Gender;
    // Convenience field to provide age range in $start-$end format.
    ageRange?: string;
    ageRangeStart?: number;
    ageRangeEnd?: number;
    occupation?: string;
    healthcareWorker?: YesNo;

    // Events
    dateEntry: string;
    dateOnset?: string;
    dateConfirmation?: string;
    confirmationMethod?: string;
    dateOfFirstConsult?: string;
    hospitalized?: YesNo;
    reasonForHospitalization?: HospitalizationReason;
    dateHospitalization?: string;
    dateDischargeHospital?: string;
    intensiveCare?: YesNo;
    dateAdmissionICU?: string;
    dateDischargeICU?: string;
    homeMonitoring?: YesNo;
    isolated?: YesNo;
    dateIsolation?: string;
    outcome?: Outcome;
    dateDeath?: string;
    dateRecovered?: string;

    // Preexisting conditions
    previousInfection?: YesNo;
    coInfection?: string;
    preexistingCondition?: string;
    pregnancyStatus?: YesNo;

    // Symptoms
    symptoms?: string; // semicolon delimited list

    // Location
    country: string;
    countryISO3: string;
    location?: string;
    city?: string;

    // Bulk upload specific data
    caseCount?: number;
}

interface BatchUpsertError {
    index: number;
    message: string;
}

interface BatchUpsertResponse {
    phase: string;
    numCreated: number;
    numUpdated: number;
    errors: BatchUpsertError[];
}

interface UploadSummary {
    numCreated?: number;
    numUpdated?: number;
    error?: string;
}

interface Upload {
    _id: string;
    status: string;
    summary: UploadSummary;
    created: Date;
}

// See description below for usage. This is a mapped partial type that
// reproduces the fields of <T>, including for nested fields. The non-
// recursive variant of this is easier to understand, and is explained here:
//
//   https://www.typescriptlang.org/docs/handbook/advanced-types.html#mapped-types
//
// By changing the field type from T[P] to RecursivePartial<T[P]>, we can make
// nested fields optional; which is important for this specific abstraction.
type RecursivePartial<T> = {
    [P in keyof T]?: RecursivePartial<T[P]>;
};

// Re-use the case model defined in this dir, but with all optional fields.
// Existing components rely on pseudo-optional semantics for most fields in the
// case object (e.g., relying on axios only to populate the fields indicated by
// the case API), but we can't cleanly do that here, since we're directly both
// populating and using the values in the object.
//
// TODO: Consider defining truly optional fields as optional in Case.tsx.
type CompleteParsedCase = RecursivePartial<Day0Case> & { caseCount?: number };

const BulkFormSchema = Yup.object().shape({
    caseReference: Yup.object().shape({
        sourceUrl: Yup.string().required('Required'),
        sourceName: Yup.string().required('Required'),
    }),
    file: Yup.mixed().required('Please upload a file'),
});

const BulkCaseForm = (props: BulkCaseFormProps) => {
    const { onModalClose } = props;

    const history = useHistory();
    const classes = useStyles();

    const [errorMessage, setErrorMessage] = useState('');
    const [errors, setErrors] = useState<CaseValidationError[]>([]);

    const createLocationQuery = (c: RawParsedCase): string => {
        return c.location
            ? c.location
            : [c.city, c.country].filter((field) => field).join(', ');
    };

    const createAgeRange = (c: RawParsedCase): AgeRange => {
        let ageRangeStart = c.ageRangeStart;
        let ageRangeEnd = c.ageRangeEnd;
        if (c.ageRange?.match(/^\d*-\d*$/)) {
            const startEnd = c.ageRange.split('-');
            ageRangeStart = startEnd[0] ? Number(startEnd[0]) : undefined;
            ageRangeEnd = startEnd[1] ? Number(startEnd[1]) : undefined;
        }
        return { start: ageRangeStart, end: ageRangeEnd };
    };

    /**
     * Create an API-ready case object from parsed case data.
     *
     * TODO: Put the Raw->CompleteParsedCase conversion logic in a separate
     * class, and unit test the API. Right now it's just verified via a single
     * Cypress case.
     */
    const createCaseObject = (
        c: RawParsedCase,
        ageRange: AgeRange,
        caseReference: CaseReference,
        uploadId: string,
    ): CompleteParsedCase => {
        return {
            caseStatus: c.caseStatus,
            pathogen: c.pathogen,
            caseReference: {
                sourceId: caseReference.sourceId,
                sourceEntryId: c.sourceEntryId?.toString(),
                sourceUrl: caseReference.sourceUrl,
                uploadIds: [uploadId],
            },
            demographics: {
                gender: c.gender,
                ageRange: ageRange,
                occupation: c.occupation,
                healthcareWorker: c.healthcareWorker,
            },
            location: {
                country: c.country,
                countryISO3: c.countryISO3,
                city: c.city,
                location: c.location,
                query: createLocationQuery(c),
            },
            events: {
                dateEntry: c.dateEntry,
                dateOnset: c.dateOnset,
                dateConfirmation: c.dateConfirmation,
                confirmationMethod: c.confirmationMethod,
                dateOfFirstConsult: c.dateOfFirstConsult,
                hospitalized: c.hospitalized,
                reasonForHospitalization: c.reasonForHospitalization,
                dateHospitalization: c.dateHospitalization,
                dateDischargeHospital: c.dateDischargeHospital,
                intensiveCare: c.intensiveCare,
                dateAdmissionICU: c.dateAdmissionICU,
                dateDischargeICU: c.dateDischargeICU,
                homeMonitoring: c.homeMonitoring,
                isolated: c.isolated,
                dateIsolation: c.dateIsolation,
                outcome: c.outcome,
                dateDeath: c.dateDeath,
                dateRecovered: c.dateRecovered,
            },
            symptoms: c.symptoms,
            caseCount: c.caseCount,
            // TBD whether we need those added to the CSV
            preexistingConditions: {
                previousInfection: c.previousInfection,
                coInfection: c.coInfection,
                preexistingCondition: c.preexistingCondition,
                pregnancyStatus: c.pregnancyStatus,
            },
            transmission: {},
            travelHistory: {},
            vaccination: {},
            genomeSequences: {},
        };
    };

    const batchUpsertCases = async (
        cases: CompleteParsedCase[],
    ): Promise<BatchUpsertResponse> => {
        const casesToSend = cases.flatMap((c) =>
            Array.from({ length: c.caseCount || 1 }, () => c),
        );

        // TODO: Split and send smaller batches.
        const response = await axios.post<BatchUpsertResponse>(
            '/api/cases/batchUpsert',
            {
                cases: casesToSend,
            },
            { maxContentLength: Infinity },
        );
        return response.data;
    };

    const createUpload = async (
        caseReference: CaseReference,
    ): Promise<string> => {
        const response = await axios.post<Upload>(
            `/api/sources/${caseReference.sourceId}/uploads`,
            {
                status: 'IN_PROGRESS',
                summary: {},
            },
        );
        return response.data._id;
    };

    const finalizeUpload = async (
        sourceId: string,
        uploadId: string,
        status: string,
        summary: UploadSummary,
    ): Promise<void> => {
        await axios.put(`/api/sources/${sourceId}/uploads/${uploadId}`, {
            status: status,
            summary: summary,
        });
    };

    const uploadData = async (
        results: ParseResult<RawParsedCase>,
        caseReference: CaseReference,
        filename: string,
    ): Promise<void> => {
        const uploadId = await createUpload(caseReference);
        const cases = results.data.map((c) => {
            // papaparse uses null to fill values that are empty in the CSV.
            // I'm not clear how it does so -- since our types aren't union
            // null -- but it does.
            // Here, replace these with undefined so that they aren't populated
            // in the axios request object.
            Object.keys(c).forEach(
                (field) =>
                    (c[field] = c[field] === null ? undefined : c[field]),
            );
            const ageRange = createAgeRange(c);
            return createCaseObject(c, ageRange, caseReference, uploadId);
        });

        let upsertResponse: BatchUpsertResponse;
        try {
            upsertResponse = await batchUpsertCases(cases);
        } catch (e) {
            setErrorMessage(`System error during upload: ${e.message}`);
            await finalizeUpload(caseReference.sourceId, uploadId, 'ERROR', {
                error: 'DATA_UPLOAD_ERROR',
            });
            return;
        }
        const validationErrors = upsertResponse.errors.map(
            (e) => new CaseValidationError(e.index + 1, e.message),
        );
        setErrors(validationErrors);
        if (validationErrors.length > 0) {
            setErrorMessage('');
            await finalizeUpload(caseReference.sourceId, uploadId, 'ERROR', {
                error: 'VALIDATION_ERROR',
            });
            return;
        }
        await finalizeUpload(caseReference.sourceId, uploadId, 'SUCCESS', {
            numCreated: upsertResponse.numCreated,
            numUpdated: upsertResponse.numUpdated,
        });
        const createdMessage =
            upsertResponse.numCreated === 0
                ? ''
                : upsertResponse.numCreated === 1
                ? '1 new case added. '
                : `${upsertResponse.numCreated} new cases added. `;
        const updatedMessage =
            upsertResponse.numUpdated === 0
                ? ''
                : upsertResponse.numUpdated === 1
                ? '1 case updated. '
                : `${upsertResponse.numUpdated} cases updated. `;

        history.push({
            pathname: '/cases',
            state: {
                bulkMessage: `${filename} uploaded. ${createdMessage} ${updatedMessage}`,
                searchQuery: `uploadid:${uploadId}`,
            },
        });
    };

    const submitCases = async (
        values: BulkCaseFormValues,
    ): Promise<unknown> => {
        if (values.caseReference && values.caseReference.sourceId === '') {
            try {
                const newCaseReference = await submitSource({
                    name: values.caseReference.sourceName as string,
                    url: values.caseReference.sourceUrl,
                    license: values.caseReference.sourceLicense as string,
                    providerName: values.caseReference.sourceProviderName,
                    providerWebsiteUrl: values.caseReference.sourceProviderUrl,
                    format: 'CSV',
                });
                values.caseReference.sourceId = newCaseReference.sourceId;
            } catch (e) {
                setErrorMessage(
                    `System error during source creation: ${e.message}`,
                );
                return;
            }
        }
        if (values.file && values.caseReference) {
            const parsePromise = (
                file: File,
                caseReference: CaseReference,
            ): Promise<unknown> => {
                return new Promise((resolve) => {
                    const papaparseOptions: ParseLocalConfig<
                        RawParsedCase,
                        File
                    > = {
                        complete: async (results) => {
                            await uploadData(results, caseReference, file.name);
                            resolve(null);
                        },
                        dynamicTyping: true,
                        header: true,
                        skipEmptyLines: true,
                    };
                    Papa.parse<RawParsedCase, File>(file, papaparseOptions);
                });
            };
            return parsePromise(values.file, values.caseReference);
        }
    };

    return (
        <AppModal title="New bulk upload" onModalClose={onModalClose}>
            <Formik
                validationSchema={BulkFormSchema}
                validateOnChange={false}
                initialValues={{ file: null, caseReference: undefined }}
                onSubmit={async (values): Promise<void> => {
                    await submitCases(values);
                }}
            >
                {({ isSubmitting, submitForm }): JSX.Element => (
                    <div className={classes.form}>
                        <div className={classes.headerText}>
                            <Typography data-testid="header-title" variant="h5">
                                Upload bulk data
                            </Typography>
                            <Typography
                                className={classes.headerBlurb}
                                data-testid="header-blurb"
                                variant="body2"
                            >
                                Add new cases or make changes to existing ones
                                by uploading a CSV file. The CSV needs to follow
                                the case template format for successful entries.{' '}
                                {/* TODO: Host the final CSV template. */}
                                <a
                                    href="https://docs.google.com/spreadsheets/d/1J-C7dq1rNNV8KdE1IZ-hUR6lsz7AdlvQhx6DWp36bjE/export?format=csv"
                                    rel="noopener noreferrer"
                                    target="_blank"
                                >
                                    Download case template (.csv)
                                </a>
                            </Typography>
                        </div>
                        <Form>
                            <Paper className={classes.allFormSections}>
                                <div className={classes.formSection}>
                                    <Source />
                                </div>
                                <div className={classes.formSection}>
                                    <FileUpload></FileUpload>
                                </div>
                            </Paper>
                            {/* TODO: Host the final instructions doc. */}
                            <a
                                href="https://github.com/globaldothealth/list/tree/main/verification/curator-service/ui#bulk-upload-process"
                                rel="noopener noreferrer"
                                target="_blank"
                            >
                                Need help? Detailed instructions here
                            </a>
                            <div className={classes.uploadFeedback}>
                                {errors.length > 0 && (
                                    <ValidationErrorList
                                        errors={errors}
                                        maxDisplayErrors={10}
                                    />
                                )}
                                {errorMessage && (
                                    <Alert
                                        className={classes.statusMessage}
                                        severity="error"
                                    >
                                        {errorMessage}
                                    </Alert>
                                )}
                            </div>
                        </Form>
                        <div className={classes.uploadBar}>
                            <Button
                                variant="contained"
                                color="primary"
                                data-testid="submit"
                                disabled={isSubmitting}
                                onClick={submitForm}
                            >
                                Upload Cases
                            </Button>
                            <Button
                                className={classes.cancelButton}
                                color="primary"
                                disabled={isSubmitting}
                                onClick={onModalClose}
                                variant="outlined"
                            >
                                Cancel
                            </Button>
                            <span style={{ flexGrow: 1 }}></span>
                            {isSubmitting && (
                                <div className={classes.progressIndicator}>
                                    <CircularProgress data-testid="progress" />
                                    <span className={classes.progressText}>
                                        <strong>Uploading cases</strong>
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Formik>
        </AppModal>
    );
};

export default BulkCaseForm;
