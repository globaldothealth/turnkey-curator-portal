import React from 'react';
import * as Yup from 'yup';
import { useAppSelector } from '../hooks/redux';
import { selectUser } from '../redux/auth/selectors';

import { Button, Paper, Typography, Theme } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { FastField, Form, Formik } from 'formik';

import AppModal from './AppModal';
import ChipInput from './ChipInput';
import FieldTitle from './common-form-fields/FieldTitle';
import MuiAlert from '@mui/material/Alert';
import { SelectField } from './common-form-fields/FormikFields';
import { TextField, CheckboxWithLabel } from 'formik-mui';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import countries from 'i18n-iso-countries';

// eslint-disable-next-line
enum Format {
    Csv = 'CSV',
    Json = 'JSON',
    Xlsx = 'XLSX',
}

const useStyles = makeStyles()((theme: Theme) => ({
    headerBlurb: {
        maxWidth: '70%',
        paddingBottom: '3em',
        paddingTop: '1em',
    },
    headerText: {
        marginTop: '2em',
    },
    fieldTitle: {
        paddingBottom: '1em',
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
        paddingLeft: '2em',
        paddingRight: '1em',
        paddingTop: '0.5em',
    },
    statusMessage: {
        marginTop: '2em',
        maxWidth: '80%',
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
    errorHelper: {
        color: theme.palette.error.main,
    },
}));

interface Props {
    onModalClose: () => void;
}

export interface AutomatedSourceFormValues {
    url: string;
    license: string;
    name: string;
    providerName: string;
    providerWebsiteUrl: string;
    countryCodes: string[];
    format: string;
    notificationRecipients: string[];
    excludeFromLineList: boolean;
    hasStableIdentifiers: boolean;
}

const AutomatedSourceFormSchema = Yup.object().shape({
    url: Yup.string().required('Required'),
    name: Yup.string().required('Required'),
    countryCodes: Yup.array().of(Yup.string()).required('Required'),
    format: Yup.string().required('Required'),
    license: Yup.string().required('Required'),
    providerName: Yup.string(),
    providerWebsiteUrl: Yup.string(),
    notificationRecipients: Yup.array().of(Yup.string().email()),
    excludeFromLineList: Yup.boolean().required('Required'),
    hasStableIdentifiers: Yup.boolean().required('Required'),
});

export default function AutomatedSourceForm(props: Props): JSX.Element {
    const { classes } = useStyles();
    const navigate = useNavigate();
    const [errorMessage, setErrorMessage] = React.useState('');

    const user = useAppSelector(selectUser);

    const countryCodesList = Object.keys(countries.getAlpha3Codes());

    const createSource = async (
        values: AutomatedSourceFormValues,
    ): Promise<void> => {
        const newSource = {
            name: values.name,
            countryCodes: values.countryCodes,
            origin: {
                url: values.url,
                license: values.license,
                providerName: values.providerName,
                providerWebsiteUrl: values.providerWebsiteUrl,
            },
            format: values.format,
            notificationRecipients: values.notificationRecipients,
            excludeFromLineList: values.excludeFromLineList,
            hasStableIdentifiers: values.hasStableIdentifiers,
        };
        try {
            await axios.post('/api/sources', newSource);
            setErrorMessage('');
        } catch (e) {
            setErrorMessage(e.response?.data?.message || e.toString());
            return;
        }
        // Navigate to sources after successful submit
        navigate('/sources');
    };

    return (
        <>
            {user ? (
                <AppModal
                    title="New automated data source"
                    onModalClose={props.onModalClose}
                >
                    <Formik
                        validationSchema={AutomatedSourceFormSchema}
                        validateOnChange={false}
                        initialValues={{
                            url: '',
                            name: '',
                            countryCodes: [],
                            format: '',
                            license: '',
                            providerName: '',
                            providerWebsiteUrl: '',
                            notificationRecipients: [user.email],
                            excludeFromLineList: false,
                            hasStableIdentifiers: false,
                        }}
                        onSubmit={async (values): Promise<void> => {
                            await createSource(values);
                        }}
                    >
                        {({
                            errors,
                            initialValues,
                            isSubmitting,
                            setFieldValue,
                            submitForm,
                            values,
                        }): JSX.Element => (
                            <div className={classes.form}>
                                <div className={classes.headerText}>
                                    <Typography
                                        data-testid="header-title"
                                        variant="h5"
                                    >
                                        Provide details about the automated data
                                        source
                                    </Typography>
                                    <Typography
                                        className={classes.headerBlurb}
                                        data-testid="header-blurb"
                                        variant="body2"
                                    >
                                        Add new cases through automated
                                        ingestion from a data source.
                                    </Typography>
                                </div>
                                <Form>
                                    <Paper className={classes.allFormSections}>
                                        <div className={classes.fieldTitle}>
                                            <FieldTitle title="Data Source" />
                                        </div>
                                        <div className={classes.formSection}>
                                            <FastField
                                                helperText="Required"
                                                label="Data Source URL"
                                                name="url"
                                                type="text"
                                                data-testid="url"
                                                component={TextField}
                                                fullWidth
                                            />
                                        </div>
                                        <div className={classes.formSection}>
                                            <FastField
                                                helperText="Required"
                                                label="Data Source Name"
                                                name="name"
                                                type="text"
                                                data-testid="name"
                                                component={TextField}
                                                fullWidth
                                            />
                                        </div>
                                        <div className={classes.formSection}>
                                            <ChipInput
                                                label="Country codes"
                                                placeholder="Two letter ISO-3166-1 country codes (or ZZ for world)"
                                                data-testid="countryCodes"
                                                values={values.countryCodes}
                                                options={countryCodesList}
                                                onChange={(values) =>
                                                    setFieldValue(
                                                        'countryCodes',
                                                        values ?? undefined,
                                                    )
                                                }
                                                helperText={
                                                    errors.countryCodes
                                                        ? 'Values must be valid country codes'
                                                        : undefined
                                                }
                                            />
                                        </div>
                                        <div className={classes.formSection}>
                                            <FastField
                                                helperText="Required (MIT, Apache V2, ...)"
                                                label="License"
                                                name="license"
                                                type="text"
                                                data-testid="license"
                                                component={TextField}
                                                fullWidth
                                            />
                                        </div>
                                        <div className={classes.formSection}>
                                            <FastField
                                                name="providerName"
                                                label="Data Provider Name"
                                                type="text"
                                                data-testid="providerName"
                                                component={TextField}
                                                fullWidth
                                            />
                                        </div>
                                        <div className={classes.formSection}>
                                            <FastField
                                                name="providerWebsiteUrl"
                                                label="Data Provider Website"
                                                type="text"
                                                data-testid="providerWebsiteUrl"
                                                component={TextField}
                                                fullWidth
                                            />
                                        </div>
                                        <div className={classes.formSection}>
                                            <SelectField
                                                name="format"
                                                label="Data Source Format"
                                                values={Object.values(Format)}
                                                required
                                            />
                                        </div>
                                        <div className={classes.formSection}>
                                            <FastField
                                                name="excludeFromLineList"
                                                component={CheckboxWithLabel}
                                                type="checkbox"
                                                // helperText="Whether cases from this source can appear in the line list"
                                                required
                                                data-testid="excludeFromLineList"
                                                Label={{
                                                    label: 'Exclude From Line List?',
                                                }}
                                            />
                                        </div>
                                        <div className={classes.formSection}>
                                            <FastField
                                                name="hasStableIdentifiers"
                                                component={CheckboxWithLabel}
                                                type="checkbox"
                                                // helperText="Whether cases from this source have unique, unchanging identifiers"
                                                required
                                                data-testid="hasStableIdentifiers"
                                                Label={{
                                                    label: 'Source has Stable Identifiers?',
                                                }}
                                            />
                                        </div>
                                        <div className={classes.formSection}>
                                            <ChipInput
                                                dataTestId="recipients"
                                                helperText={
                                                    errors.notificationRecipients
                                                        ? 'Values must be valid email addresses'
                                                        : undefined
                                                }
                                                label="Notification recipients"
                                                placeholder="Notification recipient emails"
                                                defaultValue={
                                                    initialValues.notificationRecipients
                                                }
                                                values={
                                                    values.notificationRecipients
                                                }
                                                onChange={(values) =>
                                                    setFieldValue(
                                                        'notificationRecipients',
                                                        values ?? undefined,
                                                    )
                                                }
                                            />
                                        </div>
                                    </Paper>
                                </Form>
                                {errorMessage && (
                                    <MuiAlert
                                        className={classes.statusMessage}
                                        elevation={6}
                                        variant="filled"
                                        severity="error"
                                    >
                                        {errorMessage}
                                    </MuiAlert>
                                )}
                                <div className={classes.uploadBar}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        data-testid="submit"
                                        disabled={isSubmitting}
                                        onClick={submitForm}
                                    >
                                        Create source
                                    </Button>
                                    <Button
                                        className={classes.cancelButton}
                                        color="primary"
                                        disabled={isSubmitting}
                                        onClick={props.onModalClose}
                                        variant="outlined"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Formik>
                </AppModal>
            ) : (
                <></>
            )}
        </>
    );
}
