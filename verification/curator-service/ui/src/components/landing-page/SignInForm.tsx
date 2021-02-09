import React from 'react';
import { Formik, Form, Field, FieldProps } from 'formik';
import { CheckboxWithLabel } from 'formik-material-ui';
import {
    FormHelperText,
    LinearProgress,
    Button,
    TextField,
} from '@material-ui/core';

interface Props {
    handleSubmit: (email: string, resetForm: () => void) => void;
    setIsAgreementChecked: (value: boolean) => void;
    setIsAgreementMessage: (value: boolean) => void;
    isSubmitting: boolean;
    isAgreementChecked: boolean;
    isAgreementMessage: boolean;
    classes: {
        emailField: any;
        divider: any;
        loader: any;
        signInButton: any;
    };
}

interface FormValues {
    email: string;
    isAgreementChecked: boolean;
}

export default function SignInForm({
    handleSubmit,
    setIsAgreementChecked,
    setIsAgreementMessage,
    isSubmitting,
    isAgreementChecked,
    isAgreementMessage,
    classes,
}: Props) {
    return (
        <Formik
            initialValues={{ email: '', isAgreementChecked: false }}
            validate={(values) => {
                const errors: Partial<FormValues> = {};
                if (!values.email) {
                    errors.email = 'Required';
                } else if (
                    !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(
                        values.email,
                    )
                ) {
                    errors.email = 'Invalid email address';
                }
                if (!values.isAgreementChecked) {
                    errors.isAgreementChecked = true;
                }

                return errors;
            }}
            onSubmit={(values, { resetForm }) =>
                handleSubmit(values.email, resetForm)
            }
        >
            {({ errors, touched, submitForm }) => (
                <Form>
                    <Field name="email">
                        {({ field, meta }: FieldProps<FormValues>) => (
                            <>
                                <TextField
                                    className={classes.emailField}
                                    label="Email"
                                    type="email"
                                    variant="outlined"
                                    disabled={isSubmitting}
                                    error={
                                        meta.error !== undefined && meta.touched
                                    }
                                    fullWidth
                                    {...field}
                                />
                                {meta.touched && meta.error && (
                                    <FormHelperText error>
                                        {meta.error}
                                    </FormHelperText>
                                )}
                            </>
                        )}
                    </Field>
                    <div className={classes.divider} />
                    <Field
                        component={CheckboxWithLabel}
                        type="checkbox"
                        name="isAgreementChecked"
                        onClick={() => {
                            setIsAgreementChecked(!isAgreementChecked);
                            setIsAgreementMessage(isAgreementChecked);
                        }}
                        disabled={isSubmitting}
                        Label={{
                            label: (
                                <small>
                                    By creating an account, I accept the
                                    Global.health{' '}
                                    <a
                                        href="https://test-globalhealth.pantheonsite.io/terms-of-use/"
                                        rel="noopener noreferrer"
                                        target="_blank"
                                    >
                                        Terms of Use
                                    </a>{' '}
                                    and{' '}
                                    <a
                                        href="https://test-globalhealth.pantheonsite.io/privacy/"
                                        rel="noopener noreferrer"
                                        target="_blank"
                                    >
                                        Privacy Policy
                                    </a>
                                    , and agree to be added to the newsletter
                                </small>
                            ),
                        }}
                    />
                    {(isAgreementMessage ||
                        (errors.isAgreementChecked &&
                            touched.isAgreementChecked)) && (
                        <FormHelperText error>
                            This agreement is required
                        </FormHelperText>
                    )}
                    {isSubmitting && (
                        <LinearProgress
                            className={classes.loader}
                            data-testid="loader"
                        />
                    )}
                    <Button
                        className={classes.signInButton}
                        variant="contained"
                        color="primary"
                        disabled={isSubmitting}
                        onClick={submitForm}
                    >
                        Sign in
                    </Button>
                </Form>
            )}
        </Formik>
    );
}
