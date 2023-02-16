import React from 'react';
import { Field, useFormikContext } from 'formik';
import { Typography } from '@mui/material';

import { makeStyles } from '@mui/styles';

import AddIcon from '@mui/icons-material/Add';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import FieldTitle from '../common-form-fields/FieldTitle';
import { GeocodeLocation } from '../../api/models/Day0Case';
import Location from './Location';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { RequiredHelperText } from '../common-form-fields/FormikFields';
import Scroll from 'react-scroll';
import { TextField } from 'formik-mui';
import { StyledTooltip } from './StyledTooltip';
import axios from 'axios';
import throttle from 'lodash/throttle';
import { Day0CaseFormValues } from '../../api/models/Day0Case';

const TooltipText = () => (
    <StyledTooltip>
        <ul>
            <li>
                Enter the location for the case.
                <ul>
                    <li>
                        Start typing the location and the field will be auto
                        completed with supported locations.
                    </li>
                    <li>
                        You can enter a location up to Admin level 3; as an
                        example this corresponds to country level location data
                        in the USA. Specific locations are not supported
                    </li>
                </ul>
            </li>
            <li>
                <strong>Example:</strong> If your case has 'Location = USA,
                California, Santa Clara' type 'Santa Clara' and select that
                option from the drop down list. On selection the rest of the
                location fields would be prepopulated.
                <ul>
                    <li>
                        If you need to change the location you can press X in
                        the location field and then retype the location and
                        select the desidered one. This will change the
                        prepoulated fields to the new location.
                    </li>
                    <li>
                        If you cannot find a specific location please provide
                        details to your Global.health contact.
                    </li>
                </ul>
            </li>
        </ul>
    </StyledTooltip>
);

function LocationForm(): JSX.Element {
    const { values, initialValues, setFieldValue } =
        useFormikContext<Day0CaseFormValues>();

    return (
        <Scroll.Element name="location">
            <FieldTitle title="Location" tooltip={<TooltipText />} />
            <PlacesAutocomplete
                initialValue={initialValues.location.geocodeLocation?.name}
                name="location.geocodeLocation"
                required
            />
            {!values.location.geocodeLocation && (
                <Button
                    variant="outlined"
                    id="add-location"
                    startIcon={<AddIcon />}
                    onClick={() =>
                        setFieldValue('location.geocodeLocation', {})
                    }
                >
                    Specify geocode manually
                </Button>
            )}
            {values.location.geocodeLocation && <Location />}
        </Scroll.Element>
    );
}

export default LocationForm;

const useStyles = makeStyles((theme) => ({
    icon: {
        color: theme.palette.text.secondary,
        marginRight: theme.spacing(2),
    },
    suggestion: {
        display: 'flex',
        alignItems: 'center',
        padding: '0.5rem 0',
        cursor: 'pointer',

        '&:hover': {
            backgroundColor: '#00000014',
        },
    },
}));

interface PlacesAutocompleteProps {
    name: string;
    required?: boolean;
    initialValue?: string;
}

// Place autocomplete, based on
// https://material-ui.com/components/autocomplete/#google-maps-place
export function PlacesAutocomplete(
    props: PlacesAutocompleteProps,
): JSX.Element {
    const classes = useStyles();
    const [value, setValue] = React.useState<GeocodeLocation | null>(null);
    const [inputValue, setInputValue] = React.useState('');
    const [options, setOptions] = React.useState<GeocodeLocation[]>([]);
    const { setFieldValue, setTouched } =
        useFormikContext<Day0CaseFormValues>();

    const fetch = React.useMemo(
        () =>
            throttle(
                async (
                    request: { q: string },
                    callback: (results?: GeocodeLocation[]) => void,
                ) => {
                    const resp = await axios.get<GeocodeLocation[]>(
                        '/api/geocode/suggest',
                        {
                            params: request,
                        },
                    );
                    callback(resp.data);
                },
                250,
            ),
        [],
    );

    React.useEffect(() => {
        let active = true;

        if (inputValue.trim() === '') {
            setOptions(value ? [value] : []);
            return undefined;
        }

        fetch({ q: inputValue }, (results?: GeocodeLocation[]) => {
            if (active) {
                let newOptions = [] as GeocodeLocation[];

                if (results) {
                    newOptions = results.map((l) => {
                        return {
                            query: inputValue,
                            ...l,
                        };
                    });
                }
                setOptions(newOptions);
            }
        });

        return (): void => {
            active = false;
        };
    }, [value, inputValue, fetch]);

    return (
        <Autocomplete
            itemType="GeocodeLocation"
            getOptionLabel={(option: GeocodeLocation): string => option.name}
            options={options}
            value={value}
            sx={{ width: '50%' }}
            onChange={(_: unknown, newValue: GeocodeLocation | null): void => {
                setOptions(newValue ? [newValue, ...options] : options);
                setValue(newValue);
                setFieldValue(props.name, newValue);
            }}
            onBlur={(): void => setTouched({ [props.name]: true })}
            onInputChange={(_, newInputValue): void => {
                setInputValue(newInputValue);
            }}
            noOptionsText="No locations found, type to search"
            renderInput={(params): JSX.Element => (
                <>
                    {/* Do not use FastField here */}
                    <Field
                        {...params}
                        // Setting the name properly allows any typed value
                        // to be set in the form values, rather than only selected
                        // dropdown values. Thus we use an unused form value here.
                        name="unused"
                        data-testid={props.name}
                        // Use the initial valuelocation name as a hint when untouched
                        // otherwise just use the field name.
                        label={props.initialValue || 'Location'}
                        component={TextField}
                        fullWidth
                    />
                    {props.required && (
                        <RequiredHelperText
                            name={props.name}
                            locationRequiredText="A location must be provided"
                        />
                    )}
                </>
            )}
            renderOption={(
                props,
                option: GeocodeLocation,
                state,
            ): React.ReactNode => {
                return (
                    <li {...props} className={classes.suggestion}>
                        <LocationOnIcon className={classes.icon} />
                        <Typography variant="body2">{option.name}</Typography>
                    </li>
                );
            }}
        />
    );
}
