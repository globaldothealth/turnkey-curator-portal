import axios from 'axios';
import { FastField, Field, useFormikContext } from 'formik';
import { Select, TextField } from 'formik-mui';
import { get } from 'lodash';
import {
    Autocomplete,
    FormControl,
    FormHelperText,
    MenuItem,
    // TextField as MuiTextField,
} from '@mui/material';
import { createFilterOptions } from '@mui/material/Autocomplete';
import { makeStyles } from 'tss-react/mui';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import React, { BaseSyntheticEvent } from 'react';

import { Day0CaseFormValues } from '../../api/models/Day0Case';
import { AutomatedSourceFormValues } from '../AutomatedSourceForm';
import BulkCaseFormValues from '../bulk-case-form-fields/BulkCaseFormValues';
import { hasKey } from '../Utils';

const useStyles = makeStyles()(() => ({
    fieldRow: {
        marginBottom: '2em',
        width: '100%',
    },
    field: {
        width: '50%',
    },
}));

interface FormikAutocompleteProps {
    name: string;
    label: string;
    multiple: boolean;
    optionsList?: string[];
    optionsLocation?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialValue: any;
    freeSolo?: boolean;
}

const filter = createFilterOptions<string>();

// Autocomplete for use in a Formik form.
// Based on https://material-ui.com/components/autocomplete/#asynchronous-requests.
export function FormikAutocomplete(
    props: FormikAutocompleteProps,
): JSX.Element {
    const [open, setOpen] = React.useState(false);
    const [options, setOptions] = React.useState<string[]>([]);
    const loading = open && options.length === 0;
    const { setFieldValue, setTouched, initialValues, values } =
        useFormikContext<Day0CaseFormValues>();

    React.useEffect(() => {
        let active = true;

        if (!loading) {
            return undefined;
        }

        (async (): Promise<void> => {
            let retrievedOptions = props.optionsList;
            if (!retrievedOptions && props.optionsLocation) {
                const resp = await axios.get<string>(props.optionsLocation);
                retrievedOptions = resp.data.split('\n');
            }

            if (active) {
                setOptions([...new Set(retrievedOptions)] as string[]);
            }
        })();

        return (): void => {
            active = false;
        };
    }, [
        initialValues,
        loading,
        props.name,
        props.optionsList,
        props.optionsLocation,
        setFieldValue,
        setTouched,
    ]);

    React.useEffect(() => {
        if (!open) {
            setOptions([]);
        }
    }, [open]);

    const fallbackValue = props.multiple ? [] : '';

    return (
        <Autocomplete
            multiple={props.multiple}
            filterSelectedOptions
            itemType="string"
            open={open}
            sx={{ width: '50%' }}
            freeSolo={props.freeSolo}
            onOpen={(): void => {
                setOpen(true);
            }}
            onClose={(): void => {
                setOpen(false);
            }}
            value={get(values, props.name, fallbackValue)}
            options={options}
            filterOptions={(options: string[], params): string[] => {
                const filtered = filter(options, params) as string[];

                if (props.freeSolo && params.inputValue !== '') {
                    filtered.push(params.inputValue);
                }

                return filtered;
            }}
            loading={loading}
            onChange={(_, values) =>
                setFieldValue(props.name, values ?? undefined)
            }
            onBlur={() => setTouched({ [props.name]: true })}
            defaultValue={props.initialValue}
            renderInput={(params): JSX.Element => (
                // Do not use FastField here
                <Field
                    {...params}
                    // Setting the name properly allows any typed value
                    // to be set in the form values, rather than only selected
                    // dropdown values. Thus we use an unused form value here.
                    name="unused"
                    data-testid={props.name}
                    label={props.label}
                    component={TextField}
                    // This onChange event handles situation when user did not
                    // select element from the list of autocomplete.
                    // It will only work for single element autocomplete.
                    onChange={(event: BaseSyntheticEvent) => {
                        if (!props.multiple) {
                            setFieldValue(props.name, event.target.value || '');
                        }
                    }}
                />
            )}
        />
    );
}

interface SelectFieldProps {
    name: string;
    label: string;
    values: string[];
    required?: boolean;
}

export function SelectField(props: SelectFieldProps): JSX.Element {
    const { classes } = useStyles();
    return (
        <FormControl className={classes.fieldRow} variant="standard">
            <FastField
                label={`${props.label}${props.required ? '*' : ''}`}
                as="select"
                name={props.name}
                type="text"
                data-testid={props.name}
                className={classes.field}
                component={Select}
            >
                {props.values.map((value) => (
                    <MenuItem key={value} value={value}>
                        {value}
                    </MenuItem>
                ))}
            </FastField>
            {props.required && (
                <RequiredHelperText name={props.name}></RequiredHelperText>
            )}
        </FormControl>
    );
}

interface DateFieldProps {
    name: string;
    label: string;
    value: Date | string | undefined | null;
    onChange: (value: Date | null) => void;
    required?: boolean;
    errorMessage?: string;
}

export function DateField(props: DateFieldProps): JSX.Element {
    const { classes } = useStyles();

    const dateValue =
        typeof props.value === 'string' ? new Date(props.value) : props.value;

    return (
        <div className={classes.fieldRow}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DesktopDatePicker
                    className={classes.field}
                    data-testid={props.name}
                    label={props.label}
                    format="yyyy/MM/dd"
                    // mask="____/__/__"
                    minDate={new Date('2019/12/01')}
                    disableFuture
                    value={dateValue}
                    onChange={props.onChange}
                    // renderInput={(params) => ( // TODO check if this is needed
                    //     <MuiTextField
                    //         {...params}
                    //         name={props.name}
                    //         fullWidth
                    //         // Non formik component needs different error handling
                    //         error={!!props.errorMessage}
                    //         helperText={props.errorMessage}
                    //     />
                    // )}
                />
            </LocalizationProvider>
            {props.required && <RequiredHelperText name={props.name} />}
        </div>
    );
}

interface RequiredHelperTextProps {
    name: string;
    wrongUrl?: boolean;
    locationRequiredText?: string;
}

export function RequiredHelperText(
    props: RequiredHelperTextProps,
): JSX.Element {
    const { values, touched } = useFormikContext<
        Day0CaseFormValues | BulkCaseFormValues | AutomatedSourceFormValues
    >();

    let finalHelperText = 'Required';
    if (props.wrongUrl === false) {
        finalHelperText = 'Please enter a valid URL';
    } else if (props.locationRequiredText) {
        finalHelperText = props.locationRequiredText;
    }

    return (
        <div>
            <FormHelperText
                error={
                    hasKey(touched, props.name) &&
                    touched[props.name] &&
                    hasKey(values, props.name) &&
                    (values[props.name] === undefined ||
                        values[props.name] === null ||
                        props.wrongUrl === false)
                }
            >
                {finalHelperText}
            </FormHelperText>
        </div>
    );
}
